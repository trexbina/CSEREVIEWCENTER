import pool from "./db.js"

/**
 * Ensures student_subject_progress table exists in PostgreSQL.
 * Tracks progress percentage, completed vs total items (out of),
 * active study days, and study streaks for every subject.
 */
export async function ensureStudentSubjectProgressTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_subject_progress (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        completed_items INTEGER NOT NULL DEFAULT 0,
        total_items INTEGER NOT NULL DEFAULT 0,
        progress_pct INTEGER NOT NULL DEFAULT 0,
        active_days INTEGER NOT NULL DEFAULT 0,
        study_streak INTEGER NOT NULL DEFAULT 0,
        last_activity_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_student_subject UNIQUE (student_id, subject_id)
      );

      CREATE INDEX IF NOT EXISTS idx_student_subject_progress_student 
        ON student_subject_progress(student_id);

      CREATE INDEX IF NOT EXISTS idx_student_subject_progress_subject 
        ON student_subject_progress(subject_id);
    `)
  } catch (err) {
    console.error("[ensureStudentSubjectProgressTable error]:", err?.message || err)
  }
}
