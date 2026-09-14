import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const revalidate = 0

// Safe query helper that returns empty rows array if table or column fails
async function safeQuery(sql, params = []) {
  try {
    return await pool.query(sql, params)
  } catch (err) {
    console.error("[safeQuery error in /api/admin/search]:", err.message)
    return { rows: [] }
  }
}

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get("q") || ""
    const query = rawQuery.trim()

    if (!query) {
      return NextResponse.json({
        users: [],
        categories: [],
        subcategories: [],
        subjects: [],
        modules: [],
        mock_exams: [],
        master_data: []
      })
    }

    const searchPattern = `%${query}%`

    // Run safe parallel searches across entities
    const [
      usersRes,
      categoriesRes,
      subcategoriesRes,
      subjectsRes,
      modulesRes,
      mockExamsRes,
      schoolsRes,
      coursesRes,
      batchesRes,
      examsRes,
      programsRes,
      majorsRes
    ] = await Promise.all([
      // 1. Users (Students, Instructors, Admins)
      safeQuery(`
        SELECT 
          u.id, u.name, u.email, u.role, u.avatar_url,
          COALESCE(c.name, u.course, '—') AS course_name,
          COALESCE(s.name, u.school, '—') AS school_name
        FROM users u
        LEFT JOIN academic_courses c ON u.academic_course_id = c.id
        LEFT JOIN schools s ON u.school_id = s.id
        WHERE 
          u.name ILIKE $1 
          OR u.email ILIKE $1 
          OR u.first_name ILIKE $1 
          OR u.last_name ILIKE $1
          OR u.phone ILIKE $1
        ORDER BY 
          CASE WHEN u.name ILIKE $1 THEN 0 ELSE 1 END,
          u.created_at DESC
        LIMIT 8
      `, [searchPattern]),

      // 2. Categories
      safeQuery(`
        SELECT id, name, description, has_subcategories
        FROM categories
        WHERE name ILIKE $1 OR description ILIKE $1
        ORDER BY CASE WHEN name ILIKE $1 THEN 0 ELSE 1 END, name ASC
        LIMIT 6
      `, [searchPattern]),

      // 3. Subcategories
      safeQuery(`
        SELECT s.id, s.name, s.description, s.category_id, c.name AS category_name
        FROM subcategories s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.name ILIKE $1 OR s.description ILIKE $1
        ORDER BY CASE WHEN s.name ILIKE $1 THEN 0 ELSE 1 END, s.name ASC
        LIMIT 6
      `, [searchPattern]),

      // 4. Subjects
      safeQuery(`
        SELECT 
          sub.id, sub.title, sub.code, sub.description, sub.subcategory_id,
          sc.name AS subcategory_name,
          c.id AS category_id,
          c.name AS category_name
        FROM subjects sub
        LEFT JOIN subcategories sc ON sub.subcategory_id = sc.id
        LEFT JOIN categories c ON sc.category_id = c.id
        WHERE sub.title ILIKE $1 OR sub.code ILIKE $1 OR sub.description ILIKE $1
        ORDER BY CASE WHEN sub.title ILIKE $1 THEN 0 ELSE 1 END, sub.title ASC
        LIMIT 8
      `, [searchPattern]),

      // 5. Modules & Lessons
      safeQuery(`
        SELECT 
          m.id, m.title, m.subject_id,
          s.title AS subject_title, s.code AS subject_code
        FROM subject_modules m
        LEFT JOIN subjects s ON m.subject_id = s.id
        WHERE m.title ILIKE $1
        ORDER BY CASE WHEN m.title ILIKE $1 THEN 0 ELSE 1 END, m.title ASC
        LIMIT 6
      `, [searchPattern]),

      // 6. Mock Exams
      safeQuery(`
        SELECT id, title, exam_code, description, status, unlock_date
        FROM mock_exams
        WHERE title ILIKE $1 OR exam_code ILIKE $1 OR description ILIKE $1
        ORDER BY CASE WHEN title ILIKE $1 THEN 0 ELSE 1 END, created_at DESC
        LIMIT 6
      `, [searchPattern]),

      // 7. Schools
      safeQuery(`
        SELECT id, name, address
        FROM schools
        WHERE name ILIKE $1 OR address ILIKE $1
        LIMIT 4
      `, [searchPattern]),

      // 8. Academic Courses
      safeQuery(`
        SELECT id, name
        FROM academic_courses
        WHERE name ILIKE $1
        LIMIT 4
      `, [searchPattern]),

      // 9. Batches
      safeQuery(`
        SELECT b.id, b.name, b.target_year, b.status, e.name AS exam_name
        FROM batches b
        LEFT JOIN examinations e ON b.exam_id = e.id
        WHERE b.name ILIKE $1 OR CAST(b.target_year AS TEXT) ILIKE $1
        LIMIT 4
      `, [searchPattern]),

      // 10. Examinations
      safeQuery(`
        SELECT id, name
        FROM examinations
        WHERE name ILIKE $1
        LIMIT 4
      `, [searchPattern]),

      // 11. Programs
      safeQuery(`
        SELECT p.id, p.name, e.name AS exam_name
        FROM programs p
        LEFT JOIN examinations e ON p.exam_id = e.id
        WHERE p.name ILIKE $1
        LIMIT 4
      `, [searchPattern]),

      // 12. Majors
      safeQuery(`
        SELECT m.id, m.name, p.name AS program_name
        FROM majors m
        LEFT JOIN programs p ON m.program_id = p.id
        WHERE m.name ILIKE $1
        LIMIT 4
      `, [searchPattern]),
    ])

    // Aggregate master data items
    const masterDataItems = [
      ...schoolsRes.rows.map(r => ({
        type: "School / Institution",
        id: r.id,
        title: r.name,
        subtitle: r.address || "Academic Institution",
        href: "/admin/master-data?tab=education"
      })),
      ...coursesRes.rows.map(r => ({
        type: "Academic Course",
        id: r.id,
        title: r.name,
        subtitle: "Course Offering",
        href: "/admin/master-data?tab=education"
      })),
      ...batchesRes.rows.map(r => ({
        type: "Batch",
        id: r.id,
        title: r.name,
        subtitle: `${r.target_year || "—"} • ${r.exam_name || "Exam Board"} • ${r.status || "active"}`,
        href: "/admin/master-data?tab=batches"
      })),
      ...examsRes.rows.map(r => ({
        type: "Board Exam",
        id: r.id,
        title: r.name,
        subtitle: "Examination Management Data",
        href: "/admin/master-data?tab=tree"
      })),
      ...programsRes.rows.map(r => ({
        type: "Master Program",
        id: r.id,
        title: r.name,
        subtitle: r.exam_name ? `Exam: ${r.exam_name}` : "Program",
        href: "/admin/master-data?tab=tree"
      })),
      ...majorsRes.rows.map(r => ({
        type: "Specialization / Major",
        id: r.id,
        title: r.name,
        subtitle: r.program_name ? `Program: ${r.program_name}` : "Specialization",
        href: "/admin/master-data?tab=tree"
      }))
    ]

    return NextResponse.json({
      users: usersRes.rows.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar_url: u.avatar_url,
        course: u.course_name,
        school: u.school_name,
        href: `/admin/users/${u.id}`
      })),
      categories: categoriesRes.rows.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        href: `/admin/curriculum?cat=${c.id}`
      })),
      subcategories: subcategoriesRes.rows.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category_name: s.category_name,
        href: s.category_id ? `/admin/curriculum?cat=${s.category_id}&sub=${s.id}` : "/admin/curriculum"
      })),
      subjects: subjectsRes.rows.map(s => ({
        id: s.id,
        title: s.title,
        code: s.code,
        description: s.description,
        category_name: s.category_name,
        subcategory_name: s.subcategory_name,
        href: `/admin/curriculum/${s.id}/content`
      })),
      modules: modulesRes.rows.map(m => ({
        id: m.id,
        title: m.title,
        subject_id: m.subject_id,
        subject_title: m.subject_title,
        subject_code: m.subject_code,
        href: `/admin/curriculum/${m.subject_id}/content`
      })),
      mock_exams: mockExamsRes.rows.map(e => ({
        id: e.id,
        title: e.title,
        exam_code: e.exam_code,
        description: e.description,
        status: e.status,
        href: `/admin/mock-exams/${e.id}`
      })),
      master_data: masterDataItems
    })
  } catch (err) {
    console.error("[GET /api/admin/search]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
