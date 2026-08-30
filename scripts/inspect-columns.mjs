import pg from "pg"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const { Pool } = pg

const connectionString = process.env.DATABASE_URL.replace(/[?&]sslmode=[^&]*/gi, "")

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

async function check() {
  const tables = ["users", "examinations", "batches", "schools", "academic_courses"]
  for (const t of tables) {
    const cols = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
      [t]
    )
    console.log(`=== TABLE: ${t} ===`)
    console.log(cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(", "))
  }
  await pool.end()
}

check()
