import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES } from "@/lib/auth"
import pool from "@/lib/db"
import { redirect } from "next/navigation"
import { UserProfileDetail } from "@/components/user-profile-detail"

export const metadata = {
  title: "My Profile | Admin Dashboard",
  description: "View and manage your administrator profile.",
}

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
        p.name AS program_name,
        m.name AS major_name
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      LEFT JOIN academic_courses ac ON u.academic_course_id = ac.id
      LEFT JOIN examinations ex ON u.exam_id = ex.id
      LEFT JOIN batches b ON u.batch_id = b.id
      LEFT JOIN programs p ON u.program_id = p.id
      LEFT JOIN majors m ON u.major_id = m.id
      WHERE u.id = $1`,
      [userId]
    )
    return rows[0] || null
  } catch (err) {
    console.error("Failed to query admin user detail:", err)
    return null
  }
}

export default async function AdminProfilePage() {
  const session = await getSession()
  if (!session?.userId || !ADMIN_ROLES.includes(session.role)) {
    redirect("/login")
  }

  const user = await getUserDetail(session.userId)
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="w-full">
      <UserProfileDetail initialUser={user} showBackBtn={false} />
    </div>
  )
}
