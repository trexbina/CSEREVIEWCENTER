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

        // Filter categories according to target_course, target_program, and target_major
        const eligibleCategories = categories.filter((cat) => {
            const cTarget = (cat.target_course || "all").toLowerCase()
            const pTarget = (cat.target_program || "all").toLowerCase()
            const mTarget = (cat.target_major || "all").toLowerCase()

            if (cTarget !== "all" && userExam) {
                if (!userExam.includes(cTarget) && !cTarget.includes(userExam)) return false
            }

            if (pTarget !== "all" && userProg) {
                if (!userProg.includes(pTarget) && !pTarget.includes(userProg)) return false
            }

            if (mTarget !== "all" && userMajor) {
                if (!userMajor.includes(mTarget) && !mTarget.includes(userMajor)) return false
            }

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
