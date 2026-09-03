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
        conditions.push(`entity_type IN ('MASTER_DATA_BATCH', 'MASTER_DATA_SCHOOL', 'MASTER_DATA_COURSE', 'MASTER_DATA_GRADEBOOK')`)
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
          const checkCat = await pool.query("SELECT id FROM categories WHERE LOWER(name) = LOWER($1)", [p.name])
          if (checkCat.rows.length > 0) {
            errors.push(`Cannot restore category "${p.name}": category name already exists.`)
            continue
          }

          await pool.query(
            `INSERT INTO categories (name, description, has_subcategories, target_course, target_program, target_major, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [p.name, p.description, p.has_subcategories !== false, p.target_course || 'all', p.target_program || 'all', p.target_major || 'all', p.created_at || new Date()]
          )
          restoredIds.push(item.id)
        } else if (item.entity_type === "CURRICULUM_SUBCATEGORY") {
          await pool.query(
            `INSERT INTO subcategories (name, description, status, category_id, image_url, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [p.name, p.description, p.status || 'active', p.category_id, p.image_url, p.created_at || new Date()]
          )
          restoredIds.push(item.id)
        } else if (item.entity_type === "CURRICULUM_SUBJECT") {
          const checkCode = await pool.query("SELECT id FROM subjects WHERE UPPER(code) = UPPER($1)", [p.code])
          if (checkCode.rows.length > 0) {
            errors.push(`Cannot restore subject "${p.title}": code "${p.code}" is already in use.`)
            continue
          }

          await pool.query(
            `INSERT INTO subjects (title, code, description, category, subcategory_id, image_url, status, unlock_date, topics, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
            [
              p.title, p.code, p.description, p.category, p.subcategory_id, p.image_url,
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
        } else if (item.entity_type === "MASTER_DATA_BATCH") {
          await pool.query(
            `INSERT INTO batches (name, target_year, status, exam_id) VALUES ($1, $2, $3, $4)`,
            [p.name, p.target_year, p.status || 'active', p.exam_id]
          )
          restoredIds.push(item.id)
        } else if (item.entity_type === "MASTER_DATA_SCHOOL") {
          await pool.query(
            `INSERT INTO schools (name, address) VALUES ($1, $2)`,
            [p.name, p.address]
          )
          restoredIds.push(item.id)
        } else if (item.entity_type === "MASTER_DATA_COURSE") {
          await pool.query(
            `INSERT INTO academic_courses (name) VALUES ($1)`,
            [p.name]
          )
          restoredIds.push(item.id)
        } else if (item.entity_type === "MASTER_DATA_GRADEBOOK") {
          await pool.query(
            `INSERT INTO gradebooks (name, code, batch_id, exam_id, status, targets) VALUES ($1, $2, $3, $4, $5, $6)`,
            [p.name, p.code, p.batch_id, p.exam_id, p.status || 'ACTIVE', JSON.stringify(p.targets || [])]
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
