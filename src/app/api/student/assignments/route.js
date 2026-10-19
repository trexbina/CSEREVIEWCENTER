import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

// ── GET /api/student/assignments ──────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.userId || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }

    const studentId = session.userId

    // 1. Fetch only active subject contents where lesson_type is explicitly 'quiz'
    const contentsRes = await pool.query(`
      SELECT 
        sc.id,
        sc.title,
        sc.lesson_type,
        sc.quiz_content,
        sc.module_id,
        sc.created_at,
        sm.title as module_title,
        sub.id as subject_id,
        sub.title as subject_title,
        sub.category as subject_category
      FROM subject_contents sc
      INNER JOIN subject_modules sm ON sm.id = sc.module_id
      INNER JOIN subjects sub ON sub.id = sm.subject_id
      WHERE LOWER(COALESCE(sc.lesson_type, '')) = 'quiz'
        AND sub.status = 'active'
      ORDER BY sc.created_at DESC
    `)

    // 2. Fetch all submissions for this student from student_quiz_submissions
    const submissionsRes = await pool.query(`
      SELECT 
        content_id,
        earned_points,
        total_points,
        time_taken_seconds,
        attempts_count,
        submitted_at
      FROM student_quiz_submissions
      WHERE student_id = $1
    `, [studentId])

    const submissionsMap = {}
    for (const sub of submissionsRes.rows) {
      submissionsMap[sub.content_id] = sub
    }

    // 3. Return all valid quizzes and assignments
    const items = []

    for (const row of contentsRes.rows) {
      let parsed = null
      if (row.quiz_content) {
        try {
          parsed = typeof row.quiz_content === "string" ? JSON.parse(row.quiz_content) : row.quiz_content
        } catch (e) {
          parsed = null
        }
      }
      if (!parsed) {
        parsed = { settings: {}, questions: [] }
      }
      const settings = parsed.settings || {}
      const isAssignment = !!settings.isAssignment

      const questions = Array.isArray(parsed.questions) ? parsed.questions : (Array.isArray(parsed) ? parsed : [])
      const qOnly = questions.filter(q => q.type === 'question')

      let calculatedTotalPoints = 0
      qOnly.forEach(q => {
        calculatedTotalPoints += (q.points !== undefined ? Number(q.points) : 1)
      })

      // Construct due date
      let dueDateTime = null
      if (settings.endDate) {
        const time = settings.endTime && settings.endTime.trim() ? settings.endTime : "23:59"
        dueDateTime = `${settings.endDate}T${time}`
      }

      let startDateTime = null
      if (settings.startDate) {
        const time = settings.startTime && settings.startTime.trim() ? settings.startTime : "00:00"
        startDateTime = `${settings.startDate}T${time}`
      }

      // If neither start_date nor due_date is specified, fall back to creation date so it reflects on the calendar
      const effectiveStartDate = startDateTime || (!dueDateTime ? row.created_at : null)

      const sub = submissionsMap[row.id]
      const isSubmitted = !!sub

      items.push({
        id: row.id,
        title: row.title,
        description: `${qOnly.length} questions · Module: ${row.module_title || 'General'}`,
        subject_name: row.subject_title || row.subject_category || "General Education",
        subject_id: row.subject_id,
        module_id: row.module_id,
        is_assignment: isAssignment,
        start_date: effectiveStartDate,
        due_date: dueDateTime,
        max_points: calculatedTotalPoints || 100,
        question_count: qOnly.length,
        time_limit_minutes: settings.timeLimitMinutes || 0,
        max_retries: settings.maxRetries ?? 0,
        submission_status: isSubmitted ? "submitted" : "pending",
        earned_points: sub?.earned_points,
        total_points: sub?.total_points ?? calculatedTotalPoints,
        attempts_count: sub?.attempts_count || 0,
        time_taken_seconds: sub?.time_taken_seconds,
        submitted_at: sub?.submitted_at,
        quiz_url: row.subject_id ? `/student/subjects/${row.subject_id}?lessonId=${row.id}` : `/student/subjects`
      })
    }

    return NextResponse.json(
      { assignments: items },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    )
  } catch (err) {
    console.error("[GET /api/student/assignments]", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
