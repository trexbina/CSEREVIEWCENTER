// database connection helper
import pool from "@/lib/db"

// helper to check if admin is logged in
import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES } from "@/lib/auth"

// helper to send user to another page
import { redirect } from "next/navigation"

// the main curriculum editor component
import SubjectBuilderClient from "@/components/subject-builder-client"

// this loads the subject information on the server before showing the page
export default async function SubjectContentPage({ params }) {
    // check if user is logged in as admin
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) redirect("/?login=1")

    // find the admin username from the database
    const userResult = await pool.query(
        "SELECT name FROM users WHERE id = $1",
        [session.userId]
    )
    const currentUserName = userResult.rows[0]?.name || "Admin"

    // get the subject id from the url
    const { subjectId } = await params

    // fetch the subject from the database
    const { rows } = await pool.query(
        "SELECT * FROM subjects WHERE id = $1",
        [subjectId]
    )

    // if subject does not exist go back to curriculum list
    if (rows.length === 0) redirect("/admin/curriculum")

    // show the subject builder screen
    return <SubjectBuilderClient subject={rows[0]} currentUserName={currentUserName} />
}
