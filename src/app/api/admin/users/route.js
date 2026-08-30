import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

const VALID_ROLES = ["student", "teacher", "admin"]

/** GET /api/admin/users — list all users (admin only). */
export async function GET() {
  try {
    const session = await getSession()
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const { rows } = await pool.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
    )
    return NextResponse.json({ users: rows })
  } catch (err) {
    console.error("[admin/users GET] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

async function ensureTable() {
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS targets JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_email VARCHAR(255);
  `).catch(console.error)
}

/** POST /api/admin/users — create a student or teacher (admin only). */
export async function POST(request) {
  try {
    const session = await getSession()
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    await ensureTable()

    const body = await request.json()
    const { name, email, password, role, personal_email } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, login email and password are required." },
        { status: 400 }
      )
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'student', 'teacher', or 'admin'." },
        { status: 400 }
      )
    }

    // Check if login email already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase().trim()])
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Login email already registered." },
        { status: 409 }
      )
    }

    const hash = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `INSERT INTO users (
        name, email, password, role,
        first_name, middle_name, last_name, suffix,
        birthday, gender, phone, address, city, province, zip_code,
        school, course, year_graduated, highest_education,
        exam_id, batch_id, program_id, major_id, job_role_description,
        school_id, academic_course_id, avatar_url, targets, personal_email, created_at
      )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29, NOW())
       RETURNING id, name, email, personal_email, role, created_at, avatar_url`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        hash,
        role,
        body.first_name?.trim() || null,
        body.middle_name?.trim() || null,
        body.last_name?.trim() || null,
        body.suffix?.trim() || null,
        body.birthday || null,
        body.gender || null,
        body.phone?.trim() || null,
        body.address?.trim() || null,
        body.city?.trim() || null,
        body.province?.trim() || null,
        body.zip_code?.trim() || null,
        body.school?.trim() || null,
        body.course?.trim() || null,
        body.year_graduated?.toString().trim() || null,
        body.highest_education || null,
        body.exam_id || null,
        body.batch_id || null,
        body.program_id || null,
        body.major_id || null,
        body.job_role_description?.trim() || null,
        body.school_id || null,
        body.academic_course_id || null,
        body.avatar_url || null,
        JSON.stringify(body.targets || []),
        personal_email?.toLowerCase().trim() || email.toLowerCase().trim(),
      ]
    )

    revalidatePath("/admin/users")
    revalidatePath("/admin/users/all")

    return NextResponse.json({ user: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error("[admin/users POST] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

/** DELETE /api/admin/users — delete single user (?id=123) or multiple users ({ ids: [123, 456] } or ?ids=123,456). */
export async function DELETE(request) {
  try {
    const session = await getSession()
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    let targetIds = []
    let bodyData = null
    try {
      bodyData = await request.json()
    } catch {
      // Body parsing optional
    }

    if (bodyData?.ids && Array.isArray(bodyData.ids)) {
      targetIds = bodyData.ids.map((id) => Number(id)).filter((id) => !isNaN(id))
    } else if (bodyData?.id) {
      targetIds = [Number(bodyData.id)].filter((id) => !isNaN(id))
    } else {
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
      return NextResponse.json({ error: "User id(s) required." }, { status: 400 })
    }

    // Exclude current session admin from deletion
    const validIdsToDelete = targetIds.filter((id) => id !== Number(session.userId))

    if (validIdsToDelete.length === 0) {
      return NextResponse.json({ error: "Cannot delete yourself." }, { status: 400 })
    }

    const { rowCount } = await pool.query(
      "DELETE FROM users WHERE id = ANY($1::int[])",
      [validIdsToDelete]
    )

    if (rowCount === 0) {
      return NextResponse.json({ error: "User(s) not found." }, { status: 404 })
    }

    revalidatePath("/admin/users")
    revalidatePath("/admin/users/all")

    return NextResponse.json({ ok: true, deletedCount: rowCount })
  } catch (err) {
    console.error("[admin/users DELETE] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

/** PUT /api/admin/users?id=123 — update a user (admin only). */
export async function PUT(request) {
  try {
    const session = await getSession()
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "User id is required." }, { status: 400 })
    }

    const body = await request.json()
    const { name, email, role, password, personal_email } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and login email are required." },
        { status: 400 }
      )
    }

    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'student', 'teacher', or 'admin'." },
        { status: 400 }
      )
    }

    // Check if login email is taken by another user
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email.toLowerCase().trim(), userId]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Login email already in use by another account." },
        { status: 409 }
      )
    }

    let result
    if (password?.trim()) {
      const hash = await bcrypt.hash(password.trim(), 10)
      result = await pool.query(
        `UPDATE users SET
          name = $1, email = $2, role = $3, password = $4,
          first_name = $5, middle_name = $6, last_name = $7, suffix = $8,
          birthday = $9, gender = $10, phone = $11, address = $12, city = $13, province = $14, zip_code = $15,
          school = $16, course = $17, year_graduated = $18, highest_education = $19,
          exam_id = $20, batch_id = $21, program_id = $22, major_id = $23, job_role_description = $24,
          school_id = $25, academic_course_id = $26, avatar_url = $27, targets = $28,
          personal_email = $29
         WHERE id = $30
         RETURNING id, name, email, personal_email, role, created_at, avatar_url`,
        [
          name.trim(),
          email.toLowerCase().trim(),
          role || "student",
          hash,
          body.first_name?.trim() || null,
          body.middle_name?.trim() || null,
          body.last_name?.trim() || null,
          body.suffix?.trim() || null,
          body.birthday || null,
          body.gender || null,
          body.phone?.trim() || null,
          body.address?.trim() || null,
          body.city?.trim() || null,
          body.province?.trim() || null,
          body.zip_code?.trim() || null,
          body.school?.trim() || null,
          body.course?.trim() || null,
          body.year_graduated?.toString().trim() || null,
          body.highest_education || null,
          body.exam_id || null,
          body.batch_id || null,
          body.program_id || null,
          body.major_id || null,
          body.job_role_description?.trim() || null,
          body.school_id || null,
          body.academic_course_id || null,
          body.avatar_url || null,
          body.targets !== undefined ? JSON.stringify(body.targets) : null,
          personal_email?.toLowerCase().trim() || email.toLowerCase().trim(),
          userId,
        ]
      )
    } else {
      result = await pool.query(
        `UPDATE users SET
          name = $1, email = $2, role = $3,
          first_name = $4, middle_name = $5, last_name = $6, suffix = $7,
          birthday = $8, gender = $9, phone = $10, address = $11, city = $12, province = $13, zip_code = $14,
          school = $15, course = $16, year_graduated = $17, highest_education = $18,
          exam_id = $19, batch_id = $20, program_id = $21, major_id = $22, job_role_description = $23,
          school_id = $24, academic_course_id = $25, avatar_url = $26, targets = $27,
          personal_email = $28
         WHERE id = $29
         RETURNING id, name, email, personal_email, role, created_at, avatar_url`,
        [
          name.trim(),
          email.toLowerCase().trim(),
          role || "student",
          body.first_name?.trim() || null,
          body.middle_name?.trim() || null,
          body.last_name?.trim() || null,
          body.suffix?.trim() || null,
          body.birthday || null,
          body.gender || null,
          body.phone?.trim() || null,
          body.address?.trim() || null,
          body.city?.trim() || null,
          body.province?.trim() || null,
          body.zip_code?.trim() || null,
          body.school?.trim() || null,
          body.course?.trim() || null,
          body.year_graduated?.toString().trim() || null,
          body.highest_education || null,
          body.exam_id || null,
          body.batch_id || null,
          body.program_id || null,
          body.major_id || null,
          body.job_role_description?.trim() || null,
          body.school_id || null,
          body.academic_course_id || null,
          body.avatar_url || null,
          body.targets !== undefined ? JSON.stringify(body.targets) : null,
          personal_email?.toLowerCase().trim() || email.toLowerCase().trim(),
          userId,
        ]
      )
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 })
    }

    revalidatePath("/admin/users")
    revalidatePath("/admin/users/all")

    return NextResponse.json({ user: result.rows[0] })
  } catch (err) {
    console.error("[admin/users PUT] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
