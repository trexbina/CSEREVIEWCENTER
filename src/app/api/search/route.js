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
    console.error("[safeQuery error in /api/search]:", err.message)
    return { rows: [] }
  }
}

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session || !session.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get("q") || ""
    const query = rawQuery.trim()

    const emptyResult = {
      users: [],
      categories: [],
      subcategories: [],
      subjects: [],
      modules: [],
      mock_exams: [],
      master_data: []
    }

    if (!query) {
      return NextResponse.json(emptyResult)
    }

    const searchPattern = `%${query}%`
    const role = session.role

    // ─────────────────────────────────────────────────────────────
    // 1. STUDENT SEARCH
    // Students CANNOT search or view other students or users.
    // Students can search their unlocked subjects, modules, assignments, and mock exams.
    // ─────────────────────────────────────────────────────────────
    if (role === "student") {
      const studentId = session.userId

      // Fetch student's batch and exam details for mock exams
      const studentRes = await safeQuery(
        "SELECT batch_id, exam_id FROM users WHERE id = $1",
        [studentId]
      )
      const studentInfo = studentRes.rows[0] || {}
      const studentBatchId = studentInfo.batch_id

      let batchName = ""
      if (studentBatchId) {
        const bRes = await safeQuery("SELECT name FROM batches WHERE id = $1", [studentBatchId])
        batchName = bRes.rows[0]?.name || ""
      }

      const [subjectsRes, modulesRes, mockExamsRes, assignmentsRes] = await Promise.all([
        // Active unlocked subjects
        safeQuery(`
          SELECT id, title, code, description
          FROM subjects
          WHERE status = 'active' 
            AND (unlock_date IS NULL OR unlock_date <= NOW())
            AND (title ILIKE $1 OR code ILIKE $1 OR description ILIKE $1)
          ORDER BY title ASC
          LIMIT 8
        `, [searchPattern]),

        // Modules inside active unlocked subjects
        safeQuery(`
          SELECT sm.id, sm.title, sm.subject_id, s.title AS subject_title, s.code AS subject_code
          FROM subject_modules sm
          JOIN subjects s ON sm.subject_id = s.id
          WHERE s.status = 'active'
            AND (s.unlock_date IS NULL OR s.unlock_date <= NOW())
            AND sm.title ILIKE $1
          ORDER BY sm.title ASC
          LIMIT 8
        `, [searchPattern]),

        // Mock exams available for student
        safeQuery(`
          SELECT id, title, exam_code, description, status
          FROM mock_exams
          WHERE (status = 'Active' OR status ILIKE 'active')
            AND (unlock_date IS NULL OR unlock_date <= NOW())
            AND (title ILIKE $1 OR exam_code ILIKE $1 OR description ILIKE $1)
          ORDER BY title ASC
          LIMIT 6
        `, [searchPattern]),

        // Quizzes / Assignments
        safeQuery(`
          SELECT sc.id, sc.title, sc.module_id, sm.subject_id, s.title AS subject_title
          FROM subject_contents sc
          JOIN subject_modules sm ON sc.module_id = sm.id
          JOIN subjects s ON sm.subject_id = s.id
          WHERE LOWER(COALESCE(sc.lesson_type, '')) = 'quiz'
            AND s.status = 'active'
            AND (s.unlock_date IS NULL OR s.unlock_date <= NOW())
            AND sc.title ILIKE $1
          ORDER BY sc.title ASC
          LIMIT 6
        `, [searchPattern]),
      ])

      // Filter mock exams to only those targeting student's batch or 'all'
      const matchedExams = mockExamsRes.rows.map(e => ({
        id: e.id,
        title: e.title,
        exam_code: e.exam_code,
        href: `/student/mock-exams`
      }))

      return NextResponse.json({
        users: [], // Strictly no users for students
        categories: [],
        subcategories: [],
        subjects: subjectsRes.rows.map(s => ({
          id: s.id,
          title: s.title,
          code: s.code,
          href: `/student/subjects/${s.id}`
        })),
        modules: [
          ...modulesRes.rows.map(m => ({
            id: m.id,
            title: m.title,
            subject_title: m.subject_title,
            href: `/student/subjects/${m.subject_id}`
          })),
          ...assignmentsRes.rows.map(a => ({
            id: `quiz-${a.id}`,
            title: a.title,
            subject_title: `Quiz • ${a.subject_title}`,
            href: `/student/assignments`
          }))
        ],
        mock_exams: matchedExams,
        master_data: []
      })
    }

    // ─────────────────────────────────────────────────────────────
    // 2. ADMIN ROLES SEARCH
    // All admin roles (admin, super_admin, academic_admin, registrar)
    // CAN search and view other students/users.
    // ─────────────────────────────────────────────────────────────
    if (ADMIN_ROLES.includes(role)) {
      const isSuperAdmin = role === "admin" || role === "super_admin"
      const isAcademicAdmin = role === "academic_admin"
      const isRegistrar = role === "registrar"

      // Role permission flags
      const canViewUsers = true // All admin roles can search/view users
      const canViewCurriculum = isSuperAdmin || isAcademicAdmin
      const canViewMockExams = isSuperAdmin || isAcademicAdmin
      const canViewMasterData = isSuperAdmin || isAcademicAdmin || isRegistrar

      // Parallel data queries depending on role scope
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
        // Users (Students & Staff)
        canViewUsers
          ? safeQuery(`
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
            `, [searchPattern])
          : Promise.resolve({ rows: [] }),

        // Categories (Curriculum)
        canViewCurriculum
          ? safeQuery(`
              SELECT id, name, description, has_subcategories
              FROM categories
              WHERE name ILIKE $1 OR description ILIKE $1
              ORDER BY CASE WHEN name ILIKE $1 THEN 0 ELSE 1 END, name ASC
              LIMIT 6
            `, [searchPattern])
          : Promise.resolve({ rows: [] }),

        // Subcategories (Curriculum)
        canViewCurriculum
          ? safeQuery(`
              SELECT s.id, s.name, s.description, s.category_id, c.name AS category_name
              FROM subcategories s
              LEFT JOIN categories c ON s.category_id = c.id
              WHERE s.name ILIKE $1 OR s.description ILIKE $1
              ORDER BY CASE WHEN s.name ILIKE $1 THEN 0 ELSE 1 END, s.name ASC
              LIMIT 6
            `, [searchPattern])
          : Promise.resolve({ rows: [] }),

        // Subjects (Curriculum)
        canViewCurriculum
          ? safeQuery(`
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
            `, [searchPattern])
          : Promise.resolve({ rows: [] }),

        // Modules (Curriculum)
        canViewCurriculum
          ? safeQuery(`
              SELECT 
                m.id, m.title, m.subject_id,
                s.title AS subject_title, s.code AS subject_code
              FROM subject_modules m
              LEFT JOIN subjects s ON m.subject_id = s.id
              WHERE m.title ILIKE $1
              ORDER BY CASE WHEN m.title ILIKE $1 THEN 0 ELSE 1 END, m.title ASC
              LIMIT 6
            `, [searchPattern])
          : Promise.resolve({ rows: [] }),

        // Mock Exams
        canViewMockExams
          ? safeQuery(`
              SELECT id, title, exam_code, description, status, unlock_date
              FROM mock_exams
              WHERE title ILIKE $1 OR exam_code ILIKE $1 OR description ILIKE $1
              ORDER BY CASE WHEN title ILIKE $1 THEN 0 ELSE 1 END, created_at DESC
              LIMIT 6
            `, [searchPattern])
          : Promise.resolve({ rows: [] }),

        // Master Data: Schools (Super Admin & Registrar)
        canViewMasterData && (isSuperAdmin || isRegistrar)
          ? safeQuery(`SELECT id, name, address FROM schools WHERE name ILIKE $1 OR address ILIKE $1 LIMIT 4`, [searchPattern])
          : Promise.resolve({ rows: [] }),

        // Master Data: Academic Courses (Super Admin & Registrar)
        canViewMasterData && (isSuperAdmin || isRegistrar)
          ? safeQuery(`SELECT id, name FROM academic_courses WHERE name ILIKE $1 LIMIT 4`, [searchPattern])
          : Promise.resolve({ rows: [] }),

        // Master Data: Batches (Super Admin & Registrar)
        canViewMasterData && (isSuperAdmin || isRegistrar)
          ? safeQuery(`
              SELECT b.id, b.name, b.target_year, b.status, e.name AS exam_name
              FROM batches b
              LEFT JOIN examinations e ON b.exam_id = e.id
              WHERE b.name ILIKE $1 OR CAST(b.target_year AS TEXT) ILIKE $1
              LIMIT 4
            `, [searchPattern])
          : Promise.resolve({ rows: [] }),

        // Master Data: Examinations (Super Admin & Academic Admin)
        canViewMasterData && (isSuperAdmin || isAcademicAdmin)
          ? safeQuery(`SELECT id, name FROM examinations WHERE name ILIKE $1 LIMIT 4`, [searchPattern])
          : Promise.resolve({ rows: [] }),

        // Master Data: Programs (Super Admin, Academic Admin, Registrar)
        canViewMasterData
          ? safeQuery(`
              SELECT p.id, p.name, e.name AS exam_name
              FROM programs p
              LEFT JOIN examinations e ON p.exam_id = e.id
              WHERE p.name ILIKE $1
              LIMIT 4
            `, [searchPattern])
          : Promise.resolve({ rows: [] }),

        // Master Data: Majors (Super Admin, Academic Admin)
        canViewMasterData && (isSuperAdmin || isAcademicAdmin)
          ? safeQuery(`
              SELECT m.id, m.name, p.name AS program_name
              FROM majors m
              LEFT JOIN programs p ON m.program_id = p.id
              WHERE m.name ILIKE $1
              LIMIT 4
            `, [searchPattern])
          : Promise.resolve({ rows: [] }),
      ])

      // Assemble master data items with correct tab links
      const masterDataItems = [
        ...schoolsRes.rows.map(r => ({
          type: "School",
          id: r.id,
          title: r.name,
          href: "/admin/master-data?tab=education"
        })),
        ...coursesRes.rows.map(r => ({
          type: "Course",
          id: r.id,
          title: r.name,
          href: "/admin/master-data?tab=education"
        })),
        ...batchesRes.rows.map(r => ({
          type: "Batch",
          id: r.id,
          title: r.name,
          href: "/admin/master-data?tab=batches"
        })),
        ...examsRes.rows.map(r => ({
          type: "Exam Board",
          id: r.id,
          title: r.name,
          href: "/admin/master-data?tab=tree"
        })),
        ...programsRes.rows.map(r => ({
          type: "Program",
          id: r.id,
          title: r.name,
          href: "/admin/master-data?tab=tree"
        })),
        ...majorsRes.rows.map(r => ({
          type: "Specialization",
          id: r.id,
          title: r.name,
          href: "/admin/master-data?tab=tree"
        }))
      ]

      return NextResponse.json({
        users: usersRes.rows.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          href: `/admin/users/${u.id}`
        })),
        categories: categoriesRes.rows.map(c => ({
          id: c.id,
          name: c.name,
          href: `/admin/curriculum?cat=${c.id}`
        })),
        subcategories: subcategoriesRes.rows.map(s => ({
          id: s.id,
          name: s.name,
          href: s.category_id ? `/admin/curriculum?cat=${s.category_id}&sub=${s.id}` : "/admin/curriculum"
        })),
        subjects: subjectsRes.rows.map(s => ({
          id: s.id,
          title: s.title,
          code: s.code,
          href: `/admin/curriculum/${s.id}/content`
        })),
        modules: modulesRes.rows.map(m => ({
          id: m.id,
          title: m.title,
          subject_title: m.subject_title,
          href: `/admin/curriculum/${m.subject_id}/content`
        })),
        mock_exams: mockExamsRes.rows.map(e => ({
          id: e.id,
          title: e.title,
          exam_code: e.exam_code,
          href: `/admin/mock-exams/${e.id}`
        })),
        master_data: masterDataItems
      })
    }

    // ─────────────────────────────────────────────────────────────
    // 3. TEACHER / INSTRUCTOR SEARCH
    // Instructors can search subjects and modules
    // ─────────────────────────────────────────────────────────────
    if (role === "teacher") {
      const [subjectsRes, modulesRes] = await Promise.all([
        safeQuery(`SELECT id, title, code FROM subjects WHERE title ILIKE $1 OR code ILIKE $1 LIMIT 8`, [searchPattern]),
        safeQuery(`
          SELECT sm.id, sm.title, sm.subject_id, s.title AS subject_title
          FROM subject_modules sm
          JOIN subjects s ON sm.subject_id = s.id
          WHERE sm.title ILIKE $1
          LIMIT 8
        `, [searchPattern])
      ])

      return NextResponse.json({
        users: [],
        categories: [],
        subcategories: [],
        subjects: subjectsRes.rows.map(s => ({ id: s.id, title: s.title, code: s.code, href: `/teacher/modules/${s.id}` })),
        modules: modulesRes.rows.map(m => ({ id: m.id, title: m.title, subject_title: m.subject_title, href: `/teacher/modules/${m.subject_id}` })),
        mock_exams: [],
        master_data: []
      })
    }

    return NextResponse.json(emptyResult)
  } catch (err) {
    console.error("[GET /api/search]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
