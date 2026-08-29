import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

export async function GET(request, props) {
    try {
        const session = await getSession()
        if (!session?.userId || (session.role !== "teacher" && session.role !== "admin")) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        const params = await props.params
        const { subjectId } = params

        // Basic verification that the subject is active and exists
        const check = await pool.query(
            "SELECT id FROM subjects WHERE id = $1 AND status = 'active'",
            [subjectId]
        )
        if (check.rows.length === 0) {
            return NextResponse.json({ error: "Forbidden: Subject is not active or does not exist" }, { status: 403 })
        }

        // Fetch modules
        const modulesResult = await pool.query(
            "SELECT id, title, order_index, created_at FROM subject_modules WHERE subject_id = $1 ORDER BY order_index ASC, created_at ASC",
            [subjectId]
        )

        const modules = modulesResult.rows

        // Fetch lessons (excluding quiz type)
        let contents = []
        if (modules.length > 0) {
            const moduleIds = modules.map(m => m.id)
            const contentsResult = await pool.query(
                `SELECT
                    id,
                    module_id,
                    title,
                    COALESCE(
                        NULLIF(LOWER(lesson_type), ''),
                        CASE
                            WHEN jsonb_typeof(pdf_files) = 'array' AND jsonb_array_length(pdf_files) > 0 THEN 'pdf'
                            ELSE 'module'
                        END
                    ) AS lesson_type,
                    CASE
                        WHEN jsonb_typeof(pdf_files) = 'array' AND jsonb_array_length(pdf_files) > 0 THEN true
                        ELSE false
                    END AS has_pdf,
                    order_index,
                    created_at
                 FROM subject_contents
                 WHERE module_id = ANY($1)
                   AND LOWER(COALESCE(lesson_type, '')) != 'quiz'
                   AND LOWER(COALESCE(lesson_type, '')) != 'exam'
                 ORDER BY order_index ASC, created_at ASC`,
                [moduleIds]
            )
            contents = contentsResult.rows
        }

        // Fetch subject details for back navigation
        const subjectResult = await pool.query(
            `SELECT s.id, s.title, s.code, s.subcategory_id,
                    COALESCE(sub.category_id, cat.id) as category_id
             FROM subjects s
             LEFT JOIN subcategories sub ON s.subcategory_id = sub.id
             LEFT JOIN categories cat ON (
                 s.category IS NOT NULL AND (
                     s.category = cat.id::text OR LOWER(s.category) = LOWER(cat.name)
                 )
             )
             WHERE s.id = $1`,
            [subjectId]
        )
        const subject = subjectResult.rows[0] || null

        const structuredModules = modules.map(mod => ({
            ...mod,
            lessons: contents.filter(c => c.module_id === mod.id)
        }))

        return NextResponse.json({ modules: structuredModules, subject })
    } catch (err) {
        console.error("[teacher/subjects/modules GET]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
