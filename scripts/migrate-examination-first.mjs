import pg from "pg"

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!connectionString) throw new Error("DATABASE_URL or POSTGRES_URL must be configured.")

const pool = new pg.Pool({ connectionString })

async function columnExists(table, column) {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column]
  )
  return rows.length > 0
}

try {
  await pool.query("BEGIN")

  // Mock exams now belong to one examination. Legacy records stay visible but
  // are intentionally unassigned until an admin selects their examination.
  await pool.query("ALTER TABLE mock_exams ADD COLUMN IF NOT EXISTS examination_id INTEGER REFERENCES examinations(id) ON DELETE SET NULL")
  await pool.query("CREATE INDEX IF NOT EXISTS idx_mock_exams_examination_id ON mock_exams(examination_id)")

  // Gradebooks retain their examination and no longer derive it from a batch.
  await pool.query("UPDATE gradebooks g SET exam_id = b.exam_id FROM batches b WHERE g.exam_id IS NULL AND g.batch_id = b.id")

  // Batch values are historical only. Clearing them prevents stale data from
  // becoming an accidental access, reporting, or enrollment dependency.
  if (await columnExists("users", "batch_id")) await pool.query("UPDATE users SET batch_id = NULL WHERE batch_id IS NOT NULL")
  if (await columnExists("pre_registrations", "batch_id")) await pool.query("UPDATE pre_registrations SET batch_id = NULL WHERE batch_id IS NOT NULL")
  if (await columnExists("gradebooks", "batch_id")) await pool.query("UPDATE gradebooks SET batch_id = NULL WHERE batch_id IS NOT NULL")
  if (await columnExists("mock_exam_targets", "batch_id")) await pool.query("UPDATE mock_exam_targets SET batch_id = NULL WHERE batch_id IS NOT NULL")
  if (await columnExists("user_subscriptions", "cohort_id")) await pool.query("UPDATE user_subscriptions SET cohort_id = NULL WHERE cohort_id IS NOT NULL")
  if (await columnExists("user_subscriptions", "source_legacy_cohort_id")) await pool.query("UPDATE user_subscriptions SET source_legacy_cohort_id = NULL WHERE source_legacy_cohort_id IS NOT NULL")

  const [mockExams, gradebooks, users, subscriptions, batches] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM mock_exams WHERE examination_id IS NULL"),
    pool.query("SELECT COUNT(*)::int AS count FROM gradebooks WHERE exam_id IS NULL"),
    pool.query("SELECT COUNT(*)::int AS count FROM users WHERE batch_id IS NOT NULL"),
    pool.query("SELECT COUNT(*)::int AS count FROM user_subscriptions WHERE cohort_id IS NOT NULL"),
    pool.query("SELECT COUNT(*)::int AS count FROM batches")
  ])

  await pool.query("COMMIT")
  console.log(JSON.stringify({
    examinationFirst: true,
    legacyRecordsNeedingMockExamAssignment: mockExams.rows[0].count,
    gradebooksMissingExamination: gradebooks.rows[0].count,
    usersStillLinkedToBatch: users.rows[0].count,
    subscriptionsStillLinkedToCohort: subscriptions.rows[0].count,
    legacyBatchRowsRetainedForAuditOnly: batches.rows[0].count
  }, null, 2))
} catch (error) {
  await pool.query("ROLLBACK").catch(() => {})
  throw error
} finally {
  await pool.end()
}
