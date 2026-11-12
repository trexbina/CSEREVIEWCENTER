import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { ensureSubscriptionSchema } from "@/lib/subscriptions"

export async function GET() {
  try {
    await ensureSubscriptionSchema()
    const { rows } = await pool.query(`SELECT p.id, p.name, p.description, p.price, p.duration_days, p.billing_interval, p.plan_type, e.name AS examination_name
      FROM subscription_plans p JOIN examinations e ON e.id = p.examination_id
      WHERE p.status = 'active' AND p.plan_type = 'paid' ORDER BY p.price NULLS LAST, p.duration_days, p.name`)
    return NextResponse.json({ plans: rows })
  } catch {
    return NextResponse.json({ plans: [] })
  }
}
