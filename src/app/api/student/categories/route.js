import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

/** GET /api/student/categories — all categories with their subcategories */
export async function GET() {
    try {
        const session = await getSession()
        if (!session?.userId || session.role !== "student") {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        const { rows: categories } = await pool.query(
            "SELECT * FROM categories ORDER BY created_at ASC"
        )

        const { rows: subcategories } = await pool.query(
            "SELECT * FROM subcategories ORDER BY created_at ASC"
        )

        // Group subcategories by category_id
        const grouped = {}
        for (const sub of subcategories) {
            if (!grouped[sub.category_id]) grouped[sub.category_id] = []
            grouped[sub.category_id].push(sub)
        }

        const result = categories.map((cat) => ({
            ...cat,
            subcategories: grouped[cat.id] || [],
        }))

        return NextResponse.json({ categories: result })
    } catch (err) {
        console.error("[student/categories GET]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}
