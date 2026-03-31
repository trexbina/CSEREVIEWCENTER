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
        const { subjectId, lessonId } = params

        const { rows } = await pool.query(
            "SELECT * FROM subject_contents WHERE id = $1",
            [lessonId]
        )

        if (rows.length === 0) {
            return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
        }

        return NextResponse.json({ lesson: rows[0] })
    } catch (err) {
        console.error("[student/lesson GET]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
