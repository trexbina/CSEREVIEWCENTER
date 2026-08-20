import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

export async function POST(request) {
  try {
    const session = await getSession()
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const body = await request.json()
    const {
      id,
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
      avatar_url,
    } = body

    if (!id) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 })
    }

    // Update statement for profile details
    const result = await pool.query(
      `UPDATE users SET
        first_name = $1,
        middle_name = $2,
        last_name = $3,
        suffix = $4,
        birthday = $5,
        gender = $6,
        phone = $7,
        address = $8,
        city = $9,
        province = $10,
        zip_code = $11,
        school_id = $12,
        academic_course_id = $13,
        year_graduated = $14,
        highest_education = $15,
        exam_id = $16,
        batch_id = $17,
        program_id = $18,
        major_id = $19,
        avatar_url = $20
      WHERE id = $21
      RETURNING *`,
      [
        first_name?.trim() || null,
        middle_name?.trim() || null,
        last_name?.trim() || null,
        suffix?.trim() || null,
        birthday || null,
        gender || null,
        phone?.trim() || null,
        address?.trim() || null,
        city?.trim() || null,
        province?.trim() || null,
        zip_code?.trim() || null,
        school_id || null,
        academic_course_id || null,
        year_graduated || null,
        highest_education || null,
        exam_id || null,
        batch_id || null,
        program_id || null,
        major_id || null,
        avatar_url || null,
        id
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 })
    }

    return NextResponse.json({ user: result.rows[0] })
  } catch (err) {
    console.error("[admin/users/profile-update POST] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
