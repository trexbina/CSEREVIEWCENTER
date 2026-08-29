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
        const { subjectId, lessonId } = params

        const { rows } = await pool.query(
            `SELECT
                sc.*,
                COALESCE(
                    NULLIF(LOWER(sc.lesson_type), ''),
                    CASE
                        WHEN jsonb_typeof(sc.pdf_files) = 'array' AND jsonb_array_length(sc.pdf_files) > 0 THEN 'pdf'
                        ELSE 'module'
                    END
                ) AS normalized_lesson_type,
                CASE
                    WHEN jsonb_typeof(sc.pdf_files) = 'array' AND jsonb_array_length(sc.pdf_files) > 0 THEN true
                    ELSE false
                END AS has_pdf
             FROM subject_contents sc
             JOIN subject_modules sm ON sm.id = sc.module_id
             WHERE sc.id = $1 
               AND sm.subject_id = $2
               AND LOWER(COALESCE(sc.lesson_type, '')) != 'quiz'
               AND LOWER(COALESCE(sc.lesson_type, '')) != 'exam'`,
            [lessonId, subjectId]
        )

        if (rows.length === 0) {
            return NextResponse.json({ error: "Lesson not found or inaccessible" }, { status: 404 })
        }

        const lesson = {
            ...rows[0],
            lesson_type: rows[0].normalized_lesson_type || rows[0].lesson_type || "module",
        }

        return NextResponse.json({ lesson })
    } catch (err) {
        console.error("[teacher/lesson GET]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
