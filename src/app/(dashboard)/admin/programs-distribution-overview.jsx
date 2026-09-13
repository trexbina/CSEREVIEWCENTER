import pool from "@/lib/db"
import Link from "next/link"
import { BookOpen, GraduationCap, ArrowUpRight, PieChart } from "lucide-react"

export async function ProgramsDistributionOverview() {
  let totalStudents = 0
  let exams = []
  let programs = []

  try {
    const [totalRes, examsRes, programsRes] = await Promise.all([
      pool.query("SELECT COUNT(*)::int as total FROM users WHERE role = 'student'"),
      pool.query(`
        SELECT 
          e.id, 
          e.name,
          (SELECT COUNT(*)::int FROM users u WHERE u.exam_id = e.id AND u.role = 'student') as student_count,
          (SELECT COUNT(*)::int FROM batches b WHERE b.exam_id = e.id) as batch_count
        FROM examinations e
        ORDER BY student_count DESC, e.name ASC
      `),
      pool.query(`
        SELECT 
          p.id, 
          p.name, 
          p.exam_id,
          (SELECT COUNT(*)::int FROM users u WHERE u.program_id = p.id AND u.role = 'student') as student_count
        FROM programs p
        ORDER BY student_count DESC, p.name ASC
      `)
    ])

    totalStudents = totalRes.rows[0]?.total || 0
    exams = examsRes.rows || []
    programs = programsRes.rows || []
  } catch (err) {
    console.error("[ProgramsDistributionOverview] Failed to load:", err)
  }

  return (
    <div className="w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <BookOpen className="size-4 text-neutral-400 dark:text-neutral-500 stroke-[1.75]" />
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">
            Academic Programs & Cohort Distribution
          </h2>
        </div>

        <Link
          href="/admin/curriculum"
          className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
        >
          <span>Curriculum manager</span>
          <ArrowUpRight className="size-3.5 text-neutral-400" />
        </Link>
      </div>

      {/* Asymmetric Dual Split: Left is Key Programs, Right is Sub-track Distribution */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column (spans 5 cols): Licensure Examination Pillars */}
        <div className="md:col-span-5 space-y-4 pr-0 md:pr-4 md:border-r md:border-black/5 md:dark:border-white/5">
          <div className="text-[11px] font-medium tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
            Licensure Examination Targets
          </div>

          {exams.length === 0 ? (
            <div className="py-4 text-xs text-neutral-400 dark:text-neutral-500">
              No examination programs configured.
            </div>
          ) : (
            exams.map((exam) => {
              const sharePercent = totalStudents > 0 ? Math.round((exam.student_count / totalStudents) * 100) : 0

              return (
                <div key={exam.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-neutral-900 dark:text-white leading-snug line-clamp-2">
                      {exam.name}
                    </span>
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 shrink-0">
                      {sharePercent}%
                    </span>
                  </div>

                  {/* Clean neutral distribution bar */}
                  <div className="w-full h-1.5 rounded-full bg-neutral-200/70 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-neutral-800 dark:bg-white/80 transition-all duration-500"
                      style={{ width: `${sharePercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
                    <span>{exam.batch_count} {exam.batch_count === 1 ? "active batch" : "active batches"}</span>
                    <span>{exam.student_count} reviewees</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Right Column (spans 7 cols): Specialization & Track Breakdown */}
        <div className="md:col-span-7 space-y-3">
          <div className="text-[11px] font-medium tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
            Specialization & Degree Tracks
          </div>

          {programs.length === 0 ? (
            <div className="py-4 text-xs text-neutral-400 dark:text-neutral-500">
              No degree programs registered yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {programs.map((prog) => {
                const sharePercent = totalStudents > 0 ? Math.round((prog.student_count / totalStudents) * 100) : 0

                return (
                  <div
                    key={prog.id}
                    className="p-3 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-white/[0.015] flex flex-col justify-between min-h-[76px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-neutral-900 dark:text-white line-clamp-1">
                        {prog.name}
                      </span>
                      <GraduationCap className="size-3.5 text-neutral-400 shrink-0 stroke-[1.75]" />
                    </div>

                    <div className="mt-2.5 flex items-baseline justify-between">
                      <span className="text-base font-bold text-neutral-900 dark:text-white">
                        {prog.student_count} <span className="text-[11px] font-normal text-neutral-400 dark:text-neutral-500">students</span>
                      </span>
                      <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                        {sharePercent}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
