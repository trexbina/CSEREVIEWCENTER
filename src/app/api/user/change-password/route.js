import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

/**
 * POST /api/user/change-password
 * Allows authenticated users (admin, teacher, student) to change their password with retype verification.
 */
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    if (!newPassword || newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New password and retype password do not match." },
        { status: 400 }
      )
    }

    // Verify current user from database
    const userRes = await pool.query(
      "SELECT id, name, email, role, password FROM users WHERE id = $1",
      [session.userId]
    )

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 })
    }

    const user = userRes.rows[0]

    // Current password is strictly required for security
    if (!currentPassword || !currentPassword.trim()) {
      return NextResponse.json(
        { error: "Current password is required to change your password." },
        { status: 400 }
      )
    }

    const isMatch = await bcrypt.compare(currentPassword.trim(), user.password)
    if (!isMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect. If you forgot your password, contact an administrator." },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10)

    // Update user password
    await pool.query(
      "UPDATE users SET password = $1 WHERE id = $2",
      [hashedPassword, session.userId]
    )

    // Audit log
    try {
      await pool.query(`
        INSERT INTO security_audit_logs (user_id, user_name, user_role, event_type, description, status, created_at)
        VALUES ($1, $2, $3, 'PASSWORD_CHANGE', 'Account password was successfully changed', 'success', NOW())
      `, [user.id, user.name || session.email, user.role || session.role])
    } catch (auditErr) {
      console.warn("[change-password audit log]:", auditErr.message)
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    })
  } catch (err) {
    console.error("[change-password API error]:", err)
    return NextResponse.json(
      { error: "Failed to update password. Please try again." },
      { status: 500 }
    )
  }
}
