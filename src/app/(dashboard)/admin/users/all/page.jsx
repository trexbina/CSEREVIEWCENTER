// auth session helper
import { getSession } from "@/lib/auth-session"
// database connection
import pool from "@/lib/db"
// next link for navigation
import Link from "next/link"
// icons from lucide
import { Users, ArrowLeft } from "lucide-react"
// user table component
import { UserTable } from "../user-management"

// force dynamic rendering for all users page
export const dynamic = "force-dynamic"
export const revalidate = 0

// fetch all users from database
async function getAllUsers() {
    const result = await pool.query(
        `SELECT 
            u.id, u.name, u.email, u.role, u.created_at, u.avatar_url,
            u.first_name, u.middle_name, u.last_name, u.suffix,
            u.birthday, u.gender, u.phone, u.address, u.city, u.province, u.zip_code,
            u.school, u.course, u.year_graduated, u.highest_education,
            u.exam_id, u.batch_id, u.program_id, u.major_id, u.job_role_description,
            u.school_id, u.academic_course_id,
            COALESCE(c.name, u.course, '—') AS academic_course_name,
            COALESCE(p.name, '—') AS program_name,
            COALESCE(m.name, '—') AS major_name,
            COALESCE(s.name, u.school, '—') AS school_name
         FROM users u
         LEFT JOIN academic_courses c ON u.academic_course_id = c.id
         LEFT JOIN programs p ON u.program_id = p.id
         LEFT JOIN majors m ON u.major_id = m.id
         LEFT JOIN schools s ON u.school_id = s.id
         ORDER BY u.created_at DESC`
    )
    return result.rows
}

// render the all users page
export default async function AllUsersPage() {
    // get current user session
    const session = await getSession()
    // get users if logged in
    const users = session?.userId ? await getAllUsers() : []

    // aggregate user counts by role
    const counts = users.reduce(
        (acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc },
        {}
    )

    return (
        <div className="space-y-6 w-full max-w-6xl mx-auto px-4 py-4 pb-16">
            {/* header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/admin/users"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground shadow-2xs"
                            title="Back to User Management"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <h1 className="text-2xl font-bold tracking-wider text-foreground uppercase">
                            ALL USERS
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">
                        Complete user directory — sort by any column, edit, delete, or assign subjects.
                    </p>
                </div>
            </div>

            {/* user role summary cards */}
            <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 bg-card border border-border rounded-xl px-3.5 py-1.5 shadow-2xs">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total:</span>
                    <span className="text-xs font-bold text-foreground">{users.length}</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-card border border-border rounded-xl px-3.5 py-1.5 shadow-2xs">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Students:</span>
                    <span className="text-xs font-bold text-[#E9C46A]">{counts.student || 0}</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-card border border-border rounded-xl px-3.5 py-1.5 shadow-2xs">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Teachers:</span>
                    <span className="text-xs font-bold text-[#4382DF]">{counts.teacher || 0}</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-card border border-border rounded-xl px-3.5 py-1.5 shadow-2xs">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admins:</span>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{counts.admin || 0}</span>
                </div>
            </div>

            {/* Full sortable table */}
            <div className="pt-2">
                <UserTable users={users} currentUserId={session?.userId} />
            </div>
        </div>
    )
}
