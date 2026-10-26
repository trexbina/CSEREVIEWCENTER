import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import pg from "pg"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function setupDatabase() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!databaseUrl) {
    console.error("\n❌ Error: DATABASE_URL is not set.")
    console.error("Please configure your DATABASE_URL in .env.local or your environment.")
    console.error("Example: DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/csereview\"\n")
    process.exit(1)
  }

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  })

  const sqlFilePath = path.resolve(__dirname, "..", "setup.sql")

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`\n❌ Error: setup.sql file not found at ${sqlFilePath}\n`)
    process.exit(1)
  }

  console.log(`\n📦 Reading SQL setup script from: ${sqlFilePath}...`)
  const sql = fs.readFileSync(sqlFilePath, "utf8")

  const client = await pool.connect()
  try {
    console.log("⚡ Executing schema setup & seed data into target database...")
    await client.query(sql)
    console.log("✅ Database schema and initial seed data applied successfully!\n")
    console.log("Default Accounts:")
    console.log("  • Super Admin: admin@csereview.local (Password: password123)")
    console.log("  • Admin:       staff@csereview.local (Password: password123)")
    console.log("  • Instructor:  instructor@csereview.local (Password: password123)")
    console.log("  • Student:     student@csereview.local (Password: password123)\n")
  } catch (err) {
    console.error("\n❌ Failed to execute setup.sql:", err.message)
    console.error(err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

setupDatabase()
