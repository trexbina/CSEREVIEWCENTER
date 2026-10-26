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
export default async function UserManagementPage({ searchParams }) {
    const session = await getSession()
    const users = session?.userId ? await getAllUsers() : []
    const pendingCount = session?.userId ? await getPendingPreRegistrationsCount() : 0
    const resolvedParams = await searchParams
    const initialTab = resolvedParams?.tab || "users"

    return (
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-1 pb-12">
            {/* Interactive Tabs: User Directory vs Pre-Registrations vs Subscriptions */}
            <UserManagementTabs
                users={users}
                currentUserId={session?.userId}
                pendingCount={pendingCount}
                initialTab={initialTab}
            />
        </div>
    )
}
