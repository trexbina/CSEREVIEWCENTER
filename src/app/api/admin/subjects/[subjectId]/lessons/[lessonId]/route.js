import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES } from "@/lib/auth"

async function adminGuard() {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) return null
    return session
}

export async function GET(request, props) {
    try {
        const session = await adminGuard()
        if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const params = await props.params
        const { lessonId } = params

        const result = await pool.query("SELECT * FROM subject_contents WHERE id = $1", [lessonId])
        if (result.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

        return NextResponse.json({ lesson: result.rows[0] })
    } catch (err) {
        console.error("[admin/subjects/lessons GET]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PUT(request, props) {
    try {
        const session = await adminGuard()
        if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const params = await props.params
        const { lessonId } = params
        const body = await request.json()

        const { pdf_files, quiz_content } = body

        // Dynamically build SET clause to only update what is provided
        let query = "UPDATE subject_contents SET updated_at = NOW()"
        const values = [lessonId]
        let index = 2

        if (pdf_files !== undefined) {
            query += `, pdf_files = $${index}`
            values.push(JSON.stringify(pdf_files))
            index++
        }
        
        if (quiz_content !== undefined) {
            query += `, quiz_content = $${index}`
            values.push(quiz_content)
            index++
        }

        query += ` WHERE id = $1 RETURNING *`

        const result = await pool.query(query, values)
        if (result.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

        return NextResponse.json({ success: true, lesson: result.rows[0] })
    } catch (err) {
        console.error("[admin/subjects/lessons PUT]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
