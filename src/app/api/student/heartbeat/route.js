import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { ensureStudentActivityTables } from "@/lib/student-activity-db"

/**
 * POST /api/student/heartbeat
 * Heartbeat ping received from active student study view (default every 60s)
 * Body: { subjectId, activityType, durationSeconds, pageVisible, idle }
 */
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const {
      subjectId = null,
      activityType = "lecture", // 'lecture', 'reading', 'quiz', 'mock_exam', 'practice_test'
      durationSeconds = 60,
      pageVisible = true,
      idle = false,
    } = body

    // If tab is hidden or student is idle, do not accumulate study time
    if (!pageVisible || idle) {
      return NextResponse.json({ success: true, logged: false, reason: "paused" })
    }

    await ensureStudentActivityTables()

    const userId = session.userId
    const duration = Math.min(300, Math.max(10, parseInt(durationSeconds, 10) || 60))
    const isTest = ["quiz", "mock_exam", "practice_test"].includes(activityType)
    const lectureSeconds = isTest ? 0 : duration
    const testSeconds = isTest ? duration : 0

    // 1. Log or extend current session in study_sessions
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    const recentSessionRes = await pool.query(
      `SELECT id, duration_seconds 
       FROM study_sessions 
       WHERE user_id = $1 
         AND subject_id IS NOT DISTINCT FROM $2
         AND activity_type = $3
         AND session_end >= $4
       ORDER BY session_end DESC 
       LIMIT 1`,
      [userId, subjectId ? parseInt(subjectId, 10) : null, activityType, fiveMinutesAgo]
    )

    if (recentSessionRes.rows.length > 0) {
      const sessionId = recentSessionRes.rows[0].id
      await pool.query(
        `UPDATE study_sessions 
         SET session_end = NOW(), 
             duration_seconds = duration_seconds + $1, 
             updated_at = NOW() 
         WHERE id = $2`,
        [duration, sessionId]
      )
    } else {
      await pool.query(
        `INSERT INTO study_sessions 
           (user_id, subject_id, activity_type, session_start, session_end, duration_seconds, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW(), $4, NOW())`,
        [userId, subjectId ? parseInt(subjectId, 10) : null, activityType, duration]
      )
    }

    // 2. Pre-aggregated rollback in daily_student_stats for lightning-fast queries
    const todayStr = now.toISOString().split("T")[0] // YYYY-MM-DD
    const resolvedSubjectId = subjectId ? parseInt(subjectId, 10) : null

    await pool.query(
      `INSERT INTO daily_student_stats 
         (stat_date, user_id, subject_id, total_seconds, lecture_seconds, test_seconds, quiz_attempts, resource_hits, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1, NOW())
       ON CONFLICT (stat_date, user_id, COALESCE(subject_id, 0))
       DO UPDATE SET 
         total_seconds = daily_student_stats.total_seconds + EXCLUDED.total_seconds,
         lecture_seconds = daily_student_stats.lecture_seconds + EXCLUDED.lecture_seconds,
         test_seconds = daily_student_stats.test_seconds + EXCLUDED.test_seconds,
         quiz_attempts = daily_student_stats.quiz_attempts + EXCLUDED.quiz_attempts,
         resource_hits = daily_student_stats.resource_hits + 1,
         updated_at = NOW()`,
      [todayStr, userId, resolvedSubjectId, duration, lectureSeconds, testSeconds, isTest ? 1 : 0]
    )

    return NextResponse.json({ success: true, logged: true, durationSeconds: duration })
  } catch (err) {
    console.error("[student/heartbeat error]:", err?.message || err)
    return NextResponse.json({ error: "Failed to record heartbeat" }, { status: 500 })
  }
}
