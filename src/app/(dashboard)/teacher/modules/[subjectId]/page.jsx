import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"
import SubjectBuilderClient from "@/components/subject-builder-client"

export default async function TeacherSubjectContentPage({ params }) {
    const session = await getSession()
    if (!session || (session.role !== "teacher" && session.role !== "admin")) {
        redirect("/login")
    }

    const userResult = await pool.query(
        "SELECT name FROM users WHERE id = $1",
        [session.userId]
    )
    const currentUserName = userResult.rows[0]?.name || "Instructor"

    const { subjectId } = await params

    const { rows } = await pool.query(
        "SELECT * FROM subjects WHERE id = $1 AND status = 'active'",
        [subjectId]
    )

    if (rows.length === 0) redirect("/teacher/modules")

    return (
        <SubjectBuilderClient 
            subject={rows[0]} 
            isStudent={true} 
            currentUserName={currentUserName} 
        />
    )
}
