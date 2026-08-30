import pg from "pg"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const { Pool } = pg

const connectionString = process.env.DATABASE_URL.replace(/[?&]sslmode=[^&]*/gi, "")

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

async function checkMasterData() {
  const schools = await pool.query("SELECT id, name FROM schools LIMIT 10").catch(() => ({ rows: [] }))
  const courses = await pool.query("SELECT id, name FROM academic_courses LIMIT 10").catch(() => ({ rows: [] }))
  const exams = await pool.query("SELECT id, name FROM examinations LIMIT 10").catch(() => ({ rows: [] }))
  const batches = await pool.query("SELECT id, name FROM batches LIMIT 10").catch(() => ({ rows: [] }))

  console.log("Master Data:", {
    schools: schools.rows,
    courses: courses.rows,
    exams: exams.rows,
    batches: batches.rows,
  })

  await pool.end()
}

checkMasterData()
