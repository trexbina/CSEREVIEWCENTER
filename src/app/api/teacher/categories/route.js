import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

/** GET /api/teacher/categories — categories with subcategories for teachers based on their assigned examination */
export async function GET() {
    try {
        const session = await getSession()
        if (!session?.userId || (session.role !== "teacher" && session.role !== "admin")) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        // Fetch teacher's assigned examination, program, major, and targets
        const userRes = await pool.query(
            `SELECT u.id, u.exam_id, u.program_id, u.major_id, u.targets,
                    p.name as program_name, m.name as major_name,
                    e.name as exam_name
             FROM users u 
             LEFT JOIN programs p ON u.program_id = p.id 
             LEFT JOIN majors m ON u.major_id = m.id 
             LEFT JOIN examinations e ON u.exam_id = e.id
             WHERE u.id = $1`,
            [session.userId]
        ).catch(() => ({ rows: [] }))

        const userObj = userRes.rows[0] || {}
        const userExam = (userObj.exam_name || "").toLowerCase()
        const userProg = (userObj.program_name || "").toLowerCase()
        const userMajor = (userObj.major_name || "").toLowerCase()
        const userTargets = Array.isArray(userObj.targets) ? userObj.targets : []

        // Fetch master data for name resolution of target IDs (e.g. exam_1, prog_2, maj_3)
        const [examsRes, progsRes, majsRes] = await Promise.all([
            pool.query("SELECT id, name FROM examinations"),
            pool.query("SELECT id, name, exam_id FROM programs"),
            pool.query("SELECT id, name, program_id FROM majors"),
        ])

        // Map raw IDs to names and build hierarchy lookup
        const examMap = new Map(examsRes.rows.map(e => [e.id, e.name.trim().toLowerCase()]))
        const progMap = new Map(progsRes.rows.map(p => [p.id, { name: p.name.trim().toLowerCase(), exam_id: p.exam_id }]))
        const majMap = new Map(majsRes.rows.map(m => [m.id, { name: m.name.trim().toLowerCase(), program_id: m.program_id }]))

        // Collect all assigned target names and direct category IDs from userTargets
        const assignedExamNames = new Set()
        const assignedProgNames = new Set()
        const assignedMajNames = new Set()
        const assignedCategoryIds = new Set()

        if (userExam) assignedExamNames.add(userExam.trim().toLowerCase())
        if (userProg) assignedProgNames.add(userProg.trim().toLowerCase())
        if (userMajor) assignedMajNames.add(userMajor.trim().toLowerCase())

        userTargets.forEach(t => {
            const str = String(t)
            if (str.includes("_cat_")) {
                const parts = str.split("_cat_")
                const id = parseInt(parts[1])
                if (!isNaN(id)) assignedCategoryIds.add(id)
            } else if (str.startsWith("cat_")) {
                const id = parseInt(str.replace("cat_", ""))
                if (!isNaN(id)) assignedCategoryIds.add(id)
            } else if (str.startsWith("exam_")) {
                const id = parseInt(str.replace("exam_", ""))
                if (examMap.has(id)) assignedExamNames.add(examMap.get(id))
            } else if (str.startsWith("prog_")) {
                const id = parseInt(str.replace("prog_", ""))
                if (progMap.has(id)) {
                    const progInfo = progMap.get(id)
                    assignedProgNames.add(progInfo.name)
                    if (progInfo.exam_id && examMap.has(progInfo.exam_id)) {
                        assignedExamNames.add(examMap.get(progInfo.exam_id))
                    }
                }
            } else if (str.startsWith("maj_")) {
                const id = parseInt(str.replace("maj_", ""))
                if (majMap.has(id)) {
                    const majInfo = majMap.get(id)
                    assignedMajNames.add(majInfo.name)
                    if (majInfo.program_id && progMap.has(majInfo.program_id)) {
                        const progInfo = progMap.get(majInfo.program_id)
                        assignedProgNames.add(progInfo.name)
                        if (progInfo.exam_id && examMap.has(progInfo.exam_id)) {
                            assignedExamNames.add(examMap.get(progInfo.exam_id))
                        }
                    }
                }
            }
        })

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

        // Filter categories according to direct assignment, target_course (examination), target_program, and target_major
        const eligibleCategories = categories.filter((cat) => {
            // 1. If teacher has specifically selected categories in their targets, check direct ID match
            if (assignedCategoryIds.size > 0) {
                return assignedCategoryIds.has(cat.id)
            }

            // 2. Otherwise (e.g. legacy assignments), filter by course/exam, program, and major
            // Helper for multi-target check
            const matchesMultiTarget = (targetValue, allowedSet, singleVal) => {
                if (!targetValue || targetValue === "all") return true
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

                return targets.some(t => {
                    const tLower = t.toLowerCase()
                    if (allowedSet && allowedSet.size > 0) {
                        return Array.from(allowedSet).some(name => name.includes(tLower) || tLower.includes(name))
                    }
                    if (singleVal) {
                        const sLower = singleVal.toLowerCase()
                        return sLower.includes(tLower) || tLower.includes(sLower)
                    }
                    return false
                })
            }

            // Course / Exam check
            if (!matchesMultiTarget(cat.target_course, assignedExamNames, null)) return false

            // Program check
            if (!matchesMultiTarget(cat.target_program, assignedProgNames, userProg)) return false

            // Major check
            if (!matchesMultiTarget(cat.target_major, assignedMajNames, userMajor)) return false

            return true
        })

        const result = (eligibleCategories.length > 0 ? eligibleCategories : categories).map((cat) => ({
            ...cat,
            subcategories: grouped[cat.id] || [],
        }))

        return NextResponse.json({
            categories: result,
            teacherInfo: {
                examName: userObj.exam_name || "LEPT",
                programName: userObj.program_name,
                majorName: userObj.major_name,
            }
        })
    } catch (err) {
        console.error("[teacher/categories GET]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}
