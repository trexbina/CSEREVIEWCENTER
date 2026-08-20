import { getSession } from "@/lib/auth-session"
import pool from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { UserProfileDetail } from "@/components/user-profile-detail"

export const metadata = {
  title: "User Profile | Admin Dashboard",
  description: "View and manage detailed reviewee and staff member profiles.",
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
    console.error("Failed to query user detail:", err)
    return null
  }
}

export default async function UserProfilePage({ params }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    redirect("/login")
  }

  const resolvedParams = await params
  const { id } = resolvedParams
  const userId = parseInt(id)
  
  if (isNaN(userId)) {
    notFound()
  }

  const user = await getUserDetail(userId)
  if (!user) {
    notFound()
  }

  return (
    <div className="w-full">
      <UserProfileDetail initialUser={user} />
    </div>
  )
}
