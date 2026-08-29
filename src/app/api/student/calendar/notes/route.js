import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_calendar_notes (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_date DATE NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      time VARCHAR(10),
      tag VARCHAR(50) DEFAULT 'personal',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_student_calendar_notes_student ON student_calendar_notes(student_id);
    CREATE INDEX IF NOT EXISTS idx_student_calendar_notes_date ON student_calendar_notes(event_date);
  `)
}

// ── GET /api/student/calendar/notes ──────────────────────────────────────────
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session?.userId || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }

    await ensureTable()

    const { rows } = await pool.query(
      `SELECT id, to_char(event_date, 'YYYY-MM-DD') as event_date, title, description, time, tag, created_at 
       FROM student_calendar_notes 
       WHERE student_id = $1 
       ORDER BY event_date ASC, id ASC`,
      [session.userId]
    )

    return NextResponse.json({ notes: rows })
  } catch (err) {
    console.error("[student/calendar/notes GET] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

// ── POST /api/student/calendar/notes ─────────────────────────────────────────
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session?.userId || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }

    await ensureTable()

    const { event_date, title, description, time, tag } = await request.json()

    if (!event_date || !title?.trim()) {
      return NextResponse.json(
        { error: "Event date and title are required." },
        { status: 400 }
      )
    }

    const { rows } = await pool.query(
      `INSERT INTO student_calendar_notes (student_id, event_date, title, description, time, tag)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, to_char(event_date, 'YYYY-MM-DD') as event_date, title, description, time, tag, created_at`,
      [session.userId, event_date, title.trim(), description?.trim() || null, time?.trim() || null, tag?.trim() || "personal"]
    )

    return NextResponse.json({ note: rows[0] }, { status: 201 })
  } catch (err) {
    console.error("[student/calendar/notes POST] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

// ── DELETE /api/student/calendar/notes?id=… ─────────────────────────────────
export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session?.userId || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Note ID is required." }, { status: 400 })
    }

    await ensureTable()

    const { rowCount } = await pool.query(
      "DELETE FROM student_calendar_notes WHERE id = $1 AND student_id = $2",
      [id, session.userId]
    )

    if (rowCount === 0) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 })
    }

    return NextResponse.json({ message: "Note deleted successfully." })
  } catch (err) {
    console.error("[student/calendar/notes DELETE] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
