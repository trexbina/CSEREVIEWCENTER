import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

/** GET /api/student/subjects — subjects assigned to the logged-in student */
export async function GET() {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        const { rows } = await pool.query(
            `SELECT id, title, code, description, category, subcategory_id, status,
              topics, image_url, unlock_date, created_at, NOW() as assigned_at
       FROM subjects
       WHERE status = 'active' AND (unlock_date IS NULL OR unlock_date <= NOW())
       ORDER BY created_at DESC, id DESC`
        )

        return NextResponse.json({ subjects: rows })
    } catch (err) {
        console.error("[student/subjects GET]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}
