import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

async function adminGuard() {
    const session = await getSession()
    if (session?.role !== "admin") return null
    return session
}

// ── GET /api/admin/mock-exams/[examId] ────────────────────────────────────────
export async function GET(request, { params }) {
    try {
        const session = await adminGuard()
        if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 })

        const { examId } = await params
        const { rows } = await pool.query(
            "SELECT * FROM mock_exams WHERE id = $1",
            [examId]
        )

        if (rows.length === 0) {
            return NextResponse.json({ error: "Mock exam not found." }, { status: 404 })
        }

        return NextResponse.json({ exam: rows[0] })
    } catch (err) {
        console.error("[admin/mock-exams/id GET]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── PUT /api/admin/mock-exams/[examId] ────────────────────────────────────────
export async function PUT(request, { params }) {
    try {
        const session = await adminGuard()
        if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 })

        const { examId } = await params
        const body = await request.json()

        // If the body contains "questions", it's a save action from the builder!
        if (body.questions !== undefined) {
            const { rows } = await pool.query(
                `UPDATE mock_exams 
                 SET questions = $1, 
                     title = COALESCE($2, title),
                     updated_at = NOW() 
                 WHERE id = $3 
                 RETURNING *`,
                [JSON.stringify(body.questions), body.title || null, examId]
            )
            if (rows.length === 0) {
                return NextResponse.json({ error: "Mock exam not found." }, { status: 404 })
            }
            return NextResponse.json({ exam: rows[0] })
        }

        // Otherwise, it's updating metadata (title, description, status, targets, unlockDate, settings)
        const { title, description, examCode, targetCourses, unlockDate, startDate, startTime, timeLimitMinutes, maxRetries, status } = body

        if (!title?.trim() || !examCode?.trim()) {
            return NextResponse.json({ error: "Title and Exam Code are required." }, { status: 400 })
        }

        // check duplicate code (excluding current ID)
        const dup = await pool.query(
            "SELECT id FROM mock_exams WHERE exam_code = $1 AND id != $2",
            [examCode.trim().toUpperCase(), examId]
        )
        if (dup.rows.length > 0) {
            return NextResponse.json({ error: "Another exam with this code already exists." }, { status: 409 })
        }

        let computedUnlockDate = null
        if (startDate) {
            computedUnlockDate = startTime 
                ? new Date(`${startDate}T${startTime}:00`).toISOString()
                : new Date(`${startDate}T00:00:00`).toISOString()
        } else if (unlockDate) {
            computedUnlockDate = new Date(unlockDate).toISOString()
        }

        // Retrieve existing questions to preserve questions array while updating settings
        const existingRes = await pool.query("SELECT questions FROM mock_exams WHERE id = $1", [examId])
        let currentQuestionsData = existingRes.rows[0]?.questions
        let questionsList = []
        let existingSettings = {}

        if (typeof currentQuestionsData === 'string') {
            try { currentQuestionsData = JSON.parse(currentQuestionsData) } catch (e) {}
        }
        if (Array.isArray(currentQuestionsData)) {
            questionsList = currentQuestionsData
        } else if (currentQuestionsData?.questions && Array.isArray(currentQuestionsData.questions)) {
            questionsList = currentQuestionsData.questions
            existingSettings = currentQuestionsData.settings || {}
        }

        const updatedQuestionsJson = {
            settings: {
                ...existingSettings,
                startDate: startDate !== undefined ? (startDate || null) : (existingSettings.startDate || null),
                startTime: startTime !== undefined ? (startTime || null) : (existingSettings.startTime || null),
                timeLimitMinutes: timeLimitMinutes !== undefined ? Math.max(0, Number(timeLimitMinutes) || 0) : (existingSettings.timeLimitMinutes || 0),
                maxRetries: maxRetries !== undefined ? Math.max(0, Number(maxRetries) || 0) : (existingSettings.maxRetries || 0)
            },
            questions: questionsList
        }

        const { rows } = await pool.query(
            `UPDATE mock_exams
             SET title = $1, 
                 description = $2, 
                 exam_code = $3, 
                 targets = $4, 
                 unlock_date = $5, 
                 status = $6, 
                 questions = $7,
                 updated_at = NOW()
             WHERE id = $8
             RETURNING *`,
            [
                title.trim(),
                description?.trim() || null,
                examCode.trim().toUpperCase(),
                JSON.stringify(targetCourses || []),
                computedUnlockDate,
                status === "Active" ? "active" : "locked",
                JSON.stringify(updatedQuestionsJson),
                examId
            ]
        )

        if (rows.length === 0) {
            return NextResponse.json({ error: "Mock exam not found." }, { status: 404 })
        }

        return NextResponse.json({ exam: rows[0] })
    } catch (err) {
        console.error("[admin/mock-exams/id PUT]", err)
        return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 })
    }
}

// ── DELETE /api/admin/mock-exams/[examId] ─────────────────────────────────────
export async function DELETE(request, { params }) {
    try {
        const session = await adminGuard()
        if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 })

        const { examId } = await params
        const { rowCount } = await pool.query(
            "DELETE FROM mock_exams WHERE id = $1",
            [examId]
        )

        if (rowCount === 0) {
            return NextResponse.json({ error: "Mock exam not found." }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("[admin/mock-exams/id DELETE]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}
