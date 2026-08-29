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
        const { title, description, examCode, targetCourses, unlockDate, startDate, startTime, timeLimitMinutes, maxRetries, status } = body

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

        let computedUnlockDate = null
        if (startDate) {
            computedUnlockDate = startTime 
                ? new Date(`${startDate}T${startTime}:00`).toISOString()
                : new Date(`${startDate}T00:00:00`).toISOString()
        } else if (unlockDate) {
            computedUnlockDate = new Date(unlockDate).toISOString()
        }

        const initialQuestionsJson = {
            settings: {
                startDate: startDate || null,
                startTime: startTime || null,
                timeLimitMinutes: Math.max(0, Number(timeLimitMinutes) || 0),
                maxRetries: Math.max(0, Number(maxRetries) || 0)
            },
            questions: []
        }

        const { rows } = await pool.query(
            `INSERT INTO mock_exams (exam_code, title, description, targets, unlock_date, status, questions, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                examCode.trim().toUpperCase(),
                title.trim(),
                description?.trim() || null,
                JSON.stringify(targetCourses || []),
                computedUnlockDate,
                status === "Active" ? "active" : "locked",
                JSON.stringify(initialQuestionsJson),
                session.userId
            ]
        )

        const createdExam = rows[0]

        // Dispatch notification to students
        try {
          await pool.query(
            `INSERT INTO notifications (student_id, type, title, message, link, is_read, created_at)
             VALUES (NULL, 'mock_exam', 'New Mock Exam Posted', $1, $2, FALSE, NOW())`,
            [
              `New Mock Exam available: "${title.trim()}". Test your knowledge now!`,
              `/student/mock-exams?examId=${createdExam.id}`
            ]
          )
        } catch (notifErr) {
          console.error("Failed to insert mock exam notification:", notifErr)
        }

        return NextResponse.json({ exam: createdExam }, { status: 201 })
    } catch (err) {
        console.error("[admin/mock-exams POST]", err)
        return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 })
    }
}
