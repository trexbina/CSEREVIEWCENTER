import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import pool from "@/lib/db"
import { signToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth"

export async function POST(request) {
  try {
    const body = await request.json()
    const identifier = (body.loginId || body.login_id || body.email || "").toLowerCase().trim()
    const password = body.password

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Login ID and password are required." },
        { status: 400 }
      )
    }

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.login_id, u.password, u.role, u.is_active, u.subscription_end_date,
              b.end_date as batch_end_date, b.name as batch_name
       FROM users u
       LEFT JOIN batches b ON u.batch_id = b.id
       WHERE LOWER(u.login_id) = $1 OR LOWER(u.email) = $1`,
      [identifier]
    )

    const user = result.rows[0]

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { error: "Invalid Login ID or password." },
        { status: 401 }
      )
    }

    // Check account active status
    if (user.is_active === false) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact your administrator for assistance." },
        { status: 403 }
      )
    }

    // Check student subscription expiry (inherited from batch or custom student extension)
    if (user.role === "student") {
      const effectiveEndDate = user.subscription_end_date || user.batch_end_date
      if (effectiveEndDate) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const expDate = new Date(effectiveEndDate)
        if (expDate < today) {
          const formattedDate = expDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
          return NextResponse.json(
            { error: `Your review term completed on ${formattedDate}. Please contact your administrator for renewal or extension.` },
            { status: 403 }
          )
        }
      }
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
      loginId: user.login_id,
      role: user.role,
    })

    const { password: _, ...safeUser } = updatedUser
    const response = NextResponse.json({ user: safeUser })
    response.cookies.set("session", token, SESSION_COOKIE_OPTIONS)
    return response
  } catch (err) {
    console.error("[login] error details:", err)
    return NextResponse.json(
      { 
        error: err?.message || "Internal server error.",
        code: err?.code,
        hint: !process.env.DATABASE_URL && !process.env.POSTGRES_URL ? "Missing DATABASE_URL or POSTGRES_URL environment variable." : undefined
      },
      { status: 500 }
    )
  }
}
