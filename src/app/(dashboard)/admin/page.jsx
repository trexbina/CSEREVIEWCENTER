import dynamic from "next/dynamic"
import { getSession } from "@/lib/auth-session"
import pool from "@/lib/db"

const DashboardCarousel = dynamic(
  () => import("@/components/dashboard-carousel").then((m) => m.DashboardCarousel),
  {
    loading: () => (
      <div className="w-full aspect-[21/7] rounded-xl border border-border bg-muted animate-pulse" />
    ),
  }
)

async function getAdminData() {
  const [usersResult, assignmentsResult, submissionsResult] =
    await Promise.all([
      pool.query(
        `SELECT role, COUNT(*) AS count FROM users GROUP BY role ORDER BY role`
      ),
      pool.query(`SELECT COUNT(*) AS total FROM assignments`),
      pool.query(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status = 'pending')  AS pending,
           COUNT(*) FILTER (WHERE status = 'reviewed') AS reviewed
         FROM submissions`
      ),
    ])

  const usersByRole = {}
  let totalUsers = 0
  for (const row of usersResult.rows) {
    usersByRole[row.role] = Number(row.count)
    totalUsers += Number(row.count)
  }

  const sub = submissionsResult.rows[0]

  return {
    totalUsers,
    usersByRole,
    totalAssignments: Number(assignmentsResult.rows[0]?.total ?? 0),
    totalSubmissions: Number(sub?.total ?? 0),
    pendingSubmissions: Number(sub?.pending ?? 0),
    reviewedSubmissions: Number(sub?.reviewed ?? 0),
  }
}

export default async function AdminDashboard() {
  const session = await getSession()

  let data = {

    totalUsers: 0,
    usersByRole: {},
    totalAssignments: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    reviewedSubmissions: 0,
  }

  if (session?.userId) {
    data = await getAdminData()
  }

  const statCards = [
    { label: "Total Users", value: data.totalUsers },
    { label: "Students", value: data.usersByRole.student ?? 0 },
    { label: "Teachers", value: data.usersByRole.teacher ?? 0 },
    { label: "Admins", value: data.usersByRole.admin ?? 0 },
    { label: "Assignments", value: data.totalAssignments },
    { label: "Total Submissions", value: data.totalSubmissions },
    { label: "Pending Reviews", value: data.pendingSubmissions },
    { label: "Reviewed", value: data.reviewedSubmissions },
  ]

  return (
    <div className="space-y-8">
      {/* ── Hero Banner / Carousel ── */}
      <DashboardCarousel />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          System overview — monitor overall platform analytics, user metrics, and activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-card p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
