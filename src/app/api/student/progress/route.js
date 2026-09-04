import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

/**
 * GET /api/student/progress
 * Fetches all student scores across:
 * 1. Quizzes (from student_quiz_submissions & subject_contents)
 * 2. Assignments (from student_quiz_submissions / submissions)
 * 3. Mock Exams (from mock_exam_scores & mock_exams)
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.userId || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }

    const studentId = session.userId

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

    return NextResponse.json(
      {
        success: true,
        quizzes,
        assignments,
        mockExams,
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
