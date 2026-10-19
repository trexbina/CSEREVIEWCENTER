"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  RefreshCw,
  AlertCircle,
} from "lucide-react"

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Type Tab: 'assignments' | 'quizzes'
  const [typeTab, setTypeTab] = useState("assignments")
  // Status Filter: 'all' | 'pending' | 'completed'
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")

  const fetchAssignments = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/student/assignments?t=${Date.now()}`, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load assignments.")
      setAssignments(data.assignments || [])
    } catch (err) {
      setError(err.message || "Network error loading assignments.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  const filteredItems = useMemo(() => {
    const now = Date.now()
    return assignments.filter((item) => {
      // 1. Match typeTab
      if (typeTab === "assignments" && !item.is_assignment) return false
      if (typeTab === "quizzes" && item.is_assignment) return false

      // 2. Search query
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase())

      if (!matchesSearch) return false

      // 3. Status filter
      const isSubmitted = item.submission_status === "submitted"
      const unlockTime = item.start_date ? new Date(item.start_date).getTime() : null
      const isTooEarly = unlockTime && unlockTime > now

      if (statusFilter === "pending") {
        return isTooEarly && !isSubmitted
      }
      if (statusFilter === "completed") {
        return isSubmitted
      }

      return true
    })
  }, [assignments, typeTab, statusFilter, search])

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "No deadline"
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 space-y-6 sm:space-y-8 pb-10">
      {/* ── Page Heading ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
            Assignments & Quizzes
          </h1>
          <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal">
            Your coursework assignments, scheduled quizzes, and scores.
          </p>
        </div>
      </div>

      {/* ── Error Notification ── */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-rose-600 dark:text-rose-300 text-xs font-medium flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Tabs & Filter Controls Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
        {/* Left: Minimal Segmented Toggle for Assignments vs Quizzes */}
        <div className="flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl border border-black/5 dark:border-white/10 w-fit select-none">
          <button
            type="button"
            onClick={() => {
              setTypeTab("assignments")
              setStatusFilter("all")
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${typeTab === "assignments"
              ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
              : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
              }`}
          >
            Assignments
          </button>
          <button
            type="button"
            onClick={() => {
              setTypeTab("quizzes")
              setStatusFilter("all")
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${typeTab === "quizzes"
              ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
              : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
              }`}
          >
            Quizzes
          </button>
        </div>

        {/* Right: Search + Filter Dropdown + Refresh Button */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Search box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 pointer-events-none select-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${typeTab}...`}
              className="w-full h-8 pl-8 pr-3 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-xs text-[#3B3B3B] dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 transition-all shadow-2xs"
            />
          </div>

          {/* Status Select dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white px-3 shadow-2xs cursor-pointer focus:outline-none transition-all"
          >
            <option value="all">All</option>
            <option value="pending">Scheduled</option>
            <option value="completed">Completed</option>
          </select>

          {/* Refresh button */}
          <button
            type="button"
            onClick={fetchAssignments}
            title="Refresh"
            aria-label="Refresh list"
            className="size-8 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white hover:bg-white/90 flex items-center justify-center transition-all shadow-2xs shrink-0 cursor-pointer active:scale-95"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Line Divider ── */}
      <div className="border-t border-black/5 dark:border-white/10" />

      {/* ── Content Grid / Cards ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="size-6 border-2 border-neutral-300 dark:border-neutral-600 border-t-[#3B3B3B] dark:border-t-white rounded-full animate-spin" />
          <p className="text-xs text-neutral-400 dark:text-neutral-500 font-normal">
            Loading {typeTab}...
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center space-y-1 select-none">
          <h3 className="text-xs font-semibold text-[#3B3B3B] dark:text-white">
            No {typeTab} found
          </h3>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            No {typeTab} match your selected filter right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredItems.map((item) => {
            const now = Date.now()
            const isSubmitted = item.submission_status === "submitted"
            const unlockTime = item.start_date ? new Date(item.start_date).getTime() : null
            const isTooEarly = unlockTime && unlockTime > now
            const dueTime = item.due_date ? new Date(item.due_date).getTime() : null
            const isClosed = dueTime && dueTime < now && !isSubmitted
            const headerColor = item.is_assignment
              ? "bg-[#2A9D8F]/20 dark:bg-[#2A9D8F]/25"
              : "bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25"

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between"
              >
                {/* ── Card Header: Signature Colored Header ── */}
                <div className={`relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)] ${headerColor}`}>
                  <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 truncate select-none">
                    {item.subject_name || (item.is_assignment ? "ASSIGNMENT" : "QUIZ")}
                  </span>
                  <span className="text-[11px] font-semibold text-[#3B3B3B] dark:text-white">
                    {isSubmitted ? "Completed" : isClosed ? "Closed" : isTooEarly ? "Scheduled" : "Open"}
                  </span>
                </div>

                {/* ── Card Body ── */}
                <div className="p-5 sm:p-6 flex flex-col justify-between gap-4 flex-1">
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-semibold text-[#3B3B3B] dark:text-white line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 line-clamp-1">
                      {item.description || item.subject_name || "Coursework module"}
                    </p>
                  </div>

                  {/* Meta details */}
                  <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 flex-wrap">
                    {item.due_date && (
                      <span>Due {formatDateTime(item.due_date)}</span>
                    )}
                    {isTooEarly && item.start_date && (
                      <span>Opens {formatDateTime(item.start_date)}</span>
                    )}
                    {item.question_count > 0 && (
                      <>
                        <span>·</span>
                        <span>{item.question_count} questions</span>
                      </>
                    )}
                    {item.time_limit_minutes > 0 && (
                      <>
                        <span>·</span>
                        <span>{item.time_limit_minutes} mins</span>
                      </>
                    )}
                  </div>

                  {/* ── Footer / Actions ── */}
                  <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                      {isSubmitted
                        ? `${item.earned_points ?? 0} / ${item.total_points ?? 0} pts`
                        : isClosed
                          ? "Closed"
                          : isTooEarly
                            ? "Locked"
                            : "Not taken yet"}
                    </span>

                    {/* White button matching Student Dashboard cards */}
                    {isSubmitted ? (
                      <Link
                        href={item.quiz_url}
                        className="inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 border border-black/5 dark:border-white/10 transition-all shadow-2xs shrink-0 cursor-pointer"
                      >
                        Review
                      </Link>
                    ) : isClosed ? (
                      <span className="inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-neutral-400 dark:text-neutral-500 bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 cursor-not-allowed select-none">
                        Closed
                      </span>
                    ) : isTooEarly ? (
                      <span className="inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-neutral-400 dark:text-neutral-500 bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 cursor-not-allowed select-none">
                        Locked
                      </span>
                    ) : (
                      <Link
                        href={item.quiz_url}
                        className="inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 border border-black/5 dark:border-white/10 transition-all shadow-2xs shrink-0 cursor-pointer"
                      >
                        {item.is_assignment ? "Start Assignment" : "Start Quiz"}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
