import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

export async function GET(request, props) {
    try {
        const session = await getSession()
        if (!session?.userId || session.role !== "student") {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        const params = await props.params
        const { subjectId } = params

        // Basic verification that the subject is active and assigned (optional deep check)
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

        // Fetch lessons
        let contents = []
        if (modules.length > 0) {
            const moduleIds = modules.map(m => m.id)
            const contentsResult = await pool.query(
                `SELECT
                    id,
                    module_id,
                    title,
                    pdf_files,
                    quiz_content,
                    COALESCE(
                        NULLIF(LOWER(lesson_type), ''),
                        CASE
                            WHEN pdf_files IS NOT NULL AND pdf_files::text NOT IN ('[]', 'null', '') THEN 'pdf'
                            ELSE 'module'
                        END
                    ) AS lesson_type,
                    CASE
                        WHEN pdf_files IS NOT NULL AND pdf_files::text NOT IN ('[]', 'null', '') THEN true
                        ELSE false
                    END AS has_pdf,
                    order_index,
                    created_at
                 FROM subject_contents
                 WHERE module_id = ANY($1)
                 ORDER BY order_index ASC, created_at ASC`,
                [moduleIds]
            )
            contents = contentsResult.rows.map((row) => {
                let safeQuizContent = row.quiz_content
                if (String(row.lesson_type).toLowerCase() === "quiz" && row.quiz_content) {
                    try {
                        const parsed = typeof row.quiz_content === "string" ? JSON.parse(row.quiz_content) : row.quiz_content
                        safeQuizContent = JSON.stringify({
                            settings: {
                                referencePdfs: parsed?.settings?.referencePdfs || (parsed?.settings?.referencePdf?.url ? [parsed.settings.referencePdf] : []),
                                referencePdf: parsed?.settings?.referencePdf || null,
                            }
                        })
                    } catch {
                        safeQuizContent = null
                    }
                }
                return {
                    ...row,
                    quiz_content: safeQuizContent,
                }
            })
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
        console.error("[student/subjects/modules GET]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
