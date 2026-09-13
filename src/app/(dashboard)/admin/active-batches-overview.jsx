import pool from "@/lib/db"
import Link from "next/link"
import { Calendar, Users, ArrowUpRight, Clock } from "lucide-react"

function getDaysRemaining(endDateStr) {
  if (!endDateStr) return null
  const end = new Date(endDateStr)
  end.setHours(23, 59, 59, 999)
  const now = new Date()
  const diffTime = end.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr) {
  if (!dateStr) return "No date set"
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export async function ActiveBatchesOverview() {
  let batches = []

  try {
    const res = await pool.query(`
      SELECT 
        b.id,
        b.name,
        b.target_year,
        b.status,
        b.start_date,
        b.end_date,
        e.name as exam_name,
        (SELECT COUNT(*)::int FROM users u WHERE u.batch_id = b.id AND u.role = 'student') as student_count
      FROM batches b
      LEFT JOIN examinations e ON b.exam_id = e.id
      ORDER BY b.end_date ASC NULLS LAST, b.name ASC
    `)
    batches = res.rows || []
  } catch (err) {
    console.error("[ActiveBatchesOverview] Failed to load batches:", err)
  }

  return (
    <div className="w-full space-y-3">
      {/* External Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white tracking-tight">
            Batches
          </h2>
          <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 bg-black/5 dark:bg-white/5 px-2.5 py-0.5 rounded-full">
            {batches.length} {batches.length === 1 ? "batch" : "batches"}
          </span>
        </div>

        <Link
          href="/admin/subscriptions"
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
        >
          <span>View all</span>
          <ArrowUpRight className="size-3.5 sm:size-4 text-neutral-400" />
        </Link>
      </div>

      {/* Batches Table / Clean List inside Container */}
      <div className="w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs p-5 sm:p-6">
        <div className="divide-y divide-black/5 dark:divide-white/5">
        {batches.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
            No active batches created yet.
          </div>
        ) : (
          batches.map((batch) => {
            const daysLeft = getDaysRemaining(batch.end_date)
            const isExpired = daysLeft !== null && daysLeft <= 0
            const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 14

            return (
              <div
                key={batch.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Batch Name & Exam Target */}
                <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full shrink-0 bg-neutral-300 dark:bg-neutral-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        {batch.name}
                      </span>
                      {batch.target_year && (
                        <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                          ({batch.target_year})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {batch.exam_name || "General Review"}
                    </div>
                  </div>
                </div>

                {/* Right: Students Enrolled + Term Expiry Info */}
                <div className="flex items-center gap-5 sm:gap-7 text-xs self-end sm:self-center">
                  {/* Students Count */}
                  <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                    <Users className="size-3.5 text-neutral-400 stroke-[1.75]" />
                    <span>
                      {batch.student_count}{" "}
                      <span className="text-neutral-400 dark:text-neutral-500 text-[11px]">
                        enrolled
                      </span>
                    </span>
                  </div>

                  {/* Term Deadline */}
                  <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                    <Clock className="size-3.5 text-neutral-400 stroke-[1.75]" />
                    <span>
                      {formatDate(batch.end_date)}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="min-w-[76px] text-right">
                    {isExpired ? (
                      <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                        Term ended
                      </span>
                    ) : isExpiringSoon ? (
                      <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        {daysLeft}d left
                      </span>
                    ) : daysLeft !== null ? (
                      <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                        {daysLeft}d left
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                        Ongoing
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        </div>
      </div>
    </div>
  )
}
