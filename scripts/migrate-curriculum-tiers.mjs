import pg from "pg"

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!connectionString) throw new Error("DATABASE_URL or POSTGRES_URL must be configured.")
const pool = new pg.Pool({ connectionString })

try {
  await pool.query("ALTER TABLE categories ADD COLUMN IF NOT EXISTS access_tier VARCHAR(10) NOT NULL DEFAULT 'free'")
  await pool.query("ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT")
  await pool.query("UPDATE categories SET access_tier = 'free' WHERE access_tier IS NULL OR access_tier NOT IN ('free', 'paid')")
  await pool.query(`INSERT INTO subscription_plans (examination_id, name, description, duration_days, billing_interval, plan_type, access_mode, is_default_free, status)
    SELECT e.id, 'Free Tier', 'Automatic baseline access for this examination.', NULL, 'none', 'free', 'all', true, 'active'
    FROM examinations e
    WHERE NOT EXISTS (SELECT 1 FROM subscription_plans p WHERE p.examination_id = e.id AND p.is_default_free = true)
    ON CONFLICT DO NOTHING`)
  await pool.query(`INSERT INTO user_subscriptions (user_id, subscription_plan_id, examination_id, activated_at, expires_at, status, plan_name_snapshot, plan_type_snapshot, access_mode_snapshot, duration_days_snapshot, billing_interval_snapshot)
    SELECT u.id, p.id, p.examination_id, COALESCE(u.created_at, NOW()), NULL, 'active', p.name, 'free', p.access_mode, NULL, 'none'
    FROM users u JOIN subscription_plans p ON p.examination_id = u.exam_id
    WHERE u.role = 'student' AND p.is_default_free = true AND p.plan_type = 'free' AND p.status = 'active'
      AND NOT EXISTS (SELECT 1 FROM user_subscriptions us WHERE us.user_id = u.id AND us.examination_id = p.examination_id AND us.plan_type_snapshot = 'free' AND us.status = 'active')`)
  const { rows } = await pool.query("SELECT e.name AS examination, c.access_tier, COUNT(*)::int AS category_count FROM categories c LEFT JOIN examinations e ON e.id = c.exam_id GROUP BY e.name, c.access_tier ORDER BY e.name, c.access_tier")
  console.log(JSON.stringify({ curriculumTierMigration: rows }, null, 2))
} finally {
  await pool.end()
}
