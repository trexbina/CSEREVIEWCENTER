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

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const { password: _, ...safeUser } = user
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
