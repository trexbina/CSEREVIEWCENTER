import { NextResponse } from "next/server"
import pool from "@/lib/db"

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

/** GET /api/public/pre-register — public dropdown data for applicants */
export async function GET() {
  try {
    await ensurePreRegistrationsTable()

    const [examsResult, batchesResult, programsResult, majorsResult, schoolsResult, academicCoursesResult] = await Promise.all([
      pool.query("SELECT id, name FROM examinations ORDER BY name ASC"),
      pool.query("SELECT id, name, exam_id, target_year, status FROM batches WHERE status = 'active' OR status IS NULL ORDER BY name ASC"),
      pool.query("SELECT id, name, exam_id FROM programs ORDER BY name ASC"),
      pool.query("SELECT id, name, program_id FROM majors ORDER BY name ASC"),
      pool.query("SELECT id, name, address FROM schools ORDER BY name ASC"),
      pool.query("SELECT id, name FROM academic_courses ORDER BY name ASC"),
    ])

    return NextResponse.json({
      examinations: examsResult.rows,
      batches: batchesResult.rows,
      programs: programsResult.rows,
      majors: majorsResult.rows,
      schools: schoolsResult.rows,
      academic_courses: academicCoursesResult.rows,
    })
  } catch (err) {
    console.error("[public/pre-register GET] error:", err)
    return NextResponse.json({ error: "Failed to load registration data." }, { status: 500 })
  }
}

/** POST /api/public/pre-register — submit a new student pre-registration */
export async function POST(request) {
  try {
    await ensurePreRegistrationsTable()

    const body = await request.json()
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
    } = body

    if (!first_name?.trim() || !last_name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "First Name, Last Name, and Email are required." },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()

    // Check if user already exists in active users table
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [cleanEmail]
    )
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "An active account with this email address already exists. Please log in instead." },
        { status: 409 }
      )
    }

    // Check if pending pre-registration already exists
    const existingApplication = await pool.query(
      "SELECT id, status FROM pre_registrations WHERE email = $1",
      [cleanEmail]
    )
    if (existingApplication.rows.length > 0) {
      const currentStatus = existingApplication.rows[0].status
      if (currentStatus === "PENDING") {
        return NextResponse.json(
          { error: "A pending application with this email has already been submitted. Please await admin review." },
          { status: 409 }
        )
      }
    }

    const insertQuery = `
      INSERT INTO pre_registrations (
        first_name, middle_name, last_name, suffix,
        email, phone, birthday, gender,
        address, city, province, zip_code,
        school, school_id, course, academic_course_id,
        year_graduated, highest_education,
        exam_id, program_id, major_id, batch_id,
        status
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18,
        $19, $20, $21, $22,
        'PENDING'
      )
      ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        middle_name = EXCLUDED.middle_name,
        last_name = EXCLUDED.last_name,
        suffix = EXCLUDED.suffix,
        phone = EXCLUDED.phone,
        birthday = EXCLUDED.birthday,
        gender = EXCLUDED.gender,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        province = EXCLUDED.province,
        zip_code = EXCLUDED.zip_code,
        school = EXCLUDED.school,
        school_id = EXCLUDED.school_id,
        course = EXCLUDED.course,
        academic_course_id = EXCLUDED.academic_course_id,
        year_graduated = EXCLUDED.year_graduated,
        highest_education = EXCLUDED.highest_education,
        exam_id = EXCLUDED.exam_id,
        program_id = EXCLUDED.program_id,
        major_id = EXCLUDED.major_id,
        batch_id = EXCLUDED.batch_id,
        status = 'PENDING',
        created_at = NOW(),
        reviewed_at = NULL,
        reviewed_by = NULL
      RETURNING id, first_name, last_name, email, created_at, status
    `

    const result = await pool.query(insertQuery, [
      first_name.trim(),
      middle_name?.trim() || null,
      last_name.trim(),
      suffix?.trim() || null,
      cleanEmail,
      phone?.trim() || null,
      birthday || null,
      gender || null,
      address?.trim() || null,
      city?.trim() || null,
      province?.trim() || null,
      zip_code?.trim() || null,
      school?.trim() || null,
      school_id ? parseInt(school_id, 10) : null,
      course?.trim() || null,
      academic_course_id ? parseInt(academic_course_id, 10) : null,
      year_graduated?.toString().trim() || null,
      highest_education || null,
      exam_id ? parseInt(exam_id, 10) : null,
      program_id ? parseInt(program_id, 10) : null,
      major_id ? parseInt(major_id, 10) : null,
      batch_id ? parseInt(batch_id, 10) : null,
    ])

    return NextResponse.json(
      {
        message: "Application submitted successfully.",
        application: result.rows[0],
      },
      { status: 201 }
    )
  } catch (err) {
    console.error("[public/pre-register POST] error:", err)
    return NextResponse.json({ error: "Failed to submit application." }, { status: 500 })
  }
}
