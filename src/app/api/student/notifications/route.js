import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "student") {
      return NextResponse.json({ notifications: [], unreadCount: 0 })
    }

    const userId = session.userId

    // 1. Fetch DB notifications filtered strictly to deployed quizzes/assignments/mock-exams
    const { rows: dbNotifications } = await pool.query(
      `SELECT * FROM notifications 
       WHERE (student_id = $1 OR student_id IS NULL)
         AND type IN ('quiz', 'assignment', 'mock_exam')
       ORDER BY created_at DESC LIMIT 50`,
      [userId]
    )

    let allNotifications = [...dbNotifications]

    // 2. Fetch all quizzes/assignments and check if any are near deadline (within 24 hours / 1 day before)
    try {
      const contentsRes = await pool.query(`
        SELECT 
          sc.id,
          sc.title,
          sc.lesson_type,
          sc.quiz_content,
          sm.title as module_title,
          sub.id as subject_id,
          sub.title as subject_title
        FROM subject_contents sc
        JOIN subject_modules sm ON sm.id = sc.module_id
        JOIN subjects sub ON sub.id = sm.subject_id
        WHERE LOWER(COALESCE(sc.lesson_type, '')) = 'quiz'
          AND sub.status = 'active'
      `)

      // Fetch student's submitted quiz IDs
      const { rows: subRows } = await pool.query(
        `SELECT content_id FROM student_quiz_submissions WHERE student_id = $1`,
        [userId]
      )
      const submittedContentIds = new Set(subRows.map(r => r.content_id))

      const now = new Date().getTime()
      const oneDayMs = 24 * 60 * 60 * 1000

      for (const row of contentsRes.rows) {
        // Skip if already submitted
        if (submittedContentIds.has(row.id)) continue

        let parsed = null
        if (row.quiz_content) {
          try {
            parsed = typeof row.quiz_content === "string" ? JSON.parse(row.quiz_content) : row.quiz_content
          } catch (e) {
            parsed = null
          }
        }

        const settings = parsed?.settings || {}
        if (!settings.endDate) continue

        const endTime = settings.endTime && settings.endTime.trim() ? settings.endTime : "23:59"
        const dueDateTime = new Date(`${settings.endDate}T${endTime}`).getTime()

        // Check if deadline is in the future AND within 24 hours (1 day before)
        const timeUntilDue = dueDateTime - now
        if (timeUntilDue > 0 && timeUntilDue <= oneDayMs) {
          const hoursLeft = Math.max(1, Math.round(timeUntilDue / (60 * 60 * 1000)))
          const isAssignment = !!settings.isAssignment
          const itemType = isAssignment ? "Assignment" : "Quiz"

          allNotifications.unshift({
            id: `deadline-warn-${row.id}`,
            student_id: userId,
            type: isAssignment ? 'assignment' : 'quiz',
            title: `Deadline Alert: ${itemType} Due Soon`,
            message: `"${row.title}" is due in approximately ${hoursLeft} hour${hoursLeft === 1 ? '' : 's'}. Make sure to complete your submission!`,
            link: `/student/subjects/${row.subject_id}?lessonId=${row.id}&type=quiz`,
            is_read: false,
            created_at: new Date().toISOString()
          })
        }
      }
    } catch (deadlineErr) {
      console.error("Error evaluating quiz deadline notifications:", deadlineErr)
    }

    // 3. Enrich notification links to ensure direct deep-linking
    allNotifications = await Promise.all(
      allNotifications.map(async (n) => {
        let link = n.link || ""

        // Case 1: Generic subject link without lessonId
        const subjMatch = link.match(/^\/student\/subjects\/(\d+)$/)
        if (subjMatch) {
          const subjectId = parseInt(subjMatch[1], 10)
          const titleMatch = (n.message || "").match(/"([^"]+)"/)
          const targetTitle = titleMatch ? titleMatch[1].trim() : null

          try {
            let content = null
            if (targetTitle) {
              const { rows: contentRows } = await pool.query(
                `SELECT sc.id, sc.title, sc.lesson_type
                 FROM subject_contents sc
                 JOIN subject_modules sm ON sc.module_id = sm.id
                 WHERE sm.subject_id = $1 AND (LOWER(TRIM(sc.title)) = LOWER($2) OR sc.title ILIKE $3)
                 ORDER BY sc.id DESC LIMIT 1`,
                [subjectId, targetTitle, `%${targetTitle}%`]
              )
              if (contentRows.length > 0) content = contentRows[0]
            }

            if (content) {
              link = `/student/subjects/${subjectId}?lessonId=${content.id}&type=quiz`
            }
          } catch (err) {
            console.error("Error resolving notification lesson link:", err)
          }
        }

        // Case 2: Generic mock exam link without examId
        if (link === '/student/mock-exams' || (!link.includes('examId') && n.type === 'mock_exam')) {
          const titleMatch = (n.message || "").match(/"([^"]+)"/)
          const targetTitle = titleMatch ? titleMatch[1].trim() : null

          try {
            let exam = null
            if (targetTitle) {
              const { rows: examRows } = await pool.query(
                `SELECT id, title FROM mock_exams WHERE LOWER(title) = LOWER($1) OR title ILIKE $2 ORDER BY id DESC LIMIT 1`,
                [targetTitle, `%${targetTitle}%`]
              )
              if (examRows.length > 0) exam = examRows[0]
            }

            if (!exam) {
              const { rows: fallbackExams } = await pool.query(
                `SELECT id, title FROM mock_exams ORDER BY id DESC LIMIT 1`
              )
              if (fallbackExams.length > 0) exam = fallbackExams[0]
            }

            if (exam) {
              link = `/student/mock-exams?examId=${exam.id}`
            }
          } catch (err) {
            console.error("Error resolving notification exam link:", err)
          }
        }

        return { ...n, link }
      })
    )

    const unreadCount = allNotifications.filter(n => !n.is_read).length

    return NextResponse.json({
      notifications: allNotifications,
      unreadCount
    })
  } catch (error) {
    console.error("GET Notifications Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.userId
    const body = await request.json().catch(() => ({}))

    if (body.markAllRead) {
      await pool.query(
        `UPDATE notifications SET is_read = TRUE WHERE student_id = $1 OR student_id IS NULL`,
        [userId]
      )
      return NextResponse.json({ success: true, message: "All notifications marked as read." })
    }

    if (body.id && typeof body.id === 'number') {
      await pool.query(
        `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND (student_id = $2 OR student_id IS NULL)`,
        [body.id, userId]
      )
      return NextResponse.json({ success: true, message: "Notification marked as read." })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PATCH Notifications Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.userId
    await pool.query(
      `DELETE FROM notifications WHERE student_id = $1 OR student_id IS NULL`,
      [userId]
    )

    return NextResponse.json({ success: true, message: "All notifications deleted." })
  } catch (error) {
    console.error("DELETE Notifications Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
