import pg from "pg"

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error("DATABASE_URL or POSTGRES_URL must be configured.")
}

const pool = new pg.Pool({ connectionString })

try {
  await pool.query("BEGIN")
  await pool.query("DROP TABLE IF EXISTS user_active_sessions")
  await pool.query("DROP TABLE IF EXISTS security_audit_logs")
  await pool.query("DROP TABLE IF EXISTS system_security_settings")
  await pool.query("UPDATE custom_roles SET permissions = permissions - '/admin/settings/security'")
  await pool.query("COMMIT")
  console.log("Removed Security & Access Policies tables and permissions.")
} catch (error) {
  await pool.query("ROLLBACK").catch(() => {})
  throw error
} finally {
  await pool.end()
}
