import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"
import SubjectBuilderClient from "@/components/subject-builder-client"

export default async function StudentSubjectContentPage({ params }) {
    const session = await getSession()
    if (!session?.userId) redirect("/?login=1")

    const userResult = await pool.query(
        "SELECT name FROM users WHERE id = $1",
        [session.userId]
    )
    const currentUserName = userResult.rows[0]?.name || "Student"

    const { subjectId } = await params

    const { rows } = await pool.query(
        "SELECT * FROM subjects WHERE id = $1 AND status = 'active'",
        [subjectId]
    )

    if (rows.length === 0) redirect("/student/subjects")

    // Asynchronously log subject / curriculum open event
    pool.query(
        `INSERT INTO student_activities (student_id, activity_type, title, details, status, created_at)
         VALUES ($1, 'curriculum_view', $2, $3, 'info', NOW())`,
        [
            session.userId,
            `Opened Subject: ${rows[0].title || 'Curriculum Subject'}`,
            `Subject Code: ${rows[0].code || 'SUBJ'} (ID: ${rows[0].id})`
        ]
    ).catch(err => console.error("Error logging curriculum_view activity:", err))

    return <SubjectBuilderClient subject={rows[0]} isStudent={true} currentUserName={currentUserName} />
}
