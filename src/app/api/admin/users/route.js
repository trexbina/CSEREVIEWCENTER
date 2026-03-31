import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

const VALID_ROLES = ["student", "teacher", "admin"]

/** GET /api/admin/users — list all users (admin only). */
export async function GET() {
  try {
    const session = await getSession()
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const { rows } = await pool.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
    )
    return NextResponse.json({ users: rows })
  } catch (err) {
    console.error("[admin/users GET] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

/** POST /api/admin/users — create a student or teacher (admin only). */
export async function POST(request) {
  try {
    const session = await getSession()
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, role } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required." },
        { status: 400 }
      )
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'student', 'teacher', or 'admin'." },
        { status: 400 }
      )
    }

    const hash = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `INSERT INTO users (
        name, email, password, role,
        first_name, middle_name, last_name, suffix,
        birthday, gender, phone, address, city, province, zip_code,
        school, course, year_graduated, highest_education
      )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, name, email, role, created_at`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        hash,
        role,
        body.first_name?.trim() || null,
        body.middle_name?.trim() || null,
        body.last_name?.trim() || null,
        body.suffix?.trim() || null,
        body.birthday || null,
        body.gender || null,
        body.phone?.trim() || null,
        body.address?.trim() || null,
        body.city?.trim() || null,
        body.province?.trim() || null,
        body.zip_code?.trim() || null,
        body.school?.trim() || null,
        body.course?.trim() || null,
        body.year_graduated?.toString().trim() || null,
        body.highest_education || null,
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      )
    }

    return NextResponse.json({ user: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error("[admin/users POST] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

/** DELETE /api/admin/users?id=123 — delete a user (admin only, cannot delete self). */
export async function DELETE(request) {
  try {
    const session = await getSession()
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "User id is required." }, { status: 400 })
    }

    if (Number(userId) === session.userId) {
      return NextResponse.json({ error: "Cannot delete yourself." }, { status: 400 })
    }

    const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [userId])

    if (rowCount === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[admin/users DELETE] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

/** PUT /api/admin/users?id=123 — update a user (admin only). */
export async function PUT(request) {
  try {
    const session = await getSession()
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "User id is required." }, { status: 400 })
    }

    const { name, email, role, password } = await request.json()

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      )
    }

    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'student', 'teacher', or 'admin'." },
        { status: 400 }
      )
    }

    // Check email uniqueness (excluding current user)
    const dup = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email.toLowerCase().trim(), userId]
    )
    if (dup.rows.length > 0) {
      return NextResponse.json(
        { error: "Email already used by another account." },
        { status: 409 }
      )
    }

    let result
    if (password?.trim()) {
      // Update with new password
      const hash = await bcrypt.hash(password.trim(), 10)
      result = await pool.query(
        `UPDATE users SET name = $1, email = $2, role = $3, password = $4
         WHERE id = $5
         RETURNING id, name, email, role, created_at`,
        [name.trim(), email.toLowerCase().trim(), role || "student", hash, userId]
      )
    } else {
      // Update without changing password
      result = await pool.query(
        `UPDATE users SET name = $1, email = $2, role = $3
         WHERE id = $4
         RETURNING id, name, email, role, created_at`,
        [name.trim(), email.toLowerCase().trim(), role || "student", userId]
      )
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 })
    }

    return NextResponse.json({ user: result.rows[0] })
  } catch (err) {
    console.error("[admin/users PUT] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
