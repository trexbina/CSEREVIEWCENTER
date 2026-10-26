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
            u.school_id, u.academic_course_id, u.is_active, u.subscription_end_date,
            COALESCE(c.name, u.course, '—') AS academic_course_name,
            COALESCE(p.name, '—') AS program_name,
            COALESCE(m.name, '—') AS major_name,
            COALESCE(s.name, u.school, '—') AS school_name,
            b.name AS batch_name,
            b.end_date AS batch_end_date,
            b.start_date AS batch_start_date,
            e.name AS exam_name,
            COALESCE(cr.name, u.role) AS role_name
         FROM users u
         LEFT JOIN academic_courses c ON u.academic_course_id = c.id
         LEFT JOIN programs p ON u.program_id = p.id
         LEFT JOIN majors m ON u.major_id = m.id
         LEFT JOIN schools s ON u.school_id = s.id
         LEFT JOIN batches b ON u.batch_id = b.id
         LEFT JOIN examinations e ON u.exam_id = e.id
         LEFT JOIN custom_roles cr ON cr.role_key = u.role
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

    return (
        <div className="space-y-4 w-full max-w-7xl mx-auto px-2 sm:px-4 py-2 pb-16">
            {/* Header */}
            <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/users"
                        className="flex items-center justify-center size-9 rounded-xl bg-white dark:bg-white/10 text-[#696969] hover:text-[#3B3B3B] dark:hover:text-white border border-black/5 dark:border-white/10 shadow-2xs transition-all cursor-pointer"
                        title="Back to User Management"
                    >
                        <ArrowLeft className="size-4" />
                    </Link>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl font-bold tracking-wide text-[#3B3B3B] dark:text-white">
                            All Users
                        </h1>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#696969] dark:text-gray-300">
                            Total Users: {users.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Full sortable table */}
            <UserTable users={users} currentUserId={session?.userId} />
        </div>
    )
}
