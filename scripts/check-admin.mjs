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

async function checkAdmin() {
  const res = await pool.query(
    "SELECT id, name, email, password, role FROM users WHERE email ILIKE '%admin%' OR role = 'admin'"
  )
  console.log("Admin accounts found:", res.rows.length)
  for (const u of res.rows) {
    const isPass123 = await bcrypt.compare("password123", u.password)
    const isAdmin123 = await bcrypt.compare("admin123", u.password)
    const isAdmin = await bcrypt.compare("admin", u.password)
    const isPeakAdmin = await bcrypt.compare("peakadmin", u.password)
    const isPeak2026 = await bcrypt.compare("peak2026", u.password)

    console.log(`\nEmail: ${u.email} (Role: ${u.role}, Name: ${u.name})`)
    console.log(`  matches 'password123': ${isPass123}`)
    console.log(`  matches 'admin123': ${isAdmin123}`)
    console.log(`  matches 'admin': ${isAdmin}`)
    console.log(`  matches 'peakadmin': ${isPeakAdmin}`)
    console.log(`  matches 'peak2026': ${isPeak2026}`)
  }
  await pool.end()
}

checkAdmin()
