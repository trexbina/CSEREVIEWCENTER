import { NextResponse } from "next/server"
import crypto from "crypto"
import pool from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"

const ADMIN_ROLES = ["admin", "super_admin", "academic_admin", "registrar"]

export const runtime = "nodejs"

export async function POST(request) {
  try {
    const body = await request.json()
    const rawIdentifier = body.email || body.username || body.loginId || body.login_id || ""
    const identifier = rawIdentifier.trim().toLowerCase()

    if (!identifier) {
      return NextResponse.json(
        { error: "Please enter your email address." },
        { status: 400 }
      )
    }

    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
    `)

    // Query user by email or personal_email
    const userRes = await pool.query(
      `SELECT id, name, email, personal_email, role, is_active
       FROM users
       WHERE LOWER(email) = $1 OR LOWER(personal_email) = $1
       LIMIT 1`,
      [identifier]
    )

    const user = userRes.rows[0]

    // Security requirement: Admins must NEVER reset passwords through this public mechanism
    if (user && ADMIN_ROLES.includes(user.role?.toLowerCase())) {
      return NextResponse.json(
        { error: "invalid Contact Admin to change password" },
        { status: 403 }
      )
    }

    // If no non-admin user exists with that identifier, return blind success message to prevent user enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account with that username exists, a password reset link has been sent to its registered email address.",
      })
    }

    // Ensure account is active
    if (user.is_active === false) {
      return NextResponse.json(
        { error: "Your account is inactive. Please contact the administrator for assistance." },
        { status: 403 }
      )
    }

    // Determine destination email
    const recipientEmail = (user.personal_email || user.email || "").trim()

    if (!recipientEmail || !recipientEmail.includes("@")) {
      // Blind fallback if somehow no valid email is found
      return NextResponse.json({
        success: true,
        message: "If an account with that username exists, a password reset link has been sent to its registered email address.",
      })
    }

    // Invalidate previous pending tokens for this user
    await pool.query(
      `UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false`,
      [user.id]
    )

    // Generate high-entropy cryptographic token
    const token = crypto.randomBytes(32).toString("hex")

    // Save token with 1 hour expiration
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, email, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour')`,
      [user.id, token, recipientEmail]
    )

    // Determine app origin for the reset link
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host")
    const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https")
    const origin =
      request.headers.get("origin") ||
      (host ? `${proto}://${host}` : null) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000"

    const resetUrl = `${origin}/reset-password?token=${token}`

    // Send the email via nodemailer
    await sendPasswordResetEmail({
      to: recipientEmail,
      name: user.name,
      resetUrl,
    })

    return NextResponse.json({
      success: true,
      message: "A password reset link has been dispatched to your registered email. Please check your inbox and spam folder.",
    })
  } catch (error) {
    console.error("[forgot-password] Error:", error)
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred while processing your request. Please try again later." },
      { status: 500 }
    )
  }
}
