import pool from "@/lib/db"
import { getStudentCurriculumContext } from "@/lib/student-curriculum"

let schemaReady = false

export async function ensureSubscriptionSchema(client = pool) {
  if (schemaReady) return
  await client.query(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id SERIAL PRIMARY KEY,
      examination_id INTEGER NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      price NUMERIC(10, 2),
      duration_days INTEGER,
      billing_interval VARCHAR(20) NOT NULL DEFAULT 'monthly',
      plan_type VARCHAR(20) NOT NULL DEFAULT 'paid',
      access_mode VARCHAR(20) NOT NULL DEFAULT 'all',
      is_default_free BOOLEAN NOT NULL DEFAULT FALSE,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      legacy_cohort_id INTEGER UNIQUE REFERENCES batches(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (plan_type IN ('free', 'paid', 'legacy')),
      CHECK (access_mode IN ('all', 'selected')),
      CHECK (duration_days IS NULL OR duration_days > 0)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS subscription_plans_one_default_free_per_exam
      ON subscription_plans(examination_id) WHERE is_default_free;
    CREATE TABLE IF NOT EXISTS subscription_plan_subjects (
      subscription_plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      PRIMARY KEY (subscription_plan_id, subject_id)
    );
    CREATE TABLE IF NOT EXISTS subscription_plan_mock_exams (
      subscription_plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
      mock_exam_id INTEGER NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
      PRIMARY KEY (subscription_plan_id, mock_exam_id)
    );
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subscription_plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
      examination_id INTEGER NOT NULL REFERENCES examinations(id) ON DELETE RESTRICT,
      cohort_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
      activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      plan_name_snapshot VARCHAR(150) NOT NULL,
      plan_type_snapshot VARCHAR(20) NOT NULL,
      access_mode_snapshot VARCHAR(20) NOT NULL,
      duration_days_snapshot INTEGER,
      billing_interval_snapshot VARCHAR(20),
      source_legacy_cohort_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
      assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (status IN ('active', 'cancelled')),
      CHECK (access_mode_snapshot IN ('all', 'selected'))
    );
    CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active
      ON user_subscriptions(user_id, examination_id, status, expires_at);
    CREATE TABLE IF NOT EXISTS user_subscription_subjects (
      user_subscription_id INTEGER NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      PRIMARY KEY (user_subscription_id, subject_id)
    );
    CREATE TABLE IF NOT EXISTS user_subscription_mock_exams (
      user_subscription_id INTEGER NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
      mock_exam_id INTEGER NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
      PRIMARY KEY (user_subscription_id, mock_exam_id)
    );
  `)
  // These columns keep existing installations compatible with the monthly/annual plan model.
  await client.query(`
    ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(20) NOT NULL DEFAULT 'monthly';
    ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS billing_interval_snapshot VARCHAR(20);
    UPDATE subscription_plans
    SET billing_interval = CASE
      WHEN plan_type IN ('free', 'legacy') THEN 'none'
      WHEN duration_days >= 365 THEN 'annual'
      ELSE 'monthly'
    END
    WHERE billing_interval IS NULL
      OR billing_interval NOT IN ('monthly', 'annual', 'none')
      OR (plan_type IN ('free', 'legacy') AND billing_interval <> 'none');
  `)
  schemaReady = true
}

export async function migrateLegacyCohorts(client = pool) {
  await ensureSubscriptionSchema(client)
  await client.query(`
    INSERT INTO subscription_plans (examination_id, name, duration_days, billing_interval, plan_type, access_mode, status, legacy_cohort_id)
    SELECT b.exam_id, 'Legacy: ' || b.name,
           CASE WHEN b.start_date IS NOT NULL AND b.end_date IS NOT NULL AND b.end_date > b.start_date
             THEN (b.end_date - b.start_date) ELSE NULL END,
           'none', 'legacy', 'all', CASE WHEN b.status = 'completed' THEN 'inactive' ELSE 'active' END, b.id
    FROM batches b
    WHERE b.exam_id IS NOT NULL
    ON CONFLICT (legacy_cohort_id) DO NOTHING
  `)
  await client.query(`
    INSERT INTO user_subscriptions (
      user_id, subscription_plan_id, examination_id, cohort_id, activated_at, expires_at,
      status, plan_name_snapshot, plan_type_snapshot, access_mode_snapshot,
      duration_days_snapshot, source_legacy_cohort_id
    )
    SELECT u.id, p.id, p.examination_id, b.id,
           COALESCE(b.start_date::timestamptz, u.created_at, NOW()),
           COALESCE(u.subscription_end_date, b.end_date::timestamptz + INTERVAL '1 day'),
           'active', p.name, p.plan_type, p.access_mode, p.duration_days, b.id
    FROM users u
    JOIN batches b ON b.id = u.batch_id
    JOIN subscription_plans p ON p.legacy_cohort_id = b.id
    WHERE u.role = 'student'
      AND NOT EXISTS (
        SELECT 1 FROM user_subscriptions us
        WHERE us.user_id = u.id AND us.source_legacy_cohort_id = b.id
      )
  `)
}

export async function assignSubscription({ userId, planId, activatedAt, expiresAt, assignedBy = null }, client = pool) {
  await ensureSubscriptionSchema(client)
  const planResult = await client.query(
    `SELECT * FROM subscription_plans WHERE id = $1 AND status = 'active'`, [planId]
  )
  const plan = planResult.rows[0]
  if (!plan) throw new Error("Subscription plan is not available.")

  const start = activatedAt ? new Date(activatedAt) : new Date()
  if (Number.isNaN(start.getTime())) throw new Error("A valid activation date is required.")
  const calculatedExpiry = (() => {
    if (plan.plan_type === 'free' || !plan.duration_days) return null
    const expiry = new Date(start)
    if (plan.billing_interval === 'annual') expiry.setFullYear(expiry.getFullYear() + 1)
    else if (plan.billing_interval === 'monthly') expiry.setMonth(expiry.getMonth() + 1)
    else expiry.setDate(expiry.getDate() + plan.duration_days)
    return expiry
  })()
  const finalExpiry = expiresAt ? new Date(expiresAt) : calculatedExpiry
  if (finalExpiry && Number.isNaN(finalExpiry.getTime())) throw new Error("A valid expiry date is required.")
  if (finalExpiry && finalExpiry <= start) throw new Error("Expiry must be after activation.")

  // Free access remains as the student's baseline. A paid renewal replaces
  // only another paid subscription, so expiry naturally falls back to Free Tier.
  await client.query(
    `UPDATE user_subscriptions SET status = 'cancelled'
     WHERE user_id = $1 AND examination_id = $2 AND status = 'active'
       AND plan_type_snapshot = $3`,
    [userId, plan.examination_id, plan.plan_type === 'paid' ? 'paid' : 'free']
  )
  const subscription = await client.query(
    `INSERT INTO user_subscriptions (
       user_id, subscription_plan_id, examination_id, cohort_id, activated_at, expires_at,
       status, plan_name_snapshot, plan_type_snapshot, access_mode_snapshot, duration_days_snapshot, billing_interval_snapshot, assigned_by
     ) VALUES ($1,$2,$3,$4,$5,$6,'active',$7,$8,$9,$10,$11,$12) RETURNING *`,
    [userId, plan.id, plan.examination_id, null, start, finalExpiry, plan.name, plan.plan_type, plan.access_mode, plan.duration_days, plan.billing_interval, assignedBy]
  )
  const subscriptionId = subscription.rows[0].id
  await client.query(`INSERT INTO user_subscription_subjects (user_subscription_id, subject_id)
    SELECT $1, subject_id FROM subscription_plan_subjects WHERE subscription_plan_id = $2`, [subscriptionId, plan.id])
  await client.query(`INSERT INTO user_subscription_mock_exams (user_subscription_id, mock_exam_id)
    SELECT $1, mock_exam_id FROM subscription_plan_mock_exams WHERE subscription_plan_id = $2`, [subscriptionId, plan.id])
  return subscription.rows[0]
}

export async function assignDefaultFreeSubscription(userId, examinationId, assignedBy = null, client = pool) {
  await ensureSubscriptionSchema(client)
  let { rows } = await client.query(
    `SELECT id FROM subscription_plans WHERE examination_id = $1 AND is_default_free = true AND plan_type = 'free' AND status = 'active'`,
    [examinationId]
  )
  if (!rows[0]) {
    await client.query(
      `INSERT INTO subscription_plans (examination_id, name, description, duration_days, billing_interval, plan_type, access_mode, is_default_free, status)
       SELECT $1, 'Free Tier', 'Automatic baseline access for this examination.', NULL, 'none', 'free', 'all', true, 'active'
       WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE examination_id = $1 AND is_default_free = true)
       ON CONFLICT DO NOTHING`,
      [examinationId]
    )
    const refreshed = await client.query(
      `SELECT id FROM subscription_plans WHERE examination_id = $1 AND is_default_free = true AND plan_type = 'free' AND status = 'active'`,
      [examinationId]
    )
    rows = refreshed.rows
  }
  if (!rows[0]) return null
  const activeFree = await client.query(
    `SELECT * FROM user_subscriptions
     WHERE user_id = $1 AND examination_id = $2 AND subscription_plan_id = $3
       AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY created_at DESC LIMIT 1`,
    [userId, examinationId, rows[0].id]
  )
  if (activeFree.rows[0]) return activeFree.rows[0]
  return assignSubscription({ userId, planId: rows[0].id, assignedBy }, client)
}

export async function getActiveSubscriptions(userId, client = pool) {
  await ensureSubscriptionSchema(client)
  const { rows } = await client.query(
    `SELECT * FROM user_subscriptions
     WHERE user_id = $1 AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())`, [userId]
  )
  return rows
}

export async function getStudentEntitlements(userId, client = pool) {
  const subscriptions = await getActiveSubscriptions(userId, client)
  const ids = subscriptions.map(s => s.id)
  const [subjects, mocks] = ids.length ? await Promise.all([
    client.query(`SELECT subject_id FROM user_subscription_subjects WHERE user_subscription_id = ANY($1::int[])`, [ids]),
    client.query(`SELECT mock_exam_id FROM user_subscription_mock_exams WHERE user_subscription_id = ANY($1::int[])`, [ids]),
  ]) : [{ rows: [] }, { rows: [] }]
  return {
    subscriptions,
    tier: subscriptions.some(s => s.plan_type_snapshot === 'paid') ? 'paid' : 'free',
    examinationIds: [...new Set(subscriptions.map(s => s.examination_id))],
    hasFullAccess: subscriptions.some(s => s.access_mode_snapshot === 'all'),
    subjectIds: [...new Set(subjects.rows.map(r => r.subject_id))],
    mockExamIds: [...new Set(mocks.rows.map(r => r.mock_exam_id))],
  }
}

export async function getAccessibleSubjectIds(userId, client = pool) {
  const entitlements = await getStudentEntitlements(userId, client)
  if (!entitlements.subscriptions.length) return []
  const curriculum = await getStudentCurriculumContext(userId, client, entitlements.tier)
  const curriculumSubjectIds = new Set(curriculum.subjectIds)
  const allowed = new Set(entitlements.subjectIds.filter(id => curriculumSubjectIds.has(id)))
  if (entitlements.hasFullAccess) {
    curriculum.subjectIds.forEach(id => allowed.add(id))
  }
  return [...allowed]
}

export async function canAccessSubject(userId, subjectId, client = pool) {
  return (await getAccessibleSubjectIds(userId, client)).includes(Number(subjectId))
}

export async function canAccessMockExam(userId, mockExamId, client = pool) {
  const entitlements = await getStudentEntitlements(userId, client)
  if (entitlements.mockExamIds.includes(Number(mockExamId))) return true
  if (!entitlements.hasFullAccess || !entitlements.examinationIds.length) return false
  const { rows } = await client.query(
    `SELECT 1
     FROM mock_exams me
     WHERE me.id = $1
       AND me.examination_id = ANY($2::int[])`,
    [Number(mockExamId), entitlements.examinationIds]
  )
  return Boolean(rows[0])
}
