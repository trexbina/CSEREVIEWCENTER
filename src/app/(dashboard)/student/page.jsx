import dynamic from "next/dynamic"
import Link from "next/link"
import { getSession } from "@/lib/auth-session"
import pool from "@/lib/db"
import { ArrowRight, ChevronRight } from "lucide-react"
import { UpcomingExamTimer } from "@/components/upcoming-exam-timer"
import { StudentTodoWidget } from "./student-todo-widget"
import { StudentCalendarWidget } from "./student-calendar-widget"
import { LordIcon } from "@/components/ui/lord-icon"
import { getStudentCurriculumContext } from "@/lib/student-curriculum"

const DashboardCarousel = dynamic(
  () => import("@/components/dashboard-carousel").then((m) => m.DashboardCarousel),
  {
    loading: () => (
      <div className="w-full aspect-[16/8] sm:aspect-[16/7] rounded-2xl border border-black/5 dark:border-white/10 bg-muted/40 animate-pulse" />
    ),
  }
)

const LearningPerformanceChart = dynamic(
  () => import("@/components/student-dashboard-charts").then((m) => m.LearningPerformanceChart),
  {
    loading: () => (
      <div className="rounded-2xl border border-border/70 bg-card h-[360px] animate-pulse" />
    ),
  }
)

const SubjectFocusChart = dynamic(
  () => import("@/components/student-dashboard-charts").then((m) => m.SubjectFocusChart),
  {
    loading: () => (
      <div className="rounded-2xl border border-border/70 bg-card h-[360px] animate-pulse" />
    ),
  }
)

const RecentLearningActivityList = dynamic(
  () => import("@/components/recent-learning-activity-list").then((m) => m.RecentLearningActivityList),
  {
    loading: () => (
      <div className="rounded-2xl border border-border/70 bg-card p-6 h-[200px] animate-pulse" />
    ),
  }
)

async function getStudentDashboardData(userId) {
  const curriculumCtx = await getStudentCurriculumContext(userId)
  const curriculumSubjectIds = curriculumCtx.subjectIds
  const subjectIdsParam = curriculumSubjectIds.length > 0 ? curriculumSubjectIds : null

  const [
    resumeRes,
    overviewStatsRes,
    activeSubjectsRes,
    activityResult,
    mockExamsProgressRes,
    sevenDayPerformanceRes,
    subjectFocusRes,
    upcomingExamRes
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
         AND ($2::int[] IS NULL OR NULLIF(SUBSTRING(sa.details FROM 'SubjectID: ([0-9]+)'), '')::int IS NULL OR NULLIF(SUBSTRING(sa.details FROM 'SubjectID: ([0-9]+)'), '')::int = ANY($2::int[]))
       ORDER BY sa.created_at DESC
       LIMIT 1`,
      [userId, subjectIdsParam]
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

    // 3. User Subjects with Progression (scoped strictly to student's curriculum)
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
         AND ($2::int[] IS NULL OR s.id = ANY($2::int[]))
       ORDER BY 
         CASE WHEN COALESCE(ssp.completed_items, 0) > 0 THEN 0 ELSE 1 END ASC,
         ssp.last_activity_at DESC NULLS LAST, 
         s.id ASC
       LIMIT 4`,
      [userId, subjectIdsParam]
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
       LIMIT 20`,
      [userId]
    ).catch(() => ({ rows: [] })),

    // 5. Dynamic Mock Exam Progress
    pool.query(
      `SELECT 
         me.id,
         me.title,
         me.exam_code,
         (SELECT COUNT(*) FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(me.questions::jsonb->'questions') = 'array' 
                 THEN me.questions::jsonb->'questions' 
                 ELSE '[]'::jsonb END
         )) AS question_count,
         mes.score,
         mes.max_score,
         mes.completed_at,
         COALESCE(mes.attempts_count, CASE WHEN mes.score IS NOT NULL THEN 1 ELSE 0 END) AS attempts_count
       FROM mock_exams me
       LEFT JOIN mock_exam_scores mes ON mes.mock_exam_id = me.id AND mes.student_id = $1
       WHERE me.status = 'active'
       ORDER BY me.id ASC
       LIMIT 4`,
      [userId]
    ).catch(() => ({ rows: [] })),

    // 6. 7-Day Performance Trend (Daily scores from quizzes & exams)
    pool.query(
      `SELECT 
         to_char(d, 'Dy') AS day,
         to_char(d, 'YYYY-MM-DD') AS date_str,
         COALESCE(
           ROUND(AVG(
             CASE WHEN scores.total_points > 0 
                  THEN (scores.earned_points::numeric / scores.total_points::numeric) * 100 
                  ELSE NULL END
           ), 0),
           0
         ) AS avg_score
       FROM generate_series(
         (NOW() AT TIME ZONE 'Asia/Manila')::date - INTERVAL '6 days',
         (NOW() AT TIME ZONE 'Asia/Manila')::date,
         INTERVAL '1 day'
       ) d
       LEFT JOIN (
         SELECT submitted_at AS act_time, earned_points, total_points
         FROM student_quiz_submissions
         WHERE student_id = $1
         UNION ALL
         SELECT completed_at AS act_time, score AS earned_points, max_score AS total_points
         FROM mock_exam_scores
         WHERE student_id = $1
       ) scores ON to_char(scores.act_time AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD') = to_char(d, 'YYYY-MM-DD')
       GROUP BY d
       ORDER BY d ASC`,
      [userId]
    ).catch(() => ({ rows: [] })),

    // 7. Dynamic Subject Focus Allocation (Study seconds & activity hits per curriculum subject)
    pool.query(
      `SELECT 
         s.id,
         s.title,
         s.code,
         COALESCE(SUM(dss.total_seconds), 0) AS total_seconds,
         COALESCE(ssp.progress_pct, 0) AS progress_pct,
         (SELECT COUNT(sa.id) FROM student_activities sa WHERE sa.student_id = $1 AND sa.details LIKE '%SubjectID: ' || s.id || '%') AS hits
       FROM subjects s
       LEFT JOIN daily_student_stats dss ON dss.subject_id = s.id AND dss.user_id = $1
       LEFT JOIN student_subject_progress ssp ON ssp.subject_id = s.id AND ssp.student_id = $1
       WHERE s.status = 'active'
         AND ($2::int[] IS NULL OR s.id = ANY($2::int[]))
       GROUP BY s.id, s.title, s.code, ssp.progress_pct
       ORDER BY s.id ASC`,
      [userId, subjectIdsParam]
    ).catch(() => ({ rows: [] })),

    // 8. Upcoming or Active Mock Exam for Alarm/Timer
    pool.query(
      `SELECT 
         me.id,
         me.title,
         me.exam_code,
         me.unlock_date,
         me.status,
         mes.completed_at
       FROM mock_exams me
       LEFT JOIN mock_exam_scores mes ON mes.mock_exam_id = me.id AND mes.student_id = $1
       WHERE me.status = 'active'
       ORDER BY 
         CASE 
           WHEN me.unlock_date IS NOT NULL AND me.unlock_date > NOW() THEN 0 
           WHEN mes.completed_at IS NULL THEN 1 
           ELSE 2 
         END ASC,
         me.unlock_date ASC NULLS LAST,
         me.id ASC`,
      [userId]
    ).catch(() => ({ rows: [] }))
  ])

  const resume = resumeRes.rows[0] || null
  const overview = overviewStatsRes.rows[0] || {}
  const subjects = activeSubjectsRes.rows || []
  const activities = activityResult.rows || []
  const mockExams = mockExamsProgressRes.rows || []

  // Resolve upcoming exam for header alarm & timer
  const upcomingExamList = upcomingExamRes?.rows || []
  const futureExam = upcomingExamList.find(
    (e) => e.unlock_date && new Date(e.unlock_date).getTime() > Date.now() && !e.completed_at
  )
  const activeUncompletedExam = upcomingExamList.find((e) => !e.completed_at)

  const selectedTarget = futureExam || activeUncompletedExam
  const upcomingExam = selectedTarget
    ? {
      id: selectedTarget.id,
      title: selectedTarget.title,
      examCode: selectedTarget.exam_code,
      unlockDate: selectedTarget.unlock_date ? new Date(selectedTarget.unlock_date).toISOString() : null,
    }
    : null

  // Format 7-Day Performance
  const performanceData = (sevenDayPerformanceRes.rows || []).map(r => ({
    day: r.day,
    score: Number(r.avg_score || 0)
  }))

  // Format Subject Focus Donut data strictly scoped to student curriculum
  const rawFocus = subjectFocusRes.rows || []
  const totalCurriculumSubjects = curriculumSubjectIds.length > 0 ? curriculumSubjectIds.length : rawFocus.length

  const engagedFocus = rawFocus.filter(
    (sub) => Number(sub.total_seconds || 0) > 0 || Number(sub.hits || 0) > 0 || Number(sub.progress_pct || 0) > 0
  )

  let focusData = []
  if (engagedFocus.length > 0) {
    engagedFocus.sort((a, b) => {
      const wa = Number(a.total_seconds || 0) + (Number(a.hits || 0) * 60) + Number(a.progress_pct || 0)
      const wb = Number(b.total_seconds || 0) + (Number(b.hits || 0) * 60) + Number(b.progress_pct || 0)
      return wb - wa
    })
    const topEngaged = engagedFocus.slice(0, 5)
    const remaining = engagedFocus.slice(5)

    let totalWeight = 0
    topEngaged.forEach((s) => {
      const w = Number(s.total_seconds || 0) + (Number(s.hits || 0) * 60) + Number(s.progress_pct || 0)
      totalWeight += w
    })
    let remainingWeight = 0
    remaining.forEach((s) => {
      const w = Number(s.total_seconds || 0) + (Number(s.hits || 0) * 60) + Number(s.progress_pct || 0)
      remainingWeight += w
    })
    totalWeight += remainingWeight

    focusData = topEngaged.map((s) => {
      const w = Number(s.total_seconds || 0) + (Number(s.hits || 0) * 60) + Number(s.progress_pct || 0)
      return {
        name: s.title || s.code || "Subject",
        value: totalWeight > 0 ? Math.max(1, Math.round((w / totalWeight) * 100)) : 100,
      }
    })

    if (remainingWeight > 0) {
      focusData.push({
        name: "Other Subjects",
        value: Math.max(1, Math.round((remainingWeight / totalWeight) * 100)),
      })
    }
  } else {
    // If student has no study activity yet, display top 5 subjects from their curriculum
    const topCurriculum = rawFocus.slice(0, 5)
    if (topCurriculum.length > 0) {
      const eachVal = Math.floor(100 / topCurriculum.length)
      const remainder = 100 - (eachVal * topCurriculum.length)
      focusData = topCurriculum.map((s, idx) => ({
        name: s.title || s.code || `Subject ${idx + 1}`,
        value: idx === 0 ? eachVal + remainder : eachVal,
      }))
    }
  }

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
    mockExams: mockExams.map(m => {
      const hasCompleted = m.completed_at != null
      const score = m.score != null ? Number(m.score) : null
      const maxScore = m.max_score != null ? Number(m.max_score) : (Number(m.question_count) || 100)
      const percentage = hasCompleted && maxScore > 0 ? Math.round((score / maxScore) * 100) : null
      return {
        id: m.id,
        title: m.title,
        exam_code: m.exam_code,
        questionCount: Number(m.question_count || 0),
        isCompleted: hasCompleted,
        score,
        maxScore,
        percentage,
        attemptsCount: Number(m.attempts_count || (hasCompleted ? 1 : 0)),
        completedAt: m.completed_at,
        passed: percentage != null ? percentage >= 75 : null,
      }
    }),
    performanceData,
    focusData,
    totalCurriculumSubjects,
    upcomingExam
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
    mockExams: [],
    performanceData: [],
    focusData: [],
    totalCurriculumSubjects: 0,
    upcomingExam: null
  }

  if (session?.userId) {
    data = await getStudentDashboardData(session.userId)
  }

  const { resume, overview, subjects, activities, mockExams, performanceData, focusData, totalCurriculumSubjects, upcomingExam } = data

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
    <div className="space-y-9 sm:space-y-10 pb-10">
      {/* ── Dashboard heading row ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
            Dashboard
          </h1>
          <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal">
            Welcome back, {firstName}! Here is how you are doing so far.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <UpcomingExamTimer upcomingExam={upcomingExam} />
        </div>
      </div>

      {/* ── Top Section: 9-col Carousel + Metric Cards / 3-col To-Do List + Calendar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 items-stretch">
        {/* Left Column (spans 9 cols): Carousel Banner + Overview Metrics Strip */}
        <div className="lg:col-span-9 flex flex-col justify-between gap-6 sm:gap-7">
          <DashboardCarousel />

          {/* Key Overview Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
            {/* Metric 1: Study Streak */}
            <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none">
              <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                  Study Streak
                </span>
              </div>
              <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                  {overview.studyStreak} <span className="text-sm font-normal text-neutral-400 dark:text-neutral-500">days</span>
                </div>
                <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                  Days studied in a row
                </p>
              </div>
            </div>

            {/* Metric 2: Active Days */}
            <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none">
              <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#2A9D8F]/20 dark:bg-[#2A9D8F]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                  Active Days
                </span>
              </div>
              <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                  {overview.activeDays} <span className="text-sm font-normal text-neutral-400 dark:text-neutral-500">days total</span>
                </div>
                <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                  Days you logged in
                </p>
              </div>
            </div>

            {/* Metric 3: Quizzes Taken */}
            <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none">
              <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#E17055]/20 dark:bg-[#E17055]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                  Quizzes Taken
                </span>
              </div>
              <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                  {overview.completedQuizzes} <span className="text-sm font-normal text-neutral-400 dark:text-neutral-500">completed</span>
                </div>
                <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                  Quizzes you finished
                </p>
              </div>
            </div>

            {/* Metric 4: Quiz Accuracy */}
            <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none">
              <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#3B82F6]/20 dark:bg-[#3B82F6]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                  Quiz Accuracy
                </span>
              </div>
              <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                  {overview.avgQuizScore != null ? `${overview.avgQuizScore}%` : "—"}
                </div>
                <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                  Your average score
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (spans 3 cols): Student To-do List + Calendar Widget */}
        <div className="lg:col-span-3 flex flex-col justify-between gap-6 sm:gap-7">
          <StudentTodoWidget />
          <StudentCalendarWidget upcomingExamDate={upcomingExam?.unlockDate} />
        </div>
      </div>

      {/* ── Line Divider ── */}
      <div className="border-t border-black/5 dark:border-white/10" />

      {/* ── Hero "Resume Where You Left Off" Navigation Banner ── */}
      {resume && (
        <>
          <div className="w-full rounded-2xl border border-black/5 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] p-5 sm:p-6 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              <LordIcon
                src="/icons/startexam.json"
                size={48}
                trigger="loop"
                delay={2500}
                className="shrink-0 select-none"
              />
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 select-none">
                    Continue where you left off
                  </span>
                  {resume.subject_code && (
                    <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full select-none">
                      {resume.subject_code}
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-[#3B3B3B] dark:text-white tracking-tight line-clamp-1">
                  {resume.lesson_title || resume.subject_title || "Continue Lesson"}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                  {resume.subject_title}
                  {resume.module_title && ` · ${resume.module_title}`}
                </p>
              </div>
            </div>

            <Link
              href={resumeUrl}
              className="inline-flex items-center justify-center gap-1.5 h-8 px-4 rounded-xl text-xs font-semibold text-white bg-[#3B3B3B] hover:bg-[#2B2B2B] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-all shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <span>Resume Lesson</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="border-t border-black/5 dark:border-white/10" />
        </>
      )}

      {/* ── SECTION: Mock Exam Progress ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-semibold text-[#3B3B3B] dark:text-white tracking-tight">
              Mock Exam Progress
            </h2>
          </div>

          <Link
            href="/student/mock-exams"
            className="inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 transition-all shadow-2xs shrink-0 cursor-pointer"
          >
            View all
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {mockExams.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-black/10 dark:border-white/15 p-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
              No mock exams right now.
            </div>
          ) : (
            mockExams.map((exam) => {
              const isDone = exam.isCompleted
              return (
                <div
                  key={exam.id}
                  className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between transition-all hover:border-black/15 dark:hover:border-white/20"
                >
                  <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)] bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25">
                    <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 truncate select-none">
                      {exam.exam_code || `MOCK-${exam.id}`}
                    </span>
                    <span className="text-[11px] font-semibold text-[#3B3B3B] dark:text-white">
                      {isDone ? `${exam.percentage}%` : "Not started"}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6 flex flex-col justify-between gap-4 flex-1">
                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-semibold text-[#3B3B3B] dark:text-white line-clamp-1">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 line-clamp-1">
                        {exam.questionCount} questions
                      </p>

                      <div className="w-full bg-black/5 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
                        <div
                          className="h-full bg-[#E9C46A] rounded-full transition-all duration-500"
                          style={{ width: `${exam.percentage != null ? exam.percentage : (isDone ? 100 : 0)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">
                        {isDone ? `${exam.score} / ${exam.maxScore} pts` : "Not taken yet"}
                      </span>

                      <Link
                        href="/student/mock-exams"
                        className="inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 border border-black/5 dark:border-white/10 transition-all shadow-2xs shrink-0 cursor-pointer"
                      >
                        {isDone ? "Review" : "Start Exam"}
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Line Divider ── */}
      <div className="border-t border-black/5 dark:border-white/10" />

      {/* ── Active Subjects Curriculum Section ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-semibold text-[#3B3B3B] dark:text-white tracking-tight">
              Curriculum & Modules
            </h2>
          </div>

          <Link
            href="/student/subjects"
            className="inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 transition-all shadow-2xs shrink-0 cursor-pointer"
          >
            View all
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {subjects.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-black/10 dark:border-white/15 p-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
              No subjects available right now.
            </div>
          ) : (
            subjects.map((sub) => {
              const pct = Number(sub.progress_pct || 0)
              return (
                <div
                  key={sub.id}
                  className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between transition-all hover:border-black/15 dark:hover:border-white/20"
                >
                  <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)] bg-[#2A9D8F]/20 dark:bg-[#2A9D8F]/25">
                    <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 truncate select-none">
                      {sub.code || "SUBJECT"}
                    </span>
                    <span className="text-[11px] font-semibold text-[#3B3B3B] dark:text-white">
                      {pct}%
                    </span>
                  </div>

                  <div className="p-5 sm:p-6 flex flex-col justify-between gap-4 flex-1">
                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-semibold text-[#3B3B3B] dark:text-white line-clamp-1">
                        {sub.title}
                      </h3>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 line-clamp-1">
                        {sub.category || "General"}
                      </p>

                      <div className="w-full bg-black/5 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
                        <div
                          className="h-full bg-[#2A9D8F] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">
                        {sub.completed_items} of {sub.total_items} lessons done
                      </span>

                      <Link
                        href={`/student/subjects/${sub.id}`}
                        className="inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 border border-black/5 dark:border-white/10 transition-all shadow-2xs shrink-0 cursor-pointer"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Line Divider ── */}
      <div className="border-t border-black/5 dark:border-white/10" />

      {/* ── Dynamic Charts Row (Live Performance Trend & Dynamic Subject Focus) ── */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <LearningPerformanceChart
          performanceData={performanceData}
          overallAverage={overview.avgQuizScore}
          trendLabel={overview.completedQuizzes > 0 ? "Scores over the last 7 days" : "Take quizzes to track your progress"}
        />
        <SubjectFocusChart focusData={focusData} totalSubjects={totalCurriculumSubjects} />
      </div>

  {/* ── Line Divider ── */ }
  <div className="border-t border-black/5 dark:border-white/10" />

  {/* ── Dynamic Recent Student Learning Activity (Collapsible & Expandable) ── */}
  <RecentLearningActivityList activities={activities} />
    </div>
  )
}
