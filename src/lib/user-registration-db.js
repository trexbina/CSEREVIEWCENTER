import pool from "./db.js"

/**
 * Ensures user schema verification and daily_registration_stats roll-up table.
 * Dynamically normalizes target_exam and status across existing and incoming records.
 */
export async function ensureUserRegistrationTables() {
  try {
    // 1. Ensure required columns exist on users table
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS target_exam VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS target_exam_date DATE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
    `)

    // 2. Dynamically scan examinations table and normalize target_exam on users table
    await pool.query(`
      UPDATE users u
      SET target_exam = CASE
        WHEN e.name ILIKE '%LEPT%' OR e.name ILIKE '%Teacher%' THEN 'LEPT'
        WHEN e.name ILIKE '%PNLE%' OR e.name ILIKE '%Nurse%' THEN 'PNLE'
        WHEN e.name ILIKE '%NCLEX%' THEN 'NCLEX'
        WHEN e.name ILIKE '%CLE%' OR e.name ILIKE '%Criminolog%' THEN 'CLE'
        WHEN e.name ~ '\\(([^)]+)\\)' THEN substring(e.name from '\\(([^)]+)\\)')
        ELSE COALESCE(e.name, 'General')
      END
      FROM examinations e
      WHERE u.exam_id = e.id AND (u.target_exam IS NULL OR u.target_exam = '');

      -- Default users with null exam to 'General'
      UPDATE users
      SET target_exam = 'General'
      WHERE target_exam IS NULL OR target_exam = '';

      -- Normalize status based on is_active if status is null or empty
      UPDATE users
      SET status = CASE
        WHEN is_active = false THEN 'expired'
        WHEN is_active = true OR is_active IS NULL THEN 'active'
        ELSE 'active'
      END
      WHERE status IS NULL OR status = '';
    `)

    // 3. Create Daily Roll-Up Table (daily_registration_stats)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_registration_stats (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        exam_type VARCHAR(100) NOT NULL,
        batch_id INTEGER,
        new_registrations_count INTEGER DEFAULT 0,
        active_users_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_reg_stats_unique
      ON daily_registration_stats(date, exam_type, COALESCE(batch_id, 0));

      CREATE INDEX IF NOT EXISTS idx_daily_reg_stats_date
      ON daily_registration_stats(date);

      CREATE INDEX IF NOT EXISTS idx_daily_reg_stats_exam
      ON daily_registration_stats(exam_type);
    `)

    // 4. Perform dynamic pre-aggregation sync from users to daily_registration_stats
    await pool.query(`
      INSERT INTO daily_registration_stats (date, exam_type, batch_id, new_registrations_count, active_users_count, updated_at)
      SELECT 
        u.created_at::date AS date,
        COALESCE(u.target_exam, 'General') AS exam_type,
        u.batch_id,
        COUNT(*)::int AS new_registrations_count,
        COUNT(CASE WHEN u.status = 'active' OR u.is_active = true THEN 1 END)::int AS active_users_count,
        NOW()
      FROM users u
      GROUP BY u.created_at::date, COALESCE(u.target_exam, 'General'), u.batch_id
      ON CONFLICT (date, exam_type, COALESCE(batch_id, 0))
      DO UPDATE SET
        new_registrations_count = EXCLUDED.new_registrations_count,
        active_users_count = EXCLUDED.active_users_count,
        updated_at = NOW();
    `)
  } catch (err) {
    console.error("[ensureUserRegistrationTables error]:", err?.message || err)
  }
}
