import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

export async function GET() {
  try {
    const session = await getSession()
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const [examsResult, batchesResult, programsResult, majorsResult, schoolsResult, academicCoursesResult] = await Promise.all([
      pool.query("SELECT id, name FROM examinations ORDER BY name ASC"),
      pool.query("SELECT id, name, exam_id, target_year, status FROM batches ORDER BY name ASC"),
      pool.query("SELECT id, name, exam_id FROM programs ORDER BY name ASC"),
      pool.query("SELECT id, name, program_id FROM majors ORDER BY name ASC"),
      pool.query("SELECT id, name, address FROM schools ORDER BY name ASC"),
      pool.query("SELECT id, name FROM academic_courses ORDER BY name ASC")
    ])

    return NextResponse.json({
      examinations: examsResult.rows,
      batches: batchesResult.rows,
      programs: programsResult.rows,
      majors: majorsResult.rows,
      schools: schoolsResult.rows,
      academic_courses: academicCoursesResult.rows
    })
  } catch (err) {
    console.error("[admin/master-data/dropdowns GET] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
