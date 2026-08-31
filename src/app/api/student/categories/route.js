import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

/** GET /api/student/categories — categories with subcategories for students */
export async function GET() {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        // Fetch user profile course (exam), program, and major info
        const userRes = await pool.query(
            `SELECT u.id, u.program_id, u.major_id, u.batch_id,
                    p.name as program_name, m.name as major_name,
                    e.name as exam_name
             FROM users u 
             LEFT JOIN programs p ON u.program_id = p.id 
             LEFT JOIN majors m ON u.major_id = m.id 
             LEFT JOIN batches b ON u.batch_id = b.id
             LEFT JOIN examinations e ON b.exam_id = e.id
             WHERE u.id = $1`,
            [session.userId]
        ).catch(() => ({ rows: [] }))

        const userObj = userRes.rows[0] || {}
        const userExam = (userObj.exam_name || "").toLowerCase()
        const userProg = (userObj.program_name || "").toLowerCase()
        const userMajor = (userObj.major_name || "").toLowerCase()

        const { rows: categories } = await pool.query(
            "SELECT * FROM categories ORDER BY created_at ASC"
        )

        const { rows: subcategories } = await pool.query(
            "SELECT * FROM subcategories WHERE status = 'active' ORDER BY created_at DESC, id DESC"
        )

        // Group subcategories by category_id
        const grouped = {}
        for (const sub of subcategories) {
            if (!grouped[sub.category_id]) grouped[sub.category_id] = []
            grouped[sub.category_id].push(sub)
        }

        // Helper to check multi-target match (handles 'all', comma-separated, or JSON arrays)
        const isMatch = (targetValue, userValue) => {
            if (!targetValue || targetValue === "all" || !userValue) return true
            let targets = []
            try {
                if (targetValue.startsWith("[") && targetValue.endsWith("]")) {
                    targets = JSON.parse(targetValue)
                } else {
                    targets = targetValue.split(",").map(t => t.trim())
                }
            } catch (e) {
                targets = [targetValue.trim()]
            }
            if (targets.includes("all") || targets.length === 0) return true
            const uLower = userValue.toLowerCase()
            return targets.some(t => {
                const tLower = t.toLowerCase()
                return uLower.includes(tLower) || tLower.includes(uLower)
            })
        }

        // Filter categories according to target_course, target_program, and target_major
        const eligibleCategories = categories.filter((cat) => {
            if (!isMatch(cat.target_course, userExam)) return false
            if (!isMatch(cat.target_program, userProg)) return false
            if (!isMatch(cat.target_major, userMajor)) return false
            return true
        })

        const result = (eligibleCategories.length > 0 ? eligibleCategories : categories).map((cat) => ({
            ...cat,
            subcategories: grouped[cat.id] || [],
        }))

        return NextResponse.json({ categories: result })
    } catch (err) {
        console.error("[student/categories GET]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}
