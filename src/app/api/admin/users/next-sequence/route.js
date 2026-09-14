import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES } from "@/lib/auth"
import { sanitizeSurnamePrefix } from "@/lib/login-id"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/admin/users/next-sequence?lastName=...&name=...&role=...
 * Returns preview of the next automatic sequence number and generated Login ID.
 */
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const lastName = searchParams.get("lastName") || ""
    const fullName = searchParams.get("name") || ""
    const role = searchParams.get("role") || "student"

    const prefix = sanitizeSurnamePrefix(lastName, fullName, role)

    const seqRes = await pool.query(`
      SELECT COALESCE(MAX(login_number::bigint), 0) + 1 AS next_seq
      FROM users
      WHERE login_number ~ '^[0-9]+$'
    `)

    const nextSeq = Number(seqRes.rows[0]?.next_seq || 1)
    const nextNumber = String(nextSeq).padStart(5, "0")
    const loginId = `${prefix}${nextNumber}`

    return NextResponse.json({
      prefix,
      nextNumber,
      loginId,
    })
  } catch (err) {
    console.error("[next-sequence GET] error:", err)
    return NextResponse.json({ error: "Failed to generate next sequence." }, { status: 500 })
  }
}
