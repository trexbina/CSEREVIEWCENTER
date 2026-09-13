import pool from "@/lib/db"
import Link from "next/link"
import { BookOpen, GraduationCap, ArrowUpRight, Award } from "lucide-react"

export async function ProgramsDistributionOverview() {
  let exams = []
  let programs = []

  try {
    const [examsRes, programsRes] = await Promise.all([
      pool.query(`
        SELECT id, name
        FROM examinations
        ORDER BY name ASC
      `),
      pool.query(`
        SELECT id, name
        FROM programs
        ORDER BY name ASC
      `)
    ])

    exams = examsRes.rows || []
    programs = programsRes.rows || []
  } catch (err) {
    console.error("[ProgramsDistributionOverview] Failed to load:", err)
  }

  return (
    <div className="w-full space-y-3">
      {/* External Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-semibold text-[#3B3B3B] dark:text-white tracking-tight">
            Programs & Courses
          </h2>
        </div>

        <Link
          href="/admin/curriculum"
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white transition-colors"
        >
          <span>Manage curriculum</span>
          <ArrowUpRight className="size-3.5 sm:size-4 text-neutral-400" />
        </Link>
      </div>

      {/* Dual Column Container (Non-analytical item display) */}
      <div className="w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column (spans 5 cols): Examinations */}
          <div className="md:col-span-5 space-y-3 pr-0 md:pr-4 md:border-r md:border-black/5 md:dark:border-white/5">
            <div className="text-[11px] font-medium tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
              Examinations
            </div>

            {exams.length === 0 ? (
              <div className="py-4 text-xs text-neutral-400 dark:text-neutral-500">
                No examinations found.
              </div>
            ) : (
              <div className="divide-y divide-black/5 dark:divide-white/5">
                {exams.map((exam) => (
                  <div key={exam.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-2.5">
                    <Award className="size-3.5 text-neutral-400 dark:text-neutral-500 shrink-0 stroke-[1.75]" />
                    <span className="text-xs sm:text-sm font-medium text-[#3B3B3B] dark:text-white leading-snug">
                      {exam.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column (spans 7 cols): Degree Programs */}
          <div className="md:col-span-7 space-y-3">
            <div className="text-[11px] font-medium tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
              Degree Programs
            </div>

            {programs.length === 0 ? (
              <div className="py-4 text-xs text-neutral-400 dark:text-neutral-500">
                No degree programs found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                {programs.map((prog) => (
                  <div
                    key={prog.id}
                    className="p-3 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-white/[0.015] flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-medium text-[#3B3B3B] dark:text-white line-clamp-1">
                      {prog.name}
                    </span>
                    <GraduationCap className="size-3.5 text-neutral-400 shrink-0 stroke-[1.75]" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

