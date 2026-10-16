import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { ensureStudentSubjectProgressTable } from "@/lib/student-progress-db"

/**
 * GET /api/student/progress
 * Fetches:
 * 1. User Subject Progression (with %, completed/total items, active study days, and study streaks)
 *    Dynamically calculated and synced to student_subject_progress in DB.
 * 2. Quizzes (from student_quiz_submissions & subject_contents)
 * 3. Assignments (from student_quiz_submissions / submissions)
 * 4. Mock Exams (from mock_exam_scores & mock_exams)
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.userId || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }

    const studentId = session.userId
    await ensureStudentSubjectProgressTable()

    // 1. Fetch Quizzes & Assignments from subject_contents + student_quiz_submissions
    const [quizAssignmentRes, mockExamRes] = await Promise.all([
      pool.query(
        `SELECT 
           sc.id,
           sc.title,
           sc.lesson_type,
           sc.quiz_content,
           sm.title AS module_title,
           sub.id AS subject_id,
           sub.title AS subject_title,
           COALESCE(cat.name, sub.category, 'General Education') AS category_name,
           subcat.name AS subcategory_name,
           sqs.earned_points,
           sqs.total_points,
           sqs.time_taken_seconds,
           sqs.attempts_count,
           sqs.submitted_at
         FROM subject_contents sc
         INNER JOIN subject_modules sm ON sm.id = sc.module_id
         INNER JOIN subjects sub ON sub.id = sm.subject_id
         LEFT JOIN categories cat ON cat.id = sub.category_id OR LOWER(cat.name) = LOWER(sub.category)
         LEFT JOIN subcategories subcat ON subcat.id = sub.subcategory_id
         LEFT JOIN student_quiz_submissions sqs ON sqs.content_id = sc.id AND sqs.student_id = $1
         WHERE LOWER(COALESCE(sc.lesson_type, '')) = 'quiz'
           AND sub.status = 'active'
         ORDER BY COALESCE(sqs.submitted_at, sc.created_at) DESC`,
        [studentId]
      ).catch(() => ({ rows: [] })),

      // 2. Fetch Mock Exams and Student Scores
      pool.query(
        `SELECT 
           me.id,
           me.exam_code,
           me.title,
           me.description,
           (SELECT COUNT(*) FROM jsonb_array_elements(
              CASE WHEN jsonb_typeof(me.questions::jsonb->'questions') = 'array' 
                   THEN me.questions::jsonb->'questions' 
                   ELSE '[]'::jsonb END
           )) AS question_count,
           mes.score,
           mes.max_score,
           mes.completed_at,
           COALESCE(mes.attempts_count, CASE WHEN mes.score IS NOT NULL THEN 1 ELSE 0 END) AS attempts_count
         FROM mock_exams me
         LEFT JOIN mock_exam_scores mes ON mes.mock_exam_id = me.id AND mes.student_id = $1
         WHERE me.status = 'active'
         ORDER BY COALESCE(mes.completed_at, me.created_at) DESC`,
        [studentId]
      ).catch(() => ({ rows: [] }))
    ])

    const quizzes = []
    const assignments = []

    for (const row of quizAssignmentRes.rows) {
      let parsed = null
      if (row.quiz_content) {
        try {
          parsed = typeof row.quiz_content === "string" ? JSON.parse(row.quiz_content) : row.quiz_content
        } catch {
          parsed = null
        }
      }

      const settings = parsed?.settings || {}
      const isAssignment = !!settings.isAssignment
      const questions = Array.isArray(parsed?.questions) ? parsed.questions : []
      const qOnly = questions.filter(q => q.type === "question")

      let calculatedMax = 0
      qOnly.forEach(q => {
        calculatedMax += q.points !== undefined ? Number(q.points) : 1
      })
      if (!calculatedMax) calculatedMax = 100

      const hasSubmission = row.submitted_at != null
      const earned = row.earned_points != null ? Number(row.earned_points) : null
      const total = row.total_points != null ? Number(row.total_points) : calculatedMax
      const percentage = hasSubmission && total > 0 ? Math.round((earned / total) * 100) : null

      const item = {
        id: row.id,
        title: row.title,
        moduleName: row.module_title || "General Module",
        subjectName: row.subject_title || row.category_name || "General Education",
        subjectId: row.subject_id,
        categoryName: row.category_name || "General Education",
        subcategoryName: row.subcategory_name || null,
        isCompleted: hasSubmission,
        score: earned,
        maxScore: total,
        percentage,
        attemptsCount: row.attempts_count || (hasSubmission ? 1 : 0),
        timeTakenSeconds: row.time_taken_seconds,
        completedAt: row.submitted_at,
        passed: percentage != null ? percentage >= 75 : null,
      }

      if (isAssignment) {
        assignments.push(item)
      } else {
        quizzes.push(item)
      }
    }

    const mockExams = mockExamRes.rows.map(row => {
      const hasCompleted = row.completed_at != null
      const score = row.score != null ? Number(row.score) : null
      const maxScore = row.max_score != null ? Number(row.max_score) : (row.question_count || 100)
      const percentage = hasCompleted && maxScore > 0 ? Math.round((score / maxScore) * 100) : null

      return {
        id: row.id,
        title: row.title,
        code: row.exam_code || `MOCK-${row.id}`,
        questionCount: row.question_count || 0,
        isCompleted: hasCompleted,
        score,
        maxScore,
        percentage,
        attemptsCount: row.attempts_count || (hasCompleted ? 1 : 0),
        completedAt: row.completed_at,
        passed: percentage != null ? percentage >= 75 : null,
      }
    })

    // 3. Compute dynamic User Subject Progression, Active Study Days, and Study Streak
    const [subjectsRes, subjectItemsRes, completedLessonsRes, completedQuizzesRes, studentActivityDatesRes, nowRes] = await Promise.all([
      // A. All active subjects accessible to student
      pool.query(
        `SELECT 
           s.id,
           s.title,
           s.code,
           s.description,
           s.category,
           s.image_url,
           COALESCE(cat.name, s.category, 'General Education') AS category_name,
           subcat.name AS subcategory_name
         FROM subjects s
         LEFT JOIN categories cat ON cat.id = s.category_id OR LOWER(cat.name) = LOWER(s.category)
         LEFT JOIN subcategories subcat ON subcat.id = s.subcategory_id
         WHERE s.status = 'active'
         ORDER BY s.id ASC`
      ).catch(() => ({ rows: [] })),

      // B. Total content items (lessons + quizzes) per subject
      pool.query(
        `SELECT 
           sm.subject_id,
           COUNT(sc.id) AS total_items,
           COUNT(sc.id) FILTER (WHERE LOWER(COALESCE(sc.lesson_type, '')) != 'quiz') AS total_lessons,
           COUNT(sc.id) FILTER (WHERE LOWER(COALESCE(sc.lesson_type, '')) = 'quiz') AS total_quizzes
         FROM subject_contents sc
         JOIN subject_modules sm ON sm.id = sc.module_id
         GROUP BY sm.subject_id`
      ).catch(() => ({ rows: [] })),

      // C. Lessons opened/completed by student per subject
      pool.query(
        `SELECT 
           COALESCE(
             SUBSTRING(details FROM 'SubjectID: ([0-9]+)'),
             sm.subject_id::text
           ) AS subject_id,
           COUNT(DISTINCT SUBSTRING(details FROM 'LessonID: ([0-9]+)')) AS opened_lessons
         FROM student_activities sa
         LEFT JOIN subject_contents sc ON sc.id = (
           CASE WHEN SUBSTRING(sa.details FROM 'LessonID: ([0-9]+)') ~ '^[0-9]+$' 
                THEN SUBSTRING(sa.details FROM 'LessonID: ([0-9]+)')::int 
                ELSE NULL END
         )
         LEFT JOIN subject_modules sm ON sm.id = sc.module_id
         WHERE sa.student_id = $1 
           AND sa.activity_type IN ('lesson_open', 'module_complete')
         GROUP BY 1`,
        [studentId]
      ).catch(() => ({ rows: [] })),

      // D. Quizzes completed by student per subject
      pool.query(
        `SELECT 
           sm.subject_id,
           COUNT(DISTINCT sqs.content_id) AS completed_quizzes
         FROM student_quiz_submissions sqs
         JOIN subject_contents sc ON sc.id = sqs.content_id
         JOIN subject_modules sm ON sm.id = sc.module_id
         WHERE sqs.student_id = $1
         GROUP BY sm.subject_id`,
        [studentId]
      ).catch(() => ({ rows: [] })),

      // E. Unique activity dates for this student (across activities, quizzes, exams, sessions)
      pool.query(
        `SELECT DISTINCT to_char(act_timestamp AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD') AS act_date
         FROM (
           SELECT created_at AS act_timestamp FROM student_activities WHERE student_id = $1
           UNION ALL
           SELECT submitted_at AS act_timestamp FROM student_quiz_submissions WHERE student_id = $1
           UNION ALL
           SELECT completed_at AS act_timestamp FROM mock_exam_scores WHERE student_id = $1
           UNION ALL
           SELECT session_start AS act_timestamp FROM study_sessions WHERE user_id = $1
         ) t
         WHERE act_timestamp IS NOT NULL
         ORDER BY act_date DESC`,
        [studentId]
      ).catch(() => ({ rows: [] })),

      // F. Current Manila today and yesterday dates
      pool.query(
        `SELECT 
           to_char(NOW() AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD') AS today,
           to_char((NOW() AT TIME ZONE 'Asia/Manila') - INTERVAL '1 day', 'YYYY-MM-DD') AS yesterday`
      ).catch(() => ({ rows: [{ today: new Date().toISOString().slice(0, 10), yesterday: "" }] }))
    ])

    // Compute Overall Active Study Days & Study Streak
    const { today, yesterday } = nowRes.rows[0] || {}
    const activeDatesList = studentActivityDatesRes.rows.map(r => r.act_date).filter(Boolean)
    const activeDatesSet = new Set(activeDatesList)
    const totalActiveDays = activeDatesSet.size

    let studyStreak = 0
    let checkDateStr = null

    if (activeDatesSet.has(today)) {
      checkDateStr = today
    } else if (activeDatesSet.has(yesterday)) {
      checkDateStr = yesterday
    }

    if (checkDateStr) {
      let currentCheck = new Date(checkDateStr)
      while (activeDatesSet.has(currentCheck.toISOString().slice(0, 10))) {
        studyStreak++
        currentCheck.setDate(currentCheck.getDate() - 1)
      }
    }

    // Maps for fast subject lookup
    const subjectItemCounts = {}
    subjectItemsRes.rows.forEach(r => {
      subjectItemCounts[String(r.subject_id)] = {
        totalItems: parseInt(r.total_items || "0", 10),
        totalLessons: parseInt(r.total_lessons || "0", 10),
        totalQuizzes: parseInt(r.total_quizzes || "0", 10),
      }
    })

    const openedLessonsMap = {}
    completedLessonsRes.rows.forEach(r => {
      if (r.subject_id) {
        openedLessonsMap[String(r.subject_id)] = parseInt(r.opened_lessons || "0", 10)
      }
    })

    const completedQuizzesMap = {}
    completedQuizzesRes.rows.forEach(r => {
      if (r.subject_id) {
        completedQuizzesMap[String(r.subject_id)] = parseInt(r.completed_quizzes || "0", 10)
      }
    })

    // Compute progression per subject & persist into student_subject_progress in DB
    const subjectProgression = []
    const upsertPromises = []

    for (const sub of subjectsRes.rows) {
      const sid = String(sub.id)
      const counts = subjectItemCounts[sid] || { totalItems: 0, totalLessons: 0, totalQuizzes: 0 }
      const totalItems = counts.totalItems || 0

      const openedLessons = openedLessonsMap[sid] || 0
      const doneQuizzes = completedQuizzesMap[sid] || 0
      const completedItems = Math.min(totalItems, openedLessons + doneQuizzes)

      const progressPct = totalItems > 0 ? Math.min(100, Math.round((completedItems / totalItems) * 100)) : (completedItems > 0 ? 100 : 0)

      upsertPromises.push(
        pool.query(
          `INSERT INTO student_subject_progress 
             (student_id, subject_id, completed_items, total_items, progress_pct, active_days, study_streak, last_activity_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT (student_id, subject_id) DO UPDATE SET
             completed_items = EXCLUDED.completed_items,
             total_items = EXCLUDED.total_items,
             progress_pct = EXCLUDED.progress_pct,
             active_days = EXCLUDED.active_days,
             study_streak = EXCLUDED.study_streak,
             updated_at = NOW()`,
          [studentId, sub.id, completedItems, totalItems, progressPct, totalActiveDays, studyStreak]
        ).catch(err => console.error("Error upserting student_subject_progress:", err))
      )

      subjectProgression.push({
        id: sub.id,
        title: sub.title,
        code: sub.code,
        categoryName: sub.category_name,
        subcategoryName: sub.subcategory_name,
        imageUrl: sub.image_url,
        completedItems,
        totalItems,
        progressPct,
        activeDays: totalActiveDays,
        studyStreak,
      })
    }

    if (upsertPromises.length > 0) {
      await Promise.all(upsertPromises)
    }

    return NextResponse.json(
      {
        success: true,
        quizzes,
        assignments,
        mockExams,
        subjects: subjectProgression,
        overallStats: {
          totalActiveDays,
          studyStreak,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    )
  } catch (err) {
    console.error("[student/progress GET]", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
