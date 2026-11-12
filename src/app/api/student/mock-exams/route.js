import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { canAccessMockExam, getStudentEntitlements } from "@/lib/subscriptions"

// Ensure student_answers & attempts_count columns and unique constraint exist in mock_exam_scores
async function ensureStudentAnswersColumn() {
  try {
    await pool.query(`
      ALTER TABLE mock_exam_scores ADD COLUMN IF NOT EXISTS student_answers JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE mock_exam_scores ADD COLUMN IF NOT EXISTS attempts_count INTEGER DEFAULT 1;
      CREATE UNIQUE INDEX IF NOT EXISTS mock_exam_scores_student_mock_exam_unique ON mock_exam_scores (student_id, mock_exam_id);
    `)
  } catch (e) {
    // column/index already exists or table issue
  }
}

// GET /api/student/mock-exams — list exams for the student's entitled examinations.
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.userId || session.role !== "student") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    await ensureStudentAnswersColumn()

    const entitlements = await getStudentEntitlements(session.userId)
    if (!entitlements.subscriptions.length) {
      return NextResponse.json({ exams: [], message: "Your subscription is inactive or expired." })
    }

    // Selected plans use their snapshot list. Full plans use examination targets.
    const { rows: exams } = await pool.query(`
      SELECT me.id, me.exam_code, me.title, me.description, me.questions, me.unlock_date, me.created_at, me.status,
             (SELECT COUNT(*) FROM jsonb_array_elements(
               CASE WHEN jsonb_typeof(me.questions::jsonb->'questions') = 'array' 
                    THEN me.questions::jsonb->'questions' 
                    ELSE '[]'::jsonb END
             )) as question_count,
             mes.score, mes.max_score, mes.completed_at, mes.student_answers,
             COALESCE(mes.attempts_count, CASE WHEN mes.score IS NOT NULL THEN 1 ELSE 0 END) as attempts_count
      FROM mock_exams me
      LEFT JOIN mock_exam_scores mes ON mes.mock_exam_id = me.id AND mes.student_id = $1
      WHERE me.status = 'active' AND (
        me.id = ANY($2::int[])
        OR ($3::boolean = true AND me.examination_id = ANY($4::int[]))
      )
      ORDER BY me.created_at DESC
    `, [session.userId, entitlements.mockExamIds.length ? entitlements.mockExamIds : [-1], entitlements.hasFullAccess, entitlements.examinationIds.length ? entitlements.examinationIds : [-1]])

    return NextResponse.json({ exams })
  } catch (err) {
    console.error("[student/mock-exams GET]", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

// POST /api/student/mock-exams — submit mock exam answers
export async function POST(req) {
  try {
    const session = await getSession()
    if (!session?.userId || session.role !== "student") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const { examId, answers } = await req.json() // answers: { [questionId]: selectedOptionId(s) or shortAnswerText }

    if (!(await canAccessMockExam(session.userId, examId))) {
      return NextResponse.json({ error: "Your subscription does not include this mock exam." }, { status: 403 })
    }

    // Fetch the exam questions to check correct answers
    const examRes = await pool.query(
      "SELECT id, questions FROM mock_exams WHERE id = $1",
      [parseInt(examId)]
    )
    if (examRes.rows.length === 0) {
      return NextResponse.json({ error: "Exam not found." }, { status: 404 })
    }

    const exam = examRes.rows[0]
    let parsedQuestions = []
    if (exam.questions) {
      let parsed = typeof exam.questions === "string" ? JSON.parse(exam.questions) : exam.questions
      parsedQuestions = parsed.questions || parsed || []
    }

    let totalPoints = 0
    let earnedPoints = 0

    parsedQuestions.filter(q => q.type === 'question').forEach(q => {
      const pts = q.points || 1
      totalPoints += pts

      let isCorrect = false
      if (q.questionType === "True or False" || q.questionType === "Multiple Choice") {
        const correctIds = q.options?.filter(o => o.isCorrect).map(o => o.id.toString()) || []
        let selected = answers[q.id] || []
        if (!Array.isArray(selected)) {
          selected = [selected.toString()]
        } else {
          selected = selected.map(s => s.toString())
        }

        if (correctIds.length > 0 &&
            correctIds.length === selected.length &&
            correctIds.every(id => selected.includes(id))) {
          isCorrect = true
        }
      } else if (q.questionType === "Short Answer") {
        const targetStr = (q.correctAnswer || "").trim()
        const studentStr = (answers[q.id] || "").trim()
        const matches = q.caseSensitive 
            ? studentStr === targetStr 
            : studentStr.toLowerCase() === targetStr.toLowerCase()
        if (targetStr && matches) {
          isCorrect = true
        }
      }

      if (isCorrect) earnedPoints += pts
    })

    // Save score, student answers, and increment attempts_count in mock_exam_scores
    await ensureStudentAnswersColumn()
    await pool.query(`
      INSERT INTO mock_exam_scores (student_id, mock_exam_id, score, max_score, student_answers, attempts_count, completed_at)
      VALUES ($1, $2, $3, $4, $5, 1, NOW())
      ON CONFLICT (student_id, mock_exam_id)
      DO UPDATE SET 
        score = $3, 
        max_score = $4, 
        student_answers = $5, 
        attempts_count = COALESCE(mock_exam_scores.attempts_count, 0) + 1,
        completed_at = NOW()
    `, [session.userId, parseInt(examId), earnedPoints, totalPoints, JSON.stringify(answers || {})])

    return NextResponse.json({
      success: true,
      score: earnedPoints,
      maxScore: totalPoints,
      studentAnswers: answers
    })
  } catch (err) {
    console.error("[student/mock-exams POST]", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
