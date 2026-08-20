import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

// GET /api/admin/gradebook/[id] — fetch full gradebook data with students & scores
export async function GET(req, { params }) {
  try {
    const session = await getSession()
    if (session?.role !== "admin" && session?.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const { id } = await params

    // 1. Fetch the gradebook record
    const gbRes = await pool.query(
      "SELECT * FROM gradebooks WHERE id = $1",
      [parseInt(id)]
    )
    if (gbRes.rows.length === 0) {
      return NextResponse.json({ error: "Gradebook not found." }, { status: 404 })
    }
    const gradebook = gbRes.rows[0]

    // 2. Fetch all students enrolled in this batch
    const studentsRes = await pool.query(`
      SELECT u.id, u.name, u.email,
             COALESCE(s.name, u.school, 'N/A') as school_name
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.role = 'student' AND u.batch_id = $1
      ORDER BY u.name ASC
    `, [gradebook.batch_id])

    // 3. Fetch all mock exams that target this batch
    const mockExamsRes = await pool.query(`
      SELECT me.id, me.exam_code, me.title, me.status,
             (SELECT COUNT(*) FROM jsonb_array_elements(
               CASE WHEN jsonb_typeof(me.questions::jsonb->'questions') = 'array' 
                    THEN me.questions::jsonb->'questions' 
                    ELSE '[]'::jsonb END
             )) as question_count
      FROM mock_exams me
      WHERE EXISTS (
        SELECT 1 
        FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(me.targets::jsonb) = 'array' THEN me.targets::jsonb ELSE '[]'::jsonb END) t
        WHERE t = $1 OR t LIKE $2
      )
      OR me.targets IS NULL
      OR jsonb_typeof(me.targets::jsonb) != 'array'
      OR jsonb_array_length(me.targets::jsonb) = 0
      ORDER BY me.created_at ASC
    `, [`batch${gradebook.batch_id}`, `batch${gradebook.batch_id}-%`])

    const mockExams = mockExamsRes.rows

    // 4. Fetch all mock exams in the system so the admin can add them to this gradebook
    const allSystemMocksRes = await pool.query(`
      SELECT me.id, me.exam_code, me.title, me.status, me.targets,
             (SELECT COUNT(*) FROM jsonb_array_elements(
               CASE WHEN jsonb_typeof(me.questions::jsonb->'questions') = 'array' 
                    THEN me.questions::jsonb->'questions' 
                    ELSE '[]'::jsonb END
             )) as question_count
      FROM mock_exams me
      ORDER BY me.created_at ASC
    `)

    // 5. Fetch all scores for these students
    const studentIds = studentsRes.rows.map(s => s.id)
    let scoresMap = {}

    if (studentIds.length > 0) {
      const scoresRes = await pool.query(`
        SELECT student_id, mock_exam_id, score, max_score
        FROM mock_exam_scores
        WHERE student_id = ANY($1)
      `, [studentIds])

      // Build a map: { studentId: { mockExamId: { score, maxScore } } }
      for (const row of scoresRes.rows) {
        if (!scoresMap[row.student_id]) scoresMap[row.student_id] = {}
        scoresMap[row.student_id][row.mock_exam_id] = {
          score: row.score,
          maxScore: row.max_score
        }
      }
    }

    // 6. Get batch and exam info
    const batchRes = await pool.query(
      "SELECT b.name as batch_name, b.target_year, e.name as exam_name FROM batches b JOIN examinations e ON b.exam_id = e.id WHERE b.id = $1",
      [gradebook.batch_id]
    )
    const batchInfo = batchRes.rows[0] || {}

    return NextResponse.json({
      gradebook,
      batch: batchInfo,
      students: studentsRes.rows,
      mockExams: mockExams,
      allSystemMockExams: allSystemMocksRes.rows,
      scoresMap
    })

  } catch (err) {
    console.error("[GET /api/admin/gradebook/[id]]", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

// PUT /api/admin/gradebook/[id] — update a single score cell, bulk scores, or mock exam columns
export async function PUT(req, { params }) {
  try {
    const session = await getSession()
    if (session?.role !== "admin" && session?.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    // 1. Update a specific student's score for a specific mock exam
    if (body.action === "UPDATE_SCORE") {
      const { studentId, mockExamId, score, maxScore } = body
      await pool.query(`
        INSERT INTO mock_exam_scores (student_id, mock_exam_id, score, max_score, completed_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (student_id, mock_exam_id)
        DO UPDATE SET score = $3, max_score = $4, completed_at = NOW()
      `, [parseInt(studentId), parseInt(mockExamId), parseInt(score), parseInt(maxScore)])
      return NextResponse.json({ success: true })
    }

    // 2. Bulk save all scores
    if (body.action === "SAVE_ALL") {
      const { scores } = body // Array of { studentId, mockExamId, score, maxScore }
      for (const s of scores) {
        await pool.query(`
          INSERT INTO mock_exam_scores (student_id, mock_exam_id, score, max_score, completed_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (student_id, mock_exam_id)
          DO UPDATE SET score = $3, max_score = $4, completed_at = NOW()
        `, [parseInt(s.studentId), parseInt(s.mockExamId), parseInt(s.score), parseInt(s.maxScore)])
      }
      return NextResponse.json({ success: true })
    }

    // 3. Add a mock exam column to the gradebook (targets the batch)
    if (body.action === "ADD_MOCK_EXAM") {
      const { mockExamId } = body
      const gbRes = await pool.query(`
        SELECT g.batch_id, b.name as batch_name, e.name as exam_name
        FROM gradebooks g
        JOIN batches b ON g.batch_id = b.id
        JOIN examinations e ON b.exam_id = e.id
        WHERE g.id = $1
      `, [parseInt(id)])
      if (gbRes.rows.length === 0) {
        return NextResponse.json({ error: "Gradebook not found." }, { status: 404 })
      }
      const { batch_id: batchId, exam_name: examName } = gbRes.rows[0]

      const meRes = await pool.query("SELECT targets FROM mock_exams WHERE id = $1", [parseInt(mockExamId)])
      if (meRes.rows.length === 0) {
        return NextResponse.json({ error: "Mock exam not found." }, { status: 404 })
      }
      const mockExam = meRes.rows[0]
      let targets = []
      if (mockExam.targets) {
        targets = typeof mockExam.targets === 'string' ? JSON.parse(mockExam.targets) : mockExam.targets
      }
      if (!Array.isArray(targets)) {
        targets = []
      }

      const batchPrefix = `batch${batchId}`
      const examSuffix = examName ? examName.toLowerCase() : ""
      const targetBatchId = batchPrefix
      const targetExamId = examSuffix ? `${batchPrefix}-${examSuffix}` : null

      let updated = false
      if (!targets.includes(targetBatchId)) {
        targets.push(targetBatchId)
        updated = true
      }
      if (targetExamId && !targets.includes(targetExamId)) {
        targets.push(targetExamId)
        updated = true
      }

      if (updated) {
        await pool.query("UPDATE mock_exams SET targets = $1 WHERE id = $2", [JSON.stringify(targets), parseInt(mockExamId)])
      }
      return NextResponse.json({ success: true })
    }

    // 4. Remove a mock exam column from the gradebook (removes batch target)
    if (body.action === "REMOVE_MOCK_EXAM") {
      const { mockExamId } = body
      const gbRes = await pool.query("SELECT batch_id FROM gradebooks WHERE id = $1", [parseInt(id)])
      if (gbRes.rows.length === 0) {
        return NextResponse.json({ error: "Gradebook not found." }, { status: 404 })
      }
      const batchId = gbRes.rows[0].batch_id

      const meRes = await pool.query("SELECT targets FROM mock_exams WHERE id = $1", [parseInt(mockExamId)])
      if (meRes.rows.length === 0) {
        return NextResponse.json({ error: "Mock exam not found." }, { status: 404 })
      }
      const mockExam = meRes.rows[0]
      let targets = []
      if (mockExam.targets) {
        targets = typeof mockExam.targets === 'string' ? JSON.parse(mockExam.targets) : mockExam.targets
      }
      if (Array.isArray(targets)) {
        const prefix = `batch${batchId}`
        targets = targets.filter(t => {
          const tStr = String(t)
          return tStr !== prefix && !tStr.startsWith(prefix + "-")
        })
        await pool.query("UPDATE mock_exams SET targets = $1 WHERE id = $2", [JSON.stringify(targets), parseInt(mockExamId)])
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 })
  } catch (err) {
    console.error("[PUT /api/admin/gradebook/[id]]", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
