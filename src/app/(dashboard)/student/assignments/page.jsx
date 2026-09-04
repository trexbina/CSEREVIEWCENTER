"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  RefreshCw,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  Lock,
  RotateCcw,
  HelpCircle
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
        // Pending = not open yet / scheduled
        return isTooEarly && !isSubmitted
      }
      if (statusFilter === "completed") {
        return isSubmitted
      }

      return true
    })
  }, [assignments, typeTab, statusFilter, search])

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "No deadline set"
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    })
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="pb-4 border-b border-gray-200/50">
        <div className="flex items-center gap-2.5 mb-1">
          <FileText className="h-6 w-6 text-[#E9C46A]" />
          <h1 className="text-2xl font-bold tracking-wider text-[#4d4d4d] uppercase">
            Assignments & Quizzes
          </h1>
        </div>
        <p className="text-[#8c8c8c] text-sm font-medium">
          Coursework assignments, scheduled quizzes, and submission records.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs & Dropdown Filter Row */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-gray-200/60 pb-4">
        {/* Left: Assignments vs Quizzes Buttons matching Category pills */}
        <div className="flex items-center gap-2.5">
          <div
            onClick={() => {
              setTypeTab("assignments")
              setStatusFilter("all")
            }}
            className={`group cursor-pointer flex items-center rounded-lg px-3.5 py-1.5 transition-all duration-200 ${
              typeTab === "assignments"
                ? "bg-[#E9C46A] text-slate-900 shadow-sm"
                : "bg-gray-50 text-[#4d4d4d] border border-gray-200/50 shadow-sm hover:border-gray-300 hover:bg-gray-100"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
              Assignments
            </span>
          </div>

          <div
            onClick={() => {
              setTypeTab("quizzes")
              setStatusFilter("all")
            }}
            className={`group cursor-pointer flex items-center rounded-lg px-3.5 py-1.5 transition-all duration-200 ${
              typeTab === "quizzes"
                ? "bg-[#E9C46A] text-slate-900 shadow-sm"
                : "bg-gray-50 text-[#4d4d4d] border border-gray-200/50 shadow-sm hover:border-gray-300 hover:bg-gray-100"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
              Quizzes
            </span>
          </div>
        </div>

        {/* Right: Dropdown Filter Box */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white dark:bg-card border border-gray-200 dark:border-border text-xs font-medium text-gray-700 dark:text-foreground pl-3 pr-8 py-1.5 rounded-xl shadow-2xs cursor-pointer focus:outline-none focus:border-[#E9C46A]"
          >
            <option value="all">{typeTab === "assignments" ? "All Assignments" : "All Quizzes"}</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* List / Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-6 h-6 border-2 border-[#E9C46A] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Loading {typeTab}...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-2 shadow-2xs">
          <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No {typeTab} found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No {typeTab} match the selected filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const now = Date.now()
            const isSubmitted = item.submission_status === "submitted"
            const unlockTime = item.start_date ? new Date(item.start_date).getTime() : null
            const isTooEarly = unlockTime && unlockTime > now
            const dueTime = item.due_date ? new Date(item.due_date).getTime() : null
            const isClosed = dueTime && dueTime < now && !isSubmitted

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-gray-300 dark:hover:border-border/80 transition-all"
              >
                <div className="space-y-2">
                  {/* Top Status Header (Completed / Closed) */}
                  {(isSubmitted || isClosed) && (
                    <div className="flex items-center justify-end">
                      {isSubmitted && (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 shrink-0 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Completed
                        </span>
                      )}
                      {isClosed && (
                        <span className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/40 shrink-0 flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Closed
                        </span>
                      )}
                    </div>
                  )}

                  {/* Title & Subject / Schedule Meta below */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 dark:text-foreground text-sm leading-snug">
                      {item.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap pt-0.5">
                      <span className="font-medium text-gray-600 dark:text-muted-foreground">
                        {item.subject_name}
                      </span>

                      {isTooEarly && (
                        <>
                          <span className="text-gray-300 dark:text-border">•</span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-muted-foreground bg-gray-50 dark:bg-muted/40 border border-gray-200/60 dark:border-border/60 rounded-full px-2.5 py-0.5">
                            <span>Scheduled to open:</span>
                            <span className="font-semibold text-gray-700 dark:text-foreground">{formatDateTime(item.start_date)}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer with Minimal Metadata & Action Button */}
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-border pt-3 gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-gray-400 dark:text-muted-foreground font-medium flex-wrap">
                    {item.is_assignment && item.due_date && (
                      <div className="flex items-center gap-1 text-gray-600 dark:text-foreground">
                        <Calendar className="h-3.5 w-3.5 text-[#E9C46A]" />
                        <span>Due: {formatDateTime(item.due_date)}</span>
                      </div>
                    )}
                    {item.is_assignment && item.due_date && <span className="text-gray-200 dark:text-border">|</span>}
                    <span>{item.question_count || 0} questions</span>
                    {item.time_limit_minutes > 0 && (
                      <>
                        <span className="text-gray-200 dark:text-border">|</span>
                        <span>{item.time_limit_minutes} mins</span>
                      </>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isSubmitted ? (
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-gray-800 dark:text-foreground font-mono">
                          {item.earned_points} / {item.total_points} pts
                        </span>
                        <Link
                          href={item.quiz_url}
                          className="px-3 py-1 bg-white hover:bg-gray-50 dark:bg-card dark:hover:bg-muted text-gray-700 dark:text-foreground font-semibold rounded-xl text-xs border border-gray-200 dark:border-border transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <span>Results</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                        </Link>
                      </div>
                    ) : isClosed ? (
                      <span className="px-3 py-1 bg-gray-100 text-gray-400 dark:bg-muted dark:text-muted-foreground font-medium rounded-xl text-xs cursor-not-allowed">
                        Closed
                      </span>
                    ) : isTooEarly ? null : (
                      <Link
                        href={item.quiz_url}
                        className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-[#E9C46A] hover:bg-[#dfb550] text-white font-semibold text-xs shadow-2xs transition-all cursor-pointer active:scale-95"
                      >
                        <span>Start {item.is_assignment ? "Assignment" : "Quiz"}</span>
                        <ArrowRight className="w-3 h-3" />
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
