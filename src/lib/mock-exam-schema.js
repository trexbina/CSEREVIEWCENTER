import pool from "@/lib/db"

let schemaReady = false
let pendingSchemaSetup = null

/** Ensures old PostgreSQL and D1 databases can store a mock exam's examination. */
export async function ensureMockExamExaminationSchema() {
  if (schemaReady) return
  if (!pendingSchemaSetup) {
    pendingSchemaSetup = (async () => {
      try {
        await pool.query("ALTER TABLE mock_exams ADD COLUMN examination_id INTEGER REFERENCES examinations(id) ON DELETE SET NULL")
      } catch (error) {
        // Both PostgreSQL and SQLite report an error when the column exists.
        // In that case the schema is already ready; unexpected errors are
        // rethrown by the following read/write operation with full context.
        const message = String(error?.message || "").toLowerCase()
        if (!message.includes("already exists") && !message.includes("duplicate column") && !message.includes("duplicate") && !message.includes("exists")) {
          console.warn("[mock-exam schema] unable to add examination_id:", error)
        }
      }
      schemaReady = true
    })()
  }
  await pendingSchemaSetup
}
