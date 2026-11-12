import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import pool from "@/lib/db"
import { signToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth"
import { getActiveSubscriptions, migrateLegacyCohorts } from "@/lib/subscriptions"
import { dashboardPathForExamination } from "@/lib/examination-dashboard"

export async function POST(request) {
  try {
    const body = await request.json()
    const email = (body.email || body.loginId || body.login_id || "").toLowerCase().trim()
    const password = body.password

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      )
    }

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.password, u.role, u.is_active, u.exam_id, e.name AS examination_name
       FROM users u LEFT JOIN examinations e ON e.id = u.exam_id WHERE LOWER(u.email) = $1`,
      [email]
    )

    const user = result.rows[0]

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { error: "Invalid email or password." },
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

    // Student access is controlled exclusively by active subscription assignments.
    if (user.role === "student") {
      await migrateLegacyCohorts()
      const activeSubscriptions = await getActiveSubscriptions(user.id)
      if (!activeSubscriptions.length) {
        return NextResponse.json(
          { error: "Your subscription is inactive or expired. Please contact your administrator for access." },
          { status: 403 }
        )
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
      role: user.role,
    })

    const { password: _, ...safeUser } = updatedUser
    const dashboardPath = user.role === "student" ? dashboardPathForExamination(user.examination_name) : null
    const response = NextResponse.json({ user: safeUser, dashboardPath })
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
