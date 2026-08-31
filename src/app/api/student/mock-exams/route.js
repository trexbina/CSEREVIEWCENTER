import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

// Ensure student_answers & attempts_count columns exist in mock_exam_scores
async function ensureStudentAnswersColumn() {
  try {
    await pool.query(`
      ALTER TABLE mock_exam_scores ADD COLUMN IF NOT EXISTS student_answers JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE mock_exam_scores ADD COLUMN IF NOT EXISTS attempts_count INTEGER DEFAULT 1;
    `)
  } catch (e) {
    // column already exists or table issue
  }
}

// GET /api/student/mock-exams — list exams for student's batch + attempt history
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.userId || session.role !== "student") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    await ensureStudentAnswersColumn()

    // Get student details
    const studentRes = await pool.query(
      "SELECT batch_id, exam_id FROM users WHERE id = $1",
      [session.userId]
    )
    if (studentRes.rows.length === 0) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 })
    }
    const { batch_id, exam_id } = studentRes.rows[0]

    if (!batch_id) {
      return NextResponse.json({ exams: [], message: "You are not assigned to a batch yet." })
    }

    // Get batch name and exam name for matching
    const batchRes = await pool.query("SELECT name FROM batches WHERE id = $1", [batch_id])
    const batchName = batchRes.rows[0]?.name || ""

    let examName = ""
    if (exam_id) {
      const examRes = await pool.query("SELECT name FROM examinations WHERE id = $1", [exam_id])
      examName = examRes.rows[0]?.name || ""
    }

    // Get mock exams targeting this batch/course (or general ones)
    const { rows: exams } = await pool.query(`
      SELECT me.id, me.exam_code, me.title, me.description, me.questions, me.unlock_date, me.status,
             (SELECT COUNT(*) FROM jsonb_array_elements(
               CASE WHEN jsonb_typeof(me.questions::jsonb->'questions') = 'array' 
                    THEN me.questions::jsonb->'questions' 
                    ELSE '[]'::jsonb END
             )) as question_count,
             mes.score, mes.max_score, mes.completed_at, mes.student_answers,
             COALESCE(mes.attempts_count, CASE WHEN mes.score IS NOT NULL THEN 1 ELSE 0 END) as attempts_count
      FROM mock_exams me
      LEFT JOIN mock_exam_scores mes ON mes.mock_exam_id = me.id AND mes.student_id = $1
      WHERE (
        EXISTS (
          SELECT 1 
          FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(me.targets::jsonb) = 'array' THEN me.targets::jsonb ELSE '[]'::jsonb END) t
          WHERE t = 'all'
             OR t = 'batch_' || $2::text
             OR t = 'batch_' || $3::text
             OR t = 'course_' || $4::text
             OR t ILIKE '%' || $3 || '%'
        )
        OR me.targets IS NULL
        OR jsonb_typeof(me.targets::jsonb) != 'array'
        OR jsonb_array_length(me.targets::jsonb) = 0
        OR me.targets::text ILIKE '%all%'
      )
        AND me.status = 'active'
      ORDER BY me.created_at DESC
    `, [session.userId, batch_id, batchName, examName])

    // If no targeted exams, return all active exams for demo/learning
    if (exams.length === 0) {
      const { rows: allExams } = await pool.query(`
        SELECT me.id, me.exam_code, me.title, me.description, me.questions, me.unlock_date, me.status,
               (SELECT COUNT(*) FROM jsonb_array_elements(
                 CASE WHEN jsonb_typeof(me.questions::jsonb->'questions') = 'array' 
                      THEN me.questions::jsonb->'questions' 
                      ELSE '[]'::jsonb END
               )) as question_count,
               mes.score, mes.max_score, mes.completed_at, mes.student_answers,
               COALESCE(mes.attempts_count, CASE WHEN mes.score IS NOT NULL THEN 1 ELSE 0 END) as attempts_count
        FROM mock_exams me
        LEFT JOIN mock_exam_scores mes ON mes.mock_exam_id = me.id AND mes.student_id = $1
        WHERE me.status = 'active'
        ORDER BY me.created_at DESC
      `, [session.userId])
      return NextResponse.json({ exams: allExams })
    }

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
