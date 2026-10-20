import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { isAdminRole } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/admin/subscriptions
 * Fetches subscription overview metrics, batches with student counts and expiry dates,
 * and list of student subscriptions.
 */
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session || !isAdminRole(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all" // all, active, expiring, expired
    const batchIdParam = searchParams.get("batchId")

    // 1. Fetch batches with student counts and expiry info
    const batchesRes = await pool.query(`
      SELECT 
        b.id, b.name, b.target_year, b.status, b.start_date, b.end_date, b.exam_id,
        e.name as exam_name,
        (SELECT COUNT(*) FROM users u WHERE u.batch_id = b.id AND u.role = 'student') as student_count,
        (SELECT COUNT(*) FROM users u WHERE u.batch_id = b.id AND u.role = 'student' AND (u.is_active = false OR (COALESCE(u.subscription_end_date, b.end_date) < CURRENT_DATE))) as expired_count
      FROM batches b
      LEFT JOIN examinations e ON b.exam_id = e.id
      ORDER BY b.end_date ASC NULLS LAST, b.name ASC
    `)

    // 2. Fetch all student subscription entries
    let userQuery = `
      SELECT 
        u.id, u.name, u.email, u.login_id, u.login_prefix, u.login_number, u.role, u.is_active, u.subscription_end_date, u.created_at, u.avatar_url,
        u.batch_id, u.exam_id,
        b.name as batch_name, b.end_date as batch_end_date, b.start_date as batch_start_date,
        e.name as exam_name
      FROM users u
      LEFT JOIN batches b ON u.batch_id = b.id
      LEFT JOIN examinations e ON u.exam_id = e.id
      WHERE u.role = 'student'
    `
    const queryParams = []

    if (batchIdParam && !isNaN(parseInt(batchIdParam))) {
      queryParams.push(parseInt(batchIdParam))
      userQuery += ` AND u.batch_id = $${queryParams.length}`
    }

    userQuery += ` ORDER BY COALESCE(u.subscription_end_date, b.end_date) ASC NULLS LAST, u.name ASC`

    const usersRes = await pool.query(userQuery, queryParams)

    // Compute metrics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysLater = new Date(today)
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

    let totalStudents = 0
    let activeCount = 0
    let expiringCount = 0
    let expiredCount = 0

    const processedStudents = usersRes.rows.map(s => {
      totalStudents++
      const effectiveEndDate = s.subscription_end_date || s.batch_end_date
      let status = "active" // active, expiring, expired, disabled

      if (s.is_active === false) {
        status = "disabled"
        expiredCount++
      } else if (effectiveEndDate) {
        const exp = new Date(effectiveEndDate)
        if (exp < today) {
          status = "expired"
          expiredCount++
        } else if (exp <= sevenDaysLater) {
          status = "expiring"
          expiringCount++
          activeCount++
        } else {
          status = "active"
          activeCount++
        }
      } else {
        status = "active"
        activeCount++
      }

      const diffDays = effectiveEndDate 
        ? Math.ceil((new Date(effectiveEndDate) - today) / (1000 * 60 * 60 * 24))
        : null

      return {
        ...s,
        effective_end_date: effectiveEndDate,
        days_remaining: diffDays,
        computed_status: status
      }
    })

    // Filter students if requested
    let filteredStudents = processedStudents
    if (filter === "active") {
      filteredStudents = processedStudents.filter(s => s.computed_status === "active" || s.computed_status === "expiring")
    } else if (filter === "expiring") {
      filteredStudents = processedStudents.filter(s => s.computed_status === "expiring")
    } else if (filter === "expired") {
      filteredStudents = processedStudents.filter(s => s.computed_status === "expired" || s.computed_status === "disabled")
    }

    // 3. Fetch all examinations for filtering
    const examsRes = await pool.query(`
      SELECT id, name FROM examinations ORDER BY name ASC
    `)

    return NextResponse.json({
      metrics: {
        totalStudents,
        activeCount,
        expiringCount,
        expiredCount,
        totalBatches: batchesRes.rows.length
      },
      batches: batchesRes.rows,
      students: filteredStudents,
      examinations: examsRes.rows
    })
  } catch (err) {
    console.error("[api/admin/subscriptions GET] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

/**
 * POST /api/admin/subscriptions
 * Extend subscription for a single student, multiple students, or an entire batch.
 */
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session || !isAdminRole(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const body = await request.json()
    const { action, studentId, studentIds, batchId, days, newEndDate } = body

    // 1. Extend single student by days or explicit date
    if (action === "EXTEND_STUDENT" && studentId) {
      let resolvedDate = newEndDate
      if (!resolvedDate && days) {
        // Fetch current student effective date
        const uRes = await pool.query(
          `SELECT u.subscription_end_date, b.end_date as batch_end_date 
           FROM users u LEFT JOIN batches b ON u.batch_id = b.id 
           WHERE u.id = $1`, 
          [studentId]
        )
        const currentEnd = uRes.rows[0]?.subscription_end_date || uRes.rows[0]?.batch_end_date || new Date()
        const baseDate = new Date(currentEnd) > new Date() ? new Date(currentEnd) : new Date()
        baseDate.setDate(baseDate.getDate() + parseInt(days))
        resolvedDate = baseDate.toISOString().split("T")[0]
      }

      await pool.query(
        `UPDATE users 
         SET subscription_end_date = $1, is_active = true 
         WHERE id = $2`,
        [resolvedDate, studentId]
      )

      return NextResponse.json({ success: true, updatedEndDate: resolvedDate })
    }

    // 2. Reactivate disabled/expired student (sets is_active = true, resets extension if needed)
    if (action === "REACTIVATE_STUDENT" && studentId) {
      await pool.query(
        `UPDATE users SET is_active = true WHERE id = $1`,
        [studentId]
      )
      return NextResponse.json({ success: true })
    }

    // 2b. Deactivate student account (sets is_active = false)
    if (action === "DEACTIVATE_STUDENT" && studentId) {
      await pool.query(
        `UPDATE users SET is_active = false WHERE id = $1`,
        [studentId]
      )
      return NextResponse.json({ success: true })
    }

    // 3. Extend / Edit entire batch
    if ((action === "EXTEND_BATCH" || action === "EDIT_BATCH_SUBSCRIPTION") && batchId) {
      const { startDate, endDate, newStartDate } = body
      let resolvedStart = newStartDate || startDate || null
      let resolvedEnd = newEndDate || endDate || null

      if (!resolvedEnd && days) {
        const bRes = await pool.query(`SELECT end_date FROM batches WHERE id = $1`, [batchId])
        const currentEnd = bRes.rows[0]?.end_date || new Date()
        const baseDate = new Date(currentEnd) > new Date() ? new Date(currentEnd) : new Date()
        baseDate.setDate(baseDate.getDate() + parseInt(days))
        resolvedEnd = baseDate.toISOString().split("T")[0]
      }

      if (resolvedStart && resolvedEnd) {
        await pool.query(
          `UPDATE batches SET start_date = $1, end_date = $2 WHERE id = $3`,
          [resolvedStart, resolvedEnd, batchId]
        )
      } else if (resolvedEnd) {
        await pool.query(
          `UPDATE batches SET end_date = $1 WHERE id = $2`,
          [resolvedEnd, batchId]
        )
      } else if (resolvedStart) {
        await pool.query(
          `UPDATE batches SET start_date = $1 WHERE id = $2`,
          [resolvedStart, batchId]
        )
      }

      // Also ensure all students in this batch are active
      await pool.query(
        `UPDATE users SET is_active = true WHERE batch_id = $1 AND role = 'student'`,
        [batchId]
      )

      if (resolvedEnd) {
        await pool.query(
          `UPDATE users SET subscription_end_date = $1 WHERE batch_id = $2 AND role = 'student' AND subscription_end_date IS NOT NULL AND subscription_end_date < $1`,
          [resolvedEnd, batchId]
        )
      }

      return NextResponse.json({ 
        success: true, 
        updatedStartDate: resolvedStart, 
        updatedEndDate: resolvedEnd 
      })
    }

    // 4. Bulk extend selected students
    if (action === "BULK_EXTEND_STUDENTS" && Array.isArray(studentIds) && studentIds.length > 0) {
      let resolvedDate = newEndDate
      if (!resolvedDate && days) {
        const baseDate = new Date()
        baseDate.setDate(baseDate.getDate() + parseInt(days))
        resolvedDate = baseDate.toISOString().split("T")[0]
      }

      await pool.query(
        `UPDATE users 
         SET subscription_end_date = $1, is_active = true 
         WHERE id = ANY($2::int[])`,
        [resolvedDate, studentIds.map(Number)]
      )

      return NextResponse.json({ success: true, updatedCount: studentIds.length })
    }

    // 5. Move single student to another batch
    if (action === "MOVE_STUDENT_BATCH" && studentId && batchId) {
      const batchRes = await pool.query(
        `SELECT id, name, exam_id, end_date FROM batches WHERE id = $1`,
        [batchId]
      )
      if (batchRes.rows.length === 0) {
        return NextResponse.json({ error: "Target batch not found." }, { status: 404 })
      }
      const targetBatch = batchRes.rows[0]

      await pool.query(
        `UPDATE users 
         SET batch_id = $1, 
             exam_id = COALESCE($2, exam_id),
             subscription_end_date = NULL, 
             is_active = true 
         WHERE id = $3`,
        [targetBatch.id, targetBatch.exam_id, studentId]
      )

      return NextResponse.json({ 
        success: true, 
        batchName: targetBatch.name, 
        endDate: targetBatch.end_date 
      })
    }

    // 6. Bulk move students to another batch
    if (action === "BULK_MOVE_STUDENTS" && Array.isArray(studentIds) && studentIds.length > 0 && batchId) {
      const batchRes = await pool.query(
        `SELECT id, name, exam_id, end_date FROM batches WHERE id = $1`,
        [batchId]
      )
      if (batchRes.rows.length === 0) {
        return NextResponse.json({ error: "Target batch not found." }, { status: 404 })
      }
      const targetBatch = batchRes.rows[0]

      await pool.query(
        `UPDATE users 
         SET batch_id = $1, 
             exam_id = COALESCE($2, exam_id),
             subscription_end_date = NULL, 
             is_active = true 
         WHERE id = ANY($3::int[])`,
        [targetBatch.id, targetBatch.exam_id, studentIds.map(Number)]
      )

      return NextResponse.json({ 
        success: true, 
        updatedCount: studentIds.length,
        batchName: targetBatch.name 
      })
    }

    return NextResponse.json({ error: "Invalid action or parameters." }, { status: 400 })
  } catch (err) {
    console.error("[api/admin/subscriptions POST] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
