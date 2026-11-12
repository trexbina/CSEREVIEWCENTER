import pg from "pg"

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!connectionString) throw new Error("DATABASE_URL or POSTGRES_URL must be configured.")

const pool = new pg.Pool({ connectionString })
try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id SERIAL PRIMARY KEY, examination_id INTEGER NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL, description TEXT, price NUMERIC(10,2), duration_days INTEGER, billing_interval VARCHAR(20) NOT NULL DEFAULT 'monthly',
      plan_type VARCHAR(20) NOT NULL DEFAULT 'paid', access_mode VARCHAR(20) NOT NULL DEFAULT 'all',
      is_default_free BOOLEAN NOT NULL DEFAULT FALSE, status VARCHAR(20) NOT NULL DEFAULT 'active',
      legacy_cohort_id INTEGER UNIQUE REFERENCES batches(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS subscription_plans_one_default_free_per_exam ON subscription_plans(examination_id) WHERE is_default_free;
    CREATE TABLE IF NOT EXISTS subscription_plan_subjects (subscription_plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE, subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE, PRIMARY KEY(subscription_plan_id, subject_id));
    CREATE TABLE IF NOT EXISTS subscription_plan_mock_exams (subscription_plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE, mock_exam_id INTEGER NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE, PRIMARY KEY(subscription_plan_id, mock_exam_id));
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subscription_plan_id INTEGER NOT NULL REFERENCES subscription_plans(id), examination_id INTEGER NOT NULL REFERENCES examinations(id),
      cohort_id INTEGER REFERENCES batches(id) ON DELETE SET NULL, activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), expires_at TIMESTAMPTZ,
      status VARCHAR(20) NOT NULL DEFAULT 'active', plan_name_snapshot VARCHAR(150) NOT NULL, plan_type_snapshot VARCHAR(20) NOT NULL,
      access_mode_snapshot VARCHAR(20) NOT NULL, duration_days_snapshot INTEGER, billing_interval_snapshot VARCHAR(20), source_legacy_cohort_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
      assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS user_subscription_subjects (user_subscription_id INTEGER NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE, subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE, PRIMARY KEY(user_subscription_id, subject_id));
    CREATE TABLE IF NOT EXISTS user_subscription_mock_exams (user_subscription_id INTEGER NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE, mock_exam_id INTEGER NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE, PRIMARY KEY(user_subscription_id, mock_exam_id));
  `)
  await pool.query(`
    ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(20) NOT NULL DEFAULT 'monthly';
    ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS billing_interval_snapshot VARCHAR(20);
    UPDATE subscription_plans SET billing_interval = CASE WHEN plan_type IN ('free', 'legacy') THEN 'none' WHEN duration_days >= 365 THEN 'annual' ELSE 'monthly' END
    WHERE billing_interval IS NULL OR billing_interval NOT IN ('monthly', 'annual', 'none') OR (plan_type IN ('free', 'legacy') AND billing_interval <> 'none');
  `)
  await pool.query("BEGIN")
  await pool.query(`INSERT INTO subscription_plans (examination_id,name,duration_days,billing_interval,plan_type,access_mode,status,legacy_cohort_id)
    SELECT b.exam_id,'Legacy: ' || b.name,CASE WHEN b.start_date IS NOT NULL AND b.end_date IS NOT NULL AND b.end_date>b.start_date THEN b.end_date-b.start_date ELSE NULL END,'none','legacy','all',CASE WHEN b.status='completed' THEN 'inactive' ELSE 'active' END,b.id
    FROM batches b WHERE b.exam_id IS NOT NULL ON CONFLICT (legacy_cohort_id) DO NOTHING`)
  const migrated = await pool.query(`INSERT INTO user_subscriptions (user_id,subscription_plan_id,examination_id,cohort_id,activated_at,expires_at,status,plan_name_snapshot,plan_type_snapshot,access_mode_snapshot,duration_days_snapshot,source_legacy_cohort_id)
    SELECT u.id,p.id,p.examination_id,b.id,COALESCE(b.start_date::timestamptz,u.created_at,NOW()),COALESCE(u.subscription_end_date,b.end_date::timestamptz + INTERVAL '1 day'),'active',p.name,p.plan_type,p.access_mode,p.duration_days,b.id
    FROM users u JOIN batches b ON b.id=u.batch_id JOIN subscription_plans p ON p.legacy_cohort_id=b.id
    WHERE u.role='student' AND NOT EXISTS (SELECT 1 FROM user_subscriptions us WHERE us.user_id=u.id AND us.source_legacy_cohort_id=b.id)
    RETURNING id`)
  const [legacyPlans, convertedUsers, missingExamination, studentsWithoutCohort, cohortsMissingExamination] = await Promise.all([
    pool.query(`SELECT p.id, p.name, p.examination_id, p.legacy_cohort_id AS cohort_id
      FROM subscription_plans p WHERE p.plan_type = 'legacy' ORDER BY p.legacy_cohort_id`),
    pool.query(`SELECT us.id, us.user_id, us.subscription_plan_id, us.examination_id, us.cohort_id, us.expires_at
      FROM user_subscriptions us WHERE us.source_legacy_cohort_id IS NOT NULL ORDER BY us.user_id, us.created_at`),
    pool.query("SELECT id, email FROM users WHERE role='student' AND exam_id IS NULL ORDER BY id"),
    pool.query("SELECT id, email FROM users WHERE role='student' AND batch_id IS NULL ORDER BY id"),
    pool.query("SELECT id, name FROM batches WHERE exam_id IS NULL ORDER BY id"),
  ])
  await pool.query("COMMIT")
  console.log(JSON.stringify({
    migratedSubscriptionsThisRun: migrated.rowCount,
    legacyPlans: legacyPlans.rows,
    convertedUserSubscriptions: convertedUsers.rows,
    studentsMissingExamination: missingExamination.rows,
    studentsWithoutLegacyCohort: studentsWithoutCohort.rows,
    cohortsMissingExamination: cohortsMissingExamination.rows,
  }, null, 2))
} catch (error) {
  await pool.query("ROLLBACK").catch(() => {})
  throw error
} finally { await pool.end() }
