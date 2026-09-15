"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  RefreshCw,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Award,
  FileCheck2,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Check,
  Target,
  Flame
} from "lucide-react"
import { LordIcon } from "@/components/ui/lord-icon"

export default function MyProgressPage() {
  const [activeTab, setActiveTab] = useState("quizzes") // "quizzes" | "assignments" | "mockExams"
  const [data, setData] = useState({ quizzes: [], assignments: [], mockExams: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL") // "ALL" | "COMPLETED" | "PENDING"
  const [sortField, setSortField] = useState("date")
  const [sortDir, setSortDir] = useState("desc")

  const [selectedSubject, setSelectedSubject] = useState("ALL")
  const [selectedSubcategory, setSelectedSubcategory] = useState("ALL")

  // State for interactive expandable cards
  const [isQuizCardExpanded, setIsQuizCardExpanded] = useState(false)
  const [isAssignmentCardExpanded, setIsAssignmentCardExpanded] = useState(false)
  const [isMockExamCardExpanded, setIsMockExamCardExpanded] = useState(false)

  const fetchProgress = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/student/progress?t=${Date.now()}`, { cache: "no-store" })
      if (res.ok) {
        const json = await res.json()
        setData({
          quizzes: json.quizzes || [],
          assignments: json.assignments || [],
          mockExams: json.mockExams || []
        })
      }
    } catch (err) {
      console.error("Failed to load progress:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProgress()
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearch("")
    setStatusFilter("ALL")
    setSelectedSubject("ALL")
    setSelectedSubcategory("ALL")
    setSortField("date")
    setSortDir("desc")
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const handleSubcategoryChange = (subcat) => {
    setSelectedSubcategory(subcat)
    // Always reset selected subject when changing subcategory to ensure accurate options
    setSelectedSubject("ALL")
  }

  // Derive available subcategories for the current tab
  const subcategoryOptions = useMemo(() => {
    const list = data[activeTab] || []
    const subcats = new Set()

    list.forEach((item) => {
      if (item.subcategoryName) subcats.add(item.subcategoryName)
    })

    return Array.from(subcats).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  }, [data, activeTab])

  // Derive subjects accurately belonging to the selected subcategory (or all if ALL selected)
  const subjectOptions = useMemo(() => {
    const list = data[activeTab] || []
    const subjs = new Set()

    list.forEach((item) => {
      if (!item.subjectName) return
      // If a subcategory is picked, only include subjects under this subcategory
      if (selectedSubcategory !== "ALL") {
        if (item.subcategoryName?.toLowerCase() === selectedSubcategory.toLowerCase()) {
          subjs.add(item.subjectName)
        }
      } else {
        subjs.add(item.subjectName)
      }
    })

    return Array.from(subjs).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  }, [data, activeTab, selectedSubcategory])

  // Get current list based on active tab and filters
  const currentItems = useMemo(() => {
    const list = data[activeTab] || []

    return list.filter((item) => {
      // 1. Status filter
      if (statusFilter === "COMPLETED" && !item.isCompleted) return false
      if (statusFilter === "PENDING" && item.isCompleted) return false

      // 2. Subcategory filter
      if (
        selectedSubcategory !== "ALL" &&
        item.subcategoryName?.toLowerCase() !== selectedSubcategory.toLowerCase()
      ) {
        return false
      }

      // 3. Subject filter
      if (selectedSubject !== "ALL" && item.subjectName !== selectedSubject) {
        return false
      }

      // 4. Search filter
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const matchTitle = item.title?.toLowerCase().includes(q)
        const matchSubject = item.subjectName?.toLowerCase().includes(q)
        const matchCategory = item.categoryName?.toLowerCase().includes(q)
        const matchSubcat = item.subcategoryName?.toLowerCase().includes(q)
        const matchModule = item.moduleName?.toLowerCase().includes(q)
        const matchCode = item.code?.toLowerCase().includes(q)
        if (!matchTitle && !matchSubject && !matchCategory && !matchSubcat && !matchModule && !matchCode) {
          return false
        }
      }
      return true
    }).sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      if (sortField === "date") {
        aVal = a.completedAt ? new Date(a.completedAt).getTime() : 0
        bVal = b.completedAt ? new Date(b.completedAt).getTime() : 0
      } else if (sortField === "score") {
        aVal = a.percentage ?? -1
        bVal = b.percentage ?? -1
      } else if (sortField === "name") {
        aVal = a.title || ""
        bVal = b.title || ""
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      aVal = aVal ?? 0
      bVal = bVal ?? 0
      return sortDir === "asc" ? aVal - bVal : bVal - aVal
    })
  }, [data, activeTab, search, statusFilter, selectedSubject, selectedSubcategory, sortField, sortDir])

  // Helper to compute category statistics (quizzes, assignments, mock exams)
  const computeStats = (list = [], itemTypeSingular = "quiz", itemTypePlural = "quizzes") => {
    const total = list.length
    const completedList = list.filter((item) => item.isCompleted)
    const completedCount = completedList.length
    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0

    let sumPercentages = 0
    let passedCount = 0
    completedList.forEach((item) => {
      if (item.percentage != null) sumPercentages += item.percentage
      if (item.passed) passedCount++
    })

    const avgScore = completedCount > 0 ? Math.round(sumPercentages / completedCount) : null

    // Determine performance status rating
    let statusLabel = "Not Started"
    let statusColor = "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 border-gray-200 dark:border-white/10"
    let statusSummary = `Complete available ${itemTypePlural} to track your assessment readiness.`

    if (completedCount > 0) {
      if (avgScore >= 85) {
        statusLabel = "Excellent Standing"
        statusColor = "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/50"
        statusSummary = `Great mastery! Your ${itemTypeSingular} scores demonstrate strong grasp of concepts.`
      } else if (avgScore >= 75) {
        statusLabel = "Good Progress"
        statusColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40"
        statusSummary = "You are doing good! Meeting standard proficiency across modules."
      } else if (avgScore >= 60) {
        statusLabel = "Needs Reinforcement"
        statusColor = "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/50"
        statusSummary = "Close to passing standard. A quick review of previous topics will boost your score."
      } else {
        statusLabel = "Attention Required"
        statusColor = "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/50"
        statusSummary = "Scores are below passing threshold. Consider reviewing the module lessons."
      }
    }

    // Cute, conversational speech bubble message with light tint background depending on % (borderless)
    let speechBubble = {
      title: "Ready when you are!",
      message: `Take your first ${itemTypeSingular} whenever you feel prepared — take it one step at a time.`,
      bubbleBg: "bg-gray-50/90 dark:bg-white/[0.04] text-[#3B3B3B] dark:text-gray-200",
      tailBorder: "border-b-gray-50/90 dark:border-b-[#1C1E22]"
    }

    if (completedCount > 0) {
      if (avgScore >= 85) {
        speechBubble = {
          title: "You're on fire!",
          message: `Amazing ${itemTypeSingular} scores! Your hard work is really shining through.`,
          bubbleBg: "bg-emerald-50/90 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200",
          tailBorder: "border-b-emerald-50/90 dark:border-b-[#0e2419]"
        }
      } else if (avgScore >= 75) {
        speechBubble = {
          title: "Doing wonderful!",
          message: "You've got a great rhythm going. Keep this friendly momentum up!",
          bubbleBg: "bg-teal-50/90 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200",
          tailBorder: "border-b-teal-50/90 dark:border-b-[#0f2324]"
        }
      } else if (avgScore >= 60) {
        speechBubble = {
          title: "Almost got it!",
          message: "You're getting so close. A gentle review of tricky items will get you right there.",
          bubbleBg: "bg-amber-50/90 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200",
          tailBorder: "border-b-amber-50/90 dark:border-b-[#261f12]"
        }
      } else {
        speechBubble = {
          title: "Practice makes perfect!",
          message: `Every ${itemTypeSingular} is just practice. Review the lesson notes and try again — you can do this!`,
          bubbleBg: "bg-rose-50/90 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200",
          tailBorder: "border-b-rose-50/90 dark:border-b-[#2a1317]"
        }
      }
    }

    let scoreColor = "text-gray-400"
    let scoreStroke = "#9CA3AF"
    if (avgScore != null) {
      if (avgScore >= 75) {
        scoreColor = "text-emerald-600 dark:text-emerald-400"
        scoreStroke = "#10B981" // emerald
      } else if (avgScore >= 60) {
        scoreColor = "text-amber-500 dark:text-amber-400"
        scoreStroke = "#F59E0B" // amber
      } else {
        scoreColor = "text-rose-500 dark:text-rose-400"
        scoreStroke = "#F43F5E" // rose
      }
    }

    return {
      total,
      completedCount,
      completionRate,
      avgScore,
      passedCount,
      statusLabel,
      statusColor,
      statusSummary,
      scoreColor,
      scoreStroke,
      speechBubble
    }
  }

  // Compute stats for all 3 categories
  const quizStats = useMemo(() => computeStats(data.quizzes, "quiz", "quizzes"), [data.quizzes])
  const assignmentStats = useMemo(() => computeStats(data.assignments, "assignment", "assignments"), [data.assignments])
  const mockExamStats = useMemo(() => computeStats(data.mockExams, "mock exam", "mock exams"), [data.mockExams])

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Minimal Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-black/5 dark:border-white/5 pb-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[#3B3B3B] dark:text-white font-sans">
            My Progress
          </h1>
          <p className="text-xs text-[#696969] dark:text-gray-400 mt-0.5">
            Track your quiz scores, assignments, and test results.
          </p>
        </div>
      </div>

      {/* ═══ SECTION: Performance Cards (Interactive & Expandable) ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {/* Card 1: Interactive Quiz Performance & Completion Card */}
        <div
          onClick={() => setIsQuizCardExpanded(!isQuizCardExpanded)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setIsQuizCardExpanded(!isQuizCardExpanded)
            }
          }}
          className="group bg-white dark:bg-card border border-black/5 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-sm transition-all duration-300 cursor-pointer select-none relative overflow-hidden focus:outline-none"
        >
          {/* Collapsed State: Animated Pencil Icon followed by Header and Click Prompt */}
          {!isQuizCardExpanded ? (
            <div className="flex items-center justify-between gap-4 py-1">
              {/* Left group: Icon before text */}
              <div className="flex items-center gap-4 min-w-0">
                {/* Animated Pencil Icon - larger size (76px), no background/border, in primary #E9C46A */}
                <div className="shrink-0 flex items-center justify-center text-[#E9C46A] [&_svg]:![--lord-icon-primary:#E9C46A] [&_path]:!stroke-[#E9C46A]">
                  <LordIcon
                    src="/icons/myprogress/pencil.json"
                    size={76}
                    speed={0.65}
                    delay={2800}
                    trigger="loop"
                    className="[&_path]:!stroke-[#E9C46A]"
                  />
                </div>

                {/* Text info */}
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-base font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    Quiz Progress
                  </h3>
                  <p className="text-xs text-[#696969] dark:text-gray-400">
                    Click to view your quiz progress
                  </p>
                </div>
              </div>

              {/* Right indicator: subtle expand chevron */}
              <ChevronDown className="size-4 text-[#696969] dark:text-gray-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
            </div>
          ) : (
            /* Minimal Expanded State */
            <div className="space-y-4 py-1">
              {/* Simple Top Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Icon without background - enlarged to 34px */}
                  <div className="shrink-0 flex items-center justify-center text-[#E9C46A] [&_svg]:![--lord-icon-primary:#E9C46A] [&_path]:!stroke-[#E9C46A]">
                    <LordIcon
                      src="/icons/myprogress/pencil.json"
                      size={34}
                      speed={0.65}
                      delay={2800}
                      trigger="loop"
                      className="[&_path]:!stroke-[#E9C46A]"
                    />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-base font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                      Quiz Progress
                    </h3>
                    <p className="text-xs text-[#696969] dark:text-gray-400">
                      Your completion and score summary
                    </p>
                  </div>
                </div>

                <ChevronUp className="size-4 text-[#696969] dark:text-gray-400 shrink-0 transition-transform" />
              </div>

              {/* 2 Minimal Circular Progress Rings: Completed & Accuracy (Enlarged size-14) */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                {/* 1. Completion Circle */}
                <div className="flex items-center gap-3.5">
                  {/* SVG Circle Progress Ring - enlarged to 56px / size-14 */}
                  <div className="relative size-14 shrink-0 flex items-center justify-center">
                    <svg className="size-full -rotate-90" viewBox="0 0 56 56">
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4.5"
                        className="text-black/5 dark:text-white/10"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="#E9C46A"
                        strokeWidth="4.5"
                        strokeDasharray={138.2}
                        strokeDashoffset={138.2 - (138.2 * quizStats.completionRate) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#3B3B3B] dark:text-white">
                      {quizStats.completionRate}%
                    </span>
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-semibold text-[#3B3B3B] dark:text-white block truncate">
                      Completed
                    </span>
                    <span className="text-[11px] text-[#696969] dark:text-gray-400 block leading-tight">
                      {quizStats.completedCount} of {quizStats.total} quizzes
                    </span>
                  </div>
                </div>

                {/* 2. Accuracy Circle */}
                <div className="flex items-center gap-3.5">
                  {/* SVG Circle Progress Ring - enlarged to 56px / size-14 */}
                  <div className="relative size-14 shrink-0 flex items-center justify-center">
                    <svg className="size-full -rotate-90" viewBox="0 0 56 56">
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4.5"
                        className="text-black/5 dark:text-white/10"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke={quizStats.scoreStroke}
                        strokeWidth="4.5"
                        strokeDasharray={138.2}
                        strokeDashoffset={
                          quizStats.avgScore != null
                            ? 138.2 - (138.2 * quizStats.avgScore) / 100
                            : 138.2
                        }
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${quizStats.avgScore != null ? quizStats.scoreColor : "text-gray-400"}`}>
                      {quizStats.avgScore != null ? `${quizStats.avgScore}%` : "—"}
                    </span>
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-semibold text-[#3B3B3B] dark:text-white block truncate">
                      Accuracy
                    </span>
                    <span className="text-[11px] text-[#696969] dark:text-gray-400 block leading-tight">
                      {quizStats.passedCount} of {quizStats.completedCount} passed
                    </span>
                  </div>
                </div>
              </div>

              {/* Cute Minimal Speech Bubble (No Icon) */}
              <div className="relative pt-2 animate-in zoom-in-95 fade-in duration-300">
                {/* Speech Bubble Tail */}
                <div
                  className={`absolute top-1 left-6 -translate-y-1/2 w-0 h-0 border-x-[6px] border-x-transparent border-b-[8px] z-10 ${quizStats.speechBubble.tailBorder}`}
                />

                {/* Speech Bubble Body (Borderless, soft light background) */}
                <div
                  className={`p-3 sm:p-3.5 rounded-2xl rounded-tl-sm shadow-2xs space-y-1 transition-colors ${quizStats.speechBubble.bubbleBg}`}
                >
                  <span className="text-xs font-bold leading-tight block tracking-tight">
                    {quizStats.speechBubble.title}
                  </span>
                  <p className="text-[11px] opacity-90 leading-relaxed font-normal">
                    {quizStats.speechBubble.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Interactive Assignment Performance & Completion Card */}
        <div
          onClick={() => setIsAssignmentCardExpanded(!isAssignmentCardExpanded)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setIsAssignmentCardExpanded(!isAssignmentCardExpanded)
            }
          }}
          className="group bg-white dark:bg-card border border-black/5 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-sm transition-all duration-300 cursor-pointer select-none relative overflow-hidden focus:outline-none"
        >
          {/* Collapsed State: Animated Assignments Icon followed by Header and Click Prompt */}
          {!isAssignmentCardExpanded ? (
            <div className="flex items-center justify-between gap-4 py-1">
              {/* Left group: Icon before text */}
              <div className="flex items-center gap-4 min-w-0">
                {/* Animated Assignment Icon - 76px, no background/border, in primary #E9C46A */}
                <div className="shrink-0 flex items-center justify-center text-[#E9C46A] [&_svg]:![--lord-icon-primary:#E9C46A] [&_path]:!stroke-[#E9C46A]">
                  <LordIcon
                    src="/icons/myprogress/assignments.json"
                    size={76}
                    speed={0.65}
                    delay={2800}
                    trigger="loop"
                    className="[&_path]:!stroke-[#E9C46A]"
                  />
                </div>

                {/* Text info */}
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-base font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    Assignment Progress
                  </h3>
                  <p className="text-xs text-[#696969] dark:text-gray-400">
                    Click to view your assignment progress
                  </p>
                </div>
              </div>

              {/* Right indicator: subtle expand chevron */}
              <ChevronDown className="size-4 text-[#696969] dark:text-gray-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
            </div>
          ) : (
            /* Minimal Expanded State */
            <div className="space-y-4 py-1">
              {/* Simple Top Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Icon without background - 34px */}
                  <div className="shrink-0 flex items-center justify-center text-[#E9C46A] [&_svg]:![--lord-icon-primary:#E9C46A] [&_path]:!stroke-[#E9C46A]">
                    <LordIcon
                      src="/icons/myprogress/assignments.json"
                      size={34}
                      speed={0.65}
                      delay={2800}
                      trigger="loop"
                      className="[&_path]:!stroke-[#E9C46A]"
                    />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-base font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                      Assignment Progress
                    </h3>
                    <p className="text-xs text-[#696969] dark:text-gray-400">
                      Your completion and score summary
                    </p>
                  </div>
                </div>

                <ChevronUp className="size-4 text-[#696969] dark:text-gray-400 shrink-0 transition-transform" />
              </div>

              {/* 2 Minimal Circular Progress Rings: Completed & Accuracy */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                {/* 1. Completion Circle */}
                <div className="flex items-center gap-3.5">
                  <div className="relative size-14 shrink-0 flex items-center justify-center">
                    <svg className="size-full -rotate-90" viewBox="0 0 56 56">
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4.5"
                        className="text-black/5 dark:text-white/10"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="#E9C46A"
                        strokeWidth="4.5"
                        strokeDasharray={138.2}
                        strokeDashoffset={138.2 - (138.2 * assignmentStats.completionRate) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#3B3B3B] dark:text-white">
                      {assignmentStats.completionRate}%
                    </span>
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-semibold text-[#3B3B3B] dark:text-white block truncate">
                      Completed
                    </span>
                    <span className="text-[11px] text-[#696969] dark:text-gray-400 block leading-tight">
                      {assignmentStats.completedCount} of {assignmentStats.total} assignments
                    </span>
                  </div>
                </div>

                {/* 2. Accuracy Circle */}
                <div className="flex items-center gap-3.5">
                  <div className="relative size-14 shrink-0 flex items-center justify-center">
                    <svg className="size-full -rotate-90" viewBox="0 0 56 56">
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4.5"
                        className="text-black/5 dark:text-white/10"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke={assignmentStats.scoreStroke}
                        strokeWidth="4.5"
                        strokeDasharray={138.2}
                        strokeDashoffset={
                          assignmentStats.avgScore != null
                            ? 138.2 - (138.2 * assignmentStats.avgScore) / 100
                            : 138.2
                        }
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${assignmentStats.avgScore != null ? assignmentStats.scoreColor : "text-gray-400"}`}>
                      {assignmentStats.avgScore != null ? `${assignmentStats.avgScore}%` : "—"}
                    </span>
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-semibold text-[#3B3B3B] dark:text-white block truncate">
                      Accuracy
                    </span>
                    <span className="text-[11px] text-[#696969] dark:text-gray-400 block leading-tight">
                      {assignmentStats.passedCount} of {assignmentStats.completedCount} passed
                    </span>
                  </div>
                </div>
              </div>

              {/* Cute Minimal Speech Bubble (No Icon) */}
              <div className="relative pt-2 animate-in zoom-in-95 fade-in duration-300">
                {/* Speech Bubble Tail */}
                <div
                  className={`absolute top-1 left-6 -translate-y-1/2 w-0 h-0 border-x-[6px] border-x-transparent border-b-[8px] z-10 ${assignmentStats.speechBubble.tailBorder}`}
                />

                {/* Speech Bubble Body (Borderless, soft light background) */}
                <div
                  className={`p-3 sm:p-3.5 rounded-2xl rounded-tl-sm shadow-2xs space-y-1 transition-colors ${assignmentStats.speechBubble.bubbleBg}`}
                >
                  <span className="text-xs font-bold leading-tight block tracking-tight">
                    {assignmentStats.speechBubble.title}
                  </span>
                  <p className="text-[11px] opacity-90 leading-relaxed font-normal">
                    {assignmentStats.speechBubble.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Interactive Mock Exam Performance & Completion Card */}
        <div
          onClick={() => setIsMockExamCardExpanded(!isMockExamCardExpanded)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setIsMockExamCardExpanded(!isMockExamCardExpanded)
            }
          }}
          className="group bg-white dark:bg-card border border-black/5 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-sm transition-all duration-300 cursor-pointer select-none relative overflow-hidden focus:outline-none"
        >
          {/* Collapsed State: Animated Mock Exams Icon followed by Header and Click Prompt */}
          {!isMockExamCardExpanded ? (
            <div className="flex items-center justify-between gap-4 py-1">
              {/* Left group: Icon before text */}
              <div className="flex items-center gap-4 min-w-0">
                {/* Animated Mock Exam Icon - 76px, no background/border, in primary #E9C46A */}
                <div className="shrink-0 flex items-center justify-center text-[#E9C46A] [&_svg]:![--lord-icon-primary:#E9C46A] [&_path]:!stroke-[#E9C46A]">
                  <LordIcon
                    src="/icons/myprogress/mockexams.json"
                    size={76}
                    speed={0.65}
                    delay={2800}
                    trigger="loop"
                    className="[&_path]:!stroke-[#E9C46A]"
                  />
                </div>

                {/* Text info */}
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-base font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    Mock Exam Progress
                  </h3>
                  <p className="text-xs text-[#696969] dark:text-gray-400">
                    Click to view your mock exam progress
                  </p>
                </div>
              </div>

              {/* Right indicator: subtle expand chevron */}
              <ChevronDown className="size-4 text-[#696969] dark:text-gray-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
            </div>
          ) : (
            /* Minimal Expanded State */
            <div className="space-y-4 py-1">
              {/* Simple Top Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Icon without background - 34px */}
                  <div className="shrink-0 flex items-center justify-center text-[#E9C46A] [&_svg]:![--lord-icon-primary:#E9C46A] [&_path]:!stroke-[#E9C46A]">
                    <LordIcon
                      src="/icons/myprogress/mockexams.json"
                      size={34}
                      speed={0.65}
                      delay={2800}
                      trigger="loop"
                      className="[&_path]:!stroke-[#E9C46A]"
                    />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-base font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                      Mock Exam Progress
                    </h3>
                    <p className="text-xs text-[#696969] dark:text-gray-400">
                      Your completion and score summary
                    </p>
                  </div>
                </div>

                <ChevronUp className="size-4 text-[#696969] dark:text-gray-400 shrink-0 transition-transform" />
              </div>

              {/* 2 Minimal Circular Progress Rings: Completed & Accuracy */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                {/* 1. Completion Circle */}
                <div className="flex items-center gap-3.5">
                  <div className="relative size-14 shrink-0 flex items-center justify-center">
                    <svg className="size-full -rotate-90" viewBox="0 0 56 56">
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4.5"
                        className="text-black/5 dark:text-white/10"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="#E9C46A"
                        strokeWidth="4.5"
                        strokeDasharray={138.2}
                        strokeDashoffset={138.2 - (138.2 * mockExamStats.completionRate) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#3B3B3B] dark:text-white">
                      {mockExamStats.completionRate}%
                    </span>
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-semibold text-[#3B3B3B] dark:text-white block truncate">
                      Completed
                    </span>
                    <span className="text-[11px] text-[#696969] dark:text-gray-400 block leading-tight">
                      {mockExamStats.completedCount} of {mockExamStats.total} mock exams
                    </span>
                  </div>
                </div>

                {/* 2. Accuracy Circle */}
                <div className="flex items-center gap-3.5">
                  <div className="relative size-14 shrink-0 flex items-center justify-center">
                    <svg className="size-full -rotate-90" viewBox="0 0 56 56">
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4.5"
                        className="text-black/5 dark:text-white/10"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke={mockExamStats.scoreStroke}
                        strokeWidth="4.5"
                        strokeDasharray={138.2}
                        strokeDashoffset={
                          mockExamStats.avgScore != null
                            ? 138.2 - (138.2 * mockExamStats.avgScore) / 100
                            : 138.2
                        }
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${mockExamStats.avgScore != null ? mockExamStats.scoreColor : "text-gray-400"}`}>
                      {mockExamStats.avgScore != null ? `${mockExamStats.avgScore}%` : "—"}
                    </span>
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-semibold text-[#3B3B3B] dark:text-white block truncate">
                      Accuracy
                    </span>
                    <span className="text-[11px] text-[#696969] dark:text-gray-400 block leading-tight">
                      {mockExamStats.passedCount} of {mockExamStats.completedCount} passed
                    </span>
                  </div>
                </div>
              </div>

              {/* Cute Minimal Speech Bubble (No Icon) */}
              <div className="relative pt-2 animate-in zoom-in-95 fade-in duration-300">
                {/* Speech Bubble Tail */}
                <div
                  className={`absolute top-1 left-6 -translate-y-1/2 w-0 h-0 border-x-[6px] border-x-transparent border-b-[8px] z-10 ${mockExamStats.speechBubble.tailBorder}`}
                />

                {/* Speech Bubble Body (Borderless, soft light background) */}
                <div
                  className={`p-3 sm:p-3.5 rounded-2xl rounded-tl-sm shadow-2xs space-y-1 transition-colors ${mockExamStats.speechBubble.bubbleBg}`}
                >
                  <span className="text-xs font-bold leading-tight block tracking-tight">
                    {mockExamStats.speechBubble.title}
                  </span>
                  <p className="text-[11px] opacity-90 leading-relaxed font-normal">
                    {mockExamStats.speechBubble.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Separator Between Cards & Scores Table ═══ */}
      <div className="border-t border-black/5 dark:border-white/10 pt-2" />

      {/* ═══ SECTION: Progress Scores Table with Filter Tabs ═══ */}
      <div className="space-y-4">
        {/* Header & Controls: Filter Tabs & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Minimal Pill Tab Switcher */}
          <div className="inline-flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleTabChange("quizzes")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "quizzes"
                  ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                  : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
              }`}
            >
              Quizzes ({data.quizzes.length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("assignments")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "assignments"
                  ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                  : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
              }`}
            >
              Assignments ({data.assignments.length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("mockExams")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "mockExams"
                  ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                  : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
              }`}
            >
              Mock Exams ({data.mockExams.length})
            </button>
          </div>

          {/* Minimal Refresh button */}
          <button
            type="button"
            onClick={fetchProgress}
            disabled={loading}
            className="self-end sm:self-auto inline-flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-medium text-[#696969] dark:text-gray-400 bg-white dark:bg-white/5 hover:text-[#3B3B3B] dark:hover:text-white border border-black/5 dark:border-white/10 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh score records"
          >
            <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Minimal Unified Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Left: Minimal Search Bar, Curriculum Filter & Status Combo Box */}
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#696969]/60 dark:text-gray-400" />
              <input
                type="search"
                placeholder={
                  activeTab === "mockExams"
                    ? "Search mock exams…"
                    : activeTab === "assignments"
                    ? "Search assignments…"
                    : "Search quizzes…"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs"
              />
            </div>

            {/* Single Combined Curriculum Dropdown (Quizzes & Assignments) */}
            {activeTab !== "mockExams" && (subcategoryOptions.length > 0 || subjectOptions.length > 0) && (
              <div className="relative">
                <select
                  aria-label="Filter by subject or subcategory"
                  value={
                    selectedSubject !== "ALL"
                      ? `SUBJ:${selectedSubject}`
                      : selectedSubcategory !== "ALL"
                      ? `CAT:${selectedSubcategory}`
                      : "ALL"
                  }
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "ALL") {
                      setSelectedSubcategory("ALL")
                      setSelectedSubject("ALL")
                    } else if (val.startsWith("CAT:")) {
                      const subcat = val.replace("CAT:", "")
                      setSelectedSubcategory(subcat)
                      setSelectedSubject("ALL")
                    } else if (val.startsWith("SUBJ:")) {
                      const subj = val.replace("SUBJ:", "")
                      const match = (data[activeTab] || []).find((i) => i.subjectName === subj)
                      if (match?.subcategoryName) {
                        setSelectedSubcategory(match.subcategoryName)
                      }
                      setSelectedSubject(subj)
                    }
                  }}
                  className="h-9 px-3 text-xs font-medium rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs cursor-pointer max-w-[200px] truncate"
                >
                  <option value="ALL">All Subjects</option>
                  {subcategoryOptions.map((subcat) => {
                    const subjsInCat = Array.from(
                      new Set(
                        (data[activeTab] || [])
                          .filter((i) => i.subcategoryName?.toLowerCase() === subcat.toLowerCase() && i.subjectName)
                          .map((i) => i.subjectName)
                      )
                    ).sort()

                    return (
                      <optgroup key={subcat} label={subcat}>
                        <option value={`CAT:${subcat}`}>All {subcat}</option>
                        {subjsInCat.map((s) => (
                          <option key={s} value={`SUBJ:${s}`}>
                            {s}
                          </option>
                        ))}
                      </optgroup>
                    )
                  })}
                  {(() => {
                    const unassigned = Array.from(
                      new Set(
                        (data[activeTab] || [])
                          .filter((i) => !i.subcategoryName && i.subjectName)
                          .map((i) => i.subjectName)
                      )
                    ).sort()
                    if (unassigned.length === 0) return null
                    return (
                      <optgroup label="Other Subjects">
                        {unassigned.map((s) => (
                          <option key={s} value={`SUBJ:${s}`}>
                            {s}
                          </option>
                        ))}
                      </optgroup>
                    )
                  })()}
                </select>
              </div>
            )}

            {/* Status Dropdown Combo Box (Matching Subject Dropdown Design) */}
            <div className="relative">
              <select
                aria-label="Filter by completion status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs font-medium rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Not Started</option>
              </select>
            </div>
          </div>

          {/* Right: Reset Filters (Visible only when filters active) */}
          {(search || statusFilter !== "ALL" || selectedSubject !== "ALL" || selectedSubcategory !== "ALL") && (
            <div className="flex items-center self-end md:self-auto">
              <button
                type="button"
                onClick={() => {
                  setSearch("")
                  setStatusFilter("ALL")
                  setSelectedSubject("ALL")
                  setSelectedSubcategory("ALL")
                }}
                className="px-2.5 py-1.5 text-xs font-medium text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* Table Container (Matching Admin Side UI) */}
        <div className="w-full overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-card shadow-2xs">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
              <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-[#696969] dark:text-gray-400">Loading your scores…</p>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="py-16 text-center text-xs font-medium text-[#696969] dark:text-gray-400">
              {search
                ? `No ${activeTab} records found matching "${search}"`
                : `No ${activeTab} score records available.`}
            </div>
          ) : (
            <div className="max-h-[720px] overflow-y-auto">
              <table className="w-full text-left border-collapse" aria-label="Student Scores Table">
                <thead className="sticky top-0 z-10 bg-black/[0.02] dark:bg-[#14161b]/90 backdrop-blur-xs border-b border-black/5 dark:border-white/10">
                  <tr className="h-11 text-xs font-semibold text-[#696969]/80 dark:text-gray-400">
                    <th className="px-4 py-2.5" scope="col">
                      <button
                        type="button"
                        onClick={() => handleSort("name")}
                        className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer"
                      >
                        <span>{activeTab === "mockExams" ? "Exam Title" : "Title / Topic"}</span>
                        <ArrowUpDown className="size-3 opacity-60" />
                      </button>
                    </th>
                    {activeTab !== "mockExams" && (
                      <th className="px-4 py-2.5" scope="col">
                        Subject & Module
                      </th>
                    )}
                    <th className="px-4 py-2.5 text-center" scope="col">
                      Attempts
                    </th>
                    <th className="px-4 py-2.5 text-center" scope="col">
                      Status
                    </th>
                    <th className="px-4 py-2.5" scope="col">
                      <button
                        type="button"
                        onClick={() => handleSort("date")}
                        className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer"
                      >
                        <span>Date Taken</span>
                        <ArrowUpDown className="size-3 opacity-60" />
                      </button>
                    </th>
                    <th className="px-4 py-2.5 text-right pr-6" scope="col">
                      <button
                        type="button"
                        onClick={() => handleSort("score")}
                        className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer ml-auto"
                      >
                        <span>Score & Percentage</span>
                        <ArrowUpDown className="size-3 opacity-60" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
                  {currentItems.map((item) => {
                    const isCompleted = item.isCompleted
                    const percentage = item.percentage

                    return (
                      <tr
                        key={item.id}
                        className="h-13 transition-colors"
                      >
                        {/* Title */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-xs text-[#3B3B3B] dark:text-gray-100">
                            {item.title || "Untitled Assessment"}
                          </div>
                          {item.code && (
                            <div className="text-[11px] text-[#696969] dark:text-gray-400 mt-0.5 font-mono">
                              {item.code}
                            </div>
                          )}
                        </td>

                        {/* Subject & Module (for Quizzes & Assignments) */}
                        {activeTab !== "mockExams" && (
                          <td className="px-4 py-3 text-xs text-[#696969] dark:text-gray-300">
                            <div className="flex items-center gap-1.5 flex-wrap max-w-[220px]">
                              <span className="font-medium text-[#3B3B3B] dark:text-gray-200 truncate">
                                {item.subjectName || "—"}
                              </span>
                              {item.subcategoryName && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#696969] dark:text-gray-400">
                                  {item.subcategoryName}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#696969]/80 dark:text-gray-400 block truncate max-w-[220px] mt-0.5">
                              {item.moduleName}
                            </span>
                          </td>
                        )}

                        {/* Attempts */}
                        <td className="px-4 py-3 text-xs text-center text-[#696969] dark:text-gray-300">
                          {item.attemptsCount || 0}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-xs text-center">
                          {isCompleted ? (
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                item.passed
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              <CheckCircle2 className="size-3 shrink-0" />
                              <span>{item.passed ? "Passed" : "Completed"}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#696969]/60 dark:text-gray-500 font-medium">
                              <Clock className="size-3 shrink-0" />
                              <span>Not Started</span>
                            </span>
                          )}
                        </td>

                        {/* Date Taken */}
                        <td className="px-4 py-3 text-xs text-[#696969] dark:text-gray-400 whitespace-nowrap">
                          {item.completedAt
                            ? new Date(item.completedAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </td>

                        {/* Score & Percentage */}
                        <td className="px-4 py-3 text-right pr-6 text-xs whitespace-nowrap">
                          {isCompleted && percentage != null ? (
                            <div className="flex flex-col items-end">
                              <span
                                className={`font-semibold ${
                                  percentage >= 75
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : percentage >= 60
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {percentage}%
                              </span>
                              <span className="text-[10px] text-[#696969]/70 dark:text-gray-400 font-mono">
                                {item.score}/{item.maxScore} pts
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 font-medium">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
