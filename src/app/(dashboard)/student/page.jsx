import dynamic from "next/dynamic"
import { getSession } from "@/lib/auth-session"
import pool from "@/lib/db"
import { CalendarDays, Play } from "lucide-react"
import { LETCountdownInline } from "@/components/let-countdown-inline"

const DashboardCarousel = dynamic(
  () => import("@/components/dashboard-carousel").then((m) => m.DashboardCarousel),
  {
    loading: () => (
      <div className="w-full aspect-[21/7] rounded-xl border border-border bg-muted animate-pulse" />
    ),
  }
)

const LearningPerformanceChart = dynamic(
  () => import("@/components/student-dashboard-charts").then((m) => m.LearningPerformanceChart),
  {
    loading: () => (
      <div className="rounded-xl border border-border bg-card h-[360px] animate-pulse" />
    ),
  }
)

const SubjectFocusChart = dynamic(
  () => import("@/components/student-dashboard-charts").then((m) => m.SubjectFocusChart),
  {
    loading: () => (
      <div className="rounded-xl border border-border bg-card h-[360px] animate-pulse" />
    ),
  }
)

// LET Examination date — April 1, 2026
const LET_EXAM_DATE = "2026-04-01T08:00:00"

const GRADE_MAP = {
  "A+": 4.3, A: 4.0, "A-": 3.7,
  "B+": 3.3, B: 3.0, "B-": 2.7,
  "C+": 2.3, C: 2.0, "C-": 1.7,
  D: 1.0, F: 0,
}
const GRADE_ENTRIES = Object.entries(GRADE_MAP)

async function getStudentData(userId) {
  const [statsResult, activityResult] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending')  AS pending,
         COUNT(*) FILTER (WHERE status = 'reviewed') AS completed,
         COUNT(*) FILTER (WHERE feedback IS NOT NULL) AS feedback_count,
         ROUND(AVG(
           CASE grade
             WHEN 'A+' THEN 4.3 WHEN 'A' THEN 4.0 WHEN 'A-' THEN 3.7
             WHEN 'B+' THEN 3.3 WHEN 'B' THEN 3.0 WHEN 'B-' THEN 2.7
             WHEN 'C+' THEN 2.3 WHEN 'C' THEN 2.0 WHEN 'C-' THEN 1.7
             WHEN 'D'  THEN 1.0 WHEN 'F' THEN 0.0
           END
         ), 2) AS avg_gpa
       FROM submissions
       WHERE student_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT a.title, s.status, s.grade, s.feedback, s.submitted_at
       FROM submissions s
       JOIN assignments a ON a.id = s.assignment_id
       WHERE s.student_id = $1
       ORDER BY s.submitted_at DESC
       LIMIT 10`,
      [userId]
    ),
  ])

  const s = statsResult.rows[0]

  let avgGrade = "N/A"
  if (s.avg_gpa != null) {
    const gpa = Number(s.avg_gpa)
    avgGrade = GRADE_ENTRIES.reduce((best, [letter, val]) =>
      Math.abs(val - gpa) < Math.abs(best[1] - gpa) ? [letter, val] : best
    )[0]
  }

  return {
    stats: {
      pending: Number(s.pending),
      completed: Number(s.completed),
      avgGrade,
      feedbackCount: Number(s.feedback_count),
    },
    activity: activityResult.rows,
  }
}

export default async function StudentDashboard() {
  const session = await getSession()

  let stats = { pending: 0, completed: 0, avgGrade: "N/A", feedbackCount: 0 }
  let activity = []

  if (session?.userId) {
    const data = await getStudentData(session.userId)
    stats = data.stats
    activity = data.activity
  }

  const firstName = session?.name?.split(" ")[0] || "Student"

  return (
    <div className="space-y-8">
      {/* ── Hero Banner / Carousel ── */}
      <DashboardCarousel />


      {/* ── Dashboard heading row ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back, {firstName}. Your progress is looking steady.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <LETCountdownInline targetDate={LET_EXAM_DATE} />
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors">
            <CalendarDays className="h-4 w-4" />
            Schedule
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Play className="h-4 w-4" />
            Start Mock Exam
          </button>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <LearningPerformanceChart />
        <SubjectFocusChart />
      </div>

      {/* ── Recent Activity (collapsed below) ── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        <div className="mt-4 space-y-4">
          {activity.length === 0 && (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          )}
          {activity.map((item) => (
            <div
              key={item.title + item.submitted_at}
              className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(item.submitted_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  {item.grade && ` · Grade: ${item.grade}`}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${item.status === "reviewed"
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-secondary-foreground"
                  }`}
              >
                {item.status === "reviewed" ? "Reviewed" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
