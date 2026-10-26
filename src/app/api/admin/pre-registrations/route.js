import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES } from "@/lib/auth"
import { moveToTrash } from "@/lib/trash"
import { generateNextLoginId } from "@/lib/login-id"

async function ensurePreRegistrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pre_registrations (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      middle_name VARCHAR(100),
      last_name VARCHAR(100) NOT NULL,
      suffix VARCHAR(20),
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      birthday DATE,
      gender VARCHAR(20),
      address TEXT,
      city VARCHAR(100),
      province VARCHAR(100),
      zip_code VARCHAR(20),
      school VARCHAR(255),
      school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
      course VARCHAR(255),
      academic_course_id INTEGER REFERENCES academic_courses(id) ON DELETE SET NULL,
      year_graduated VARCHAR(20),
      highest_education VARCHAR(100),
      exam_id INTEGER REFERENCES examinations(id) ON DELETE SET NULL,
      program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
      major_id INTEGER REFERENCES majors(id) ON DELETE SET NULL,
      batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
      status VARCHAR(50) DEFAULT 'PENDING',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      reviewed_at TIMESTAMP WITH TIME ZONE,
      reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    );
  `).catch(console.error)
}

/** GET /api/admin/pre-registrations — list all student applications (admin only) */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    await ensurePreRegistrationsTable()

    const { rows } = await pool.query(`
      SELECT 
        pr.*,
        COALESCE(c.name, pr.course, '—') AS academic_course_name,
        COALESCE(p.name, '—') AS program_name,
        COALESCE(m.name, '—') AS major_name,
        COALESCE(s.name, pr.school, '—') AS school_name,
        COALESCE(e.name, '—') AS exam_name,
        COALESCE(b.name, '—') AS batch_name
      FROM pre_registrations pr
      LEFT JOIN academic_courses c ON pr.academic_course_id = c.id
      LEFT JOIN programs p ON pr.program_id = p.id
      LEFT JOIN majors m ON pr.major_id = m.id
      LEFT JOIN schools s ON pr.school_id = s.id
      LEFT JOIN examinations e ON pr.exam_id = e.id
      LEFT JOIN batches b ON pr.batch_id = b.id
      ORDER BY 
        CASE WHEN pr.status = 'PENDING' THEN 0 ELSE 1 END,
        pr.created_at DESC
    `)

    return NextResponse.json({ preRegistrations: rows, applications: rows })
  } catch (err) {
    console.error("[admin/pre-registrations GET] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

/** PATCH /api/admin/pre-registrations — approve or reject application (admin only) */
export async function PATCH(request) {
  try {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const body = await request.json()
    const { id, action, customPassword, ...updateFields } = body

    if (!id || !["APPROVE", "REJECT", "UPDATE"].includes(action)) {
      return NextResponse.json({ error: "Application ID and valid action (APPROVE/REJECT/UPDATE) required." }, { status: 400 })
    }

    const appRes = await pool.query("SELECT * FROM pre_registrations WHERE id = $1", [id])
    if (appRes.rows.length === 0) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 })
    }

    const app = appRes.rows[0]

    // UPDATE flow: Admin edits application details
    if (action === "UPDATE") {
      const {
        first_name,
        middle_name,
        last_name,
        suffix,
        email,
        phone,
        birthday,
        gender,
        address,
        city,
        province,
        zip_code,
        school,
        school_id,
        course,
        academic_course_id,
        year_graduated,
        highest_education,
        exam_id,
        program_id,
        major_id,
        batch_id,
      } = updateFields

      const updateQuery = `
        UPDATE pre_registrations SET
          first_name = COALESCE($1, first_name),
          middle_name = $2,
          last_name = COALESCE($3, last_name),
          suffix = $4,
          email = COALESCE($5, email),
          phone = $6,
          birthday = $7,
          gender = $8,
          address = $9,
          city = $10,
          province = $11,
          zip_code = $12,
          school = $13,
          school_id = $14,
          course = $15,
          academic_course_id = $16,
          year_graduated = $17,
          highest_education = $18,
          exam_id = $19,
          program_id = $20,
          major_id = $21,
          batch_id = $22
        WHERE id = $23
        RETURNING *
      `

      const updatedRes = await pool.query(updateQuery, [
        first_name !== undefined ? first_name.trim() : app.first_name,
        middle_name !== undefined ? (middle_name?.trim() || null) : app.middle_name,
        last_name !== undefined ? last_name.trim() : app.last_name,
        suffix !== undefined ? (suffix?.trim() || null) : app.suffix,
        email !== undefined ? email.toLowerCase().trim() : app.email,
        phone !== undefined ? (phone?.trim() || null) : app.phone,
        birthday !== undefined ? (birthday || null) : app.birthday,
        gender !== undefined ? (gender || null) : app.gender,
        address !== undefined ? (address?.trim() || null) : app.address,
        city !== undefined ? (city?.trim() || null) : app.city,
        province !== undefined ? (province?.trim() || null) : app.province,
        zip_code !== undefined ? (zip_code?.trim() || null) : app.zip_code,
        school !== undefined ? (school?.trim() || null) : app.school,
        school_id !== undefined ? (school_id ? parseInt(school_id, 10) : null) : app.school_id,
        course !== undefined ? (course?.trim() || null) : app.course,
        academic_course_id !== undefined ? (academic_course_id ? parseInt(academic_course_id, 10) : null) : app.academic_course_id,
        year_graduated !== undefined ? (year_graduated?.toString().trim() || null) : app.year_graduated,
        highest_education !== undefined ? (highest_education || null) : app.highest_education,
        exam_id !== undefined ? (exam_id ? parseInt(exam_id, 10) : null) : app.exam_id,
        program_id !== undefined ? (program_id ? parseInt(program_id, 10) : null) : app.program_id,
        major_id !== undefined ? (major_id ? parseInt(major_id, 10) : null) : app.major_id,
        batch_id !== undefined ? (batch_id ? parseInt(batch_id, 10) : null) : app.batch_id,
        id,
      ])

      return NextResponse.json({
        message: "Application updated successfully.",
        application: updatedRes.rows[0],
      })
    }

    if (action === "REJECT") {
      await pool.query(
        "UPDATE pre_registrations SET status = 'REJECTED', reviewed_at = NOW(), reviewed_by = $1 WHERE id = $2",
        [session.userId, id]
      )
      return NextResponse.json({ message: "Application rejected.", status: "REJECTED" })
    }

    // APPROVE flow: Create student account
    const fullName = [app.first_name, app.middle_name, app.last_name, app.suffix].filter(Boolean).join(" ")
    const defaultPassword = customPassword?.trim() || "Student@123"
    const hash = await bcrypt.hash(defaultPassword, 10)

    const accountEmail = (body.accountEmail || body.customEmail || app.email).toLowerCase().trim()
    const chosenBatchId = body.batch_id !== undefined
      ? (body.batch_id ? parseInt(body.batch_id, 10) : null)
      : (body.batchId !== undefined ? (body.batchId ? parseInt(body.batchId, 10) : null) : (app.batch_id || null))

    const insertUserRes = await pool.query(
      `INSERT INTO users (
        name, email, personal_email, password, role,
        first_name, middle_name, last_name, suffix,
        birthday, gender, phone, address, city, province, zip_code,
        school, course, year_graduated, highest_education,
        exam_id, batch_id, program_id, major_id,
        school_id, academic_course_id, targets, created_at
      )
      VALUES ($1,$2,$3,$4,'student',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,'[]'::jsonb, NOW())
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        personal_email = EXCLUDED.personal_email,
        role = 'student',
        password = EXCLUDED.password,
        first_name = EXCLUDED.first_name,
        middle_name = EXCLUDED.middle_name,
        last_name = EXCLUDED.last_name,
        suffix = EXCLUDED.suffix,
        birthday = EXCLUDED.birthday,
        gender = EXCLUDED.gender,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        province = EXCLUDED.province,
        zip_code = EXCLUDED.zip_code,
        school = EXCLUDED.school,
        course = EXCLUDED.course,
        year_graduated = EXCLUDED.year_graduated,
        highest_education = EXCLUDED.highest_education,
        exam_id = EXCLUDED.exam_id,
        batch_id = EXCLUDED.batch_id,
        program_id = EXCLUDED.program_id,
        major_id = EXCLUDED.major_id,
        school_id = EXCLUDED.school_id,
        academic_course_id = EXCLUDED.academic_course_id
      RETURNING id, name, email, personal_email, role, created_at`,
      [
        fullName,
        accountEmail,
        app.email?.toLowerCase().trim() || null,
        hash,
        app.first_name,
        app.middle_name,
        app.last_name,
        app.suffix,
        app.birthday,
        app.gender,
        app.phone,
        app.address,
        app.city,
        app.province,
        app.zip_code,
        app.school,
        app.course,
        app.year_graduated,
        app.highest_education,
        app.exam_id,
        chosenBatchId,
        app.program_id,
        app.major_id,
        app.school_id,
        app.academic_course_id,
      ]
    )

    // Mark application as APPROVED and sync chosen batch
    await pool.query(
      "UPDATE pre_registrations SET status = 'APPROVED', reviewed_at = NOW(), reviewed_by = $1, batch_id = COALESCE($3, batch_id) WHERE id = $2",
      [session.userId, id, chosenBatchId]
    )

    revalidatePath("/admin/users")
    revalidatePath("/admin/users/all")

    return NextResponse.json({
      message: "Application approved and student account created.",
      status: "APPROVED",
      user: insertUserRes.rows[0],
      initialPassword: defaultPassword,
      accountEmail: accountEmail,
      loginId: accountEmail,
    })
  } catch (err) {
    console.error("[admin/pre-registrations PATCH] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

/** DELETE /api/admin/pre-registrations — remove application records (single or batch) (admin only) */
export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const singleId = searchParams.get("id")

    let idsToDelete = []
    if (singleId) {
      idsToDelete = [parseInt(singleId, 10)]
    } else {
      try {
        const body = await request.json()
        if (Array.isArray(body.ids) && body.ids.length > 0) {
          idsToDelete = body.ids.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n))
        }
      } catch {
        // no body
      }
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({ error: "No valid Application ID(s) provided." }, { status: 400 })
    }

    const appsToTrash = await pool.query(
      "SELECT * FROM pre_registrations WHERE id = ANY($1::int[])",
      [idsToDelete]
    )

    for (const app of appsToTrash.rows) {
      const applicantName = [app.first_name, app.middle_name, app.last_name, app.suffix].filter(Boolean).join(" ")
      await moveToTrash({
        entity_type: "PRE_REGISTRATION",
        original_id: app.id,
        item_name: applicantName || app.email || "Pre-Registration Applicant",
        description: `Target: ${app.target_exam || "Exam"} • ${app.email || ""}`,
        original_location: "/admin/users?tab=pre-registrations",
        payload: app,
        deleted_by: session.userId,
        deleted_by_name: session.name || session.email || null,
      })
    }

    await pool.query("DELETE FROM pre_registrations WHERE id = ANY($1::int[])", [idsToDelete])

    revalidatePath("/admin/users")
    revalidatePath("/admin/trash")

    return NextResponse.json({ ok: true, deletedCount: idsToDelete.length })
  } catch (err) {
    console.error("[admin/pre-registrations DELETE] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
