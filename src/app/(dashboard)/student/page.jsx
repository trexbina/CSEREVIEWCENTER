import dynamic from "next/dynamic"
import Link from "next/link"
import { getSession } from "@/lib/auth-session"
import pool from "@/lib/db"
import {
  CalendarDays,
  Play,
  BookOpen,
  ArrowRight,
  Clock,
  Flame,
  Award,
  FileCheck2,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  Compass
} from "lucide-react"
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

async function getStudentDashboardData(userId) {
  const [
    resumeRes,
    overviewStatsRes,
    activeSubjectsRes,
    activityResult,
    activeMockExamRes
  ] = await Promise.all([
    // 1. Where the student last left off (last opened lesson or subject)
    pool.query(
      `SELECT 
         sa.id,
         sa.title,
         sa.activity_type,
         sa.details,
         sa.created_at,
         SUBSTRING(sa.details FROM 'SubjectID: ([0-9]+)') AS parsed_subject_id,
         SUBSTRING(sa.details FROM 'LessonID: ([0-9]+)') AS parsed_lesson_id,
         s.id AS subject_id,
         s.title AS subject_title,
         s.code AS subject_code,
         s.category AS subject_category,
         sc.id AS lesson_id,
         sc.title AS lesson_title,
         sc.lesson_type,
         sm.title AS module_title
       FROM student_activities sa
       LEFT JOIN subjects s ON s.id = NULLIF(SUBSTRING(sa.details FROM 'SubjectID: ([0-9]+)'), '')::int
       LEFT JOIN subject_contents sc ON sc.id = NULLIF(SUBSTRING(sa.details FROM 'LessonID: ([0-9]+)'), '')::int
       LEFT JOIN subject_modules sm ON sm.id = sc.module_id
       WHERE sa.student_id = $1 
         AND (sa.activity_type = 'lesson_open' OR sa.details LIKE '%SubjectID:%')
       ORDER BY sa.created_at DESC
       LIMIT 1`,
      [userId]
    ).catch(() => ({ rows: [] })),

    // 2. High-level Overview Counters (quizzes taken, mock exams completed, study streak, active days)
    pool.query(
      `SELECT 
         (SELECT COUNT(*) FROM student_quiz_submissions WHERE student_id = $1) AS completed_quizzes,
         (SELECT COUNT(*) FROM mock_exam_scores WHERE student_id = $1) AS completed_exams,
         (SELECT COALESCE(MAX(study_streak), 0) FROM student_subject_progress WHERE student_id = $1) AS streak_from_progress,
         (SELECT COUNT(DISTINCT to_char(act_timestamp AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD'))
          FROM (
            SELECT created_at AS act_timestamp FROM student_activities WHERE student_id = $1
            UNION ALL
            SELECT submitted_at AS act_timestamp FROM student_quiz_submissions WHERE student_id = $1
            UNION ALL
            SELECT completed_at AS act_timestamp FROM mock_exam_scores WHERE student_id = $1
            UNION ALL
            SELECT session_start AS act_timestamp FROM study_sessions WHERE user_id = $1
          ) t) AS total_active_days,
         (SELECT ROUND(AVG(
            CASE WHEN total_points > 0 THEN (earned_points::numeric / total_points::numeric) * 100 ELSE NULL END
          ), 0) FROM student_quiz_submissions WHERE student_id = $1) AS avg_quiz_score`,
      [userId]
    ).catch(() => ({ rows: [{}] })),

    // 3. User Subjects with Progression (for quick curriculum jump)
    pool.query(
      `SELECT 
         s.id,
         s.title,
         s.code,
         s.category,
         COALESCE(ssp.progress_pct, 0) AS progress_pct,
         COALESCE(ssp.completed_items, 0) AS completed_items,
         COALESCE(ssp.total_items, 0) AS total_items,
         (SELECT COUNT(sc.id) 
          FROM subject_contents sc 
          JOIN subject_modules sm ON sm.id = sc.module_id 
          WHERE sm.subject_id = s.id) AS real_total_items
       FROM subjects s
       LEFT JOIN student_subject_progress ssp ON ssp.subject_id = s.id AND ssp.student_id = $1
       WHERE s.status = 'active'
       ORDER BY ssp.last_activity_at DESC NULLS LAST, s.id ASC
       LIMIT 4`,
      [userId]
    ).catch(() => ({ rows: [] })),

    // 4. Recent Real Activity Feed
    pool.query(
      `SELECT 
         sa.id,
         sa.title,
         sa.activity_type,
         sa.details,
         sa.status,
         sa.created_at,
         SUBSTRING(sa.details FROM 'SubjectID: ([0-9]+)') AS subject_id,
         SUBSTRING(sa.details FROM 'LessonID: ([0-9]+)') AS lesson_id,
         s.title AS subject_title,
         s.code AS subject_code
       FROM student_activities sa
       LEFT JOIN subjects s ON s.id = NULLIF(SUBSTRING(sa.details FROM 'SubjectID: ([0-9]+)'), '')::int
       WHERE sa.student_id = $1
       ORDER BY sa.created_at DESC
       LIMIT 8`,
      [userId]
    ).catch(() => ({ rows: [] })),

    // 5. Active Mock Exam for Shortcut
    pool.query(
      `SELECT me.id, me.title, me.exam_code 
       FROM mock_exams me 
       WHERE me.status = 'active' 
       ORDER BY me.id ASC 
       LIMIT 1`
    ).catch(() => ({ rows: [] }))
  ])

  const resume = resumeRes.rows[0] || null
  const overview = overviewStatsRes.rows[0] || {}
  const subjects = activeSubjectsRes.rows || []
  const activities = activityResult.rows || []
  const activeExam = activeMockExamRes.rows[0] || null

  return {
    resume,
    overview: {
      completedQuizzes: Number(overview.completed_quizzes || 0),
      completedExams: Number(overview.completed_exams || 0),
      studyStreak: Math.max(Number(overview.streak_from_progress || 0), Number(overview.total_active_days || 0) > 0 ? 1 : 0),
      activeDays: Number(overview.total_active_days || 0),
      avgQuizScore: overview.avg_quiz_score != null ? Number(overview.avg_quiz_score) : null,
    },
    subjects: subjects.map(s => ({
      ...s,
      total_items: Math.max(Number(s.total_items || 0), Number(s.real_total_items || 0))
    })),
    activities,
    activeExam
  }
}

export default async function StudentDashboard() {
  const session = await getSession()
  const firstName = session?.name?.split(" ")[0] || "Student"

  let data = {
    resume: null,
    overview: { completedQuizzes: 0, completedExams: 0, studyStreak: 0, activeDays: 0, avgQuizScore: null },
    subjects: [],
    activities: [],
    activeExam: null,
  }

  if (session?.userId) {
    data = await getStudentDashboardData(session.userId)
  }

  const { resume, overview, subjects, activities, activeExam } = data

  // Resume URL builder
  let resumeUrl = "/student/subjects"
  if (resume?.subject_id) {
    if (resume?.lesson_id) {
      resumeUrl = `/student/subjects/${resume.subject_id}?lessonId=${resume.lesson_id}`
    } else {
      resumeUrl = `/student/subjects/${resume.subject_id}`
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Hero Banner / Carousel ── */}
      <DashboardCarousel />

      {/* ── Dashboard heading row with Shortcuts ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Welcome back, {firstName}. Here is your learning progress and shortcuts.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <LETCountdownInline targetDate={LET_EXAM_DATE} />

          <Link
            href="/student/calendar"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent hover:border-black/10 dark:hover:border-white/10 transition-all shadow-2xs"
          >
            <CalendarDays className="h-4 w-4 text-primary" />
            Schedule
          </Link>

          <Link
            href={activeExam ? `/student/mock-exams` : "/student/mock-exams"}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:bg-primary/90 transition-all shadow-2xs"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Mock Exams
          </Link>
        </div>
      </div>

      {/* ── Quick Navigation Shortcuts Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/student/subjects"
          className="group flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/80 hover:border-primary/40 hover:bg-primary/[0.03] transition-all shadow-2xs"
        >
          <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">Curriculum</p>
            <p className="text-[11px] text-muted-foreground truncate">All Subjects</p>
          </div>
        </Link>

        <Link
          href="/student/progress"
          className="group flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/80 hover:border-primary/40 hover:bg-primary/[0.03] transition-all shadow-2xs"
        >
          <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <TrendingUp className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">My Progress</p>
            <p className="text-[11px] text-muted-foreground truncate">Scores & Streaks</p>
          </div>
        </Link>

        <Link
          href="/student/mock-exams"
          className="group flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/80 hover:border-primary/40 hover:bg-primary/[0.03] transition-all shadow-2xs"
        >
          <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Award className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">Mock Tests</p>
            <p className="text-[11px] text-muted-foreground truncate">Full Simulations</p>
          </div>
        </Link>

        <Link
          href="/student/calendar"
          className="group flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/80 hover:border-primary/40 hover:bg-primary/[0.03] transition-all shadow-2xs"
        >
          <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <CalendarDays className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">Calendar</p>
            <p className="text-[11px] text-muted-foreground truncate">Upcoming Tasks</p>
          </div>
        </Link>
      </div>

      {/* ── Hero "Resume Where You Left Off" Navigation Banner ── */}
      {resume && (
        <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/[0.08] via-primary/[0.03] to-card p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/20 text-[#8a6e1d] dark:text-primary">
                <RotateCcw className="size-3" />
                <span>Pick up where you left off</span>
              </div>
              <h2 className="text-lg font-bold text-foreground tracking-tight line-clamp-1">
                {resume.lesson_title || resume.subject_title || "Continue Your Learning Module"}
              </h2>
              <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-2">
                <span>{resume.subject_title}</span>
                {resume.subject_code && (
                  <>
                    <span>•</span>
                    <span className="font-semibold">{resume.subject_code}</span>
                  </>
                )}
                {resume.module_title && (
                  <>
                    <span>•</span>
                    <span>{resume.module_title}</span>
                  </>
                )}
              </p>
            </div>

            <Link
              href={resumeUrl}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm shrink-0 self-start sm:self-auto"
            >
              <span>Resume Module</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Key Overview Metrics Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Study Streak</span>
            <Flame className="size-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-foreground">{overview.studyStreak}</span>
            <span className="text-xs text-muted-foreground font-medium">days</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Consistent review habit</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Active Days</span>
            <Clock className="size-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-foreground">{overview.activeDays}</span>
            <span className="text-xs text-muted-foreground font-medium">days total</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Study sessions logged</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Quizzes Taken</span>
            <FileCheck2 className="size-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-foreground">{overview.completedQuizzes}</span>
            <span className="text-xs text-muted-foreground font-medium">completed</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Module quiz checks</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Quiz Accuracy</span>
            <Sparkles className="size-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-foreground">
              {overview.avgQuizScore != null ? `${overview.avgQuizScore}%` : "—"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Average quiz proficiency</p>
        </div>
      </div>

      {/* ── Active Subjects Curriculum Quick Jump ── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary" />
            <h2 className="text-base font-bold text-foreground tracking-tight">
              Curriculum & Modules
            </h2>
          </div>
          <Link
            href="/student/subjects"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All Subjects</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjects.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No subjects currently active.
            </div>
          ) : (
            subjects.map((sub) => {
              const pct = Number(sub.progress_pct || 0)
              return (
                <Link
                  key={sub.id}
                  href={`/student/subjects/${sub.id}`}
                  className="group rounded-2xl border border-border bg-card p-4 shadow-2xs hover:shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/15 text-[#8a6e1d] dark:text-primary">
                        {sub.code || "SUBJ"}
                      </span>
                      <span className="text-xs font-bold text-foreground">{pct}%</span>
                    </div>
                    <h3 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {sub.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {sub.category || "General"}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{sub.completed_items} of {sub.total_items} items</span>
                      <span className="font-medium text-primary group-hover:translate-x-0.5 transition-transform flex items-center">
                        Open <ChevronRight className="size-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <LearningPerformanceChart />
        <SubjectFocusChart />
      </div>

      {/* ── Dynamic Recent Student Learning Activity ── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground tracking-tight">Recent Learning Activity</h2>
          </div>
          <span className="text-xs text-muted-foreground">Live activity logs</span>
        </div>

        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent learning activity recorded yet.</p>
          ) : (
            activities.map((act) => {
              const hasSubjectLink = !!act.subject_id
              const linkUrl = act.subject_id
                ? (act.lesson_id ? `/student/subjects/${act.subject_id}?lessonId=${act.lesson_id}` : `/student/subjects/${act.subject_id}`)
                : null

              return (
                <div
                  key={act.id}
                  className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-xs sm:text-sm text-foreground truncate">
                        {act.title}
                      </p>
                      {act.subject_code && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                          {act.subject_code}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {new Date(act.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                      {act.details && ` · ${act.details}`}
                    </p>
                  </div>

                  {linkUrl ? (
                    <Link
                      href={linkUrl}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors shrink-0"
                    >
                      <span>Jump</span>
                      <ChevronRight className="size-3.5" />
                    </Link>
                  ) : (
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground shrink-0">
                      Viewed
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
