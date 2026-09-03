import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES } from "@/lib/auth"

/**
 * PUT /api/user/profile
 * Allows any authenticated user (admin, teacher, student) to update their own profile and credentials.
 * Admins can also update other users by providing target userId.
 */
export async function PUT(request) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }

    const body = await request.json()
    const targetUserId = (ADMIN_ROLES.includes(session.role) && body.userId) ? parseInt(body.userId) : session.userId

    const {
      name,
      email,
      personal_email,
      password,
      first_name,
      middle_name,
      last_name,
      suffix,
      birthday,
      gender,
      phone,
      address,
      city,
      province,
      zip_code,
      school_id,
      academic_course_id,
      year_graduated,
      highest_education,
      exam_id,
      batch_id,
      program_id,
      major_id,
      job_role_description,
      avatar_url,
      targets,
      role
    } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 })
    }

    // Check if email already in use by another user
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email.toLowerCase().trim(), targetUserId]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Email is already taken by another account." }, { status: 409 })
    }

    // Only admins can change user roles; otherwise preserve existing role
    let updatedRole = session.role
    if (ADMIN_ROLES.includes(session.role) && role) {
      updatedRole = role
    } else {
      const currentRes = await pool.query("SELECT role FROM users WHERE id = $1", [targetUserId])
      updatedRole = currentRes.rows[0]?.role || session.role
    }

    let query
    let values
    if (password && password.trim().length >= 6) {
      const hash = await bcrypt.hash(password.trim(), 10)
      query = `
        UPDATE users SET
          name = $1, email = $2, role = $3, password = $4,
          first_name = $5, middle_name = $6, last_name = $7, suffix = $8,
          birthday = $9, gender = $10, phone = $11, address = $12, city = $13, province = $14, zip_code = $15,
          school_id = $16, academic_course_id = $17, year_graduated = $18, highest_education = $19,
          exam_id = $20, batch_id = $21, program_id = $22, major_id = $23,
          job_role_description = $24, avatar_url = $25, targets = $26, personal_email = $27
        WHERE id = $28
        RETURNING *
      `
      values = [
        name.trim(),
        email.toLowerCase().trim(),
        updatedRole,
        hash,
        first_name || null,
        middle_name || null,
        last_name || null,
        suffix || null,
        birthday || null,
        gender || null,
        phone || null,
        address || null,
        city || null,
        province || null,
        zip_code || null,
        school_id ? parseInt(school_id) : null,
        academic_course_id ? parseInt(academic_course_id) : null,
        year_graduated ? String(year_graduated) : null,
        highest_education || null,
        exam_id ? parseInt(exam_id) : null,
        batch_id ? parseInt(batch_id) : null,
        program_id ? parseInt(program_id) : null,
        major_id ? parseInt(major_id) : null,
        job_role_description || null,
        avatar_url || null,
        targets ? JSON.stringify(targets) : '[]',
        personal_email || null,
        targetUserId
      ]
    } else {
      query = `
        UPDATE users SET
          name = $1, email = $2, role = $3,
          first_name = $4, middle_name = $5, last_name = $6, suffix = $7,
          birthday = $8, gender = $9, phone = $10, address = $11, city = $12, province = $13, zip_code = $14,
          school_id = $15, academic_course_id = $16, year_graduated = $17, highest_education = $18,
          exam_id = $19, batch_id = $20, program_id = $21, major_id = $22,
          job_role_description = $23, avatar_url = $24, targets = $25, personal_email = $26
        WHERE id = $27
        RETURNING *
      `
      values = [
        name.trim(),
        email.toLowerCase().trim(),
        updatedRole,
        first_name || null,
        middle_name || null,
        last_name || null,
        suffix || null,
        birthday || null,
        gender || null,
        phone || null,
        address || null,
        city || null,
        province || null,
        zip_code || null,
        school_id ? parseInt(school_id) : null,
        academic_course_id ? parseInt(academic_course_id) : null,
        year_graduated ? String(year_graduated) : null,
        highest_education || null,
        exam_id ? parseInt(exam_id) : null,
        batch_id ? parseInt(batch_id) : null,
        program_id ? parseInt(program_id) : null,
        major_id ? parseInt(major_id) : null,
        job_role_description || null,
        avatar_url || null,
        targets ? JSON.stringify(targets) : '[]',
        personal_email || null,
        targetUserId
      ]
    }

    const { rows } = await pool.query(query, values)
    const updatedUser = rows[0]

    // Fetch joined names for clean response
    const detailRes = await pool.query(`
      SELECT 
        u.*,
        s.name AS school_name,
        ac.name AS academic_course_name,
        ex.name AS exam_name,
        b.name AS batch_name,
        b.target_year AS batch_year,
        p.name AS program_name,
        m.name AS major_name
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      LEFT JOIN academic_courses ac ON u.academic_course_id = ac.id
      LEFT JOIN examinations ex ON u.exam_id = ex.id
      LEFT JOIN batches b ON u.batch_id = b.id
      LEFT JOIN programs p ON u.program_id = p.id
      LEFT JOIN majors m ON u.major_id = m.id
      WHERE u.id = $1
    `, [targetUserId])

    return NextResponse.json({ success: true, user: detailRes.rows[0] || updatedUser })
  } catch (err) {
    console.error("Profile update error:", err)
    return NextResponse.json({ error: err.message || "Failed to update profile." }, { status: 500 })
  }
}
