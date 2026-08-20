import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

// Ensure font_preference column exists in users table
async function ensureFontColumn() {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS font_preference VARCHAR(50) DEFAULT 'geist';
    `)
  } catch (e) {
    // Column might already exist
  }
}

// GET /api/user/preferences — get current user's font and display preferences
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureFontColumn()

    const { rows } = await pool.query(
      "SELECT font_preference FROM users WHERE id = $1",
      [session.userId]
    )

    return NextResponse.json({
      font: rows[0]?.font_preference || "geist",
    })
  } catch (err) {
    console.error("[api/user/preferences GET]", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

// PUT /api/user/preferences — save user's font preference in database
export async function PUT(req) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { font } = await req.json()
    if (!font) {
      return NextResponse.json({ error: "Font key is required." }, { status: 400 })
    }

    await ensureFontColumn()

    await pool.query(
      "UPDATE users SET font_preference = $1 WHERE id = $2",
      [font, session.userId]
    )

    return NextResponse.json({ success: true, font })
  } catch (err) {
    console.error("[api/user/preferences PUT]", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
