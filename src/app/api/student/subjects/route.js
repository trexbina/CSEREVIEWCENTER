import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

/** GET /api/student/subjects — subjects assigned to the logged-in student */
export async function GET() {
    try {
        const session = await getSession()
        if (!session?.userId || session.role !== "student") {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        const { rows } = await pool.query(
            `SELECT id, title, code, description, category, subcategory_id, status,
              topics, image_url, unlock_date, NOW() as assigned_at
       FROM subjects
       WHERE status = 'active'
       ORDER BY title ASC`
        )

        return NextResponse.json({ subjects: rows })
    } catch (err) {
        console.error("[student/subjects GET]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}
