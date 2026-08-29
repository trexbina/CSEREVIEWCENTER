// helper to check if admin is logged in
import { getSession } from "@/lib/auth-session"

// database connection helper
import pool from "@/lib/db"

// helper for page navigation links
import Link from "next/link"

// icons for header and buttons
import { Users, Plus } from "lucide-react"

// the interactive quick search user table and pre-registrations component
import { UserManagementTabs } from "./user-management-tabs"

// tell nextjs to fetch fresh user data on every visit
export const dynamic = "force-dynamic"
export const revalidate = 0

// queries the database for all registered users with their school and course names
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

// queries pending pre-registration count
async function getPendingPreRegistrationsCount() {
    try {
        const result = await pool.query(
            "SELECT COUNT(*) AS count FROM pre_registrations WHERE status = 'PENDING'"
        )
        return parseInt(result.rows[0]?.count || "0", 10)
    } catch {
        return 0
    }
}

// main user management page component
export default async function UserManagementPage() {
    const session = await getSession()
    const users = session?.userId ? await getAllUsers() : []
    const pendingCount = session?.userId ? await getPendingPreRegistrationsCount() : 0

    return (
        <div className="space-y-6 w-full max-w-6xl mx-auto px-4 py-4 pb-16">
            {/* page header with title and add user button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
                <div>
                    <h1 className="text-2xl font-bold tracking-wider text-foreground uppercase">
                        USER MANAGEMENT
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium">
                        Manage registered accounts and review student pre-registrations.
                    </p>
                </div>
                <Link
                    href="/admin/users/add"
                    className="flex items-center justify-center bg-[#E9C46A] text-white font-bold text-xs tracking-wide uppercase px-5 py-2.5 rounded-lg shadow-sm hover:bg-[#dfb550] hover:-translate-y-0.5 transition-all shrink-0 self-start sm:self-auto cursor-pointer"
                >
                    ADD USER
                </Link>
            </div>

            {/* Interactive Tabs: User Directory vs Pre-Registrations */}
            <UserManagementTabs
                users={users}
                currentUserId={session?.userId}
                pendingCount={pendingCount}
            />
        </div>
    )
}
