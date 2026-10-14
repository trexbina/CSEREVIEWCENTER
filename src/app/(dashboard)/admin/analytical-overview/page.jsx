"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  RefreshCw,
  ArrowUpDown,
  BookOpen,
  Eye,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
  Download,
  Flame,
  Activity,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Line,
  ComposedChart,
  Legend,
} from "recharts"

export default function AnalyticalOverviewPage() {
  const [activeTab, setActiveTab] = useState("students") // "students" | "schools" | "at-risk"
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState("avgScore")
  const [sortDir, setSortDir] = useState("desc")
  const [selectedExaminationId, setSelectedExaminationId] = useState("ALL")
  const [selectedBatchId, setSelectedBatchId] = useState("ALL")
  const [showPerformanceOverview, setShowPerformanceOverview] = useState(true)
  const [showPassersRate, setShowPassersRate] = useState(true)
  const [showStudentActivity, setShowStudentActivity] = useState(true)

  // Section 3: Student Activity & Engagement State
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], [])
  const [activityDate, setActivityDate] = useState(todayStr)
  const [activityRange, setActivityRange] = useState("today") // 'today' | 'yesterday' | '7days' | 'all'
  const [activityTab, setActivityTab] = useState("subjects") // 'subjects' | 'roster'
  const [subjectSortField, setSubjectSortField] = useState("totalHoursDecimal")
  const [subjectSortDir, setSubjectSortDir] = useState("desc")
  const [rosterSortField, setRosterSortField] = useState("name")
  const [rosterSortDir, setRosterSortDir] = useState("asc")
  const [activityLoading, setActivityLoading] = useState(false)
  const [selectedActivityExaminationId, setSelectedActivityExaminationId] = useState("ALL")
  const [selectedActivityBatchId, setSelectedActivityBatchId] = useState("ALL")

  // Section 2: Mock Exam Passers Rate Filters
  const [selectedPassersExaminationId, setSelectedPassersExaminationId] = useState("ALL")
  const [selectedPassersBatchId, setSelectedPassersBatchId] = useState("ALL")
  const [selectedExamId, setSelectedExamId] = useState("ALL")

  const examinationOptions = data?.filters?.examinations || []
  const allBatchOptions = data?.filters?.batches || []
  const mockExamOptions = data?.filters?.mockExams || []

  // Dynamic batch options for Section 2 (Mock Exam Passers Rate)
  const passersBatchOptions = useMemo(() => {
    if (selectedPassersExaminationId === "ALL") {
      return allBatchOptions
    }
    return allBatchOptions.filter(
      (b) => String(b.exam_id) === String(selectedPassersExaminationId)
    )
  }, [allBatchOptions, selectedPassersExaminationId])

  // Handle Section 2 Examination filter change with batch reset
  const handlePassersExaminationChange = (newExamId) => {
    setSelectedPassersExaminationId(newExamId)
    if (newExamId !== "ALL") {
      const isBatchValid = allBatchOptions.some(
        (b) => String(b.id) === String(selectedPassersBatchId) && String(b.exam_id) === String(newExamId)
      )
      if (!isBatchValid) {
        setSelectedPassersBatchId("ALL")
      }
    }
  }

  // Dynamic batch options for Section 3 (Student Activity & Engagement)
  const activityBatchOptions = useMemo(() => {
    if (selectedActivityExaminationId === "ALL") {
      return allBatchOptions
    }
    return allBatchOptions.filter(
      (b) => String(b.exam_id) === String(selectedActivityExaminationId)
    )
  }, [allBatchOptions, selectedActivityExaminationId])

  // Handle Section 3 Examination filter change with batch reset
  const handleActivityExaminationChange = (newExamId) => {
    setSelectedActivityExaminationId(newExamId)
    if (newExamId !== "ALL") {
      const isBatchValid = allBatchOptions.some(
        (b) => String(b.id) === String(selectedActivityBatchId) && String(b.exam_id) === String(newExamId)
      )
      if (!isBatchValid) {
        setSelectedActivityBatchId("ALL")
      }
    }
  }

  // Filtered mock exams for the "View" dropdown based on selected examination & batch
  const filteredMockExamOptions = useMemo(() => {
    const list = mockExamOptions || []
    if (selectedPassersExaminationId === "ALL" && selectedPassersBatchId === "ALL") {
      return list
    }

    const examObj = selectedPassersExaminationId !== "ALL"
      ? examinationOptions.find((e) => String(e.id) === String(selectedPassersExaminationId))
      : null
    const batchObj = selectedPassersBatchId !== "ALL"
      ? allBatchOptions.find((b) => String(b.id) === String(selectedPassersBatchId))
      : null

    const attemptsList = data?.mockExamPassersData?.attempts || []

    return list.filter((exam) => {
      // 1. Check if mock exam has recorded attempts matching the selected exam / batch
      const hasMatchingAttempt = attemptsList.some((att) => {
        if (String(att.mockExamId) !== String(exam.id)) return false
        const matchExam = selectedPassersExaminationId === "ALL" || String(att.examId) === String(selectedPassersExaminationId)
        const matchBatch = selectedPassersBatchId === "ALL" || String(att.batchId) === String(selectedPassersBatchId)
        return matchExam && matchBatch
      })
      if (hasMatchingAttempt) return true

      // 2. Check if mock exam targets contain the examination or batch
      let targets = exam.targets
      if (typeof targets === "string") {
        try { targets = JSON.parse(targets) } catch (e) { targets = [] }
      }
      if (!Array.isArray(targets) || targets.length === 0 || targets.includes("all")) {
        return true
      }

      let matchesExamTarget = false
      if (selectedPassersExaminationId === "ALL") {
        matchesExamTarget = true
      } else {
        matchesExamTarget = targets.some((t) => {
          if (typeof t !== "string") return false
          const tLower = t.toLowerCase()
          return (
            tLower === `course_${selectedPassersExaminationId}` ||
            (examObj?.name && tLower.includes(examObj.name.toLowerCase()))
          )
        })
      }

      let matchesBatchTarget = false
      if (selectedPassersBatchId === "ALL") {
        matchesBatchTarget = true
      } else {
        matchesBatchTarget = targets.some((t) => {
          if (typeof t !== "string") return false
          const tLower = t.toLowerCase()
          return (
            tLower === `batch_${selectedPassersBatchId}` ||
            (batchObj?.name && tLower.includes(batchObj.name.toLowerCase()))
          )
        })
      }

      return matchesExamTarget && matchesBatchTarget
    })
  }, [mockExamOptions, selectedPassersExaminationId, selectedPassersBatchId, examinationOptions, allBatchOptions, data])

  // Determine current active mock exam passer stats dynamically
  const passersData = useMemo(() => {
    const raw = data?.mockExamPassersData
    if (!raw) {
      return {
        title: "All Mock Exams (Combined)",
        totalTakers: 0,
        passedCount: 0,
        failedCount: 0,
        passRate: 0,
        failRate: 0,
        averageScore: 0,
      }
    }

    const attempts = raw.attempts || []

    // If there are recorded individual attempts, filter them dynamically
    if (attempts.length > 0) {
      const filteredAttempts = attempts.filter((att) => {
        if (selectedExamId !== "ALL" && String(att.mockExamId) !== String(selectedExamId)) {
          return false
        }
        if (selectedPassersExaminationId !== "ALL" && String(att.examId) !== String(selectedPassersExaminationId)) {
          return false
        }
        if (selectedPassersBatchId !== "ALL" && String(att.batchId) !== String(selectedPassersBatchId)) {
          return false
        }
        return true
      })

      const totalTakers = filteredAttempts.length
      const passedCount = filteredAttempts.filter((a) => a.passed).length
      const failedCount = totalTakers - passedCount
      const passRate = totalTakers > 0 ? Math.round((passedCount / totalTakers) * 1000) / 10 : 0
      const failRate = totalTakers > 0 ? Math.max(0, Math.round((100 - passRate) * 10) / 10) : 0
      const averageScore = totalTakers > 0
        ? Math.round((filteredAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / totalTakers) * 10) / 10
        : 0

      let title = "All Mock Exams (Combined)"
      if (selectedExamId !== "ALL") {
        const found = raw.perExam?.find((e) => String(e.id) === String(selectedExamId))
        title = found ? (found.exam_code ? `${found.exam_code} — ${found.title}` : found.title) : `Mock Exam #${selectedExamId}`
      }

      return {
        title,
        totalTakers,
        passedCount,
        failedCount,
        passRate,
        failRate,
        averageScore,
      }
    }

    // Fallback if attempts array is empty (e.g. no mock exam attempts recorded yet)
    if (selectedExamId === "ALL") {
      return {
        title: "All Mock Exams (Combined)",
        totalTakers: raw.overall?.totalAttempts || 0,
        passedCount: raw.overall?.passedCount || 0,
        failedCount: raw.overall?.failedCount || 0,
        passRate: raw.overall?.passRate || 0,
        failRate: raw.overall?.failRate || 0,
        averageScore: raw.overall?.averageScore || 0,
      }
    }

    const found = raw.perExam?.find((e) => String(e.id) === String(selectedExamId))
    if (found) {
      return {
        title: found.exam_code ? `${found.exam_code} — ${found.title}` : (found.title || `Mock Exam #${found.id}`),
        totalTakers: found.totalTakers || 0,
        passedCount: found.passedCount || 0,
        failedCount: found.failedCount || 0,
        passRate: found.passRate || 0,
        failRate: found.failRate || 0,
        averageScore: found.averageScore || 0,
      }
    }

    return {
      title: "Selected Mock Exam",
      totalTakers: 0,
      passedCount: 0,
      failedCount: 0,
      passRate: 0,
      failRate: 0,
      averageScore: 0,
    }
  }, [data, selectedExamId, selectedPassersExaminationId, selectedPassersBatchId])

  // Filtered Student Activity & Engagement Data based on Examination and Batch filters
  const filteredActivityAnalytics = useMemo(() => {
    const raw = data?.studentActivityAnalytics
    if (!raw) return null

    // If both filters are "ALL", return raw data directly
    if (selectedActivityExaminationId === "ALL" && selectedActivityBatchId === "ALL") {
      return raw
    }

    const rawRoster = raw.tabB_studentRoster || []
    const rawSubjects = raw.tabA_subjectBreakdown || []
    const isSingleDay = raw.isSingleDay

    // Filter student roster
    const filteredRoster = rawRoster.filter((st) => {
      if (selectedActivityExaminationId !== "ALL" && String(st.examId) !== String(selectedActivityExaminationId)) {
        return false
      }
      if (selectedActivityBatchId !== "ALL" && String(st.batchId) !== String(selectedActivityBatchId)) {
        return false
      }
      return true
    })

    const filteredTotalEnrolled = filteredRoster.length
    // Active students in this cohort (active today or active this week or logged time)
    const activeStudents = filteredRoster.filter(
      (st) => (st.statusBadge && st.statusBadge.includes("Active")) || (st.timeSpentSeconds && st.timeSpentSeconds > 0)
    )
    const filteredActiveCount = activeStudents.length
    const filteredParticipationRate = filteredTotalEnrolled > 0
      ? Math.round((filteredActiveCount / filteredTotalEnrolled) * 100)
      : 0

    // Total seconds logged by filtered cohort
    const totalCohortSeconds = filteredRoster.reduce((acc, st) => acc + (st.timeSpentSeconds || 0), 0)
    const totalH = Math.floor(totalCohortSeconds / 3600)
    const totalM = Math.floor((totalCohortSeconds % 3600) / 60)
    const avgSecPerActive = filteredActiveCount > 0 ? Math.round(totalCohortSeconds / filteredActiveCount) : 0
    const avgH = Math.floor(avgSecPerActive / 3600)
    const avgM = Math.floor((avgSecPerActive % 3600) / 60)

    // Curriculum interactions / modules accessed by cohort
    const totalInteractions = filteredRoster.reduce((acc, st) => acc + (st.modulesAccessed || 0), 0)

    // Tab A: Subject breakdown adjusted for cohort
    const filteredSubjectBreakdown = rawSubjects.map((sub) => {
      const activeInSubject = filteredTotalEnrolled > 0
        ? Math.min(filteredTotalEnrolled, Math.round((sub.activeReviewees / Math.max(1, raw.kpis?.totalEnrolled || 1)) * filteredTotalEnrolled))
        : 0
      const completionRate = filteredTotalEnrolled > 0
        ? Math.min(100, Math.round((activeInSubject / filteredTotalEnrolled) * 100))
        : 0

      return {
        ...sub,
        activeReviewees: activeInSubject,
        totalEnrolled: filteredTotalEnrolled,
        completionRate,
      }
    })

    // Ratio scale for chart distribution if cohort is a subset
    const scaleRatio = (raw.kpis?.totalEnrolled && raw.kpis.totalEnrolled > 0 && filteredTotalEnrolled > 0)
      ? filteredTotalEnrolled / raw.kpis.totalEnrolled
      : (filteredTotalEnrolled === 0 ? 0 : 1)

    const filteredChart1 = (raw.chart1Distribution || []).map((slot) => ({
      ...slot,
      active: Math.round(slot.active * scaleRatio),
      hours: Math.round(slot.hours * scaleRatio * 10) / 10,
    }))

    const filteredChart2 = (raw.chart2SubjectAllocation || []).map((cat) => ({
      ...cat,
      lectureHours: Math.round(cat.lectureHours * scaleRatio * 10) / 10,
      testHours: Math.round(cat.testHours * scaleRatio * 10) / 10,
      totalCategoryHours: Math.round((cat.lectureHours + cat.testHours) * scaleRatio * 10) / 10,
    }))

    return {
      ...raw,
      kpis: {
        ...raw.kpis,
        activeReviewees: `${filteredActiveCount} / ${filteredTotalEnrolled}`,
        activeCount: filteredActiveCount,
        totalEnrolled: filteredTotalEnrolled,
        participationRate: filteredParticipationRate,
        participationDeltaText: `${filteredParticipationRate}% participation rate`,
        totalStudyTime: `${totalH}h ${totalM}m`,
        avgStudyTimePerActive: `Avg ${avgH}h ${avgM}m per active student`,
        curriculumInteractions: `${totalInteractions} opens`,
        peakConcurrentText: filteredActiveCount > 0
          ? `${Math.max(1, Math.round((raw.kpis?.activeCount > 0 ? (raw.kpis.activeCount) : 1) * scaleRatio))} concurrent students online`
          : "No active students online in this cohort",
      },
      chart1Distribution: filteredChart1,
      chart2SubjectAllocation: filteredChart2,
      tabA_subjectBreakdown: filteredSubjectBreakdown,
      tabB_studentRoster: filteredRoster,
    }
  }, [data, selectedActivityExaminationId, selectedActivityBatchId])

  const fetchAnalytics = async (customParams = {}) => {
    setLoading(true)
    try {
      const activeDate = customParams.date !== undefined ? customParams.date : activityDate
      const activeRange = customParams.range !== undefined ? customParams.range : activityRange

      const q = new URLSearchParams()
      if (activeDate) q.set("activity_date", activeDate)
      if (activeRange) q.set("activity_range", activeRange)

      const res = await fetch(`/api/admin/analytical-overview?${q.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setData(json)
      } else {
        setData(null)
      }
    } catch (err) {
      console.error("Failed to load analytical overview:", err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const handleDateChange = (newDate) => {
    setActivityDate(newDate)
    setActivityRange("") // clear preset when custom date is chosen
    fetchAnalytics({ date: newDate, range: "" })
  }

  const handleRangeChange = (range) => {
    setActivityRange(range)
    if (range === "today") {
      setActivityDate(todayStr)
    } else if (range === "yesterday") {
      const y = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      setActivityDate(y)
    } else {
      setActivityDate("")
    }
    fetchAnalytics({
      range,
      date: range === "today" ? todayStr : range === "yesterday" ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0] : "",
    })
  }

  // Export CSV Action
  const exportToCSV = () => {
    const act = filteredActivityAnalytics
    if (!act) return

    let csvRows = []
    if (activityTab === "subjects") {
      csvRows.push([
        "Subject / Module Name",
        "Category",
        "Active Reviewees",
        "Total Enrolled",
        "Total Hours Spent",
        "Avg Session Length",
        "Practice Tests Taken",
        "Completion Rate (%)",
      ])
      ;(act.tabA_subjectBreakdown || []).forEach((row) => {
        csvRows.push([
          `"${(row.name || "").replace(/"/g, '""')}"`,
          `"${(row.category || "").replace(/"/g, '""')}"`,
          row.activeReviewees,
          row.totalEnrolled,
          `"${row.totalHoursStr}"`,
          `"${row.avgSessionLength}"`,
          row.practiceTestsTaken,
          `${row.completionRate}%`,
        ])
      })
    } else {
      csvRows.push([
        "Student Name",
        "Email",
        "Institution",
        "Major",
        "Batch",
        "Status",
        "Time Spent",
        "Modules Accessed",
        "Mock Tests Completed",
        "Last Active",
      ])
      ;(act.tabB_studentRoster || []).forEach((row) => {
        csvRows.push([
          `"${(row.name || "").replace(/"/g, '""')}"`,
          `"${(row.email || "").replace(/"/g, '""')}"`,
          `"${(row.school || "").replace(/"/g, '""')}"`,
          `"${(row.major || "").replace(/"/g, '""')}"`,
          `"${(row.batch || "").replace(/"/g, '""')}"`,
          `"${row.statusBadge}"`,
          `"${row.timeSpentStr}"`,
          row.modulesAccessed,
          row.mockTestsCompleted,
          `"${row.lastActiveText}"`,
        ])
      })
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `student_activity_${activityTab}_${activityRange || activityDate || "export"}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter batches based on selected examination. If ALL examinations, show all batches.
  const availableBatchOptions = useMemo(() => {
    if (selectedExaminationId === "ALL") {
      return allBatchOptions
    }
    return allBatchOptions.filter(
      (b) => String(b.exam_id) === String(selectedExaminationId)
    )
  }, [allBatchOptions, selectedExaminationId])

  // Handle examination change: reset batch if current batch isn't in availableBatchOptions
  const handleExaminationChange = (newExamId) => {
    setSelectedExaminationId(newExamId)
    if (newExamId !== "ALL") {
      const isBatchValid = allBatchOptions.some(
        (b) => String(b.id) === String(selectedBatchId) && String(b.exam_id) === String(newExamId)
      )
      if (!isBatchValid) {
        setSelectedBatchId("ALL")
      }
    }
  }

  // Performance Rating calculation matching Status Reference rules
  const getPerformanceRating = (score) => {
    const val = Number(score) || 0
    if (val >= 80) {
      return {
        label: "SUPERIOR / IT PREPARED",
        badgeBg: "bg-[#fbcfe8] text-[#be185d] border-[#f472b6]/30 dark:bg-[#be185d]/20 dark:text-[#f472b6]",
      }
    }
    if (val >= 70) {
      return {
        label: "ADEQUATELY PREPARED",
        badgeBg: "bg-[#bfdbfe] text-[#1d4ed8] border-[#60a5fa]/30 dark:bg-[#1d4ed8]/20 dark:text-[#93c5fd]",
      }
    }
    if (val >= 60) {
      return {
        label: "NEEDS REINFORCEMENT",
        badgeBg: "bg-[#bbf7d0] text-[#15803d] border-[#4ade80]/30 dark:bg-[#15803d]/20 dark:text-[#86efac]",
      }
    }
    return {
      label: "FOR MONITORING",
      badgeBg: "bg-[#fef08a] text-[#a16207] border-[#facc15]/30 dark:bg-[#a16207]/20 dark:text-[#fde047]",
    }
  }

  // Reset sorting when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearch("")
    if (tab === "students") {
      setSortField("avgScore")
      setSortDir("desc")
    } else if (tab === "schools") {
      setSortField("passedCount")
      setSortDir("desc")
    } else if (tab === "at-risk") {
      setSortField("avgScore")
      setSortDir("asc")
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir(tabDefaultSortDir(field))
    }
  }

  const tabDefaultSortDir = (field) => {
    if (activeTab === "at-risk" && field === "avgScore") return "asc"
    return "desc"
  }

  // Filter and sort students (Top Students)
  const filteredStudents = useMemo(() => {
    const list = data?.comparativeLeaderboards?.students || []
    let result = list

    // Filter by examination
    if (selectedExaminationId !== "ALL") {
      result = result.filter(
        (s) =>
          String(s.examId) === String(selectedExaminationId) ||
          String(s.examinationId) === String(selectedExaminationId) ||
          s.examination?.toLowerCase() === examinationOptions.find((e) => String(e.id) === String(selectedExaminationId))?.name?.toLowerCase()
      )
    }

    // Filter by batch
    if (selectedBatchId !== "ALL") {
      result = result.filter(
        (s) =>
          String(s.batchId) === String(selectedBatchId) ||
          s.batch?.toLowerCase() === allBatchOptions.find((b) => String(b.id) === String(selectedBatchId))?.name?.toLowerCase()
      )
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.school?.toLowerCase().includes(q) ||
          s.major?.toLowerCase().includes(q) ||
          s.examination?.toLowerCase().includes(q) ||
          s.batch?.toLowerCase().includes(q)
      )
    }

    return [...result].sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      if (typeof aVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      aVal = aVal ?? 0
      bVal = bVal ?? 0
      return sortDir === "asc" ? aVal - bVal : bVal - aVal
    })
  }, [data, search, sortField, sortDir, selectedExaminationId, selectedBatchId, examinationOptions, allBatchOptions])

  // Filter and sort schools (Top Schools)
  const filteredSchools = useMemo(() => {
    const studentsList = data?.comparativeLeaderboards?.students || []
    let result = []

    if (selectedExaminationId !== "ALL" || selectedBatchId !== "ALL") {
      // Re-aggregate school statistics for the selected examination & batch
      const matchedStudents = studentsList.filter((s) => {
        const matchesExam =
          selectedExaminationId === "ALL" ||
          String(s.examId) === String(selectedExaminationId) ||
          String(s.examinationId) === String(selectedExaminationId) ||
          s.examination?.toLowerCase() === examinationOptions.find((e) => String(e.id) === String(selectedExaminationId))?.name?.toLowerCase()

        const matchesBatch =
          selectedBatchId === "ALL" ||
          String(s.batchId) === String(selectedBatchId) ||
          s.batch?.toLowerCase() === allBatchOptions.find((b) => String(b.id) === String(selectedBatchId))?.name?.toLowerCase()

        return matchesExam && matchesBatch
      })

      const schMap = {}
      matchedStudents.forEach((st) => {
        const sch = st.school || "Unassigned School"
        if (!schMap[sch]) {
          schMap[sch] = {
            schoolName: sch,
            studentCount: 0,
            passedCount: 0,
            totalScoreSum: 0,
          }
        }
        schMap[sch].studentCount += 1
        if (st.avgScore >= 75) schMap[sch].passedCount += 1
        schMap[sch].totalScoreSum += st.avgScore
      })

      result = Object.values(schMap).map((sch) => ({
        schoolName: sch.schoolName,
        studentCount: sch.studentCount,
        passedCount: sch.passedCount,
        avgScore: Math.round((sch.totalScoreSum / sch.studentCount) * 10) / 10,
        passRate: Math.round((sch.passedCount / sch.studentCount) * 100),
      }))
    } else {
      result = data?.comparativeLeaderboards?.schools || []
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((s) => s.schoolName?.toLowerCase().includes(q))
    }

    return [...result].sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      if (typeof aVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      aVal = aVal ?? 0
      bVal = bVal ?? 0
      return sortDir === "asc" ? aVal - bVal : bVal - aVal
    })
  }, [data, search, sortField, sortDir, selectedExaminationId, selectedBatchId, examinationOptions, allBatchOptions])

  // Filter and sort students at risk (avgScore < 75% or low mock exam completion)
  const filteredAtRiskStudents = useMemo(() => {
    const list = data?.comparativeLeaderboards?.students || []
    // At risk: students below passing benchmark (75%)
    let result = list.filter((s) => (s.avgScore ?? 0) < 75)

    // Filter by examination
    if (selectedExaminationId !== "ALL") {
      result = result.filter(
        (s) =>
          String(s.examId) === String(selectedExaminationId) ||
          String(s.examinationId) === String(selectedExaminationId) ||
          s.examination?.toLowerCase() === examinationOptions.find((e) => String(e.id) === String(selectedExaminationId))?.name?.toLowerCase()
      )
    }

    // Filter by batch
    if (selectedBatchId !== "ALL") {
      result = result.filter(
        (s) =>
          String(s.batchId) === String(selectedBatchId) ||
          s.batch?.toLowerCase() === allBatchOptions.find((b) => String(b.id) === String(selectedBatchId))?.name?.toLowerCase()
      )
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.school?.toLowerCase().includes(q) ||
          s.major?.toLowerCase().includes(q) ||
          s.examination?.toLowerCase().includes(q) ||
          s.batch?.toLowerCase().includes(q)
      )
    }

    return [...result].sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      if (typeof aVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      aVal = aVal ?? 0
      bVal = bVal ?? 0
      return sortDir === "asc" ? aVal - bVal : bVal - aVal
    })
  }, [data, search, sortField, sortDir, selectedExaminationId, selectedBatchId, examinationOptions, allBatchOptions])

  return (
    <div className="w-full space-y-8 pb-12">
      {/* ═══ SECTION 1: Performance Rating Overview (Top Students, Schools, At-Risk) ═══ */}
      <div className="space-y-5">
        {/* Section Header & Hide/Unhide Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowPerformanceOverview((prev) => !prev)}
            className="group inline-flex items-center gap-2.5 text-left cursor-pointer focus:outline-none"
            title={showPerformanceOverview ? "Hide Performance Rating Overview" : "Show Performance Rating Overview"}
          >
            <span className="p-1 rounded-lg bg-black/5 dark:bg-white/10 text-[#696969] dark:text-gray-400 group-hover:text-[#3B3B3B] dark:group-hover:text-white transition-colors">
              {showPerformanceOverview ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-wide text-[#3B3B3B] dark:text-white group-hover:underline">
                  Performance Rating Overview
                </h2>
                <span className="text-[10px] font-medium text-[#696969] dark:text-gray-400">
                  {showPerformanceOverview ? "(Click to hide)" : "(Click to expand)"}
                </span>
              </div>
              <p className="text-xs text-[#696969] dark:text-gray-400 mt-0.5">
                Comparative ranking and performance ratings across top students, institutions, and students requiring reinforcement.
              </p>
            </div>
          </button>

          {/* Refresh button */}
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            className="self-end sm:self-auto flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-medium text-[#696969] dark:text-gray-400 bg-white dark:bg-white/10 hover:text-[#3B3B3B] dark:hover:text-white border border-black/5 dark:border-white/10 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Collapsible Content */}
        {showPerformanceOverview && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header Controls: Tab Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Minimal Tab Switcher */}
              <div className="inline-flex items-center gap-1.5 p-1 bg-[#F2F2F2]/80 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => handleTabChange("students")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === "students"
                      ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                      : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
                  }`}
                >
                  Top Students
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("schools")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === "schools"
                      ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                      : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
                  }`}
                >
                  Top Schools
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("at-risk")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === "at-risk"
                      ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                      : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
                  }`}
                >
                  Students at Risk
                </button>
              </div>
            </div>

            {/* Filter Controls Row: Search Input & Examination/Batch Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#696969]/70" />
                <input
                  type="search"
                  placeholder={
                    activeTab === "schools"
                      ? "Search school by name…"
                      : "Search student by name, email, school, or major…"
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/60 focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs"
                />
              </div>

              {/* Filter Dropdowns: Examination & Batch */}
              <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
                {/* Examination Filter */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="examination-tab-select"
                    className="text-xs text-[#696969] dark:text-gray-400 whitespace-nowrap"
                  >
                    Examination:
                  </label>
                  <select
                    id="examination-tab-select"
                    value={selectedExaminationId}
                    onChange={(e) => handleExaminationChange(e.target.value)}
                    className="h-10 px-3 text-xs font-medium rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs cursor-pointer max-w-[220px] sm:max-w-[260px] truncate"
                  >
                    <option value="ALL">All Examinations</option>
                    {examinationOptions.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch Filter */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="batch-tab-select"
                    className="text-xs text-[#696969] dark:text-gray-400 whitespace-nowrap"
                  >
                    Batch:
                  </label>
                  <select
                    id="batch-tab-select"
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="h-10 px-3 text-xs font-medium rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs cursor-pointer max-w-[180px] truncate"
                  >
                    <option value="ALL">All Batches</option>
                    {availableBatchOptions.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="w-full overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-card shadow-2xs">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
              <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-[#696969] dark:text-gray-400">Loading ranking data…</p>
            </div>
          ) : activeTab === "students" ? (
            /* ── Top Students Table ── */
            filteredStudents.length === 0 ? (
              <div className="py-16 text-center text-xs font-medium text-[#696969] dark:text-gray-400">
                {search ? `No students found matching "${search}"` : "No student performance records available."}
              </div>
            ) : (
              <div className="max-h-[720px] overflow-y-auto">
                <table className="w-full text-left border-collapse" aria-label="Top Students Table">
                  <thead className="sticky top-0 z-10 bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25 backdrop-blur-xs border-b border-[#E9C46A]/30 shadow-2xs">
                    <tr className="h-11 text-xs font-semibold text-[#3B3B3B] dark:text-gray-200">
                      <th className="w-16 px-4 py-2.5 text-center text-[#696969] dark:text-gray-400" scope="col">Rank</th>
                      <th className="px-4 py-2.5" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("name")}
                          className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer font-semibold"
                        >
                          <span>Student</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                      <th className="px-4 py-2.5" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("school")}
                          className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer font-semibold"
                        >
                          <span>Institution</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                      <th className="px-4 py-2.5" scope="col">Major / Specialization</th>
                      <th className="px-4 py-2.5 text-center" scope="col">Batch</th>
                      <th className="px-4 py-2.5 text-right pr-6" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("avgScore")}
                          className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer font-semibold ml-auto"
                        >
                          <span>Performance Rating</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
                    {filteredStudents.map((st, idx) => {
                      const displayRank = idx + 1
                      const rating = getPerformanceRating(st.avgScore)
                      return (
                        <tr
                          key={st.id}
                          className="h-13 transition-colors"
                        >
                          {/* Rank */}
                          <td className="px-4 text-center font-medium text-xs text-[#696969] dark:text-gray-400">
                            #{displayRank}
                          </td>

                          {/* Student Name & Email */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-xs text-[#3B3B3B] dark:text-gray-100">
                              {st.name || "—"}
                            </div>
                            {st.email && (
                              <div className="text-[11px] text-[#696969] dark:text-gray-400 mt-0.5">
                                {st.email}
                              </div>
                            )}
                          </td>

                          {/* Institution */}
                          <td className="px-4 py-3 text-xs text-[#696969] dark:text-gray-300">
                            {st.school || "—"}
                          </td>

                          {/* Major */}
                          <td className="px-4 py-3 text-xs text-[#696969] dark:text-gray-400">
                            {st.major || "—"}
                          </td>

                          {/* Batch */}
                          <td className="px-4 py-3 text-xs text-center text-[#696969] dark:text-gray-300">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-[11px] font-medium text-[#3B3B3B] dark:text-gray-200">
                              {st.batch || "—"}
                            </span>
                          </td>

                          {/* Performance Rating */}
                          <td className="px-4 py-3 text-right pr-6 text-xs whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-2.5">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider border uppercase ${rating.badgeBg}`}
                              >
                                {rating.label}
                              </span>
                              <span className="font-bold text-[#3B3B3B] dark:text-gray-100 text-xs min-w-[42px] text-right">
                                {st.avgScore ? `${Number(st.avgScore).toFixed(1)}%` : "0.0%"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === "schools" ? (
            /* ── Top Schools Table ── */
            filteredSchools.length === 0 ? (
              <div className="py-16 text-center text-xs font-medium text-[#696969] dark:text-gray-400">
                {search ? `No schools found matching "${search}"` : "No institutional performance records available."}
              </div>
            ) : (
              <div className="max-h-[720px] overflow-y-auto">
                <table className="w-full text-left border-collapse" aria-label="Top Schools Table">
                  <thead className="sticky top-0 z-10 bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25 backdrop-blur-xs border-b border-[#E9C46A]/30 shadow-2xs">
                    <tr className="h-11 text-xs font-semibold text-[#3B3B3B] dark:text-gray-200">
                      <th className="w-16 px-4 py-2.5 text-center text-[#696969] dark:text-gray-400" scope="col">Rank</th>
                      <th className="px-4 py-2.5" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("schoolName")}
                          className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer font-semibold"
                        >
                          <span>Institution</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                      <th className="px-4 py-2.5 text-center" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("studentCount")}
                          className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer mx-auto font-semibold"
                        >
                          <span>Total Students</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                      <th className="px-4 py-2.5 text-center" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("passedCount")}
                          className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer mx-auto font-semibold"
                        >
                          <span>Proficient Students</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                      <th className="px-4 py-2.5 text-center" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("passRate")}
                          className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer mx-auto font-semibold"
                        >
                          <span>Passing Rate</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                      <th className="px-4 py-2.5 text-right pr-6" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("avgScore")}
                          className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer ml-auto font-semibold"
                        >
                          <span>Average Progress</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
                    {filteredSchools.map((sch, idx) => {
                      const displayRank = idx + 1
                      return (
                        <tr
                          key={sch.schoolName}
                          className="h-13 transition-colors"
                        >
                          {/* Rank */}
                          <td className="px-4 text-center font-medium text-xs text-[#696969] dark:text-gray-400">
                            #{displayRank}
                          </td>

                          {/* School Name */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-xs text-[#3B3B3B] dark:text-gray-100">
                              {sch.schoolName || "—"}
                            </div>
                          </td>

                          {/* Total Students */}
                          <td className="px-4 py-3 text-xs text-center text-[#696969] dark:text-gray-300">
                            {sch.studentCount || 0}
                          </td>

                          {/* Proficient Students (with good progress) */}
                          <td className="px-4 py-3 text-xs text-center text-[#696969] dark:text-gray-300">
                            <span className="font-medium text-[#3B3B3B] dark:text-gray-200">
                              {sch.passedCount || 0}
                            </span>
                            <span className="text-[11px] text-[#696969] dark:text-gray-400 ml-1">
                              / {sch.studentCount || 0}
                            </span>
                          </td>

                          {/* Passing Rate */}
                          <td className="px-4 py-3 text-xs text-center text-[#696969] dark:text-gray-300">
                            {sch.passRate ?? 0}%
                          </td>

                          {/* Average Progress */}
                          <td className="px-4 py-3 text-right pr-6 text-xs whitespace-nowrap">
                            <span className="font-semibold text-[#3B3B3B] dark:text-gray-100">
                              {sch.avgScore ? `${sch.avgScore}%` : "0%"}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* ── Students at Risk Table ── */
            filteredAtRiskStudents.length === 0 ? (
              <div className="py-16 text-center text-xs font-medium text-[#696969] dark:text-gray-400">
                {search
                  ? `No at-risk students found matching "${search}"`
                  : "No students currently identified as at-risk in this scope."}
              </div>
            ) : (
              <div className="max-h-[720px] overflow-y-auto">
                <table className="w-full text-left border-collapse" aria-label="Students at Risk Table">
                  <thead className="sticky top-0 z-10 bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25 backdrop-blur-xs border-b border-[#E9C46A]/30 shadow-2xs">
                    <tr className="h-11 text-xs font-semibold text-[#3B3B3B] dark:text-gray-200">
                      <th className="w-16 px-4 py-2.5 text-center text-[#696969] dark:text-gray-400" scope="col">#</th>
                      <th className="px-4 py-2.5" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("name")}
                          className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer font-semibold"
                        >
                          <span>Student</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                      <th className="px-4 py-2.5" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("school")}
                          className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer font-semibold"
                        >
                          <span>Institution</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                      <th className="px-4 py-2.5" scope="col">Major / Specialization</th>
                      <th className="px-4 py-2.5 text-center" scope="col">Batch</th>
                      <th className="px-4 py-2.5 text-right pr-6" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("avgScore")}
                          className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer font-semibold ml-auto"
                        >
                          <span>Performance Rating</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
                    {filteredAtRiskStudents.map((st, idx) => {
                      const displayIndex = idx + 1
                      const rating = getPerformanceRating(st.avgScore)
                      return (
                        <tr
                          key={st.id}
                          className="h-13 transition-colors"
                        >
                          {/* Index */}
                          <td className="px-4 text-center font-medium text-xs text-[#696969] dark:text-gray-400">
                            #{displayIndex}
                          </td>

                          {/* Student Name & Email */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-xs text-[#3B3B3B] dark:text-gray-100">
                              {st.name || "—"}
                            </div>
                            {st.email && (
                              <div className="text-[11px] text-[#696969] dark:text-gray-400 mt-0.5">
                                {st.email}
                              </div>
                            )}
                          </td>

                          {/* Institution */}
                          <td className="px-4 py-3 text-xs text-[#696969] dark:text-gray-300">
                            {st.school || "—"}
                          </td>

                          {/* Major */}
                          <td className="px-4 py-3 text-xs text-[#696969] dark:text-gray-400">
                            {st.major || "—"}
                          </td>

                          {/* Batch */}
                          <td className="px-4 py-3 text-xs text-center text-[#696969] dark:text-gray-300">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-[11px] font-medium text-[#3B3B3B] dark:text-gray-200">
                              {st.batch || "—"}
                            </span>
                          </td>

                          {/* Performance Rating */}
                          <td className="px-4 py-3 text-right pr-6 text-xs whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-2.5">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider border uppercase ${rating.badgeBg}`}
                              >
                                {rating.label}
                              </span>
                              <span className="font-bold text-[#3B3B3B] dark:text-gray-100 text-xs min-w-[42px] text-right">
                                {st.avgScore ? `${Number(st.avgScore).toFixed(1)}%` : "0.0%"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ SECTION 2: Mock Exam Passers Graphical Interface ═══ */}
      <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/10">
        {/* Section Header & Mock Exam Filter Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowPassersRate((prev) => !prev)}
            className="group inline-flex items-center gap-2.5 text-left cursor-pointer focus:outline-none"
            title={showPassersRate ? "Hide Mock Exam Passers Rate" : "Show Mock Exam Passers Rate"}
          >
            <span className="p-1 rounded-lg bg-black/5 dark:bg-white/10 text-[#696969] dark:text-gray-400 group-hover:text-[#3B3B3B] dark:group-hover:text-white transition-colors">
              {showPassersRate ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-wide text-[#3B3B3B] dark:text-white group-hover:underline">
                  Mock Exam Passers Rate
                </h2>
                <span className="text-[10px] font-medium text-[#696969] dark:text-gray-400">
                  {showPassersRate ? "(Click to hide)" : "(Click to expand)"}
                </span>
              </div>
              <p className="text-xs text-[#696969] dark:text-gray-400 mt-0.5">
                Percentage of students meeting the passing benchmark (75% and above) across mock examinations.
              </p>
            </div>
          </button>

          {/* Filters Row: Examination, Batch, and View Dropdowns (visible when expanded) */}
          {showPassersRate && (
            <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
              {/* Examination Filter */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="passers-examination-select"
                  className="text-xs text-[#696969] dark:text-gray-400 whitespace-nowrap"
                >
                  Examination:
                </label>
                <select
                  id="passers-examination-select"
                  value={selectedPassersExaminationId}
                  onChange={(e) => handlePassersExaminationChange(e.target.value)}
                  className="h-9 px-3 text-xs font-semibold rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs cursor-pointer max-w-[200px] sm:max-w-[240px] truncate"
                >
                  <option value="ALL">All Examinations</option>
                  {examinationOptions.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Batch Filter */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="passers-batch-select"
                  className="text-xs text-[#696969] dark:text-gray-400 whitespace-nowrap"
                >
                  Batch:
                </label>
                <select
                  id="passers-batch-select"
                  value={selectedPassersBatchId}
                  onChange={(e) => setSelectedPassersBatchId(e.target.value)}
                  className="h-9 px-3 text-xs font-semibold rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs cursor-pointer max-w-[160px] truncate"
                >
                  <option value="ALL">All Batches</option>
                  {passersBatchOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* View (Mock Exam Selector) Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="mock-exam-select" className="text-xs text-[#696969] dark:text-gray-400 whitespace-nowrap">
                  View:
                </label>
                <select
                  id="mock-exam-select"
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="h-9 px-3 text-xs font-semibold rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs cursor-pointer max-w-[220px] sm:max-w-[260px] truncate"
                >
                  <option value="ALL">All Mock Exams (Combined)</option>
                  {filteredMockExamOptions.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.exam_code ? `${exam.exam_code} — ` : ""}{exam.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Graphical Summary Cards & Visual Charts (Collapsible) */}
        {showPassersRate && (
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-card p-5 sm:p-6 shadow-2xs space-y-6">
          {/* Selected Exam Title & Stats Metrics */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
            <div>
              <div className="text-xs font-semibold text-[#3B3B3B] dark:text-white">
                {passersData.title}
              </div>
              <div className="text-[11px] text-[#696969] dark:text-gray-400 mt-0.5">
                {selectedExamId === "ALL"
                  ? "Aggregate performance across all active mock exams"
                  : "Individual mock examination performance metrics"}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="flex items-center gap-6 sm:gap-8 flex-wrap text-xs">
              <div>
                <span className="text-[11px] text-[#696969] dark:text-gray-400 block">Total Attempts</span>
                <span className="font-semibold text-[#3B3B3B] dark:text-white text-sm">
                  {passersData.totalTakers}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#696969] dark:text-gray-400 block">Passing Rate</span>
                <span className="font-semibold text-[#3B3B3B] dark:text-white text-sm">
                  {passersData.passRate}%
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#696969] dark:text-gray-400 block">Passed / Below Passing</span>
                <span className="font-semibold text-[#3B3B3B] dark:text-white text-sm">
                  {passersData.passedCount} / {passersData.failedCount}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#696969] dark:text-gray-400 block">Average Score</span>
                <span className="font-semibold text-[#3B3B3B] dark:text-white text-sm">
                  {passersData.averageScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Single Graphical Chart: Pass / Below Benchmark Donut */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01]">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#696969] dark:text-gray-400 mb-3 text-center">
              Pass / Below 75% Ratio
            </div>

            {passersData.totalTakers === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-xs text-[#696969] dark:text-gray-400">
                No mock exam attempts recorded yet.
              </div>
            ) : (
              <div className="relative w-full max-w-[280px] h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Passed (>= 75%)", value: passersData.passedCount || 0 },
                        { name: "Below 75%", value: passersData.failedCount || 0 },
                      ]}
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="transparent"
                    >
                      <Cell fill="#3B3B3B" className="dark:fill-white transition-all" />
                      <Cell fill="#D1D5DB" className="dark:fill-white/20 transition-all" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card, #ffffff)",
                        border: "1px solid rgba(0,0,0,0.1)",
                        borderRadius: "10px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center percentage label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {passersData.passRate}%
                  </span>
                  <span className="text-[11px] text-[#696969] dark:text-gray-400 font-medium">
                    Pass Rate
                  </span>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-8 mt-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#3B3B3B] dark:bg-white" />
                <span className="text-[#696969] dark:text-gray-400">
                  Passed: <strong className="text-[#3B3B3B] dark:text-white font-semibold">{passersData.passedCount}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-gray-300 dark:bg-white/25" />
                <span className="text-[#696969] dark:text-gray-400">
                  Below 75%: <strong className="text-[#3B3B3B] dark:text-white font-semibold">{passersData.failedCount}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* ═══ SECTION 3: Student Activity & Engagement Analytics ═══ */}
      <div className="space-y-5 pt-4 border-t border-black/5 dark:border-white/10">
        {/* Section Header & Interactive Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setShowStudentActivity((prev) => !prev)}
            className="group inline-flex items-center gap-2.5 text-left cursor-pointer focus:outline-none"
            title={showStudentActivity ? "Hide Student Activity & Engagement" : "Show Student Activity & Engagement"}
          >
            <span className="p-1 rounded-lg bg-black/5 dark:bg-white/10 text-[#696969] dark:text-gray-400 group-hover:text-[#3B3B3B] dark:group-hover:text-white transition-colors">
              {showStudentActivity ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-wide text-[#3B3B3B] dark:text-white group-hover:underline">
                  Student Activity & Engagement
                </h2>
                <span className="text-[10px] font-medium text-[#696969] dark:text-gray-400">
                  {showStudentActivity ? "(Click to hide)" : "(Click to expand)"}
                </span>
              </div>
              <p className="text-xs text-[#696969] dark:text-gray-400 mt-0.5">
                Monitor daily study hours, peak traffic windows, subject engagement, and individual candidate progress.
              </p>
            </div>
          </button>

          {/* Right-aligned Controls: Examination, Batch, Date Picker, Quick Filters, Export CSV */}
          {showStudentActivity && (
            <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-auto">
              {/* Type of Examination Filter */}
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="activity-examination-select"
                  className="text-xs text-[#696969] dark:text-gray-400 whitespace-nowrap"
                >
                  Exam:
                </label>
                <select
                  id="activity-examination-select"
                  value={selectedActivityExaminationId}
                  onChange={(e) => handleActivityExaminationChange(e.target.value)}
                  className="h-9 px-3 text-xs font-semibold rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs cursor-pointer max-w-[200px] sm:max-w-[230px] truncate"
                  title="Filter by Type of Examination"
                >
                  <option value="ALL">All Examinations</option>
                  {examinationOptions.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Filter */}
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="activity-batch-select"
                  className="text-xs text-[#696969] dark:text-gray-400 whitespace-nowrap"
                >
                  Batch:
                </label>
                <select
                  id="activity-batch-select"
                  value={selectedActivityBatchId}
                  onChange={(e) => setSelectedActivityBatchId(e.target.value)}
                  className="h-9 px-3 text-xs font-semibold rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs cursor-pointer max-w-[150px] sm:max-w-[170px] truncate"
                  title="Filter by Batch"
                >
                  <option value="ALL">All Batches</option>
                  {activityBatchOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Calendar Date Picker: Single-day selector */}
              <div className="relative flex items-center">
                <div className="relative">
                  <input
                    type="date"
                    id="activity-date-picker"
                    value={activityDate || todayStr}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="h-9 pl-3 pr-2.5 text-xs font-semibold rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs cursor-pointer"
                    title="Select specific date"
                  />
                </div>
              </div>

              {/* Preset Quick Filters Pill Buttons */}
              <div className="inline-flex items-center gap-1 p-1 bg-[#F2F2F2]/80 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
                {[
                  { id: "today", label: "Today" },
                  { id: "yesterday", label: "Yesterday" },
                  { id: "7days", label: "Last 7 Days" },
                  { id: "all", label: "All-Time" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => handleRangeChange(pill.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                      activityRange === pill.id
                        ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                        : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Export CSV Action */}
              <button
                type="button"
                onClick={exportToCSV}
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold text-[#3B3B3B] dark:text-white bg-white dark:bg-white/10 hover:bg-black/5 dark:hover:bg-white/15 border border-black/10 dark:border-white/15 transition-all shadow-2xs cursor-pointer"
                title="Export currently filtered metrics to CSV"
              >
                <Download className="size-3.5 text-[#696969] dark:text-gray-400" />
                <span>Export CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* ══ Collapsible Content ══ */}
        {showStudentActivity && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 1. Top-Level Metric Summary Cards (4-Column Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Active Reviewees */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-card p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#696969] dark:text-gray-400">
                    Active Reviewees
                  </span>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Users className="size-4" />
                  </div>
                </div>

                <div>
                  <div className="text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {data?.studentActivityAnalytics?.kpis?.activeReviewees || "0 / 0"}
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-[#696969] dark:text-gray-400">
                  <span className="truncate">Participation Rate</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                    {data?.studentActivityAnalytics?.kpis?.participationDeltaText || "0% • 0% vs yesterday"}
                  </span>
                </div>
              </div>

              {/* Card 2: Total Study Time */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-card p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#696969] dark:text-gray-400">
                    Total Study Time
                  </span>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Clock className="size-4" />
                  </div>
                </div>

                <div>
                  <div className="text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {data?.studentActivityAnalytics?.kpis?.totalStudyTime || "0h 0m"}
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-[#696969] dark:text-gray-400">
                  <span className="truncate">Active Candidate Average</span>
                  <span className="text-[#3B3B3B] dark:text-white font-semibold whitespace-nowrap">
                    {data?.studentActivityAnalytics?.kpis?.avgStudyTimePerActive || "Avg 0h 0m per active student"}
                  </span>
                </div>
              </div>

              {/* Card 3: Curriculum Interactions */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-card p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#696969] dark:text-gray-400">
                    Curriculum Interactions
                  </span>
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <BookOpen className="size-4" />
                  </div>
                </div>

                <div>
                  <div className="text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {data?.studentActivityAnalytics?.kpis?.curriculumInteractions || "0 opens"}
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-[#696969] dark:text-gray-400">
                  <span className="truncate">Resource Scope</span>
                  <span className="text-[#3B3B3B] dark:text-white font-medium whitespace-nowrap">
                    {data?.studentActivityAnalytics?.kpis?.activeSubjectsCount || "Across active subjects & modules"}
                  </span>
                </div>
              </div>

              {/* Card 4: Peak Activity Window */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-card p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#696969] dark:text-gray-400">
                    Peak Activity Window
                  </span>
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <Flame className="size-4" />
                  </div>
                </div>

                <div>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white truncate">
                    {data?.studentActivityAnalytics?.kpis?.peakActivityWindow || "—"}
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-[#696969] dark:text-gray-400">
                  <span className="truncate">Concurrent Load</span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold whitespace-nowrap">
                    {data?.studentActivityAnalytics?.kpis?.peakConcurrentText || "No active students online in this period"}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Analytics Visualizations (Two-Column Chart Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Chart 1: Daily Study & Peak Hour Distribution */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-card p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/5 dark:border-white/5">
                  <div>
                    <h3 className="text-xs font-semibold text-[#3B3B3B] dark:text-white uppercase tracking-wider">
                      Daily Study & Peak Hour Distribution
                    </h3>
                    <p className="text-[11px] text-[#696969] dark:text-gray-400 mt-0.5">
                      {data?.studentActivityAnalytics?.isSingleDay
                        ? "Hourly concurrent active students and cumulative hours (24h)"
                        : "Daily active students (bars) vs. total hours logged (line)"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#696969] dark:text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2.5 rounded-sm bg-[#E9C46A]" /> Concurrent Students
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2.5 rounded-sm bg-[#3B3B3B] dark:bg-white" /> Hours Logged
                    </span>
                  </div>
                </div>

                <div className="w-full h-[280px]">
                  {(data?.studentActivityAnalytics?.chart1Distribution || []).length === 0 ||
                  (data?.studentActivityAnalytics?.kpis?.activeCount === 0 && (data?.studentActivityAnalytics?.chart1Distribution || []).every((d) => d.active === 0 && d.hours === 0)) ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-[#696969] dark:text-gray-400">
                      <Clock className="size-8 stroke-[1.5] mb-2 opacity-30" />
                      <span>No study session distribution recorded for this date.</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={data?.studentActivityAnalytics?.chart1Distribution || []}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis
                          dataKey="hour"
                          tick={{ fontSize: 10, fill: "#888888" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 10, fill: "#888888" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 10, fill: "#888888" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0].payload
                              return (
                                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1f1f1f] p-3 shadow-lg text-xs space-y-1">
                                  <div className="font-bold text-[#3B3B3B] dark:text-white">
                                    {label}
                                  </div>
                                  <div className="text-amber-600 dark:text-amber-400">
                                    Concurrent Students: <strong>{item.active}</strong>
                                  </div>
                                  <div className="text-[#3B3B3B] dark:text-gray-200">
                                    Total Hours: <strong>{item.hours}h</strong>
                                  </div>
                                  {item.topSubject && item.topSubject !== "—" && (
                                    <div className="text-[11px] text-[#696969] dark:text-gray-400 pt-1 border-t border-black/5 dark:border-white/10">
                                      Top Subject: <span className="font-medium text-[#3B3B3B] dark:text-gray-200">{item.topSubject}</span>
                                    </div>
                                  )}
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="active"
                          name="Active Students"
                          fill="#E9C46A"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={28}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="hours"
                          name="Hours Logged"
                          stroke="#3B3B3B"
                          className="dark:stroke-white"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: "#3B3B3B" }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: Subject Time Allocation (Horizontal Stacked Bar Chart) */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-card p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/5 dark:border-white/5">
                  <div>
                    <h3 className="text-xs font-semibold text-[#3B3B3B] dark:text-white uppercase tracking-wider">
                      Subject Time Allocation
                    </h3>
                    <p className="text-[11px] text-[#696969] dark:text-gray-400 mt-0.5">
                      Lectures & reading vs. quizzes & mock exams per review domain
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#696969] dark:text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2.5 rounded-sm bg-[#3B3B3B] dark:bg-white" /> Lecture & Notes
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2.5 rounded-sm bg-[#E9C46A]" /> Tests & Quizzes
                    </span>
                  </div>
                </div>

                <div className="w-full h-[280px]">
                  {(data?.studentActivityAnalytics?.chart2SubjectAllocation || []).every((d) => d.totalCategoryHours === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-[#696969] dark:text-gray-400">
                      <BookOpen className="size-8 stroke-[1.5] mb-2 opacity-30" />
                      <span>No subject study hours logged for this period.</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={data?.studentActivityAnalytics?.chart2SubjectAllocation || []}
                        margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#888888" }} tickLine={false} axisLine={false} unit="h" />
                        <YAxis
                          type="category"
                          dataKey="category"
                          tick={{ fontSize: 11, fill: "#3B3B3B" }}
                          tickLine={false}
                          axisLine={false}
                          width={130}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload
                              return (
                                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1f1f1f] p-3 shadow-lg text-xs space-y-1">
                                  <div className="font-bold text-[#3B3B3B] dark:text-white">
                                    {d.category}
                                  </div>
                                  <div className="text-[#3B3B3B] dark:text-gray-200">
                                    Lecture & Reading: <strong>{d.lectureHours}h</strong>
                                  </div>
                                  <div className="text-amber-600 dark:text-amber-400">
                                    Practice Tests & Quizzes: <strong>{d.testHours}h</strong>
                                  </div>
                                  <div className="text-[11px] text-[#696969] dark:text-gray-400 pt-1 border-t border-black/5 dark:border-white/10">
                                    Cohort Study Share: <strong className="text-[#3B3B3B] dark:text-white">{d.sharePct}%</strong>
                                  </div>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="lectureHours" name="Lecture & Reading" stackId="a" fill="#3B3B3B" className="dark:fill-white" radius={[4, 0, 0, 4]} />
                        <Bar dataKey="testHours" name="Practice Tests & Quizzes" stackId="a" fill="#E9C46A" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Interactive Data Tables (Tabbed Interface) */}
            <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-card p-5 sm:p-6 shadow-2xs space-y-4">
              {/* Tab Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
                <div className="inline-flex items-center gap-1.5 p-1 bg-[#F2F2F2]/80 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setActivityTab("subjects")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                      activityTab === "subjects"
                        ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                        : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
                    }`}
                  >
                    Subject Performance Breakdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityTab("roster")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                      activityTab === "roster"
                        ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                        : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
                    }`}
                  >
                    Student Accountability & Roster
                  </button>
                </div>

                <div className="text-xs text-[#696969] dark:text-gray-400">
                  {activityTab === "subjects"
                    ? "Curriculum domain engagement and completion rates"
                    : "Identify active candidates and intervene with at-risk students"}
                </div>
              </div>

              {/* Tab A: Subject Performance Breakdown Table */}
              {activityTab === "subjects" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-black/5 dark:border-white/10 text-[#696969] dark:text-gray-400 font-semibold">
                        <th className="py-2.5 px-3">Subject / Module Name</th>
                        <th className="py-2.5 px-3">Active Reviewees</th>
                        <th className="py-2.5 px-3">Total Hours Spent</th>
                        <th className="py-2.5 px-3">Avg. Session Length</th>
                        <th className="py-2.5 px-3 text-center">Practice Tests Taken</th>
                        <th className="py-2.5 px-3 pr-4 text-right">Cohort Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {(data?.studentActivityAnalytics?.tabA_subjectBreakdown || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-[#696969] dark:text-gray-400">
                            No subjects configured or recorded yet.
                          </td>
                        </tr>
                      ) : (
                        (data?.studentActivityAnalytics?.tabA_subjectBreakdown || []).map((sub) => (
                          <tr key={sub.id} className="h-12 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-[#3B3B3B] dark:text-white">
                                {sub.name}
                              </div>
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-black/5 dark:bg-white/10 text-[#696969] dark:text-gray-300">
                                {sub.category}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-medium text-[#3B3B3B] dark:text-gray-200">
                              {sub.activeReviewees} of {sub.totalEnrolled} students
                            </td>
                            <td className="py-3 px-3 font-semibold text-[#3B3B3B] dark:text-white">
                              {sub.totalHoursStr}
                            </td>
                            <td className="py-3 px-3 text-[#696969] dark:text-gray-400">
                              {sub.avgSessionLength}
                            </td>
                            <td className="py-3 px-3 text-center font-medium text-[#3B3B3B] dark:text-gray-200">
                              {sub.practiceTestsTaken}
                            </td>
                            <td className="py-3 px-3 pr-4 text-right">
                              <div className="flex items-center justify-end gap-2.5">
                                <div className="w-24 h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-[#E9C46A] rounded-full transition-all"
                                    style={{ width: `${sub.completionRate}%` }}
                                  />
                                </div>
                                <span className="font-bold text-[#3B3B3B] dark:text-white text-xs min-w-[34px]">
                                  {sub.completionRate}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab B: Student Accountability & Roster Table */}
              {activityTab === "roster" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-black/5 dark:border-white/10 text-[#696969] dark:text-gray-400 font-semibold">
                        <th className="py-2.5 px-3">Student Name & Info</th>
                        <th className="py-2.5 px-3">Status Badge</th>
                        <th className="py-2.5 px-3">Time Spent (Period)</th>
                        <th className="py-2.5 px-3 text-center">Modules Accessed</th>
                        <th className="py-2.5 px-3 text-center">Mock Tests Completed</th>
                        <th className="py-2.5 px-3">Last Active</th>
                        <th className="py-2.5 px-3 text-right pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {(data?.studentActivityAnalytics?.tabB_studentRoster || []).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-[#696969] dark:text-gray-400">
                            No student activity records found for this period.
                          </td>
                        </tr>
                      ) : (
                        (data?.studentActivityAnalytics?.tabB_studentRoster || []).map((st) => (
                          <tr key={st.id} className="h-12 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-[#3B3B3B] dark:text-white">
                                {st.name}
                              </div>
                              <div className="text-[11px] text-[#696969] dark:text-gray-400">
                                {st.email} • {st.school}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${st.statusColor}`}
                              >
                                {st.statusBadge}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-[#3B3B3B] dark:text-white">
                              {st.timeSpentStr}
                            </td>
                            <td className="py-3 px-3 text-center font-medium text-[#3B3B3B] dark:text-gray-200">
                              {st.modulesAccessed}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-semibold text-[#3B3B3B] dark:text-white">
                                {st.mockTestsCompleted}
                              </span>
                              <span className="text-[11px] text-[#696969] dark:text-gray-400 block">
                                avg. {st.avgScore}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[#696969] dark:text-gray-400 whitespace-nowrap">
                              {st.lastActiveText}
                            </td>
                            <td className="py-3 px-3 pr-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  // Scroll or filter to student in section 1
                                  setSearch(st.name)
                                  window.scrollTo({ top: 0, behavior: "smooth" })
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[#3B3B3B] dark:text-white transition-all cursor-pointer whitespace-nowrap"
                              >
                                View Profile / Study Log
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


