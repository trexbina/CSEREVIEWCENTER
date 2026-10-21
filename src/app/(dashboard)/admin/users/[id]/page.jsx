// helper to check if admin is logged in
import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES } from "@/lib/auth"

// database connection helper
import pool from "@/lib/db"

// helpers for page routing and error page
import { notFound, redirect } from "next/navigation"

// the user profile overview component
import { UserProfileDetail } from "@/components/user-profile-detail"

export const metadata = {
  title: "User Profile | Admin Dashboard",
  description: "View and manage detailed reviewee and staff member profiles.",
}

// queries database for complete user profile information
async function getUserDetail(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT 
        u.*,
        s.name AS school_name,
        ac.name AS academic_course_name,
        ex.name AS exam_name,
        b.name AS batch_name,
        b.target_year AS batch_year,
        b.end_date AS batch_end_date,
        b.start_date AS batch_start_date,
        p.name AS program_name,
        m.name AS major_name,
        COALESCE(cr.name, u.role) AS role_name
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      LEFT JOIN academic_courses ac ON u.academic_course_id = ac.id
      LEFT JOIN examinations ex ON u.exam_id = ex.id
      LEFT JOIN batches b ON u.batch_id = b.id
      LEFT JOIN programs p ON u.program_id = p.id
      LEFT JOIN majors m ON u.major_id = m.id
      LEFT JOIN custom_roles cr ON cr.role_key = u.role
      WHERE u.id = $1`,
      [userId]
    )
    return rows[0] || null
  } catch (err) {
    console.error("Failed to query user detail:", err)
    return null
  }
}

// user profile page loader
export default async function UserProfilePage({ params }) {
  // ensure user is logged in as admin
  const session = await getSession()
  if (!session?.role || !ADMIN_ROLES.includes(session.role)) {
    redirect("/?login=1")
  }

  // get user id from url params
  const resolvedParams = await params
  const { id } = resolvedParams
  const userId = parseInt(id)
  
  if (isNaN(userId)) {
    notFound()
  }

  // fetch user from database
  const user = await getUserDetail(userId)
  if (!user) {
    notFound()
  }

  // display user profile detail screen
  return (
    <div className="w-full">
      <UserProfileDetail initialUser={user} />
    </div>
  )
}
