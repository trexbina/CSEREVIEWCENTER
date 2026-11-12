import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"

const ADMIN_ROLES = ["admin", "super_admin", "academic_admin", "registrar"]

function requireAdmin(session) {
  return session && ADMIN_ROLES.includes(session.role)
}

/** Security-policy notifications were removed with the Security & Access Policies feature. */
export async function GET() {
  const session = await getSession()
  if (!requireAdmin(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  return NextResponse.json({ notifications: [], unreadCount: 0 }, { headers: { "Cache-Control": "private, max-age=60" } })
}

export async function PATCH() {
  const session = await getSession()
  if (!requireAdmin(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const session = await getSession()
  if (!requireAdmin(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  return NextResponse.json({ success: true })
}
