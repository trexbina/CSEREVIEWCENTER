import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES } from "@/lib/auth"

// GET /api/admin/gradebook/[id] — fetch full gradebook data with students & scores
export async function GET(req, { params }) {
  try {
    const session = await getSession()
    if (!session || (!ADMIN_ROLES.includes(session.role) && session.role !== "teacher")) {
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

    // 2. Fetch all students enrolled in this batch / target courses
    let targets = []
    if (gradebook.targets) {
      try {
        targets = typeof gradebook.targets === 'string' ? JSON.parse(gradebook.targets) : gradebook.targets
      } catch (e) { targets = [] }
    }
    if (!Array.isArray(targets)) targets = []

    let targetProgramIds = []
    let targetMajorIds = []
    let targetExamIds = []
    let targetBatchIds = []

    for (const t of targets) {
      const tStr = String(t)
      // e.g. batch_8_prog_11 -> prog 11
      const progMatch = tStr.match(/_prog_(\d+)/)
      if (progMatch) targetProgramIds.push(parseInt(progMatch[1]))

      // e.g. batch_8_maj_11 -> maj 11
      const majMatch = tStr.match(/_maj_(\d+)/)
      if (majMatch) targetMajorIds.push(parseInt(majMatch[1]))

      // e.g. batch_8_exam_8 -> exam 8
      const examMatch = tStr.match(/_exam_(\d+)/)
      if (examMatch) targetExamIds.push(parseInt(examMatch[1]))

      // e.g. batch_8 -> batch 8
      const batchMatch = tStr.match(/^batch_(\d+)$/)
      if (batchMatch) targetBatchIds.push(parseInt(batchMatch[1]))
    }

    let studentsQuery = `
      SELECT u.id, u.name, u.email, u.program_id, u.major_id, u.exam_id, u.batch_id,
             COALESCE(s.name, u.school, 'N/A') as school_name
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.role = 'student' AND u.batch_id = $1
    `
    const queryParams = [gradebook.batch_id]

    // If specific sub-targets (programs/majors) are selected, filter students matching those criteria
    if (targetMajorIds.length > 0 && targetProgramIds.length === 0) {
      queryParams.push(targetMajorIds)
      studentsQuery += ` AND (u.major_id = ANY($${queryParams.length}) OR u.major_id IS NULL)`
    } else if (targetProgramIds.length > 0 && targetMajorIds.length === 0) {
      queryParams.push(targetProgramIds)
      studentsQuery += ` AND (u.program_id = ANY($${queryParams.length}) OR u.program_id IS NULL)`
    } else if (targetProgramIds.length > 0 && targetMajorIds.length > 0) {
      queryParams.push(targetProgramIds)
      const pIdx = queryParams.length
      queryParams.push(targetMajorIds)
      const mIdx = queryParams.length
      studentsQuery += ` AND (u.program_id = ANY($${pIdx}) OR u.major_id = ANY($${mIdx}) OR (u.program_id IS NULL AND u.major_id IS NULL))`
    }

    studentsQuery += ` ORDER BY u.name ASC`

    const studentsRes = await pool.query(studentsQuery, queryParams)

    // 3. Get batch and exam info (use LEFT JOIN for safety)
    const batchRes = await pool.query(`
      SELECT b.id, b.name as batch_name, b.target_year, b.exam_id, e.name as exam_name 
      FROM batches b 
      LEFT JOIN examinations e ON b.exam_id = e.id 
      WHERE b.id = $1
    `, [gradebook.batch_id])
    const batchInfo = batchRes.rows[0] || {}

    // 4. Fetch all mock exams safely from DB and process in JS
    const allSystemMocksRes = await pool.query(`
      SELECT id, exam_code, title, status, targets, questions, created_at
      FROM mock_exams 
      ORDER BY created_at ASC
    `)

    const batchPrefix = `batch${gradebook.batch_id}`
    const batchHyphen = `batch-${gradebook.batch_id}`
    const batchIdStr = String(gradebook.batch_id)

    const processedMocks = allSystemMocksRes.rows.map(me => {
      let qCount = 0
      if (me.questions) {
        try {
          const qObj = typeof me.questions === 'string' ? JSON.parse(me.questions) : me.questions
          if (Array.isArray(qObj?.questions)) qCount = qObj.questions.length
          else if (Array.isArray(qObj)) qCount = qObj.length
        } catch (e) { qCount = 0 }
      }

      let targets = []
      if (me.targets) {
        try {
          targets = typeof me.targets === 'string' ? JSON.parse(me.targets) : me.targets
        } catch (e) { targets = [] }
      }
      if (!Array.isArray(targets)) targets = []

      return {
        id: me.id,
        exam_code: me.exam_code,
        title: me.title,
        status: me.status,
        targets,
        question_count: qCount
      }
    })

    // Filter mock exams that target this batch
    const mockExams = processedMocks.filter(me => {
      return me.targets.some(t => {
        const tStr = String(t)
        return tStr === batchPrefix || tStr.startsWith(batchPrefix + "-") ||
               tStr === batchHyphen || tStr.startsWith(batchHyphen + "-") ||
               tStr === batchIdStr
      })
    })

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

    return NextResponse.json({
      gradebook,
      batch: batchInfo,
      students: studentsRes.rows,
      mockExams: mockExams,
      allSystemMockExams: processedMocks,
      scoresMap
    })

  } catch (err) {
    console.error("[GET /api/admin/gradebook/[id]]", err)
    return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 })
  }
}

// PUT /api/admin/gradebook/[id] — update a single score cell, bulk scores, or mock exam columns
export async function PUT(req, { params }) {
  try {
    const session = await getSession()
    if (!session || (!ADMIN_ROLES.includes(session.role) && session.role !== "teacher")) {
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
      const batchHyphen = `batch-${batchId}`
      const examSuffix = examName ? examName.toLowerCase() : ""
      const targetExamId = examSuffix ? `${batchPrefix}-${examSuffix}` : null

      let updated = false
      if (!targets.includes(batchPrefix)) {
        targets.push(batchPrefix)
        updated = true
      }
      if (!targets.includes(batchHyphen)) {
        targets.push(batchHyphen)
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
        const p1 = `batch${batchId}`
        const p2 = `batch-${batchId}`
        const p3 = String(batchId)
        targets = targets.filter(t => {
          const tStr = String(t)
          return tStr !== p1 && !tStr.startsWith(p1 + "-") &&
                 tStr !== p2 && !tStr.startsWith(p2 + "-") &&
                 tStr !== p3
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
