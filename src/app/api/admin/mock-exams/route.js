import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

async function adminGuard() {
    const session = await getSession()
    if (session?.role !== "admin") return null
    return session
}

// ── GET /api/admin/mock-exams ─────────────────────────────────────────────────
export async function GET() {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        const { rows } = await pool.query(
            "SELECT * FROM mock_exams ORDER BY created_at DESC"
        )

        return NextResponse.json({ exams: rows })
    } catch (err) {
        console.error("[admin/mock-exams GET]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── POST /api/admin/mock-exams ────────────────────────────────────────────────
export async function POST(request) {
    try {
        const session = await adminGuard()
        if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 })

        const body = await request.json()
        const { title, description, examCode, targetCourses, unlockDate, status } = body

        if (!title?.trim() || !examCode?.trim()) {
            return NextResponse.json({ error: "Title and Exam Code are required." }, { status: 400 })
        }

        // check duplicate code
        const dup = await pool.query(
            "SELECT id FROM mock_exams WHERE exam_code = $1",
            [examCode.trim().toUpperCase()]
        )
        if (dup.rows.length > 0) {
            return NextResponse.json({ error: "An exam with this code already exists." }, { status: 409 })
        }

        const { rows } = await pool.query(
            `INSERT INTO mock_exams (exam_code, title, description, targets, unlock_date, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                examCode.trim().toUpperCase(),
                title.trim(),
                description?.trim() || null,
                JSON.stringify(targetCourses || []),
                unlockDate ? new Date(unlockDate).toISOString() : null,
                status === "Active" ? "active" : "locked",
                session.userId
            ]
        )

        return NextResponse.json({ exam: rows[0] }, { status: 201 })
    } catch (err) {
        console.error("[admin/mock-exams POST]", err)
        return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 })
    }
}
