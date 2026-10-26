import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import pool from "@/lib/db"

/** GET /api/auth/me — current user's profile from DB. */
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const { rows } = await pool.query(
      "SELECT id, name, email, role, created_at, last_login_at, login_count, first_name, middle_name, last_name, suffix, birthday, gender, phone, address, city, province, zip_code, school, course, year_graduated, highest_education, avatar, avatar_url, job_role_description FROM users WHERE id = $1",
      [session.userId]
    )

    if (rows.length === 0) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user: rows[0] })
  } catch (err) {
    console.error("[me] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
