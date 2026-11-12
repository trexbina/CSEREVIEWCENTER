import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { isAdminRole } from "@/lib/auth"
import { ensureSubscriptionSchema } from "@/lib/subscriptions"

async function authorize() {
  const session = await getSession()
  return session && isAdminRole(session.role) ? session : null
}

export async function GET() {
  const session = await authorize()
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  try {
    await ensureSubscriptionSchema()
    const [plans, exams, subjects, mockExams, students] = await Promise.all([
      pool.query(`SELECT p.*, e.name AS examination_name,
        COALESCE((SELECT json_agg(subject_id) FROM subscription_plan_subjects WHERE subscription_plan_id = p.id), '[]') AS subject_ids,
        COALESCE((SELECT json_agg(mock_exam_id) FROM subscription_plan_mock_exams WHERE subscription_plan_id = p.id), '[]') AS mock_exam_ids
        FROM subscription_plans p JOIN examinations e ON e.id = p.examination_id ORDER BY e.name, p.plan_type, p.duration_days NULLS FIRST, p.name`),
      pool.query("SELECT id, name FROM examinations ORDER BY name"),
      pool.query("SELECT id, title, code FROM subjects WHERE status = 'active' ORDER BY title"),
      pool.query("SELECT id, title, exam_code FROM mock_exams WHERE status = 'active' ORDER BY title"),
      pool.query("SELECT id, name, email, exam_id FROM users WHERE role = 'student' ORDER BY name"),
    ])
    return NextResponse.json({ plans: plans.rows, examinations: exams.rows, subjects: subjects.rows, mockExams: mockExams.rows, students: students.rows })
  } catch (error) {
    console.error("[subscription-plans GET]", error)
    return NextResponse.json({ error: "Unable to load subscription plans." }, { status: 500 })
  }
}

export async function POST(request) {
  const session = await authorize()
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  try {
    await ensureSubscriptionSchema()
    const body = await request.json()
    const { action, plan = {} } = body
    if (action === "DELETE") {
      await pool.query("DELETE FROM subscription_plans WHERE id = $1", [Number(plan.id)])
      return NextResponse.json({ success: true })
    }
    if (!['CREATE', 'UPDATE'].includes(action)) return NextResponse.json({ error: "Invalid action." }, { status: 400 })
    const examinationId = Number(plan.examination_id)
    const billingInterval = plan.plan_type === 'free' ? 'none' : plan.billing_interval
    const duration = billingInterval === 'annual' ? 365 : billingInterval === 'monthly' ? 30 : null
    const price = plan.plan_type === 'free' ? null : Number(plan.price)
    if (!examinationId || !plan.name?.trim() || (plan.plan_type !== 'free' && !['monthly', 'annual'].includes(billingInterval))) {
      return NextResponse.json({ error: "Choose an examination, a name, and either a Monthly or Annual paid interval." }, { status: 400 })
    }
    if (plan.plan_type !== 'free' && (!Number.isFinite(price) || price < 0)) return NextResponse.json({ error: "A valid price is required for paid plans." }, { status: 400 })
    if (plan.is_default_free && plan.plan_type !== 'free') return NextResponse.json({ error: "Only Free plans can be the default plan." }, { status: 400 })
    const values = [examinationId, plan.name.trim(), plan.description?.trim() || null, price, duration, billingInterval, plan.plan_type || 'paid', plan.access_mode || 'all', Boolean(plan.is_default_free), plan.status || 'active']
    let planId = Number(plan.id)
    await pool.query('BEGIN')
    try {
      if (plan.is_default_free) {
        await pool.query("UPDATE subscription_plans SET is_default_free = false WHERE examination_id = $1", [examinationId])
      }
      if (action === 'CREATE') {
        const result = await pool.query(`INSERT INTO subscription_plans (examination_id,name,description,price,duration_days,billing_interval,plan_type,access_mode,is_default_free,status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, values)
        planId = result.rows[0].id
      } else {
        await pool.query(`UPDATE subscription_plans SET examination_id=$1,name=$2,description=$3,price=$4,duration_days=$5,billing_interval=$6,plan_type=$7,access_mode=$8,is_default_free=$9,status=$10,updated_at=NOW() WHERE id=$11`, [...values, planId])
      }
      await pool.query("DELETE FROM subscription_plan_subjects WHERE subscription_plan_id = $1", [planId])
      await pool.query("DELETE FROM subscription_plan_mock_exams WHERE subscription_plan_id = $1", [planId])
      if (plan.access_mode === 'selected') {
        for (const subjectId of [...new Set((plan.subject_ids || []).map(Number).filter(Boolean))]) {
          await pool.query("INSERT INTO subscription_plan_subjects (subscription_plan_id, subject_id) VALUES ($1,$2)", [planId, subjectId])
        }
        for (const mockId of [...new Set((plan.mock_exam_ids || []).map(Number).filter(Boolean))]) {
          await pool.query("INSERT INTO subscription_plan_mock_exams (subscription_plan_id, mock_exam_id) VALUES ($1,$2)", [planId, mockId])
        }
      }
      await pool.query('COMMIT')
    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
    return NextResponse.json({ success: true, id: planId })
  } catch (error) {
    console.error("[subscription-plans POST]", error)
    return NextResponse.json({ error: "Unable to save subscription plan." }, { status: 500 })
  }
}
