import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return "127.0.0.1"
}

/**
 * POST /api/security/incident
 * Records exam integrity violations or security deterrence triggers into security_audit_logs
 */
export async function POST(request) {
  try {
    const session = await getSession()
    const clientIp = getClientIp(request)
    const body = await request.json().catch(() => ({}))

    const {
      eventType = "EXAM_INTEGRITY_VIOLATION",
      description = "Security policy violation detected during student session",
      details = ""
    } = body

    const userId = session?.userId || session?.id || null
    const userName = session?.name || "Student (Unauthenticated)"
    const userRole = session?.role || "student"

    const fullDescription = details
      ? `${description} - Path: ${details}`
      : description

    await pool.query(
      `INSERT INTO security_audit_logs (user_id, user_name, user_role, event_type, description, ip_address, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'warning', NOW())`,
      [userId, userName, userRole, eventType, fullDescription, clientIp]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[POST /api/security/incident] Error:", err)
    return NextResponse.json({ error: "Failed to log incident" }, { status: 500 })
  }
}
