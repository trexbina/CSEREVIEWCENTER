import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

/** GET /api/student/quiz-submissions?contentId=123 */
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get("contentId")

    if (!contentId) {
      return NextResponse.json({ error: "contentId is required" }, { status: 400 })
    }

    const res = await pool.query(
      `SELECT * FROM student_quiz_submissions WHERE student_id = $1 AND content_id = $2`,
      [session.userId, parseInt(contentId)]
    )

    if (res.rows.length === 0) {
      return NextResponse.json({ submission: null })
    }

    return NextResponse.json({ submission: res.rows[0] })
  } catch (err) {
    console.error("GET quiz submission error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

/** POST /api/student/quiz-submissions */
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { contentId, earnedPoints, totalPoints, timeTakenSeconds, answers } = body

    if (!contentId) {
      return NextResponse.json({ error: "contentId is required" }, { status: 400 })
    }

    const query = `
      INSERT INTO student_quiz_submissions (student_id, content_id, earned_points, total_points, time_taken_seconds, answers, attempts_count, submitted_at)
      VALUES ($1, $2, $3, $4, $5, $6, 1, NOW())
      ON CONFLICT (student_id, content_id)
      DO UPDATE SET
        earned_points = EXCLUDED.earned_points,
        total_points = EXCLUDED.total_points,
        time_taken_seconds = EXCLUDED.time_taken_seconds,
        answers = EXCLUDED.answers,
        attempts_count = student_quiz_submissions.attempts_count + 1,
        submitted_at = NOW()
      RETURNING *
    `

    const values = [
      session.userId,
      parseInt(contentId),
      earnedPoints || 0,
      totalPoints || 0,
      timeTakenSeconds || 0,
      JSON.stringify(answers || {})
    ]

    const result = await pool.query(query, values)
    const submission = result.rows[0]

    // Log activity entry in student_activities table
    try {
      const contentRes = await pool.query(`SELECT title FROM subject_contents WHERE id = $1`, [parseInt(contentId)])
      const lessonTitle = contentRes.rows[0]?.title || "Quiz"
      const total = totalPoints || 1
      const earned = earnedPoints || 0
      const pct = Math.round((earned / total) * 100)
      const duration = timeTakenSeconds || 0
      const mins = Math.floor(duration / 60)
      const secs = duration % 60
      const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
      const isRetry = (submission.attempts_count || 1) > 1

      const actTitle = isRetry 
        ? `Retook Quiz: ${lessonTitle} (Attempt #${submission.attempts_count})`
        : `Completed Quiz: ${lessonTitle}`
      const actDetails = `LessonID: ${contentId} | Score: ${earned}/${total} (${pct}%) · Time taken: ${timeStr}`
      const actStatus = pct >= 75 ? "success" : "warning"

      await pool.query(
        `INSERT INTO student_activities (student_id, activity_type, title, details, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [session.userId, isRetry ? 'quiz_retry' : 'quiz_complete', actTitle, actDetails, actStatus]
      )
    } catch (logErr) {
      console.error("Failed to log activity:", logErr)
    }

    return NextResponse.json({ success: true, submission })
  } catch (err) {
    console.error("POST quiz submission error:", err)
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 })
  }
}
