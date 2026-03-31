import dynamic from "next/dynamic"
import { getSession } from "@/lib/auth-session"
import pool from "@/lib/db"

const DashboardCarousel = dynamic(
  () => import("@/components/dashboard-carousel").then((m) => m.DashboardCarousel),
  {
    loading: () => (
      <div className="w-full aspect-[21/7] rounded-lg border border-border bg-muted animate-pulse" />
    ),
  }
)

async function getTeacherData(teacherId) {
  // 3 focused queries in parallel — simpler & faster than correlated subqueries
  const [studentsResult, pendingResult, assignmentsResult, submissionsResult] =
    await Promise.all([
      pool.query(
        `SELECT COUNT(DISTINCT s.student_id) AS total
         FROM submissions s
         JOIN assignments a ON a.id = s.assignment_id
         WHERE a.teacher_id = $1`,
        [teacherId]
      ),
      pool.query(
        `SELECT COUNT(*) AS total
         FROM submissions s
         JOIN assignments a ON a.id = s.assignment_id
         WHERE a.teacher_id = $1 AND s.status = 'pending'`,
        [teacherId]
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM assignments WHERE teacher_id = $1",
        [teacherId]
      ),
      pool.query(
        `SELECT u.name AS student, a.title AS assignment, sub.submitted_at, sub.status
         FROM submissions sub
         JOIN assignments a ON a.id = sub.assignment_id
         JOIN users u ON u.id = sub.student_id
         WHERE a.teacher_id = $1
         ORDER BY sub.submitted_at DESC
         LIMIT 10`,
        [teacherId]
      ),
    ])

  return {
    stats: {
      totalStudents: Number(studentsResult.rows[0]?.total ?? 0),
      pendingReviews: Number(pendingResult.rows[0]?.total ?? 0),
      totalAssignments: Number(assignmentsResult.rows[0]?.total ?? 0),
    },
    submissions: submissionsResult.rows,
  }
}

export default async function TeacherDashboard() {
  const session = await getSession()

  let stats = { totalStudents: 0, pendingReviews: 0, totalAssignments: 0 }
  let submissions = []

  if (session?.userId) {
    const data = await getTeacherData(session.userId)
    stats = data.stats
    submissions = data.submissions
  }

  return (
    <div className="space-y-8">
      {/* Carousel */}
      <DashboardCarousel />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Manage assignments, review submissions, and provide feedback.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Total Students", value: String(stats.totalStudents) },
          { label: "Pending Reviews", value: String(stats.pendingReviews) },
          { label: "Assignments", value: String(stats.totalAssignments) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Student Submissions */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground">Recent Submissions</h2>
        <div className="mt-4 space-y-4">
          {submissions.length === 0 && (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          )}
          {submissions.map((item) => (
            <div
              key={`${item.student}-${item.assignment}-${item.submitted_at}`}
              className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium text-foreground">{item.student}</p>
                <p className="text-sm text-muted-foreground">
                  {item.assignment} &middot;{" "}
                  {new Date(item.submitted_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${item.status === "reviewed"
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
                  }`}
              >
                {item.status === "reviewed" ? "Reviewed" : "Needs Review"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
