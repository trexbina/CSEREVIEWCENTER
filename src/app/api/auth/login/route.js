import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import pool from "@/lib/db"
import { signToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth"

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      )
    }

    const result = await pool.query(
      "SELECT id, name, email, password, role FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    )

    const user = result.rows[0]

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      )
    }

    // Update login count and last login timestamp
    const updateRes = await pool.query(
      `UPDATE users SET last_login_at = NOW(), login_count = COALESCE(login_count, 0) + 1 WHERE id = $1 RETURNING last_login_at, login_count`,
      [user.id]
    )

    const updatedUser = {
      ...user,
      last_login_at: updateRes.rows[0]?.last_login_at,
      login_count: updateRes.rows[0]?.login_count
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const { password: _, ...safeUser } = updatedUser
    const response = NextResponse.json({ user: safeUser })
    response.cookies.set("session", token, SESSION_COOKIE_OPTIONS)
    return response
  } catch (err) {
    console.error("[login] error:", err)
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    )
  }
}
