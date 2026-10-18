import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import pool from "@/lib/db"

const ADMIN_ROLES = ["admin", "super_admin", "academic_admin", "registrar"]

export const runtime = "nodejs"

/**
 * Validate token state
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ valid: false, error: "Missing reset token." }, { status: 400 })
    }

    const res = await pool.query(
      `SELECT t.id, t.expires_at, t.used, u.role
       FROM password_reset_tokens t
       JOIN users u ON t.user_id = u.id
       WHERE t.token = $1`,
      [token]
    )

    if (res.rows.length === 0) {
      return NextResponse.json({ valid: false, error: "Invalid reset token." }, { status: 404 })
    }

    const record = res.rows[0]

    if (record.used) {
      return NextResponse.json({ valid: false, error: "This password reset link has already been used." }, { status: 400 })
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: "This password reset link has expired." }, { status: 400 })
    }

    if (ADMIN_ROLES.includes(record.role?.toLowerCase())) {
      return NextResponse.json({ valid: false, error: "invalid Contact Admin to change password" }, { status: 403 })
    }

    return NextResponse.json({ valid: true })
  } catch (err) {
    console.error("[reset-password GET] Error:", err)
    return NextResponse.json({ valid: false, error: "Server error validating token." }, { status: 500 })
  }
}

/**
 * Execute password reset
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { token, newPassword, confirmPassword } = body

    if (!token) {
      return NextResponse.json({ error: "Missing reset token." }, { status: 400 })
    }

    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Please provide and confirm your new password." }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 })
    }

    // Lookup token
    const res = await pool.query(
      `SELECT t.id, t.user_id, t.expires_at, t.used, u.role
       FROM password_reset_tokens t
       JOIN users u ON t.user_id = u.id
       WHERE t.token = $1`,
      [token]
    )

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Invalid or nonexistent reset link." }, { status: 404 })
    }

    const record = res.rows[0]

    if (record.used) {
      return NextResponse.json({ error: "This reset link has already been used." }, { status: 400 })
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 })
    }

    if (ADMIN_ROLES.includes(record.role?.toLowerCase())) {
      return NextResponse.json({ error: "invalid Contact Admin to change password" }, { status: 403 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user password and mark token used in a single transaction
    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      await client.query(
        `UPDATE users SET password = $1 WHERE id = $2`,
        [hashedPassword, record.user_id]
      )

      await client.query(
        `UPDATE password_reset_tokens SET used = true WHERE id = $1`,
        [record.id]
      )

      await client.query("COMMIT")
    } catch (txError) {
      await client.query("ROLLBACK")
      throw txError
    } finally {
      client.release()
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been reset successfully. You can now sign in with your new password.",
    })
  } catch (err) {
    console.error("[reset-password POST] Error:", err)
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    )
  }
}
