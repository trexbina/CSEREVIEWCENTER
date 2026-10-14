import pool from "@/lib/db"

/**
 * Ensures study_sessions and daily_student_stats tables and indexes exist.
 * PostgreSQL / Supabase / Prisma compatible.
 */
export async function ensureStudentActivityTables() {
  try {
    await pool.query(`
      -- Raw heartbeat and study sessions table
      CREATE TABLE IF NOT EXISTS study_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
        activity_type VARCHAR(50) DEFAULT 'lecture', -- 'lecture', 'reading', 'quiz', 'mock_exam', 'practice_test'
        session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        session_end TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        duration_seconds INTEGER NOT NULL DEFAULT 60,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_study_sessions_user_start ON study_sessions(user_id, session_start);
      CREATE INDEX IF NOT EXISTS idx_study_sessions_subject ON study_sessions(subject_id);

      -- Pre-aggregated daily rollback table
      CREATE TABLE IF NOT EXISTS daily_student_stats (
        id SERIAL PRIMARY KEY,
        stat_date DATE NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
        total_seconds INTEGER NOT NULL DEFAULT 0,
        lecture_seconds INTEGER NOT NULL DEFAULT 0,
        test_seconds INTEGER NOT NULL DEFAULT 0,
        quiz_attempts INTEGER NOT NULL DEFAULT 0,
        resource_hits INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_student_stats_unique 
      ON daily_student_stats(stat_date, user_id, COALESCE(subject_id, 0));

      CREATE INDEX IF NOT EXISTS idx_daily_student_stats_date 
      ON daily_student_stats(stat_date);
    `)
  } catch (err) {
    console.error("[ensureStudentActivityTables error]:", err?.message || err)
  }
}
