import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES } from "@/lib/auth"

// ── helpers ──────────────────────────────────────────────
async function ensureTable() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS student_subjects (
      id          SERIAL PRIMARY KEY,
      student_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id  INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(student_id, subject_id)
    );
    CREATE INDEX IF NOT EXISTS idx_student_subjects_student
      ON student_subjects (student_id);
    CREATE INDEX IF NOT EXISTS idx_student_subjects_subject
      ON student_subjects (subject_id);
  `)
}

async function adminGuard() {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) return null
    return session
}

// ── GET /api/admin/student-subjects?studentId=… ─────────
// Returns subjects assigned to a student, plus all available subjects
export async function GET(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }
        await ensureTable()

        const { searchParams } = new URL(request.url)
        const studentId = searchParams.get("studentId")

        if (!studentId) {
            return NextResponse.json({ error: "studentId is required." }, { status: 400 })
        }

        const [assignedRes, allSubjectsRes] = await Promise.all([
            pool.query(
                `SELECT ss.id AS assignment_id, ss.assigned_at,
                        s.id, s.title, s.code, s.category, s.status
                 FROM student_subjects ss
                 JOIN subjects s ON s.id = ss.subject_id
                 WHERE ss.student_id = $1
                 ORDER BY s.title ASC`,
                [studentId]
            ),
            pool.query(
                "SELECT id, title, code, category, status FROM subjects WHERE status = 'active' ORDER BY title ASC"
            ),
        ])

        return NextResponse.json({
            assigned: assignedRes.rows,
            subjects: allSubjectsRes.rows,
        })
    } catch (err) {
        console.error("[admin/student-subjects GET]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── POST /api/admin/student-subjects ────────────────────
// Assign a subject to a student
export async function POST(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }
        await ensureTable()

        const { student_id, subject_id } = await request.json()

        if (!student_id || !subject_id) {
            return NextResponse.json(
                { error: "student_id and subject_id are required." },
                { status: 400 }
            )
        }

        // verify user is a student
        const userRes = await pool.query(
            "SELECT role FROM users WHERE id = $1",
            [student_id]
        )
        if (userRes.rows.length === 0) {
            return NextResponse.json({ error: "Student not found." }, { status: 404 })
        }
        if (userRes.rows[0].role !== "student") {
            return NextResponse.json(
                { error: "Subjects can only be assigned to students." },
                { status: 400 }
            )
        }

        const { rows } = await pool.query(
            `INSERT INTO student_subjects (student_id, subject_id)
             VALUES ($1, $2)
             ON CONFLICT (student_id, subject_id) DO NOTHING
             RETURNING *`,
            [student_id, subject_id]
        )

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Subject already assigned to this student." },
                { status: 409 }
            )
        }

        return NextResponse.json({ assignment: rows[0] }, { status: 201 })
    } catch (err) {
        console.error("[admin/student-subjects POST]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── DELETE /api/admin/student-subjects?studentId=…&subjectId=… ──
// Remove a subject assignment from a student
export async function DELETE(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }
        await ensureTable()

        const { searchParams } = new URL(request.url)
        const studentId = searchParams.get("studentId")
        const subjectId = searchParams.get("subjectId")

        if (!studentId || !subjectId) {
            return NextResponse.json(
                { error: "studentId and subjectId are required." },
                { status: 400 }
            )
        }

        const { rowCount } = await pool.query(
            "DELETE FROM student_subjects WHERE student_id = $1 AND subject_id = $2",
            [studentId, subjectId]
        )

        if (rowCount === 0) {
            return NextResponse.json({ error: "Assignment not found." }, { status: 404 })
        }

        return NextResponse.json({ message: "Subject removed from student." })
    } catch (err) {
        console.error("[admin/student-subjects DELETE]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}
