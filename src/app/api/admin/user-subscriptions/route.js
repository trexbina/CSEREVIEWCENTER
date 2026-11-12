import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { isAdminRole } from "@/lib/auth"
import { assignSubscription, ensureSubscriptionSchema } from "@/lib/subscriptions"

export async function GET(request) {
  const session = await getSession()
  if (!session || !isAdminRole(session.role)) return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  await ensureSubscriptionSchema()
  const userId = Number(new URL(request.url).searchParams.get('userId'))
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 })
  const { rows } = await pool.query(`SELECT us.*, p.name AS current_plan_name, e.name AS examination_name
    FROM user_subscriptions us JOIN subscription_plans p ON p.id = us.subscription_plan_id
    JOIN examinations e ON e.id = us.examination_id
    WHERE us.user_id = $1 ORDER BY us.created_at DESC`, [userId])
  return NextResponse.json({ subscriptions: rows })
}

export async function POST(request) {
  const session = await getSession()
  if (!session || !isAdminRole(session.role)) return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  try {
    const body = await request.json()
    const subscription = await assignSubscription({
      userId: Number(body.userId), planId: Number(body.planId), activatedAt: body.activatedAt,
      expiresAt: body.expiresAt || null, assignedBy: session.userId,
    })
    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to assign subscription." }, { status: 400 })
  }
}
