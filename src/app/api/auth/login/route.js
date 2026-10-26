import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import pool from "@/lib/db"
import { signToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth"
import { parseDeviceFromUserAgent, getClientIp } from "@/lib/device-utils"

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
      `SELECT u.id, u.name, u.email, u.password, u.role, u.is_active, u.subscription_end_date,
              b.end_date as batch_end_date, b.name as batch_name
       FROM users u
       LEFT JOIN batches b ON u.batch_id = b.id
       WHERE LOWER(u.email) = $1`,
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
      role: user.role,
    })

    // Record active session and audit log dynamically
    try {
      const userAgent = request.headers.get("user-agent") || ""
      const clientIp = getClientIp(request)
      const deviceInfo = parseDeviceFromUserAgent(userAgent)
      const sessionId = `sess_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

      await pool.query(
        `INSERT INTO user_active_sessions (
           id, user_id, user_name, email, role, device, device_type, ip_address, location, login_time, last_active, is_current, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), true, 'active')`,
        [
          sessionId,
          user.id,
          user.name,
          user.email,
          user.role,
          deviceInfo.device,
          deviceInfo.deviceType,
          clientIp,
          "Philippines"
        ]
      )

      await pool.query(
        `INSERT INTO security_audit_logs (user_id, user_name, user_role, event_type, description, ip_address, status, created_at)
         VALUES ($1, $2, $3, 'AUTH_LOGIN', $4, $5, 'success', NOW())`,
        [
          user.id,
          user.name,
          user.role,
          `User signed in from ${deviceInfo.device}`,
          clientIp
        ]
      )
    } catch (sessErr) {
      console.error("[login] session tracking error:", sessErr)
    }

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
