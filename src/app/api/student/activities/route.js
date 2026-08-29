import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

/** GET /api/student/activities?studentId=123 */
export async function GET(request) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const targetStudentId = searchParams.get("studentId") || session?.userId

    if (!targetStudentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = parseInt(targetStudentId)

    // Fetch activities from student_activities table (excluding login logs)
    const { rows: customActivities } = await pool.query(
      `SELECT id, activity_type, title, details, status, created_at 
       FROM student_activities 
       WHERE student_id = $1 AND activity_type != 'login' AND title NOT LIKE 'Logged into%' 
       ORDER BY created_at DESC LIMIT 20`,
      [userId]
    )

    // Also fetch quiz submissions to combine if needed
    const { rows: quizSubmissions } = await pool.query(
      `SELECT sqs.*, sc.title AS lesson_title 
       FROM student_quiz_submissions sqs
       LEFT JOIN subject_contents sc ON sqs.content_id = sc.id
       WHERE sqs.student_id = $1
       ORDER BY sqs.submitted_at DESC LIMIT 10`,
      [userId]
    )

    const quizActivities = quizSubmissions.map(sub => {
      const earned = sub.earned_points || 0
      const total = sub.total_points || 1
      const pct = Math.round((earned / total) * 100)
      const duration = sub.time_taken_seconds || 0
      const mins = Math.floor(duration / 60)
      const secs = duration % 60
      const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
      const isRetry = (sub.attempts_count || 1) > 1

      return {
        id: `quiz_${sub.id}`,
        activity_type: isRetry ? 'quiz_retry' : 'quiz_complete',
        title: isRetry ? `Retook Quiz: ${sub.lesson_title || 'Quiz'} (Attempt #${sub.attempts_count})` : `Completed Quiz: ${sub.lesson_title || 'Quiz'}`,
        details: `Score: ${earned}/${total} (${pct}%) · Time taken: ${timeStr}`,
        status: pct >= 75 ? 'success' : 'warning',
        created_at: sub.submitted_at
      }
    })

    // Combine custom activities and quiz activities, deduplicating if needed, sorted by date
    const combinedMap = new Map()
    quizActivities.forEach(a => combinedMap.set(a.title + a.created_at, a))
    customActivities.forEach(a => combinedMap.set(a.title + a.created_at, a))

    const combinedList = Array.from(combinedMap.values())
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)

    return NextResponse.json({ activities: combinedList })
  } catch (err) {
    console.error("GET student activities error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

/** POST /api/student/activities */
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { activityType, title, details, status } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const query = `
      INSERT INTO student_activities (student_id, activity_type, title, details, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `

    const values = [
      session.userId,
      activityType || 'module_complete',
      title,
      details || '',
      status || 'success'
    ]

    const result = await pool.query(query, values)
    return NextResponse.json({ success: true, activity: result.rows[0] })
  } catch (err) {
    console.error("POST student activity error:", err)
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 })
  }
}
