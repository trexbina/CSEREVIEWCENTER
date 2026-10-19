import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES, isAdminRole } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || !isAdminRole(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const [examsResult, batchesResult, programsResult, majorsResult, schoolsResult, academicCoursesResult, categoriesResult, gradebooksResult, rolesResult] = await Promise.all([
      pool.query("SELECT id, name FROM examinations ORDER BY name ASC"),
      pool.query("SELECT id, name, exam_id, target_year, status, start_date, end_date FROM batches ORDER BY name ASC"),
      pool.query("SELECT id, name, exam_id FROM programs ORDER BY name ASC"),
      pool.query("SELECT id, name, program_id FROM majors ORDER BY name ASC"),
      pool.query("SELECT id, name, address FROM schools ORDER BY name ASC"),
      pool.query("SELECT id, name FROM academic_courses ORDER BY name ASC"),
      pool.query("SELECT id, name, target_course, target_program, target_major FROM categories ORDER BY created_at ASC"),
      pool.query(`
        SELECT g.id, g.name, g.code, g.batch_id, g.exam_id, g.status, g.targets, g.created_at,
               b.name as batch_name, b.target_year,
               e.name as exam_name,
               (SELECT COUNT(*) FROM users u WHERE u.batch_id = g.batch_id AND u.role = 'student') as student_count,
               (SELECT COUNT(DISTINCT mes.mock_exam_id) FROM mock_exam_scores mes 
                JOIN users u2 ON mes.student_id = u2.id 
                WHERE u2.batch_id = g.batch_id) as mock_exams_taken
        FROM gradebooks g
        JOIN batches b ON g.batch_id = b.id
        JOIN examinations e ON g.exam_id = e.id
        ORDER BY g.created_at DESC
      `),
      pool.query(`
        SELECT r.id, r.role_key, r.name, r.description, r.permissions, r.is_system, r.created_at, r.updated_at,
               (SELECT COUNT(*) FROM users u WHERE u.role = r.role_key OR (r.role_key = 'super_admin' AND u.role = 'admin')) as user_count
        FROM custom_roles r
        ORDER BY r.is_system DESC, r.name ASC
      `).catch(() => ({ rows: [] }))
    ])

    return NextResponse.json({
      examinations: examsResult.rows,
      batches: batchesResult.rows,
      programs: programsResult.rows,
      majors: majorsResult.rows,
      schools: schoolsResult.rows,
      academic_courses: academicCoursesResult.rows,
      categories: categoriesResult.rows,
      gradebooks: gradebooksResult.rows,
      roles: rolesResult.rows
    })
  } catch (err) {
    console.error("[admin/master-data/dropdowns GET] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
