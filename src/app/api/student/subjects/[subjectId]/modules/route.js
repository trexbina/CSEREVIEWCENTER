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
                    COALESCE(
                        NULLIF(LOWER(lesson_type), ''),
                        CASE
                            WHEN jsonb_typeof(pdf_files) = 'array' AND jsonb_array_length(pdf_files) > 0 THEN 'pdf'
                            ELSE 'module'
                        END
                    ) AS lesson_type,
                    order_index,
                    created_at
                 FROM subject_contents
                 WHERE module_id = ANY($1)
                 ORDER BY order_index ASC, created_at ASC`,
                [moduleIds]
            )
            contents = contentsResult.rows
        }

        const structuredModules = modules.map(mod => ({
            ...mod,
            lessons: contents.filter(c => c.module_id === mod.id)
        }))

        return NextResponse.json({ modules: structuredModules })
    } catch (err) {
        console.error("[student/subjects/modules GET]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
