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

const studentDescriptions = [
  "Aspiring registered nurse dedicated to mastering PNLE clinical concepts.",
  "Preparing for upcoming licensure exams with focus on pharmacology and maternal care.",
  "Diligent reviewer aiming for top 10 ranking in the national board examination.",
  "Senior nursing student strengthening clinical assessment and medical-surgical skills.",
  "Committed to excellence in patient care diagnostics and community health nursing.",
  "Focused reviewee preparing for intensive integrated test series and mock exams.",
  "Active learner participating in all nursing case studies and diagnostic assessments.",
  "Passionate candidate preparing for local and international healthcare certifications.",
  "Focused on high-yield test preparation and clinical competency modules.",
  "Aiming for 90%+ average on all comprehensive institutional mock exams.",
]

const teacherDescriptions = [
  "Lead Instructor specializing in Medical-Surgical Nursing and Comprehensive Pharmacology.",
  "Resident Specialist & Lecturer for Maternal and Child Health, NCLEX, and PNLE prep.",
  "Senior Review Specialist with 10+ years coaching topnotchers in Community Health and Research.",
]

const students = [
  { name: "Maria Santos", email: "maria.santos@peak.edu.ph", desc: studentDescriptions[0] },
  { name: "Juan Reyes", email: "juan.reyes@peak.edu.ph", desc: studentDescriptions[1] },
  { name: "Alyssa Cruz", email: "alyssa.cruz@peak.edu.ph", desc: studentDescriptions[2] },
  { name: "Gabriel Mendoza", email: "gabriel.mendoza@peak.edu.ph", desc: studentDescriptions[3] },
  { name: "Kaye Dela Rosa", email: "kaye.delarosa@peak.edu.ph", desc: studentDescriptions[4] },
  { name: "Mark Villanueva", email: "mark.villanueva@peak.edu.ph", desc: studentDescriptions[5] },
  { name: "Sophia Bautista", email: "sophia.bautista@peak.edu.ph", desc: studentDescriptions[6] },
  { name: "Christian Lim", email: "christian.lim@peak.edu.ph", desc: studentDescriptions[7] },
  { name: "Patricia Navarro", email: "patricia.navarro@peak.edu.ph", desc: studentDescriptions[8] },
  { name: "Joshua Ramos", email: "joshua.ramos@peak.edu.ph", desc: studentDescriptions[9] },
]

const teachers = [
  { name: "Dr. Roberto Garcia", email: "roberto.garcia@peak.edu.ph", desc: teacherDescriptions[0] },
  { name: "Prof. Elena Fernandez", email: "elena.fernandez@peak.edu.ph", desc: teacherDescriptions[1] },
  { name: "Dr. Anthony De Leon", email: "anthony.deleon@peak.edu.ph", desc: teacherDescriptions[2] },
]

async function seed() {
  console.log("Seeding test accounts...")
  const password = "password123"
  const hash = await bcrypt.hash(password, 10)

  // Seed Students
  for (const s of students) {
    const parts = s.name.split(" ")
    const firstName = parts[0]
    const lastName = parts.slice(1).join(" ")

    // Check if exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [s.email])
    if (existing.rows.length > 0) {
      await pool.query(
        "UPDATE users SET name = $1, password = $2, role = $3, first_name = $4, last_name = $5, job_role_description = $6 WHERE email = $7",
        [s.name, hash, "student", firstName, lastName, s.desc, s.email]
      )
      console.log(`[Student Updated]: ${s.email} (${s.name})`)
    } else {
      await pool.query(
        `INSERT INTO users (name, email, password, role, first_name, last_name, job_role_description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [s.name, s.email, hash, "student", firstName, lastName, s.desc]
      )
      console.log(`[Student Created]: ${s.email} (${s.name})`)
    }
  }

  // Seed Teachers
  for (const t of teachers) {
    const parts = t.name.split(" ")
    const firstName = parts.slice(0, 2).join(" ")
    const lastName = parts.slice(2).join(" ") || parts[1]

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [t.email])
    if (existing.rows.length > 0) {
      await pool.query(
        "UPDATE users SET name = $1, password = $2, role = $3, first_name = $4, last_name = $5, job_role_description = $6 WHERE email = $7",
        [t.name, hash, "teacher", firstName, lastName, t.desc, t.email]
      )
      console.log(`[Teacher Updated]: ${t.email} (${t.name})`)
    } else {
      await pool.query(
        `INSERT INTO users (name, email, password, role, first_name, last_name, job_role_description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [t.name, t.email, hash, "teacher", firstName, lastName, t.desc]
      )
      console.log(`[Teacher Created]: ${t.email} (${t.name})`)
    }
  }

  console.log("\nAll 10 students and 3 teachers have been successfully seeded!")
  await pool.end()
}

seed().catch((err) => {
  console.error("Seeding error:", err)
  process.exit(1)
})
