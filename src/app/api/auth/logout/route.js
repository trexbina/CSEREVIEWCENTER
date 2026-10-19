import { NextResponse } from "next/server"
import { SESSION_COOKIE_OPTIONS, verifyToken } from "@/lib/auth"
import pool from "@/lib/db"
import { getClientIp } from "@/lib/device-utils"

async function recordLogout(request) {
  try {
    const token = request.cookies.get("session")?.value
    if (!token) return
    const payload = await verifyToken(token)
    if (!payload?.userId) return

    const clientIp = getClientIp(request)

    await pool.query(
      `UPDATE user_active_sessions SET status = 'logged_out', last_active = NOW() WHERE user_id = $1 AND status = 'active'`,
      [payload.userId]
    )

    await pool.query(
      `INSERT INTO security_audit_logs (user_id, user_name, user_role, event_type, description, ip_address, status, created_at)
       VALUES ($1, $2, $3, 'AUTH_LOGOUT', $4, $5, 'success', NOW())`,
      [
        payload.userId,
        payload.loginId || payload.email || "User",
        payload.role || "student",
        "User logged out of the session",
        clientIp
      ]
    )
  } catch (err) {
    console.error("[logout] session update error:", err)
  }
}

function clearSessionCookie(response) {
  // Clear standard session cookie
  response.cookies.set("session", "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  })

  // Defensive clears for root path without extra options
  response.cookies.set("session", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  })

  // Set-Cookie header directly as additional fallback
  response.headers.append(
    "Set-Cookie",
    "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax"
  )

  return response
}

export async function GET(request) {
  await recordLogout(request)
  const url = new URL(request.url)
  const redirectTo = url.searchParams.get("redirect") || "/"
  // Ensure we redirect to root or requested path with 303 See Other
  const target = redirectTo.startsWith("http") ? redirectTo : new URL(redirectTo, request.url).toString()
  const response = NextResponse.redirect(target, { status: 303 })
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  return clearSessionCookie(response)
}

export async function POST(request) {
  await recordLogout(request)
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store, no-cache" } })
  return clearSessionCookie(response)
}

export async function DELETE(request) {
  await recordLogout(request)
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store, no-cache" } })
  return clearSessionCookie(response)
}
