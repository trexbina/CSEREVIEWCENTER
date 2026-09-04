import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { ensureTrashTable } from "@/lib/trash"

const ADMIN_ROLES = ["admin", "super_admin", "academic_admin", "registrar"]

async function adminGuard() {
  const session = await getSession()
  if (!session || !ADMIN_ROLES.includes(session.role)) return null
  return session
}

// ── GET /api/admin/trash ─────────────────────────────────────────────────────
// Query params: ?type=USER | PRE_REGISTRATION | CURRICULUM | MASTER_DATA | ALL
//               &search=keyword
export async function GET(request) {
  try {
    const session = await adminGuard()
    if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 })

    await ensureTrashTable()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "ALL"
    const search = searchParams.get("search") || ""

    let query = "SELECT * FROM trash_items"
    let conditions = []
    let values = []
    let pIdx = 1

    if (type !== "ALL") {
      if (type === "USERS") {
        conditions.push(`entity_type = 'USER'`)
      } else if (type === "PRE_REGISTRATIONS") {
        conditions.push(`entity_type = 'PRE_REGISTRATION'`)
      } else if (type === "CURRICULUM") {
        conditions.push(`entity_type IN ('CURRICULUM_CATEGORY', 'CURRICULUM_SUBCATEGORY', 'CURRICULUM_SUBJECT')`)
      } else if (type === "MOCK_EXAMS") {
        conditions.push(`entity_type = 'MOCK_EXAM'`)
      } else if (type === "MASTER_DATA") {
        conditions.push(`entity_type IN ('MASTER_DATA_EXAM', 'MASTER_DATA_PROGRAM', 'MASTER_DATA_MAJOR', 'MASTER_DATA_BATCH', 'MASTER_DATA_SCHOOL', 'MASTER_DATA_COURSE', 'MASTER_DATA_GRADEBOOK')`)
      } else {
        conditions.push(`entity_type = $${pIdx++}`)
        values.push(type)
      }
    }

    if (search.trim()) {
      conditions.push(`(item_name ILIKE $${pIdx} OR description ILIKE $${pIdx})`)
      values.push(`%${search.trim()}%`)
      pIdx++
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ")
    }

    query += " ORDER BY deleted_at DESC"

    const { rows } = await pool.query(query, values)
    return NextResponse.json({ items: rows })
  } catch (err) {
    console.error("[GET /api/admin/trash] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

// ── POST /api/admin/trash/recover ────────────────────────────────────────────
// Body: { ids: [1, 2, 3] } or ?action=recover
export async function POST(request) {
  try {
    const session = await adminGuard()
    if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 })

    await ensureTrashTable()

    const body = await request.json()
    const ids = Array.isArray(body.ids)
      ? body.ids.map((id) => Number(id)).filter((id) => !isNaN(id))
      : body.id
      ? [Number(body.id)].filter((id) => !isNaN(id))
      : []

    if (ids.length === 0) {
      return NextResponse.json({ error: "No item ID(s) provided." }, { status: 400 })
    }

    const { rows: items } = await pool.query(
      "SELECT * FROM trash_items WHERE id = ANY($1::int[])",
      [ids]
    )

    if (items.length === 0) {
      return NextResponse.json({ error: "Items not found in trash." }, { status: 404 })
    }

    const restoredIds = []
    const errors = []

    for (const item of items) {
      const p = item.payload
      try {
        if (item.entity_type === "USER") {
          // Check if email is already re-registered
          const checkEmail = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [p.email])
          if (checkEmail.rows.length > 0) {
            errors.push(`Cannot restore "${item.item_name}": email ${p.email} is already in use.`)
            continue
          }

          await pool.query(
            `INSERT INTO users (
              name, email, password, role, first_name, middle_name, last_name, suffix,
              birthday, gender, phone, address, city, province, zip_code, school, course,
              year_graduated, highest_education, avatar, avatar_url, batch_id, exam_id,
              program_id, major_id, school_id, academic_course_id, job_role_description,
              targets, personal_email, created_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8,
              $9, $10, $11, $12, $13, $14, $15, $16, $17,
              $18, $19, $20, $21, $22, $23,
              $24, $25, $26, $27, $28,
              $29, $30, $31
            )`,
            [
              p.name, p.email, p.password, p.role || 'student', p.first_name, p.middle_name, p.last_name, p.suffix,
              p.birthday, p.gender, p.phone, p.address, p.city, p.province, p.zip_code, p.school, p.course,
              p.year_graduated, p.highest_education, p.avatar, p.avatar_url, p.batch_id, p.exam_id,
              p.program_id, p.major_id, p.school_id, p.academic_course_id, p.job_role_description,
              JSON.stringify(p.targets || []), p.personal_email || p.email, p.created_at || new Date()
            ]
          )
          restoredIds.push(item.id)
        } else if (item.entity_type === "PRE_REGISTRATION") {
          const checkEmail = await pool.query("SELECT id FROM pre_registrations WHERE LOWER(email) = LOWER($1)", [p.email])
          if (checkEmail.rows.length > 0) {
            errors.push(`Cannot restore pre-registration "${item.item_name}": email ${p.email} already exists.`)
            continue
          }

          await pool.query(
            `INSERT INTO pre_registrations (
              first_name, middle_name, last_name, suffix, email, phone, birthday,
              gender, address, city, province, zip_code, school, school_id, course,
              academic_course_id, year_graduated, highest_education, exam_id,
              program_id, major_id, batch_id, status, notes, created_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7,
              $8, $9, $10, $11, $12, $13, $14, $15,
              $16, $17, $18, $19,
              $20, $21, $22, $23, $24, $25
            )`,
            [
              p.first_name, p.middle_name, p.last_name, p.suffix, p.email, p.phone, p.birthday,
              p.gender, p.address, p.city, p.province, p.zip_code, p.school, p.school_id, p.course,
              p.academic_course_id, p.year_graduated, p.highest_education, p.exam_id,
              p.program_id, p.major_id, p.batch_id, p.status || 'PENDING', p.notes, p.created_at || new Date()
            ]
          )
          restoredIds.push(item.id)
        } else if (item.entity_type === "CURRICULUM_CATEGORY") {
          let categoryId = null
          const checkCat = await pool.query("SELECT id FROM categories WHERE LOWER(name) = LOWER($1)", [p.name])
          if (checkCat.rows.length > 0) {
            // If category already exists, we will reuse its ID so child records can still be recovered
            categoryId = checkCat.rows[0].id
          } else {
            const insCat = await pool.query(
              `INSERT INTO categories (name, description, has_subcategories, target_course, target_program, target_major, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
               RETURNING id`,
              [p.name, p.description, p.has_subcategories !== false, p.target_course || 'all', p.target_program || 'all', p.target_major || 'all', p.created_at || new Date()]
            )
            categoryId = insCat.rows[0].id
          }
          restoredIds.push(item.id)

          // ── Cascade Recover Children: Subcategories and Subjects ────────
          // 1. Recover any child subcategories in trash associated with this category
          const childSubs = await pool.query(
            `SELECT * FROM trash_items 
             WHERE entity_type = 'CURRICULUM_SUBCATEGORY'
               AND (
                 payload->>'category_id' = $1
                 OR payload->>'_parent_category_id' = $1
                 OR LOWER(payload->>'_parent_category_name') = LOWER($2)
               )`,
            [String(p.id || item.original_id), p.name]
          )

          const subIdMap = {} // old sub ID -> new sub ID

          for (const subItem of childSubs.rows) {
            const sp = subItem.payload
            let subId = null
            // Check if subcategory already exists under this category
            const checkSub = await pool.query(
              "SELECT id FROM subcategories WHERE category_id = $1 AND LOWER(name) = LOWER($2)",
              [categoryId, sp.name]
            )
            if (checkSub.rows.length > 0) {
              subId = checkSub.rows[0].id
            } else {
              const insSub = await pool.query(
                `INSERT INTO subcategories (name, description, status, category_id, image_url, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 RETURNING id`,
                [sp.name, sp.description, sp.status || 'active', categoryId, sp.image_url, sp.created_at || new Date()]
              )
              subId = insSub.rows[0].id
            }

            if (sp.id) subIdMap[String(sp.id)] = subId
            if (subItem.original_id) subIdMap[String(subItem.original_id)] = subId
            restoredIds.push(subItem.id)
          }

          // 2. Recover any child subjects in trash associated with this category or its subcategories
          const childSubjs = await pool.query(
            `SELECT * FROM trash_items 
             WHERE entity_type = 'CURRICULUM_SUBJECT'
               AND (
                 payload->>'category_id' = $1
                 OR payload->>'_parent_category_id' = $1
                 OR LOWER(payload->>'category') = LOWER($2)
                 OR LOWER(payload->>'_parent_category_name') = LOWER($2)
                 OR payload->>'subcategory_id' = ANY($3::text[])
                 OR payload->>'_parent_subcategory_id' = ANY($3::text[])
               )`,
            [
              String(p.id || item.original_id),
              p.name,
              Object.keys(subIdMap).length > 0 ? Object.keys(subIdMap) : ["-999"]
            ]
          )

          for (const subjItem of childSubjs.rows) {
            const sjp = subjItem.payload
            // Determine the re-mapped subcategory_id if available
            const mappedSubId = sjp.subcategory_id && subIdMap[String(sjp.subcategory_id)]
              ? subIdMap[String(sjp.subcategory_id)]
              : sjp._parent_subcategory_id && subIdMap[String(sjp._parent_subcategory_id)]
              ? subIdMap[String(sjp._parent_subcategory_id)]
              : sjp.subcategory_id || null

            // Check if code already exists
            const checkCode = await pool.query("SELECT id FROM subjects WHERE UPPER(code) = UPPER($1)", [sjp.code])
            if (checkCode.rows.length === 0) {
              await pool.query(
                `INSERT INTO subjects (title, code, description, category, category_id, subcategory_id, image_url, status, unlock_date, topics, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
                [
                  sjp.title, sjp.code, sjp.description, p.name, categoryId, mappedSubId, sjp.image_url,
                  sjp.status || 'active', sjp.unlock_date, JSON.stringify(sjp.topics || []), sjp.created_at || new Date()
                ]
              )
            }
            restoredIds.push(subjItem.id)
          }
        } else if (item.entity_type === "CURRICULUM_SUBCATEGORY") {
          let categoryId = p.category_id

          // Check if parent category exists, or if we need to resolve it by name
          if (p._parent_category_name) {
            const parentCat = await pool.query("SELECT id FROM categories WHERE LOWER(name) = LOWER($1)", [p._parent_category_name])
            if (parentCat.rows.length > 0) {
              categoryId = parentCat.rows[0].id
            }
          }

          let subId = null
          const checkSub = await pool.query(
            "SELECT id FROM subcategories WHERE category_id = $1 AND LOWER(name) = LOWER($2)",
            [categoryId, p.name]
          )
          if (checkSub.rows.length > 0) {
            subId = checkSub.rows[0].id
          } else {
            const insSub = await pool.query(
              `INSERT INTO subcategories (name, description, status, category_id, image_url, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, NOW())
               RETURNING id`,
              [p.name, p.description, p.status || 'active', categoryId, p.image_url, p.created_at || new Date()]
            )
            subId = insSub.rows[0].id
          }
          restoredIds.push(item.id)

          // ── Cascade Recover Subjects under this subcategory ────────
          const childSubjs = await pool.query(
            `SELECT * FROM trash_items 
             WHERE entity_type = 'CURRICULUM_SUBJECT'
               AND (
                 payload->>'subcategory_id' = $1
                 OR payload->>'_parent_subcategory_id' = $1
                 OR payload->>'subcategory_id' = $2
                 OR payload->>'_parent_subcategory_id' = $2
               )`,
            [String(p.id || item.original_id), String(subId)]
          )

          for (const subjItem of childSubjs.rows) {
            const sjp = subjItem.payload
            const checkCode = await pool.query("SELECT id FROM subjects WHERE UPPER(code) = UPPER($1)", [sjp.code])
            if (checkCode.rows.length === 0) {
              await pool.query(
                `INSERT INTO subjects (title, code, description, category, category_id, subcategory_id, image_url, status, unlock_date, topics, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
                [
                  sjp.title, sjp.code, sjp.description, sjp.category, categoryId, subId, sjp.image_url,
                  sjp.status || 'active', sjp.unlock_date, JSON.stringify(sjp.topics || []), sjp.created_at || new Date()
                ]
              )
            }
            restoredIds.push(subjItem.id)
          }
        } else if (item.entity_type === "CURRICULUM_SUBJECT") {
          const checkCode = await pool.query("SELECT id FROM subjects WHERE UPPER(code) = UPPER($1)", [p.code])
          if (checkCode.rows.length > 0) {
            errors.push(`Cannot restore subject "${p.title}": code "${p.code}" is already in use.`)
            continue
          }

          // Resolve category_id if missing but category name exists
          let categoryId = p.category_id || null
          if (!categoryId && p.category) {
            const catRes = await pool.query("SELECT id FROM categories WHERE LOWER(name) = LOWER($1)", [p.category])
            if (catRes.rows.length > 0) {
              categoryId = catRes.rows[0].id
            }
          }

          await pool.query(
            `INSERT INTO subjects (title, code, description, category, category_id, subcategory_id, image_url, status, unlock_date, topics, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
            [
              p.title, p.code, p.description, p.category, categoryId, p.subcategory_id, p.image_url,
              p.status || 'active', p.unlock_date, JSON.stringify(p.topics || []), p.created_at || new Date()
            ]
          )
          restoredIds.push(item.id)
        } else if (item.entity_type === "MOCK_EXAM") {
          const checkCode = await pool.query("SELECT id FROM mock_exams WHERE UPPER(exam_code) = UPPER($1)", [p.exam_code])
          if (checkCode.rows.length > 0) {
            errors.push(`Cannot restore mock exam "${p.title}": code "${p.exam_code}" already exists.`)
            continue
          }

          await pool.query(
            `INSERT INTO mock_exams (exam_code, title, description, targets, unlock_date, status, questions, created_by, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
            [
              p.exam_code, p.title, p.description, JSON.stringify(p.targets || []), p.unlock_date,
              p.status || 'locked', JSON.stringify(p.questions || []), p.created_by || session.userId, p.created_at || new Date()
            ]
          )
          restoredIds.push(item.id)
        } else if (item.entity_type === "MASTER_DATA_EXAM") {
          let examId = null
          const checkExam = await pool.query("SELECT id FROM examinations WHERE LOWER(name) = LOWER($1)", [p.name])
          if (checkExam.rows.length > 0) {
            examId = checkExam.rows[0].id
          } else {
            const insExam = await pool.query(
              `INSERT INTO examinations (name, created_at, updated_at) VALUES ($1, $2, NOW()) RETURNING id`,
              [p.name, p.created_at || new Date()]
            )
            examId = insExam.rows[0].id
          }
          restoredIds.push(item.id)

          // ── Cascade Recover Child Programs ──
          const childProgs = await pool.query(
            `SELECT * FROM trash_items
             WHERE entity_type = 'MASTER_DATA_PROGRAM'
               AND (
                 payload->>'exam_id' = $1
                 OR payload->>'_parent_exam_id' = $1
                 OR LOWER(payload->>'_parent_exam_name') = LOWER($2)
               )`,
            [String(p.id || item.original_id), p.name]
          )

          const progIdMap = {} // old program ID -> new program ID
          for (const progItem of childProgs.rows) {
            const pp = progItem.payload
            let progId = null
            const checkProg = await pool.query(
              "SELECT id FROM programs WHERE exam_id = $1 AND LOWER(name) = LOWER($2)",
              [examId, pp.name]
            )
            if (checkProg.rows.length > 0) {
              progId = checkProg.rows[0].id
            } else {
              const insProg = await pool.query(
                `INSERT INTO programs (exam_id, name, created_at) VALUES ($1, $2, $3) RETURNING id`,
                [examId, pp.name, pp.created_at || new Date()]
              )
              progId = insProg.rows[0].id
            }
            if (pp.id) progIdMap[String(pp.id)] = progId
            if (progItem.original_id) progIdMap[String(progItem.original_id)] = progId
            restoredIds.push(progItem.id)
          }

          // ── Cascade Recover Child Majors ──
          const childMajors = await pool.query(
            `SELECT * FROM trash_items
             WHERE entity_type = 'MASTER_DATA_MAJOR'
               AND (
                 payload->>'_parent_exam_id' = $1
                 OR LOWER(payload->>'_parent_exam_name') = LOWER($2)
                 OR payload->>'program_id' = ANY($3::text[])
                 OR payload->>'_parent_program_id' = ANY($3::text[])
               )`,
            [
              String(p.id || item.original_id),
              p.name,
              Object.keys(progIdMap).length > 0 ? Object.keys(progIdMap) : ["-999"]
            ]
          )

          for (const majItem of childMajors.rows) {
            const mp = majItem.payload
            const mappedProgId = mp.program_id && progIdMap[String(mp.program_id)]
              ? progIdMap[String(mp.program_id)]
              : mp._parent_program_id && progIdMap[String(mp._parent_program_id)]
              ? progIdMap[String(mp._parent_program_id)]
              : null

            // If we have a valid program to attach to, or resolve by name
            let targetProgId = mappedProgId
            if (!targetProgId && mp._parent_program_name) {
              const findP = await pool.query(
                "SELECT id FROM programs WHERE exam_id = $1 AND LOWER(name) = LOWER($2)",
                [examId, mp._parent_program_name]
              )
              if (findP.rows.length > 0) targetProgId = findP.rows[0].id
            }

            if (targetProgId) {
              const checkMaj = await pool.query(
                "SELECT id FROM majors WHERE program_id = $1 AND LOWER(name) = LOWER($2)",
                [targetProgId, mp.name]
              )
              if (checkMaj.rows.length === 0) {
                await pool.query(
                  `INSERT INTO majors (program_id, name, created_at) VALUES ($1, $2, $3)`,
                  [targetProgId, mp.name, mp.created_at || new Date()]
                )
              }
            }
            restoredIds.push(majItem.id)
          }

          // ── Cascade Recover Child Batches ──
          const childBatches = await pool.query(
            `SELECT * FROM trash_items
             WHERE entity_type = 'MASTER_DATA_BATCH'
               AND (
                 payload->>'exam_id' = $1
                 OR payload->>'_parent_exam_id' = $1
                 OR LOWER(payload->>'_parent_exam_name') = LOWER($2)
               )`,
            [String(p.id || item.original_id), p.name]
          )

          const batchIdMap = {} // old batch ID -> new batch ID
          for (const batchItem of childBatches.rows) {
            const bp = batchItem.payload
            let batchId = null
            const checkBatch = await pool.query(
              "SELECT id FROM batches WHERE exam_id = $1 AND LOWER(name) = LOWER($2) AND target_year = $3",
              [examId, bp.name, bp.target_year]
            )
            if (checkBatch.rows.length > 0) {
              batchId = checkBatch.rows[0].id
            } else {
              const insBatch = await pool.query(
                `INSERT INTO batches (name, target_year, status, exam_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
                [bp.name, bp.target_year, bp.status || 'active', examId, bp.created_at || new Date()]
              )
              batchId = insBatch.rows[0].id
            }
            if (bp.id) batchIdMap[String(bp.id)] = batchId
            if (batchItem.original_id) batchIdMap[String(batchItem.original_id)] = batchId
            restoredIds.push(batchItem.id)
          }

          // ── Cascade Recover Child Gradebooks ──
          const childGbs = await pool.query(
            `SELECT * FROM trash_items
             WHERE entity_type = 'MASTER_DATA_GRADEBOOK'
               AND (
                 payload->>'exam_id' = $1
                 OR payload->>'_parent_exam_id' = $1
                 OR payload->>'batch_id' = ANY($2::text[])
                 OR payload->>'_parent_batch_id' = ANY($2::text[])
               )`,
            [
              String(p.id || item.original_id),
              Object.keys(batchIdMap).length > 0 ? Object.keys(batchIdMap) : ["-999"]
            ]
          )

          for (const gbItem of childGbs.rows) {
            const gp = gbItem.payload
            const mappedBatchId = gp.batch_id && batchIdMap[String(gp.batch_id)]
              ? batchIdMap[String(gp.batch_id)]
              : gp._parent_batch_id && batchIdMap[String(gp._parent_batch_id)]
              ? batchIdMap[String(gp._parent_batch_id)]
              : null

            let targetBatchId = mappedBatchId
            if (!targetBatchId) {
              // Try finding any batch under this exam
              const anyB = await pool.query("SELECT id FROM batches WHERE exam_id = $1 LIMIT 1", [examId])
              if (anyB.rows.length > 0) targetBatchId = anyB.rows[0].id
            }

            if (targetBatchId) {
              const checkCode = await pool.query("SELECT id FROM gradebooks WHERE UPPER(code) = UPPER($1)", [gp.code])
              if (checkCode.rows.length === 0) {
                await pool.query(
                  `INSERT INTO gradebooks (name, code, batch_id, exam_id, status, targets, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                  [gp.name, gp.code, targetBatchId, examId, gp.status || 'ACTIVE', JSON.stringify(gp.targets || []), gp.created_at || new Date()]
                )
              }
            }
            restoredIds.push(gbItem.id)
          }
        } else if (item.entity_type === "MASTER_DATA_PROGRAM") {
          let examId = p.exam_id
          if (p._parent_exam_name) {
            const eRes = await pool.query("SELECT id FROM examinations WHERE LOWER(name) = LOWER($1)", [p._parent_exam_name])
            if (eRes.rows.length > 0) examId = eRes.rows[0].id
          }

          if (!examId) {
            // Pick first examination if exam_id is missing/invalid
            const firstExam = await pool.query("SELECT id FROM examinations ORDER BY id ASC LIMIT 1")
            if (firstExam.rows.length > 0) examId = firstExam.rows[0].id
          }

          if (!examId) {
            errors.push(`Cannot restore course "${p.name}": parent examination not found.`)
            continue
          }

          let progId = null
          const checkProg = await pool.query(
            "SELECT id FROM programs WHERE exam_id = $1 AND LOWER(name) = LOWER($2)",
            [examId, p.name]
          )
          if (checkProg.rows.length > 0) {
            progId = checkProg.rows[0].id
          } else {
            const insProg = await pool.query(
              `INSERT INTO programs (exam_id, name, created_at) VALUES ($1, $2, $3) RETURNING id`,
              [examId, p.name, p.created_at || new Date()]
            )
            progId = insProg.rows[0].id
          }
          restoredIds.push(item.id)

          // ── Cascade Recover Child Majors ──
          const childMajors = await pool.query(
            `SELECT * FROM trash_items
             WHERE entity_type = 'MASTER_DATA_MAJOR'
               AND (
                 payload->>'program_id' = $1
                 OR payload->>'_parent_program_id' = $1
                 OR (payload->>'program_id' = $2 OR payload->>'_parent_program_id' = $2)
                 OR LOWER(payload->>'_parent_program_name') = LOWER($3)
               )`,
            [String(p.id || item.original_id), String(progId), p.name]
          )

          for (const majItem of childMajors.rows) {
            const mp = majItem.payload
            const checkMaj = await pool.query(
              "SELECT id FROM majors WHERE program_id = $1 AND LOWER(name) = LOWER($2)",
              [progId, mp.name]
            )
            if (checkMaj.rows.length === 0) {
              await pool.query(
                `INSERT INTO majors (program_id, name, created_at) VALUES ($1, $2, $3)`,
                [progId, mp.name, mp.created_at || new Date()]
              )
            }
            restoredIds.push(majItem.id)
          }
        } else if (item.entity_type === "MASTER_DATA_MAJOR") {
          let progId = p.program_id
          if (p._parent_program_name) {
            const pRes = await pool.query("SELECT id FROM programs WHERE LOWER(name) = LOWER($1)", [p._parent_program_name])
            if (pRes.rows.length > 0) progId = pRes.rows[0].id
          }

          if (!progId) {
            const anyProg = await pool.query("SELECT id FROM programs ORDER BY id ASC LIMIT 1")
            if (anyProg.rows.length > 0) progId = anyProg.rows[0].id
          }

          if (!progId) {
            errors.push(`Cannot restore specialization "${p.name}": parent course not found.`)
            continue
          }

          const checkMaj = await pool.query(
            "SELECT id FROM majors WHERE program_id = $1 AND LOWER(name) = LOWER($2)",
            [progId, p.name]
          )
          if (checkMaj.rows.length === 0) {
            await pool.query(
              `INSERT INTO majors (program_id, name, created_at) VALUES ($1, $2, $3)`,
              [progId, p.name, p.created_at || new Date()]
            )
          }
          restoredIds.push(item.id)
        } else if (item.entity_type === "MASTER_DATA_BATCH") {
          let examId = p.exam_id
          if (p._parent_exam_name) {
            const eRes = await pool.query("SELECT id FROM examinations WHERE LOWER(name) = LOWER($1)", [p._parent_exam_name])
            if (eRes.rows.length > 0) examId = eRes.rows[0].id
          }

          if (!examId) {
            const anyExam = await pool.query("SELECT id FROM examinations ORDER BY id ASC LIMIT 1")
            if (anyExam.rows.length > 0) examId = anyExam.rows[0].id
          }

          if (!examId) {
            errors.push(`Cannot restore batch "${p.name}": parent examination not found.`)
            continue
          }

          let batchId = null
          const checkBatch = await pool.query(
            "SELECT id FROM batches WHERE exam_id = $1 AND LOWER(name) = LOWER($2) AND target_year = $3",
            [examId, p.name, p.target_year]
          )
          if (checkBatch.rows.length > 0) {
            batchId = checkBatch.rows[0].id
          } else {
            const insBatch = await pool.query(
              `INSERT INTO batches (name, target_year, status, exam_id, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
              [p.name, p.target_year, p.status || 'active', examId, p.created_at || new Date()]
            )
            batchId = insBatch.rows[0].id
          }
          restoredIds.push(item.id)

          // ── Cascade Recover Gradebooks linked to this Batch ──
          const childGbs = await pool.query(
            `SELECT * FROM trash_items
             WHERE entity_type = 'MASTER_DATA_GRADEBOOK'
               AND (
                 payload->>'batch_id' = $1
                 OR payload->>'_parent_batch_id' = $1
                 OR payload->>'batch_id' = $2
                 OR payload->>'_parent_batch_id' = $2
                 OR LOWER(payload->>'_parent_batch_name') = LOWER($3)
               )`,
            [String(p.id || item.original_id), String(batchId), p.name]
          )

          for (const gbItem of childGbs.rows) {
            const gp = gbItem.payload
            const checkCode = await pool.query("SELECT id FROM gradebooks WHERE UPPER(code) = UPPER($1)", [gp.code])
            if (checkCode.rows.length === 0) {
              await pool.query(
                `INSERT INTO gradebooks (name, code, batch_id, exam_id, status, targets, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                [gp.name, gp.code, batchId, examId, gp.status || 'ACTIVE', JSON.stringify(gp.targets || []), gp.created_at || new Date()]
              )
            }
            restoredIds.push(gbItem.id)
          }
        } else if (item.entity_type === "MASTER_DATA_SCHOOL") {
          const checkSchool = await pool.query("SELECT id FROM schools WHERE LOWER(name) = LOWER($1)", [p.name])
          if (checkSchool.rows.length === 0) {
            await pool.query(
              `INSERT INTO schools (name, address, created_at, updated_at) VALUES ($1, $2, $3, NOW())`,
              [p.name, p.address || null, p.created_at || new Date()]
            )
          }
          restoredIds.push(item.id)
        } else if (item.entity_type === "MASTER_DATA_COURSE") {
          const checkCourse = await pool.query("SELECT id FROM academic_courses WHERE LOWER(name) = LOWER($1)", [p.name])
          if (checkCourse.rows.length === 0) {
            await pool.query(
              `INSERT INTO academic_courses (name, created_at, updated_at) VALUES ($1, $2, NOW())`,
              [p.name, p.created_at || new Date()]
            )
          }
          restoredIds.push(item.id)
        } else if (item.entity_type === "MASTER_DATA_GRADEBOOK") {
          const checkCode = await pool.query("SELECT id FROM gradebooks WHERE UPPER(code) = UPPER($1)", [p.code])
          if (checkCode.rows.length > 0) {
            errors.push(`Cannot restore gradebook "${p.name || p.code}": code "${p.code}" already exists.`)
            continue
          }

          let batchId = p.batch_id
          let examId = p.exam_id

          // If batch doesn't exist, resolve by exam or default
          const bCheck = await pool.query("SELECT id, exam_id FROM batches WHERE id = $1", [batchId])
          if (bCheck.rows.length > 0) {
            examId = bCheck.rows[0].exam_id
          } else {
            const anyBatch = await pool.query("SELECT id, exam_id FROM batches ORDER BY id ASC LIMIT 1")
            if (anyBatch.rows.length > 0) {
              batchId = anyBatch.rows[0].id
              examId = anyBatch.rows[0].exam_id
            }
          }

          if (!batchId || !examId) {
            errors.push(`Cannot restore gradebook "${p.name || p.code}": valid batch or exam not found.`)
            continue
          }

          await pool.query(
            `INSERT INTO gradebooks (name, code, batch_id, exam_id, status, targets, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [p.name, p.code, batchId, examId, p.status || 'ACTIVE', JSON.stringify(p.targets || []), p.created_at || new Date()]
          )
          restoredIds.push(item.id)
        }
      } catch (restErr) {
        console.error("Restoration error for item:", item.id, restErr)
        errors.push(`Failed to restore "${item.item_name}": ${restErr.message || "Database error"}`)
      }
    }

    if (restoredIds.length > 0) {
      await pool.query("DELETE FROM trash_items WHERE id = ANY($1::int[])", [restoredIds])
    }

    revalidatePath("/admin/trash")
    revalidatePath("/admin/users")
    revalidatePath("/admin/users/all")
    revalidatePath("/admin/curriculum")
    revalidatePath("/admin/mock-exams")
    revalidatePath("/admin/master-data")

    return NextResponse.json({
      ok: true,
      restoredCount: restoredIds.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error("[POST /api/admin/trash/recover] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

// ── DELETE /api/admin/trash ──────────────────────────────────────────────────
// Permanently purge items from trash
export async function DELETE(request) {
  try {
    const session = await adminGuard()
    if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 })

    await ensureTrashTable()

    let targetIds = []
    try {
      const body = await request.json()
      if (Array.isArray(body?.ids)) {
        targetIds = body.ids.map((id) => Number(id)).filter((id) => !isNaN(id))
      } else if (body?.id) {
        targetIds = [Number(body.id)].filter((id) => !isNaN(id))
      }
    } catch {
      // Body parsing optional
    }

    if (targetIds.length === 0) {
      const { searchParams } = new URL(request.url)
      const idsParam = searchParams.get("ids")
      const idParam = searchParams.get("id")
      if (idsParam) {
        targetIds = idsParam.split(",").map((id) => Number(id.trim())).filter((id) => !isNaN(id))
      } else if (idParam) {
        targetIds = [Number(idParam)].filter((id) => !isNaN(id))
      }
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ error: "Item ID(s) required." }, { status: 400 })
    }

    const { rowCount } = await pool.query(
      "DELETE FROM trash_items WHERE id = ANY($1::int[])",
      [targetIds]
    )

    revalidatePath("/admin/trash")

    return NextResponse.json({ ok: true, deletedCount: rowCount })
  } catch (err) {
    console.error("[DELETE /api/admin/trash] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
