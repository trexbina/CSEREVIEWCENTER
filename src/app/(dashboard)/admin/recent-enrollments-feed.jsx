import pool from "@/lib/db"
import Link from "next/link"
import { Activity, UserCheck, GraduationCap, Shield } from "lucide-react"

function formatRelativeTime(dateStr) {
  if (!dateStr) return "Recently"
  const d = new Date(dateStr)
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffSec < 60) return "Just now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function getRoleLabel(role) {
  switch (role) {
    case "student":
      return "Reviewee"
    case "teacher":
      return "Instructor"
    case "academic_admin":
      return "Academic Admin"
    case "registrar":
      return "Registrar"
    case "admin":
      return "Admin"
    default:
      return role?.replace(/_/g, " ") || "User"
  }
}

function getInitials(name) {
  if (!name) return "U"
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export async function RecentEnrollmentsFeed() {
  let recentUsers = []

  try {
    const res = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.login_id, 
        u.created_at,
        b.name as batch_name,
        e.name as exam_name
      FROM users u
      LEFT JOIN batches b ON u.batch_id = b.id
      LEFT JOIN examinations e ON u.exam_id = e.id
      ORDER BY u.created_at DESC
      LIMIT 6
    `)
    recentUsers = res.rows || []
  } catch (err) {
    console.error("[RecentEnrollmentsFeed] Failed to load recent users:", err)
  }

  return (
    <div className="w-full space-y-3">
      {/* External Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-semibold text-[#3B3B3B] dark:text-white tracking-tight">
            Recent Activity
          </h2>
        </div>

        <Link
          href="/admin/users"
          className="inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 transition-all shadow-2xs shrink-0 cursor-pointer"
        >
          View users
        </Link>
      </div>

      {/* Stream Container */}
      <div className="w-full rounded-2xl border border-black/5 dark:border-white/10 bg-[#fafafa] dark:bg-white/[0.025] backdrop-blur-md shadow-2xs p-5 sm:p-6 divide-y divide-black/5 dark:divide-white/5">
        {recentUsers.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
            No registered users recorded yet.
          </div>
        ) : (
          recentUsers.map((user) => {
            const initials = getInitials(user.name)
            const roleLabel = getRoleLabel(user.role)
            const isStudent = user.role === "student"

            return (
              <div
                key={user.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                {/* Left: Avatar initial + Name & Subtitle */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 shrink-0">
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#3B3B3B] dark:text-white truncate">
                        {user.name}
                      </span>
                      {user.login_id && (
                        <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                          {user.login_id}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                      {isStudent
                        ? user.batch_name || user.exam_name || user.email
                        : user.email}
                    </div>
                  </div>
                </div>

                {/* Right: Role tag + Timestamp */}
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    {roleLabel}
                  </span>

                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500 min-w-[54px]">
                    {formatRelativeTime(user.created_at)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
