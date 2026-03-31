/**
 * seed.mjs — Run with: node seed.mjs
 *
 * Creates tables (if not exist) and inserts sample users,
 * assignments, and submissions with properly hashed passwords.
 *
 * Requires:
 *   - PostgreSQL running with a "reviewapp" database created
 *   - DATABASE_URL in .env.local or environment
 *
 * Usage:
 *   node --env-file=.env.local seed.mjs
 */

import pg from "pg"
import bcrypt from "bcryptjs"

const { Pool } = pg

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:your_password@localhost:5432/reviewapp",
})

async function seed() {
  console.log("🌱 Seeding database…\n")

  // ── Create tables ──────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(100)        NOT NULL,
      email       VARCHAR(255) UNIQUE NOT NULL,
      password    VARCHAR(255)        NOT NULL,
      role        VARCHAR(20)         NOT NULL DEFAULT 'student'
                    CHECK (role IN ('student', 'teacher', 'admin')),
      created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

    CREATE TABLE IF NOT EXISTS assignments (
      id          SERIAL PRIMARY KEY,
      title       VARCHAR(255) NOT NULL,
      description TEXT,
      teacher_id  INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments (teacher_id);

    CREATE TABLE IF NOT EXISTS submissions (
      id            SERIAL PRIMARY KEY,
      assignment_id INT          NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      student_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content       TEXT,
      status        VARCHAR(20)  NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'reviewed')),
      grade         VARCHAR(10),
      feedback      TEXT,
      submitted_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      reviewed_at   TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_submissions_student    ON submissions (student_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions (assignment_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_status     ON submissions (status);
  `)

  console.log("✅ Tables created\n")

  // ── Hash passwords ─────────────────────────────────────────
  const password = await bcrypt.hash("password123", 10)

  // ── Insert users ───────────────────────────────────────────
  const users = [
    { name: "Admin User",    email: "admin@test.com",   role: "admin" },
    { name: "Jane Teacher",  email: "teacher@test.com", role: "teacher" },
    { name: "Alice Student", email: "alice@test.com",   role: "student" },
    { name: "Bob Student",   email: "bob@test.com",     role: "student" },
  ]

  for (const u of users) {
    await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [u.name, u.email, password, u.role]
    )
  }

  console.log("✅ Users seeded  (password = password123 for all)")

  // ── Fetch user IDs ─────────────────────────────────────────
  const { rows: dbUsers } = await pool.query(
    "SELECT id, email FROM users ORDER BY id"
  )
  const byEmail = Object.fromEntries(dbUsers.map((u) => [u.email, u.id]))

  const teacherId = byEmail["teacher@test.com"]
  const aliceId   = byEmail["alice@test.com"]
  const bobId     = byEmail["bob@test.com"]

  // ── Insert assignments ─────────────────────────────────────
  const assignments = [
    { title: "Math Quiz #5",       desc: "Complete problems 1-20 from Chapter 5." },
    { title: "Science Lab Report", desc: "Write up the results of the pendulum experiment." },
    { title: "English Essay",      desc: 'Write a 500-word essay on "To Kill a Mockingbird".' },
  ]

  for (const a of assignments) {
    await pool.query(
      `INSERT INTO assignments (title, description, teacher_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [a.title, a.desc, teacherId]
    )
  }

  console.log("✅ Assignments seeded")

  // ── Fetch assignment IDs ───────────────────────────────────
  const { rows: dbAssignments } = await pool.query(
    "SELECT id, title FROM assignments ORDER BY id"
  )
  const aByTitle = Object.fromEntries(dbAssignments.map((a) => [a.title, a.id]))

  // ── Insert submissions ─────────────────────────────────────
  const subs = [
    { aid: aByTitle["Math Quiz #5"],       sid: aliceId, content: "My answers to the math quiz.",  status: "reviewed", grade: "A-", feedback: "Great work on problem 15!" },
    { aid: aByTitle["Science Lab Report"], sid: aliceId, content: "Pendulum lab observations…",    status: "pending",  grade: null, feedback: null },
    { aid: aByTitle["English Essay"],      sid: aliceId, content: "Essay about social justice…",   status: "reviewed", grade: "B+", feedback: "Strong thesis, work on transitions." },
    { aid: aByTitle["Math Quiz #5"],       sid: bobId,   content: "Bob's math quiz answers.",      status: "pending",  grade: null, feedback: null },
    { aid: aByTitle["English Essay"],      sid: bobId,   content: "Bob's essay on the novel…",     status: "reviewed", grade: "A",  feedback: "Excellent analysis." },
  ]

  for (const s of subs) {
    await pool.query(
      `INSERT INTO submissions (assignment_id, student_id, content, status, grade, feedback, reviewed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        s.aid,
        s.sid,
        s.content,
        s.status,
        s.grade,
        s.feedback,
        s.status === "reviewed" ? new Date() : null,
      ]
    )
  }

  console.log("✅ Submissions seeded\n")
  console.log("─────────────────────────────────────────")
  console.log("  Sample login credentials:")
  console.log("  admin@test.com    / password123  (admin)")
  console.log("  teacher@test.com  / password123  (teacher)")
  console.log("  alice@test.com    / password123  (student)")
  console.log("  bob@test.com      / password123  (student)")
  console.log("─────────────────────────────────────────\n")

  await pool.end()
  process.exit(0)
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})
