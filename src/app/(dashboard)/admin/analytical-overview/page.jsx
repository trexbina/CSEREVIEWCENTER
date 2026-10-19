"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
  UserPlus,
  UserCheck,
  TrendingUp,
  Award,
  Filter,
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
  // Section 1 filter state
  const [selectedExamIds, setSelectedExamIds] = useState([])
  const [selectedBatchIds, setSelectedBatchIds] = useState([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filterDropdownRef = useRef(null)

  // Section 2: Mock Exam Passers Rate Filters
  const [selectedPassersExamIds, setSelectedPassersExamIds] = useState([])
  const [selectedPassersBatchIds, setSelectedPassersBatchIds] = useState([])
  const [selectedMockExamIds, setSelectedMockExamIds] = useState([])
  const [isPassersFilterOpen, setIsPassersFilterOpen] = useState(false)
  const passersFilterRef = useRef(null)

  // Section 3: Student Activity & Engagement State
  const [selectedActivityExamIds, setSelectedActivityExamIds] = useState([])
  const [selectedActivityBatchIds, setSelectedActivityBatchIds] = useState([])
  const [isActivityFilterOpen, setIsActivityFilterOpen] = useState(false)
  const activityFilterRef = useRef(null)

  // Section 4: User Registration Overview State
  const [selectedRegExamIds, setSelectedRegExamIds] = useState([])
  const [selectedRegBatchIds, setSelectedRegBatchIds] = useState([])
  const [isRegFilterOpen, setIsRegFilterOpen] = useState(false)
  const regFilterRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setIsFilterOpen(false)
      }
      if (passersFilterRef.current && !passersFilterRef.current.contains(e.target)) {
        setIsPassersFilterOpen(false)
      }
      if (activityFilterRef.current && !activityFilterRef.current.contains(e.target)) {
        setIsActivityFilterOpen(false)
      }
      if (regFilterRef.current && !regFilterRef.current.contains(e.target)) {
        setIsRegFilterOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])
  const [showPerformanceOverview, setShowPerformanceOverview] = useState(true)
  const [showPassersRate, setShowPassersRate] = useState(true)
  const [showStudentActivity, setShowStudentActivity] = useState(true)
  const [showUserRegistration, setShowUserRegistration] = useState(true)

  // Shared: today's date string (must be declared before any useState that uses it)
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], [])

  // Section 4: User Registration Overview State
  const [regDate, setRegDate] = useState(() => new Date().toISOString().split("T")[0])
  const [regRange, setRegRange] = useState("today") // 'today' | 'yesterday' | '7days' | '30days' | 'all'
  const [regTab, setRegTab] = useState("tracks") // 'tracks' | 'log'

  // Section 3: Student Activity & Engagement State
  const [activityDate, setActivityDate] = useState(todayStr)
  const [activityRange, setActivityRange] = useState("today") // 'today' | 'yesterday' | '7days' | 'all'
  const [activityTab, setActivityTab] = useState("subjects") // 'subjects' | 'roster'
  const [subjectSortField, setSubjectSortField] = useState("totalHoursDecimal")
  const [subjectSortDir, setSubjectSortDir] = useState("desc")
  const [rosterSortField, setRosterSortField] = useState("name")
  const [rosterSortDir, setRosterSortDir] = useState("asc")
  const [activityLoading, setActivityLoading] = useState(false)

  const examinationOptions = data?.filters?.examinations || []
  const allBatchOptions = data?.filters?.batches || []
  const mockExamOptions = data?.filters?.mockExams || []

  // Dynamic batch options for Section 2 (Mock Exam Passers Rate)
  const passersBatchOptions = useMemo(() => {
    if (selectedPassersExamIds.length === 0) {
      return allBatchOptions
    }
    return allBatchOptions.filter((b) =>
      selectedPassersExamIds.includes(String(b.exam_id))
    )
  }, [allBatchOptions, selectedPassersExamIds])

  // Dynamic batch options for Section 3 (Student Activity & Engagement)
  const activityBatchOptions = useMemo(() => {
    if (selectedActivityExamIds.length === 0) {
      return allBatchOptions
    }
    return allBatchOptions.filter((b) =>
      selectedActivityExamIds.includes(String(b.exam_id))
    )
  }, [allBatchOptions, selectedActivityExamIds])

  // Dynamic batch options for Section 4 (User Registration Overview)
  const regBatchOptions = useMemo(() => {
    if (selectedRegExamIds.length === 0) {
      return allBatchOptions
    }
    return allBatchOptions.filter((b) =>
      selectedRegExamIds.includes(String(b.exam_id))
    )
  }, [allBatchOptions, selectedRegExamIds])

  // Filter button label for Section 2
  const passersFilterButtonLabel = useMemo(() => {
    const totalSelected = selectedPassersExamIds.length + selectedPassersBatchIds.length + selectedMockExamIds.length
    if (totalSelected === 0) return "All Filters"
    return `Filters (${totalSelected})`
  }, [selectedPassersExamIds, selectedPassersBatchIds, selectedMockExamIds])

  // Filter button label for Section 3
  const activityFilterButtonLabel = useMemo(() => {
    const totalSelected = selectedActivityExamIds.length + selectedActivityBatchIds.length
    if (totalSelected === 0) return "All Filters"
    return `Filters (${totalSelected})`
  }, [selectedActivityExamIds, selectedActivityBatchIds])

  // Filter button label for Section 4
  const regFilterButtonLabel = useMemo(() => {
    const totalSelected = selectedRegExamIds.length + selectedRegBatchIds.length
    if (totalSelected === 0) return "All Filters"
    return `Filters (${totalSelected})`
  }, [selectedRegExamIds, selectedRegBatchIds])

  // Filtered mock exams for Section 2 based on selected examinations & batches
  const filteredMockExamOptions = useMemo(() => {
    const list = mockExamOptions || []
    if (selectedPassersExamIds.length === 0 && selectedPassersBatchIds.length === 0) {
      return list
    }

    const attemptsList = data?.mockExamPassersData?.attempts || []

    return list.filter((exam) => {
      // 1. Check if mock exam has recorded attempts matching the selected exam / batch
      const hasMatchingAttempt = attemptsList.some((att) => {
        if (String(att.mockExamId) !== String(exam.id)) return false
        const matchExam = selectedPassersExamIds.length === 0 || selectedPassersExamIds.includes(String(att.examId))
        const matchBatch = selectedPassersBatchIds.length === 0 || selectedPassersBatchIds.includes(String(att.batchId))
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
      if (selectedPassersExamIds.length === 0) {
        matchesExamTarget = true
      } else {
        matchesExamTarget = targets.some((t) => {
          if (typeof t !== "string") return false
          const tLower = t.toLowerCase()
          return selectedPassersExamIds.some((id) => {
            const examObj = examinationOptions.find((e) => String(e.id) === String(id))
            return (
              tLower === `course_${id}` ||
              (examObj?.name && tLower.includes(examObj.name.toLowerCase()))
            )
          })
        })
      }

      let matchesBatchTarget = false
      if (selectedPassersBatchIds.length === 0) {
        matchesBatchTarget = true
      } else {
        matchesBatchTarget = targets.some((t) => {
          if (typeof t !== "string") return false
          const tLower = t.toLowerCase()
          return selectedPassersBatchIds.some((id) => {
            const batchObj = allBatchOptions.find((b) => String(b.id) === String(id))
            return (
              tLower === `batch_${id}` ||
              (batchObj?.name && tLower.includes(batchObj.name.toLowerCase()))
            )
          })
        })
      }

      return matchesExamTarget && matchesBatchTarget
    })
  }, [mockExamOptions, selectedPassersExamIds, selectedPassersBatchIds, examinationOptions, allBatchOptions, data])

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
        if (selectedMockExamIds.length > 0 && !selectedMockExamIds.includes(String(att.mockExamId))) {
          return false
        }
        if (selectedPassersExamIds.length > 0 && !selectedPassersExamIds.includes(String(att.examId))) {
          return false
        }
        if (selectedPassersBatchIds.length > 0 && !selectedPassersBatchIds.includes(String(att.batchId))) {
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
      if (selectedMockExamIds.length === 1) {
        const found = raw.perExam?.find((e) => String(e.id) === String(selectedMockExamIds[0]))
        title = found ? (found.exam_code ? `${found.exam_code} — ${found.title}` : found.title) : `Mock Exam #${selectedMockExamIds[0]}`
      } else if (selectedMockExamIds.length > 1) {
        title = `${selectedMockExamIds.length} Mock Exams Selected`
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
    if (selectedMockExamIds.length === 0) {
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

    const selectedExams = (raw.perExam || []).filter((e) => selectedMockExamIds.includes(String(e.id)))
    if (selectedExams.length > 0) {
      const totalTakers = selectedExams.reduce((sum, e) => sum + (e.totalTakers || 0), 0)
      const passedCount = selectedExams.reduce((sum, e) => sum + (e.passedCount || 0), 0)
      const failedCount = selectedExams.reduce((sum, e) => sum + (e.failedCount || 0), 0)
      const passRate = totalTakers > 0 ? Math.round((passedCount / totalTakers) * 1000) / 10 : 0
      const failRate = totalTakers > 0 ? Math.max(0, Math.round((100 - passRate) * 10) / 10) : 0
      const totalScore = selectedExams.reduce((sum, e) => sum + ((e.averageScore || 0) * (e.totalTakers || 1)), 0)
      const averageScore = totalTakers > 0 ? Math.round((totalScore / totalTakers) * 10) / 10 : 0

      let title = selectedExams.length === 1
        ? (selectedExams[0].exam_code ? `${selectedExams[0].exam_code} — ${selectedExams[0].title}` : (selectedExams[0].title || `Mock Exam #${selectedExams[0].id}`))
        : `${selectedExams.length} Mock Exams Selected`

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

    return {
      title: "Selected Mock Exam",
      totalTakers: 0,
      passedCount: 0,
      failedCount: 0,
      passRate: 0,
      failRate: 0,
      averageScore: 0,
    }
  }, [data, selectedMockExamIds, selectedPassersExamIds, selectedPassersBatchIds])

  // Filtered Student Activity & Engagement Data based on Examination and Batch filters
  const filteredActivityAnalytics = useMemo(() => {
    const raw = data?.studentActivityAnalytics
    if (!raw) return null

    // If both filters are empty, return raw data directly
    if (selectedActivityExamIds.length === 0 && selectedActivityBatchIds.length === 0) {
      return raw
    }

    const rawRoster = raw.tabB_studentRoster || []
    const rawSubjects = raw.tabA_subjectBreakdown || []
    const isSingleDay = raw.isSingleDay

    // Filter student roster
    const filteredRoster = rawRoster.filter((st) => {
      if (selectedActivityExamIds.length > 0 && !selectedActivityExamIds.includes(String(st.examId))) {
        return false
      }
      if (selectedActivityBatchIds.length > 0 && !selectedActivityBatchIds.includes(String(st.batchId))) {
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
  }, [data, selectedActivityExamIds, selectedActivityBatchIds])

  const fetchAnalytics = async (customParams = {}) => {
    setLoading(true)
    try {
      const activeDate = customParams.date !== undefined ? customParams.date : activityDate
      const activeRange = customParams.range !== undefined ? customParams.range : activityRange
      const activeRegDate = customParams.regDate !== undefined ? customParams.regDate : regDate
      const activeRegRange = customParams.regRange !== undefined ? customParams.regRange : regRange

      const q = new URLSearchParams()
      if (activeDate) q.set("activity_date", activeDate)
      if (activeRange) q.set("activity_range", activeRange)
      if (activeRegDate) q.set("reg_date", activeRegDate)
      if (activeRegRange) q.set("reg_range", activeRegRange)

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

  // Registration date picker handler
  const handleRegDateChange = (newDate) => {
    setRegDate(newDate)
    setRegRange("")
    fetchAnalytics({ regDate: newDate, regRange: "" })
  }

  // Registration quick presets handler (Today | Yesterday | Last 7 Days | Last 30 Days | All-Time)
  const handleRegRangeChange = (range) => {
    setRegRange(range)
    if (range === "today") {
      setRegDate(todayStr)
    } else if (range === "yesterday") {
      const y = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      setRegDate(y)
    } else {
      setRegDate("")
    }
    fetchAnalytics({
      regRange: range,
      regDate:
        range === "today"
          ? todayStr
          : range === "yesterday"
          ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          : "",
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
        "Login ID",
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
          `"${(formatLoginId(row)).replace(/"/g, '""')}"`,
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

  // Section 4: Export CSV Action for User Registration Overview
  const exportRegCSV = () => {
    const reg = filteredRegistrationData
    if (!reg) return

    let csvRows = []
    if (regTab === "tracks") {
      csvRows.push([
        "Licensure Exam Track",
        "Full Examination Title",
        "New Registrations (Period)",
        "Total Enrolled Candidates",
        "Active Candidates",
        "Active Rate (%)",
        "Cohort Share (%)",
      ])
      ;(reg.tabA_examTracks || []).forEach((row) => {
        csvRows.push([
          `"${(row.trackCode || "").replace(/"/g, '""')}"`,
          `"${(row.trackName || "").replace(/"/g, '""')}"`,
          row.newRegistrations,
          row.totalCandidates,
          row.activeCandidates,
          `${row.activePercentage}%`,
          `${row.shareRate}%`,
        ])
      })
    } else {
      csvRows.push([
        "Candidate Name",
        "Login ID",
        "Role",
        "Target Examination",
        "Batch",
        "School",
        "Status",
        "Registration Date",
      ])
      ;(reg.tabB_candidateLog || []).forEach((c) => {
        csvRows.push([
          `"${(c.name || "").replace(/"/g, '""')}"`,
          `"${(formatLoginId(c)).replace(/"/g, '""')}"`,
          `"${(c.role || "").replace(/"/g, '""')}"`,
          `"${(c.target_exam || "").replace(/"/g, '""')}"`,
          `"${(c.batch_name || "").replace(/"/g, '""')}"`,
          `"${(c.school_name || "").replace(/"/g, '""')}"`,
          `"${(c.status || "").replace(/"/g, '""')}"`,
          `"${(c.created_formatted || "").replace(/"/g, '""')}"`,
        ])
      })
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `user_registrations_${regTab}_${regRange || regDate || "export"}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Section 4: Filtered User Registration Overview Data based on Examination and Batch
  const filteredRegistrationData = useMemo(() => {
    const raw = data?.userRegistrationOverview
    if (!raw) return null

    const allCandidates = raw.allCandidates || []
    const isSingleDay = raw.isSingleDay

    // Filter candidates by selected examination and batch
    const filteredCandidates = allCandidates.filter((c) => {
      if (selectedRegExamIds.length > 0) {
        const matchId = selectedRegExamIds.includes(String(c.exam_id))
        const matchTrack = selectedRegExamIds.some((id) => {
          const foundExam = examinationOptions.find((e) => String(e.id) === String(id))
          return foundExam && (
            c.target_exam?.toLowerCase() === foundExam.name?.toLowerCase() ||
            foundExam.name?.toLowerCase().includes(c.target_exam?.toLowerCase())
          )
        })
        if (!matchId && !matchTrack) return false
      }
      if (selectedRegBatchIds.length > 0 && !selectedRegBatchIds.includes(String(c.batch_id))) {
        return false
      }
      return true
    })

    const selDate = raw.selectedDate
    const inPeriod = (c) => {
      if (raw.selectedRange === "all") return true
      if (isSingleDay) return c.created_date === selDate
      return c.created_date >= raw.selectedDate && c.created_date <= todayStr
    }

    const periodCandidates = filteredCandidates.filter(inPeriod)
    const newCount = periodCandidates.length
    const totalScoped = filteredCandidates.length
    const platformTotal = allCandidates.length
    const reachPct = platformTotal > 0 ? Math.round((totalScoped / platformTotal) * 100) : 0

    const activeCandidates = filteredCandidates.filter((c) => c.status === "active")
    const activeRate = totalScoped > 0 ? Math.round((activeCandidates.length / totalScoped) * 100) : 0

    // Leading Exam Track in this filtered view
    const examCountMap = {}
    periodCandidates.forEach((c) => {
      const ex = c.target_exam || "General"
      examCountMap[ex] = (examCountMap[ex] || 0) + 1
    })
    let leadingTrack = "—"
    let leadingShare = 0
    const sortedTracks = Object.entries(examCountMap).sort((a, b) => b[1] - a[1])
    if (sortedTracks.length > 0) {
      leadingTrack = sortedTracks[0][0]
      leadingShare = newCount > 0 ? Math.round((sortedTracks[0][1] / newCount) * 100) : 0
    } else if (totalScoped > 0) {
      const totalExamMap = {}
      filteredCandidates.forEach((c) => {
        const ex = c.target_exam || "General"
        totalExamMap[ex] = (totalExamMap[ex] || 0) + 1
      })
      const sortedTotal = Object.entries(totalExamMap).sort((a, b) => b[1] - a[1])
      if (sortedTotal.length > 0) {
        leadingTrack = sortedTotal[0][0]
        leadingShare = Math.round((sortedTotal[0][1] / totalScoped) * 100)
      }
    }

    // Licensure Examination Distribution Chart
    const distinctExams = Array.from(new Set(allCandidates.map((c) => c.target_exam || "General")))
    const colors = ["#3B3B3B", "#E9C46A", "#2A9D8F", "#E76F51", "#8338EC", "#3A86FF"]
    const distributionChart = distinctExams.map((exName, idx) => {
      const count = filteredCandidates.filter((c) => (c.target_exam || "General") === exName).length
      const pct = totalScoped > 0 ? Math.round((count / totalScoped) * 1000) / 10 : 0
      return {
        name: exName,
        count,
        percentage: pct,
        fill: colors[idx % colors.length],
      }
    }).filter((e) => e.count > 0 || totalScoped === 0)

    // Historical Sign-Up Trends Chart
    let trendChart = raw.trendChart || []
    if (selectedRegExamIds.length > 0 || selectedRegBatchIds.length > 0) {
      if (isSingleDay) {
        const hourBuckets = Array.from({ length: 24 }).map((_, h) => ({
          hour: `${String(h).padStart(2, "0")}:00`,
          registrations: 0,
          cumulative: 0,
        }))
        periodCandidates.forEach((c) => {
          if (c.created_hour >= 0 && c.created_hour < 24) {
            hourBuckets[c.created_hour].registrations += 1
          }
        })
        let cum = 0
        trendChart = hourBuckets.map((b) => {
          cum += b.registrations
          return {
            hour: b.hour,
            date: b.hour,
            registrations: b.registrations,
            cumulative: cum,
          }
        })
      } else {
        const dateMap = {}
        periodCandidates.forEach((c) => {
          dateMap[c.created_date] = (dateMap[c.created_date] || 0) + 1
        })
        let running = 0
        trendChart = (raw.trendChart || []).map((slot) => {
          const matchCount = Object.keys(dateMap).find((k) => slot.date?.includes(k) || slot.hour?.includes(k))
          const regs = matchCount ? dateMap[matchCount] : 0
          running += regs
          return {
            ...slot,
            registrations: regs,
            cumulative: running,
          }
        })
      }
    }

    // Tab A: Exam Tracks Breakdown
    const examTracks = distinctExams.map((track) => {
      const trackUsers = filteredCandidates.filter((c) => (c.target_exam || "General") === track)
      const newInPeriod = periodCandidates.filter((c) => (c.target_exam || "General") === track).length
      const totalInTrack = trackUsers.length
      const activeInTrack = trackUsers.filter((c) => c.status === "active").length
      const activePct = totalInTrack > 0 ? Math.round((activeInTrack / totalInTrack) * 100) : 0
      const shareRate = totalScoped > 0 ? Math.round((totalInTrack / totalScoped) * 100) : 0

      const foundExam = examinationOptions.find((e) => e.name.toLowerCase().includes(track.toLowerCase()))
      const fullTitle = foundExam ? foundExam.name : `${track} Licensure Review`

      return {
        trackCode: track,
        trackName: fullTitle,
        newRegistrations: newInPeriod,
        totalCandidates: totalInTrack,
        activeCandidates: activeInTrack,
        activePercentage: activePct,
        shareRate,
      }
    })

    return {
      kpis: {
        newRegistrations: `+${newCount} ${isSingleDay ? (raw.selectedRange === "today" ? "Today" : "on Date") : "in Period"}`,
        newRegistrationsCount: newCount,
        registrationDeltaText: raw.kpis?.registrationDeltaText || `${newCount} accounts in period`,
        totalRegisteredReach: `${totalScoped} Candidates`,
        totalRegisteredCount: totalScoped,
        reachSubtext: `${reachPct}% of platform reach (${platformTotal} total)`,
        leadingExamTrack: leadingTrack !== "—" ? `${leadingTrack} (${leadingShare}%)` : "—",
        leadingExamSubtext: "Highest volume of candidate registrations",
        activeCandidatesRate: `${activeRate}% Active`,
        activeCandidatesCount: `${activeCandidates.length} of ${totalScoped} active accounts`,
      },
      trendChart,
      distributionChart,
      tabA_examTracks: examTracks,
      tabB_candidateLog: periodCandidates.length > 0 ? periodCandidates : filteredCandidates,
      isSingleDay,
    }
  }, [data, selectedRegExamIds, selectedRegBatchIds, examinationOptions, todayStr])

  // Filter batches based on selected examinations. If no examination is selected, show all batches.
  const availableBatchOptions = useMemo(() => {
    if (selectedExamIds.length === 0) {
      return allBatchOptions
    }
    return allBatchOptions.filter((b) =>
      selectedExamIds.includes(String(b.exam_id))
    )
  }, [allBatchOptions, selectedExamIds])

  // Label for combined filter button
  const filterButtonLabel = useMemo(() => {
    const total = selectedExamIds.length + selectedBatchIds.length
    if (total === 0) return "All"
    if (selectedExamIds.length === 1 && selectedBatchIds.length === 0) {
      const found = examinationOptions.find((e) => String(e.id) === selectedExamIds[0])
      return found?.name || "1 Examination"
    }
    if (selectedExamIds.length === 0 && selectedBatchIds.length === 1) {
      const found = allBatchOptions.find((b) => String(b.id) === selectedBatchIds[0])
      return found?.name || "1 Batch"
    }
    return `${total} Selected`
  }, [selectedExamIds, selectedBatchIds, examinationOptions, allBatchOptions])

  // Performance Rating calculation matching Status Reference rules & Dashboard palette
  const getPerformanceRating = (score) => {
    const val = Number(score) || 0
    if (val >= 80) {
      return {
        label: "SUPERIOR / IT PREPARED",
        badgeBg: "bg-[#E17055]/20 text-[#b33920] border-[#E17055]/35 dark:bg-[#E17055]/25 dark:text-[#f89b87]",
      }
    }
    if (val >= 70) {
      return {
        label: "ADEQUATELY PREPARED",
        badgeBg: "bg-[#3B82F6]/20 text-[#1d4ed8] border-[#3B82F6]/35 dark:bg-[#3B82F6]/25 dark:text-[#93c5fd]",
      }
    }
    if (val >= 60) {
      return {
        label: "NEEDS REINFORCEMENT",
        badgeBg: "bg-[#2A9D8F]/20 text-[#1b6b61] border-[#2A9D8F]/35 dark:bg-[#2A9D8F]/25 dark:text-[#68c9be]",
      }
    }
    return {
      label: "FOR MONITORING",
      badgeBg: "bg-[#E9C46A]/20 text-[#a16207] border-[#E9C46A]/35 dark:bg-[#E9C46A]/25 dark:text-[#facc15]",
    }
  }

  // Format login ID matching the system standard (e.g. dianalan00002)
  const formatLoginId = (item) => {
    if (item?.loginId && !item.loginId.includes("@") && !item.loginId.startsWith("ID: ")) return item.loginId
    if (item?.login_id && !item.login_id.includes("@") && !item.login_id.startsWith("ID: ")) return item.login_id
    if (item?.name) {
      const parts = item.name.trim().split(/\s+/)
      const surname = parts[parts.length - 1]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "user"
      return `${surname}${String(item.id || 1).padStart(5, "0")}`
    }
    return `user${String(item?.id || 1).padStart(5, "0")}`
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

    // Filter by examination (supports multi-select)
    if (selectedExamIds.length > 0) {
      result = result.filter((s) => {
        const sExamId = String(s.examId || s.examinationId || "")
        const sExamName = s.examination?.toLowerCase()
        return (
          selectedExamIds.includes(sExamId) ||
          selectedExamIds.some((id) => {
            const found = examinationOptions.find((e) => String(e.id) === String(id))
            return found && found.name?.toLowerCase() === sExamName
          })
        )
      })
    }

    // Filter by batch (supports multi-select)
    if (selectedBatchIds.length > 0) {
      result = result.filter((s) => {
        const sBatchId = String(s.batchId || "")
        const sBatchName = s.batch?.toLowerCase()
        return (
          selectedBatchIds.includes(sBatchId) ||
          selectedBatchIds.some((id) => {
            const found = allBatchOptions.find((b) => String(b.id) === String(id))
            return found && found.name?.toLowerCase() === sBatchName
          })
        )
      })
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          formatLoginId(s).toLowerCase().includes(q) ||
          (s.loginId || s.login_id || "").toLowerCase().includes(q) ||
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
  }, [data, search, sortField, sortDir, selectedExamIds, selectedBatchIds, examinationOptions, allBatchOptions])

  // Filter and sort schools (Top Schools)
  const filteredSchools = useMemo(() => {
    const studentsList = data?.comparativeLeaderboards?.students || []
    let result = []

    if (selectedExamIds.length > 0 || selectedBatchIds.length > 0) {
      // Re-aggregate school statistics for the selected examinations & batches
      const matchedStudents = studentsList.filter((s) => {
        const sExamId = String(s.examId || s.examinationId || "")
        const sExamName = s.examination?.toLowerCase()
        const matchesExam =
          selectedExamIds.length === 0 ||
          selectedExamIds.includes(sExamId) ||
          selectedExamIds.some((id) => {
            const found = examinationOptions.find((e) => String(e.id) === String(id))
            return found && found.name?.toLowerCase() === sExamName
          })

        const sBatchId = String(s.batchId || "")
        const sBatchName = s.batch?.toLowerCase()
        const matchesBatch =
          selectedBatchIds.length === 0 ||
          selectedBatchIds.includes(sBatchId) ||
          selectedBatchIds.some((id) => {
            const found = allBatchOptions.find((b) => String(b.id) === String(id))
            return found && found.name?.toLowerCase() === sBatchName
          })

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
  }, [data, search, sortField, sortDir, selectedExamIds, selectedBatchIds, examinationOptions, allBatchOptions])

  // Filter and sort students at risk (avgScore < 75% or low mock exam completion)
  const filteredAtRiskStudents = useMemo(() => {
    const list = data?.comparativeLeaderboards?.students || []
    // At risk: students below passing benchmark (75%)
    let result = list.filter((s) => (s.avgScore ?? 0) < 75)

    // Filter by examination (supports multi-select)
    if (selectedExamIds.length > 0) {
      result = result.filter((s) => {
        const sExamId = String(s.examId || s.examinationId || "")
        const sExamName = s.examination?.toLowerCase()
        return (
          selectedExamIds.includes(sExamId) ||
          selectedExamIds.some((id) => {
            const found = examinationOptions.find((e) => String(e.id) === String(id))
            return found && found.name?.toLowerCase() === sExamName
          })
        )
      })
    }

    // Filter by batch (supports multi-select)
    if (selectedBatchIds.length > 0) {
      result = result.filter((s) => {
        const sBatchId = String(s.batchId || "")
        const sBatchName = s.batch?.toLowerCase()
        return (
          selectedBatchIds.includes(sBatchId) ||
          selectedBatchIds.some((id) => {
            const found = allBatchOptions.find((b) => String(b.id) === String(id))
            return found && found.name?.toLowerCase() === sBatchName
          })
        )
      })
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          formatLoginId(s).toLowerCase().includes(q) ||
          (s.loginId || s.login_id || "").toLowerCase().includes(q) ||
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
  }, [data, search, sortField, sortDir, selectedExamIds, selectedBatchIds, examinationOptions, allBatchOptions])

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 space-y-9 sm:space-y-10 pb-10">
      {/* ═══ SECTION 1: Performance Rating Overview (Top Students, Schools, At-Risk) ═══ */}
      <div className="space-y-4">
        {/* Section Header & Hide/Unhide Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowPerformanceOverview((prev) => !prev)}
            className="group text-left cursor-pointer focus:outline-none"
          >
            <div className="inline-flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-[#3B3B3B] dark:text-white tracking-tight">
                Performance Rating Overview
              </h2>
              <div className="text-neutral-400 group-hover:text-[#3B3B3B] dark:group-hover:text-white transition-colors">
                {showPerformanceOverview ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </div>
          </button>

          {/* Refresh button */}
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            className="self-end sm:self-auto inline-flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Collapsible Content */}
        {showPerformanceOverview && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top: Minimal Tab Switcher */}
            <div className="inline-flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 shrink-0 self-start">
              <button
                type="button"
                onClick={() => handleTabChange("students")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === "students"
                    ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                    : "text-neutral-400 dark:text-neutral-500 hover:text-[#3B3B3B] dark:hover:text-white"
                }`}
              >
                Top Students
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("schools")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === "schools"
                    ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                    : "text-neutral-400 dark:text-neutral-500 hover:text-[#3B3B3B] dark:hover:text-white"
                }`}
              >
                Top Schools
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("at-risk")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === "at-risk"
                    ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                    : "text-neutral-400 dark:text-neutral-500 hover:text-[#3B3B3B] dark:hover:text-white"
                }`}
              >
                Students at Risk
              </button>
            </div>

            {/* Table Container with Integrated Toolbar */}
            <div className="w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs">
              {/* Table Top Toolbar: Integrated Search & Filter Controls */}
              <div className="p-3 sm:p-3.5 border-b border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/40 dark:bg-white/[0.02] rounded-t-2xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-64 lg:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 pointer-events-none" />
                    <input
                      type="search"
                      placeholder={
                        activeTab === "schools"
                          ? "Search school…"
                          : "Search student by name, ID…"
                      }
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full h-8.5 sm:h-9 pl-9 pr-3 text-xs rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs"
                    />
                  </div>

                  {/* Beside the button, add a label "Filter" */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-normal text-[#696969] dark:text-gray-400 select-none">
                      Filter
                    </span>
                    <div className="relative" ref={filterDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen((prev) => !prev)}
                        className="h-8.5 sm:h-9 px-3 text-xs font-normal rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white hover:bg-neutral-50 dark:hover:bg-white/15 transition-all shadow-2xs cursor-pointer inline-flex items-center gap-2 select-none"
                        aria-expanded={isFilterOpen}
                        aria-haspopup="true"
                      >
                        <Filter className="size-3.5 opacity-60 shrink-0" />
                        <span className="truncate max-w-[140px] sm:max-w-[180px]">
                          {filterButtonLabel}
                        </span>
                        <ChevronDown
                          className={`size-3 opacity-60 shrink-0 transition-transform duration-200 ${
                            isFilterOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {isFilterOpen && (
                        <div className="absolute left-0 sm:left-auto top-full mt-1.5 w-72 sm:w-80 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1b20] shadow-xl z-50 p-3 space-y-3 max-h-[400px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                          {/* Section 1: Examinations */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                                Examinations
                              </span>
                              {selectedExamIds.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedExamIds([])}
                                  className="text-[11px] text-[#a16207] dark:text-[#facc15] hover:underline cursor-pointer"
                                >
                                  Clear
                                </button>
                              )}
                            </div>

                            <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs font-medium text-[#3B3B3B] dark:text-gray-200 select-none">
                              <input
                                type="checkbox"
                                checked={selectedExamIds.length === 0}
                                onChange={() => setSelectedExamIds([])}
                                className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                              />
                              <span>All Examinations</span>
                            </label>

                            <div className="space-y-0.5 max-h-36 overflow-y-auto pr-1">
                              {examinationOptions.map((exam) => {
                                const isChecked = selectedExamIds.includes(String(exam.id))
                                return (
                                  <label
                                    key={exam.id}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs text-[#3B3B3B] dark:text-gray-200 select-none"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          setSelectedExamIds(selectedExamIds.filter((id) => id !== String(exam.id)))
                                        } else {
                                          setSelectedExamIds([...selectedExamIds, String(exam.id)])
                                        }
                                      }}
                                      className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                                    />
                                    <span className="truncate">{exam.name}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>

                          {/* Section Divider */}
                          <div className="border-t border-black/5 dark:border-white/10" />

                          {/* Section 2: Batches */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                                Batches
                              </span>
                              {selectedBatchIds.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedBatchIds([])}
                                  className="text-[11px] text-[#a16207] dark:text-[#facc15] hover:underline cursor-pointer"
                                >
                                  Clear
                                </button>
                              )}
                            </div>

                            <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs font-medium text-[#3B3B3B] dark:text-gray-200 select-none">
                              <input
                                type="checkbox"
                                checked={selectedBatchIds.length === 0}
                                onChange={() => setSelectedBatchIds([])}
                                className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                              />
                              <span>All Batches</span>
                            </label>

                            <div className="space-y-0.5 max-h-36 overflow-y-auto pr-1">
                              {availableBatchOptions.map((batch) => {
                                const isChecked = selectedBatchIds.includes(String(batch.id))
                                return (
                                  <label
                                    key={batch.id}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs text-[#3B3B3B] dark:text-gray-200 select-none"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          setSelectedBatchIds(selectedBatchIds.filter((id) => id !== String(batch.id)))
                                        } else {
                                          setSelectedBatchIds([...selectedBatchIds, String(batch.id)])
                                        }
                                      }}
                                      className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                                    />
                                    <span className="truncate">{batch.name}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>

                          {/* Bottom Reset Strip */}
                          {(selectedExamIds.length > 0 || selectedBatchIds.length > 0) && (
                            <>
                              <div className="border-t border-black/5 dark:border-white/10" />
                              <div className="flex items-center justify-between px-1 pt-0.5 text-xs">
                                <span className="text-neutral-400">
                                  {selectedExamIds.length + selectedBatchIds.length} active
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedExamIds([])
                                    setSelectedBatchIds([])
                                  }}
                                  className="font-medium text-[#3B3B3B] dark:text-white hover:underline cursor-pointer"
                                >
                                  Reset all
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Showing count indicator on the right */}
                <div className="text-[11px] text-neutral-400 dark:text-neutral-500 font-normal select-none pr-1">
                  {activeTab === "students" && `${filteredStudents.length} ${filteredStudents.length === 1 ? "student" : "students"}`}
                  {activeTab === "schools" && `${filteredSchools.length} ${filteredSchools.length === 1 ? "institution" : "institutions"}`}
                  {activeTab === "at-risk" && `${filteredAtRiskStudents.length} ${filteredAtRiskStudents.length === 1 ? "student at risk" : "students at risk"}`}
                </div>
              </div>
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
              <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-normal text-neutral-400 dark:text-neutral-500">Loading ranking data…</p>
            </div>
          ) : activeTab === "students" ? (
            /* ── Top Students Table ── */
            filteredStudents.length === 0 ? (
              <div className="py-16 text-center text-xs font-normal text-neutral-400 dark:text-neutral-500">
                {search ? `No students found matching "${search}"` : "No student performance records available."}
              </div>
            ) : (
              <div className="max-h-[720px] overflow-y-auto rounded-b-2xl">
                <table className="w-full text-left border-collapse" aria-label="Top Students Table">
                  <thead className="sticky top-0 z-10 bg-neutral-50/60 dark:bg-[#14161b]/80 backdrop-blur-md border-b border-black/5 dark:border-white/10">
                    <tr className="h-11 text-xs font-semibold text-[#696969] dark:text-gray-300">
                      <th className="w-16 px-4 py-2.5 text-center font-semibold text-[#696969] dark:text-gray-400" scope="col">Rank</th>
                      <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("name")}
                          className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer font-semibold text-xs"
                        >
                          <span>Student</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                      <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("school")}
                          className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer font-semibold text-xs"
                        >
                          <span>Institution</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                      <th className="px-4 py-2.5 font-semibold text-left" scope="col">Major / Specialization</th>
                      <th className="px-4 py-2.5 font-semibold text-left" scope="col">Batch</th>
                      <th className="px-4 py-2.5 font-semibold text-right pr-6" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("avgScore")}
                          className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer ml-auto font-semibold text-xs"
                        >
                          <span>Performance Rating</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                    {filteredStudents.map((st, idx) => {
                      const displayRank = idx + 1
                      const rating = getPerformanceRating(st.avgScore)
                      return (
                        <tr
                          key={st.id}
                          className="h-13 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors"
                        >
                          {/* Rank */}
                          <td className="w-16 px-4 py-2.5 text-center font-normal text-xs text-[#696969] dark:text-gray-400">
                            {displayRank}
                          </td>

                          {/* Student Name & Login ID */}
                          <td className="px-4 py-2.5 text-left">
                            <div className="font-normal text-[13px] text-[#3B3B3B] dark:text-gray-100">
                              {st.name || "—"}
                            </div>
                            <div className="text-[11px] font-normal text-[#696969] dark:text-gray-400 mt-0.5">
                              {formatLoginId(st)}
                            </div>
                          </td>

                          {/* Institution */}
                          <td className="px-4 py-2.5 text-left text-xs text-[#696969] dark:text-gray-300 font-normal">
                            {st.school || "—"}
                          </td>

                          {/* Major */}
                          <td className="px-4 py-2.5 text-left text-xs text-[#696969] dark:text-gray-400 font-normal">
                            {st.major || "—"}
                          </td>

                          {/* Batch */}
                          <td className="px-4 py-2.5 text-left text-xs text-[#696969] dark:text-gray-300 font-normal">
                            {st.batch || "—"}
                          </td>

                          {/* Performance Rating */}
                          <td className="px-4 py-2.5 text-right pr-6 whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-2.5">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide border uppercase ${rating.badgeBg}`}
                              >
                                {rating.label}
                              </span>
                              <span className="font-normal text-xs text-[#3B3B3B] dark:text-gray-100 min-w-[42px] text-right">
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
              <div className="py-16 text-center text-xs font-normal text-neutral-400 dark:text-neutral-500">
                {search ? `No schools found matching "${search}"` : "No institutional performance records available."}
              </div>
            ) : (
              <div className="max-h-[720px] overflow-y-auto rounded-b-2xl">
                <table className="w-full text-left border-collapse" aria-label="Top Schools Table">
                  <thead className="sticky top-0 z-10 bg-neutral-50/60 dark:bg-[#14161b]/80 backdrop-blur-md border-b border-black/5 dark:border-white/10">
                    <tr className="h-11 text-xs font-semibold text-[#696969] dark:text-gray-300">
                      <th className="w-16 px-4 py-2.5 text-center font-semibold text-[#696969] dark:text-gray-400" scope="col">Rank</th>
                      <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("schoolName")}
                          className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer font-semibold text-xs"
                        >
                          <span>Institution</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                      <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("studentCount")}
                          className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer mx-auto font-semibold text-xs"
                        >
                          <span>Total Students</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                      <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("passedCount")}
                          className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer mx-auto font-semibold text-xs"
                        >
                          <span>Proficient Students</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                      <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("passRate")}
                          className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer mx-auto font-semibold text-xs"
                        >
                          <span>Passing Rate</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                      <th className="px-4 py-2.5 font-semibold text-right pr-6" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("avgScore")}
                          className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer ml-auto font-semibold text-xs"
                        >
                          <span>Average Progress</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                    {filteredSchools.map((sch, idx) => {
                      const displayRank = idx + 1
                      return (
                        <tr
                          key={sch.schoolName}
                          className="h-13 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors"
                        >
                          {/* Rank */}
                          <td className="w-16 px-4 py-2.5 text-center font-normal text-xs text-[#696969] dark:text-gray-400">
                            {displayRank}
                          </td>

                          {/* School Name */}
                          <td className="px-4 py-2.5 text-left">
                            <div className="font-normal text-[13px] text-[#3B3B3B] dark:text-gray-100">
                              {sch.schoolName || "—"}
                            </div>
                          </td>

                          {/* Total Students */}
                          <td className="px-4 py-2.5 text-center text-xs text-[#696969] dark:text-gray-300 font-normal">
                            {sch.studentCount || 0}
                          </td>

                          {/* Proficient Students */}
                          <td className="px-4 py-2.5 text-center text-xs text-[#696969] dark:text-gray-300 font-normal">
                            <span className="font-normal text-[#3B3B3B] dark:text-gray-200">
                              {sch.passedCount || 0}
                            </span>
                            <span className="text-[11px] text-[#696969]/80 dark:text-gray-400 ml-1 font-normal">
                              / {sch.studentCount || 0}
                            </span>
                          </td>

                          {/* Passing Rate */}
                          <td className="px-4 py-2.5 text-center text-xs text-[#696969] dark:text-gray-300 font-normal">
                            {sch.passRate ?? 0}%
                          </td>

                          {/* Average Progress */}
                          <td className="px-4 py-2.5 pr-6 text-right text-xs whitespace-nowrap font-normal">
                            <span className="font-normal text-[#3B3B3B] dark:text-gray-100">
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
              <div className="py-16 text-center text-xs font-normal text-neutral-400 dark:text-neutral-500">
                {search
                  ? `No at-risk students found matching "${search}"`
                  : "No students currently identified as at-risk in this scope."}
              </div>
            ) : (
              <div className="max-h-[720px] overflow-y-auto rounded-b-2xl">
                <table className="w-full text-left border-collapse" aria-label="Students at Risk Table">
                  <thead className="sticky top-0 z-10 bg-neutral-50/60 dark:bg-[#14161b]/80 backdrop-blur-md border-b border-black/5 dark:border-white/10">
                    <tr className="h-11 text-xs font-semibold text-[#696969] dark:text-gray-300">
                      <th className="w-16 px-4 py-2.5 text-center font-semibold text-[#696969] dark:text-gray-400" scope="col">Rank</th>
                      <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("name")}
                          className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer font-semibold text-xs"
                        >
                          <span>Student</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                      <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("school")}
                          className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer font-semibold text-xs"
                        >
                          <span>Institution</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                      <th className="px-4 py-2.5 font-semibold text-left" scope="col">Major / Specialization</th>
                      <th className="px-4 py-2.5 font-semibold text-left" scope="col">Batch</th>
                      <th className="px-4 py-2.5 font-semibold text-right pr-6" scope="col">
                        <button
                          type="button"
                          onClick={() => handleSort("avgScore")}
                          className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer ml-auto font-semibold text-xs"
                        >
                          <span>Performance Rating</span>
                          <ArrowUpDown className="size-3 opacity-60" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                    {filteredAtRiskStudents.map((st, idx) => {
                      const displayIndex = idx + 1
                      const rating = getPerformanceRating(st.avgScore)
                      return (
                        <tr
                          key={st.id}
                          className="h-13 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors"
                        >
                          {/* Index */}
                          <td className="w-16 px-4 py-2.5 text-center font-normal text-xs text-[#696969] dark:text-gray-400">
                            {displayIndex}
                          </td>

                          {/* Student Name & Login ID */}
                          <td className="px-4 py-2.5 text-left">
                            <div className="font-normal text-[13px] text-[#3B3B3B] dark:text-gray-100">
                              {st.name || "—"}
                            </div>
                            <div className="text-[11px] font-normal text-[#696969] dark:text-gray-400 mt-0.5">
                              {formatLoginId(st)}
                            </div>
                          </td>

                          {/* Institution */}
                          <td className="px-4 py-2.5 text-left text-xs text-[#696969] dark:text-gray-300 font-normal">
                            {st.school || "—"}
                          </td>

                          {/* Major */}
                          <td className="px-4 py-2.5 text-left text-xs text-[#696969] dark:text-gray-400 font-normal">
                            {st.major || "—"}
                          </td>

                          {/* Batch */}
                          <td className="px-4 py-2.5 text-left text-xs text-[#696969] dark:text-gray-300 font-normal">
                            {st.batch || "—"}
                          </td>

                          {/* Performance Rating */}
                          <td className="px-4 py-2.5 text-right pr-6 whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-2.5">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide border uppercase ${rating.badgeBg}`}
                              >
                                {rating.label}
                              </span>
                              <span className="font-normal text-xs text-[#3B3B3B] dark:text-gray-100 min-w-[42px] text-right">
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

      {/* ── Line Divider ── */}
      <div className="border-t border-black/5 dark:border-white/10" />

      {/* ═══ SECTION 2: Mock Exam Passers Graphical Interface ═══ */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowPassersRate((prev) => !prev)}
            className="group text-left cursor-pointer focus:outline-none"
          >
            <div className="inline-flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-[#3B3B3B] dark:text-white tracking-tight">
                Mock Exam Passers Rate
              </h2>
              <div className="text-neutral-400 group-hover:text-[#3B3B3B] dark:group-hover:text-white transition-colors">
                {showPassersRate ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </div>
          </button>
        </div>

        {/* Collapsible Content */}
        {showPassersRate && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Beside the button, add a label "Filter" */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-normal text-[#696969] dark:text-gray-400 select-none">
                Filter
              </span>
              <div className="relative" ref={passersFilterRef}>
                <button
                  type="button"
                  onClick={() => setIsPassersFilterOpen((prev) => !prev)}
                  className="h-8.5 sm:h-9 px-3 text-xs font-normal rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white hover:bg-neutral-50 dark:hover:bg-white/15 transition-all shadow-2xs cursor-pointer inline-flex items-center gap-2 select-none"
                  aria-expanded={isPassersFilterOpen}
                  aria-haspopup="true"
                >
                  <Filter className="size-3.5 opacity-60 shrink-0" />
                  <span className="truncate max-w-[140px] sm:max-w-[180px]">
                    {passersFilterButtonLabel}
                  </span>
                  <ChevronDown
                    className={`size-3 opacity-60 shrink-0 transition-transform duration-200 ${
                      isPassersFilterOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isPassersFilterOpen && (
                  <div className="absolute left-0 sm:left-auto top-full mt-1.5 w-72 sm:w-80 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1b20] shadow-xl z-50 p-3 space-y-3 max-h-[440px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                    {/* Section 1: Examinations */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                          Examinations
                        </span>
                        {selectedPassersExamIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedPassersExamIds([])}
                            className="text-[11px] text-[#a16207] dark:text-[#facc15] hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs font-medium text-[#3B3B3B] dark:text-gray-200 select-none">
                        <input
                          type="checkbox"
                          checked={selectedPassersExamIds.length === 0}
                          onChange={() => setSelectedPassersExamIds([])}
                          className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                        />
                        <span>All Examinations</span>
                      </label>

                      <div className="space-y-0.5 max-h-36 overflow-y-auto pr-1">
                        {examinationOptions.map((exam) => {
                          const isChecked = selectedPassersExamIds.includes(String(exam.id))
                          return (
                            <label
                              key={exam.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs text-[#3B3B3B] dark:text-gray-200 select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedPassersExamIds(selectedPassersExamIds.filter((id) => id !== String(exam.id)))
                                  } else {
                                    setSelectedPassersExamIds([...selectedPassersExamIds, String(exam.id)])
                                  }
                                }}
                                className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                              />
                              <span className="truncate">{exam.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    {/* Section Divider */}
                    <div className="border-t border-black/5 dark:border-white/10" />

                    {/* Section 2: Batches */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                          Batches
                        </span>
                        {selectedPassersBatchIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedPassersBatchIds([])}
                            className="text-[11px] text-[#a16207] dark:text-[#facc15] hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs font-medium text-[#3B3B3B] dark:text-gray-200 select-none">
                        <input
                          type="checkbox"
                          checked={selectedPassersBatchIds.length === 0}
                          onChange={() => setSelectedPassersBatchIds([])}
                          className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                        />
                        <span>All Batches</span>
                      </label>

                      <div className="space-y-0.5 max-h-36 overflow-y-auto pr-1">
                        {passersBatchOptions.map((batch) => {
                          const isChecked = selectedPassersBatchIds.includes(String(batch.id))
                          return (
                            <label
                              key={batch.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs text-[#3B3B3B] dark:text-gray-200 select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedPassersBatchIds(selectedPassersBatchIds.filter((id) => id !== String(batch.id)))
                                  } else {
                                    setSelectedPassersBatchIds([...selectedPassersBatchIds, String(batch.id)])
                                  }
                                }}
                                className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                              />
                              <span className="truncate">{batch.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    {/* Section Divider */}
                    <div className="border-t border-black/5 dark:border-white/10" />

                    {/* Section 3: Mock Exams */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                          Mock Exams
                        </span>
                        {selectedMockExamIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedMockExamIds([])}
                            className="text-[11px] text-[#a16207] dark:text-[#facc15] hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs font-medium text-[#3B3B3B] dark:text-gray-200 select-none">
                        <input
                          type="checkbox"
                          checked={selectedMockExamIds.length === 0}
                          onChange={() => setSelectedMockExamIds([])}
                          className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                        />
                        <span>All Mock Exams (Combined)</span>
                      </label>

                      <div className="space-y-0.5 max-h-36 overflow-y-auto pr-1">
                        {filteredMockExamOptions.map((exam) => {
                          const isChecked = selectedMockExamIds.includes(String(exam.id))
                          return (
                            <label
                              key={exam.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs text-[#3B3B3B] dark:text-gray-200 select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedMockExamIds(selectedMockExamIds.filter((id) => id !== String(exam.id)))
                                  } else {
                                    setSelectedMockExamIds([...selectedMockExamIds, String(exam.id)])
                                  }
                                }}
                                className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                              />
                              <span className="truncate">
                                {exam.exam_code ? `${exam.exam_code} — ` : ""}{exam.title}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    {/* Bottom Reset Strip */}
                    {(selectedPassersExamIds.length > 0 || selectedPassersBatchIds.length > 0 || selectedMockExamIds.length > 0) && (
                      <>
                        <div className="border-t border-black/5 dark:border-white/10" />
                        <div className="flex items-center justify-between px-1 pt-0.5 text-xs">
                          <span className="text-neutral-400">
                            {selectedPassersExamIds.length + selectedPassersBatchIds.length + selectedMockExamIds.length} active
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPassersExamIds([])
                              setSelectedPassersBatchIds([])
                              setSelectedMockExamIds([])
                            }}
                            className="font-medium text-[#3B3B3B] dark:text-white hover:underline cursor-pointer"
                          >
                            Reset all
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Graphical Summary Cards & Visual Charts */}
            <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md p-5 sm:p-6 shadow-2xs space-y-6">
              {/* Selected Exam Title & Stats Metrics */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
                <div>
                  <div className="text-[13px] font-normal text-[#3B3B3B] dark:text-white">
                    {passersData.title}
                  </div>
                  <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-normal">
                    {selectedMockExamIds.length === 0
                      ? "Aggregate performance across all active mock exams"
                      : "Individual mock examination performance metrics"}
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="flex items-center gap-6 sm:gap-8 flex-wrap text-xs">
                  <div>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 block font-normal">Total Attempts</span>
                    <span className="text-xs font-normal text-[#3B3B3B] dark:text-white">
                      {passersData.totalTakers}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 block font-normal">Passing Rate</span>
                    <span className="text-xs font-normal text-[#3B3B3B] dark:text-white">
                      {passersData.passRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 block font-normal">Passed / Below Passing</span>
                    <span className="text-xs font-normal text-[#3B3B3B] dark:text-white">
                      {passersData.passedCount} / {passersData.failedCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 block font-normal">Average Score</span>
                    <span className="text-xs font-normal text-[#3B3B3B] dark:text-white">
                      {passersData.averageScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Single Graphical Chart: Pass / Below Benchmark Donut */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-white/[0.015]">
                <div className="text-xs font-normal text-neutral-400 dark:text-neutral-500 mb-3 text-center">
                  Pass / Below 75% Ratio
                </div>

                {passersData.totalTakers === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-xs font-normal text-neutral-400 dark:text-neutral-500">
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
                      <span className="text-2xl font-normal tracking-tight text-[#3B3B3B] dark:text-white">
                        {passersData.passRate}%
                      </span>
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-normal">
                        Pass Rate
                      </span>
                    </div>
                  </div>
                )}

                {/* Legend */}
                <div className="flex items-center justify-center gap-8 mt-3 text-xs font-normal">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-[#3B3B3B] dark:bg-white" />
                    <span className="text-neutral-500 dark:text-neutral-400">
                      Passed: <span className="text-[#3B3B3B] dark:text-white font-normal">{passersData.passedCount}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-gray-300 dark:bg-white/25" />
                    <span className="text-neutral-500 dark:text-neutral-400">
                      Below 75%: <span className="text-[#3B3B3B] dark:text-white font-normal">{passersData.failedCount}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Line Divider ── */}
      <div className="border-t border-black/5 dark:border-white/10" />

      {/* ═══ SECTION 3: Student Activity & Engagement Analytics ═══ */}
      <div className="space-y-4">
        {/* Section Header & Interactive Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setShowStudentActivity((prev) => !prev)}
            className="group text-left cursor-pointer focus:outline-none"
          >
            <div className="inline-flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-[#3B3B3B] dark:text-white tracking-tight">
                Student Activity & Engagement
              </h2>
              <div className="text-neutral-400 group-hover:text-[#3B3B3B] dark:group-hover:text-white transition-colors">
                {showStudentActivity ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </div>
          </button>
        </div>

        {/* ══ Collapsible Content ══ */}
        {showStudentActivity && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Unified Controls Toolbar: Preset Range on top, Filters underneath */}
            <div className="flex flex-col gap-3">
              {/* Preset Quick Filters Buttons */}
              <div className="inline-flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 shrink-0 self-start">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                      activityRange === pill.id
                        ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                        : "text-neutral-400 dark:text-neutral-500 hover:text-[#3B3B3B] dark:hover:text-white"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Filters Row: Filter Dropdown, Date Picker, Export CSV */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Beside the button, add a label "Filter" */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-normal text-[#696969] dark:text-gray-400 select-none">
                    Filter
                  </span>
                  <div className="relative" ref={activityFilterRef}>
                    <button
                      type="button"
                      onClick={() => setIsActivityFilterOpen((prev) => !prev)}
                      className="h-8.5 sm:h-9 px-3 text-xs font-normal rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white hover:bg-neutral-50 dark:hover:bg-white/15 transition-all shadow-2xs cursor-pointer inline-flex items-center gap-2 select-none"
                      aria-expanded={isActivityFilterOpen}
                      aria-haspopup="true"
                    >
                      <Filter className="size-3.5 opacity-60 shrink-0" />
                      <span className="truncate max-w-[140px] sm:max-w-[180px]">
                        {activityFilterButtonLabel}
                      </span>
                      <ChevronDown
                        className={`size-3 opacity-60 shrink-0 transition-transform duration-200 ${
                          isActivityFilterOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {isActivityFilterOpen && (
                      <div className="absolute left-0 sm:left-auto top-full mt-1.5 w-72 sm:w-80 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1b20] shadow-xl z-50 p-3 space-y-3 max-h-[440px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                        {/* Section 1: Examinations */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                              Examinations
                            </span>
                            {selectedActivityExamIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedActivityExamIds([])}
                                className="text-[11px] text-[#a16207] dark:text-[#facc15] hover:underline cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs font-medium text-[#3B3B3B] dark:text-gray-200 select-none">
                            <input
                              type="checkbox"
                              checked={selectedActivityExamIds.length === 0}
                              onChange={() => setSelectedActivityExamIds([])}
                              className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                            />
                            <span>All Examinations</span>
                          </label>

                          <div className="space-y-0.5 max-h-36 overflow-y-auto pr-1">
                            {examinationOptions.map((exam) => {
                              const isChecked = selectedActivityExamIds.includes(String(exam.id))
                              return (
                                <label
                                  key={exam.id}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs text-[#3B3B3B] dark:text-gray-200 select-none"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setSelectedActivityExamIds(selectedActivityExamIds.filter((id) => id !== String(exam.id)))
                                      } else {
                                        setSelectedActivityExamIds([...selectedActivityExamIds, String(exam.id)])
                                      }
                                    }}
                                    className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                                  />
                                  <span className="truncate">{exam.name}</span>
                                </label>
                              )
                            })}
                          </div>
                        </div>

                        {/* Section Divider */}
                        <div className="border-t border-black/5 dark:border-white/10" />

                        {/* Section 2: Batches */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                              Batches
                            </span>
                            {selectedActivityBatchIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedActivityBatchIds([])}
                                className="text-[11px] text-[#a16207] dark:text-[#facc15] hover:underline cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs font-medium text-[#3B3B3B] dark:text-gray-200 select-none">
                            <input
                              type="checkbox"
                              checked={selectedActivityBatchIds.length === 0}
                              onChange={() => setSelectedActivityBatchIds([])}
                              className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                            />
                            <span>All Batches</span>
                          </label>

                          <div className="space-y-0.5 max-h-36 overflow-y-auto pr-1">
                            {activityBatchOptions.map((batch) => {
                              const isChecked = selectedActivityBatchIds.includes(String(batch.id))
                              return (
                                <label
                                  key={batch.id}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs text-[#3B3B3B] dark:text-gray-200 select-none"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setSelectedActivityBatchIds(selectedActivityBatchIds.filter((id) => id !== String(batch.id)))
                                      } else {
                                        setSelectedActivityBatchIds([...selectedActivityBatchIds, String(batch.id)])
                                      }
                                    }}
                                    className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                                  />
                                  <span className="truncate">{batch.name}</span>
                                </label>
                              )
                            })}
                          </div>
                        </div>

                        {/* Bottom Reset Strip */}
                        {(selectedActivityExamIds.length > 0 || selectedActivityBatchIds.length > 0) && (
                          <>
                            <div className="border-t border-black/5 dark:border-white/10" />
                            <div className="flex items-center justify-between px-1 pt-0.5 text-xs">
                              <span className="text-neutral-400">
                                {selectedActivityExamIds.length + selectedActivityBatchIds.length} active
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedActivityExamIds([])
                                  setSelectedActivityBatchIds([])
                                }}
                                className="font-medium text-[#3B3B3B] dark:text-white hover:underline cursor-pointer"
                              >
                                Reset all
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Calendar Date Picker: Single-day selector */}
                <input
                  type="date"
                  id="activity-date-picker"
                  aria-label="Filter by date"
                  value={activityDate || todayStr}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="h-8.5 sm:h-9 px-3 text-xs font-normal rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs cursor-pointer"
                  title="Select specific date"
                />

                {/* Export CSV Action */}
                <button
                  type="button"
                  onClick={exportToCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 h-8.5 sm:h-9 rounded-xl text-xs font-normal text-[#3B3B3B] dark:text-white bg-white dark:bg-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 transition-all shadow-2xs cursor-pointer"
                  title="Export currently filtered metrics to CSV"
                >
                  <Download className="size-3.5 text-neutral-400" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* 1. Top-Level Metric Summary Cards (4-Column Grid styled like Student Dashboard) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Card 1: Active Reviewees */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none">
                <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                  <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                    Active Reviewees
                  </span>
                </div>
                <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                  <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {filteredActivityAnalytics?.kpis?.activeReviewees || "0 / 0"}
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                    {filteredActivityAnalytics?.kpis?.participationDeltaText || "0% • 0% vs yesterday"}
                  </p>
                </div>
              </div>

              {/* Card 2: Total Study Time */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none">
                <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#2A9D8F]/20 dark:bg-[#2A9D8F]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                  <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                    Total Study Time
                  </span>
                </div>
                <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                  <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {filteredActivityAnalytics?.kpis?.totalStudyTime || "0h 0m"}
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                    {filteredActivityAnalytics?.kpis?.avgStudyTimePerActive || "Avg 0h 0m per active student"}
                  </p>
                </div>
              </div>

              {/* Card 3: Curriculum Interactions */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none">
                <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#E17055]/20 dark:bg-[#E17055]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                  <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                    Curriculum Interactions
                  </span>
                </div>
                <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                  <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {filteredActivityAnalytics?.kpis?.curriculumInteractions || "0 opens"}
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                    {filteredActivityAnalytics?.kpis?.activeSubjectsCount || "Across active subjects & modules"}
                  </p>
                </div>
              </div>

              {/* Card 4: Peak Activity Window */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none">
                <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#3B82F6]/20 dark:bg-[#3B82F6]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                  <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                    Peak Activity Window
                  </span>
                </div>
                <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white truncate">
                    {filteredActivityAnalytics?.kpis?.peakActivityWindow || "—"}
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                    {filteredActivityAnalytics?.kpis?.peakConcurrentText || "No active students online in this period"}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Combined Analytics Visualizations & Performance Breakdown Card */}
            <div className="w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden">
              {/* Top: 2-Column Analytics Visualizations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-black/5 dark:divide-white/10">
                {/* Chart 1: Daily Study & Peak Hour Distribution */}
                <div className="p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/5 dark:border-white/5">
                  <div>
                    <h3 className="text-xs font-normal text-[#3B3B3B] dark:text-white">
                      Daily Study & Peak Hour Distribution
                    </h3>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-normal">
                      {filteredActivityAnalytics?.isSingleDay
                        ? "Hourly concurrent active students and cumulative hours (24h)"
                        : "Daily active students (bars) vs. total hours logged (line)"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-sm bg-[#E9C46A]" /> Concurrent Students
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-sm bg-[#3B3B3B] dark:bg-white" /> Hours Logged
                    </span>
                  </div>
                </div>

                <div className="w-full h-[280px]">
                  {(filteredActivityAnalytics?.chart1Distribution || []).length === 0 ||
                  (filteredActivityAnalytics?.kpis?.activeCount === 0 && (filteredActivityAnalytics?.chart1Distribution || []).every((d) => d.active === 0 && d.hours === 0)) ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-neutral-400 dark:text-neutral-500 font-normal">
                      <Clock className="size-8 stroke-[1.5] mb-2 opacity-30" />
                      <span>No study session distribution recorded for this date.</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={filteredActivityAnalytics?.chart1Distribution || []}
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
                                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1f1f1f] p-3 shadow-lg text-xs space-y-1 font-normal">
                                  <div className="text-[#3B3B3B] dark:text-white font-normal">
                                    {label}
                                  </div>
                                  <div className="text-amber-600 dark:text-amber-400 font-normal">
                                    Concurrent Students: {item.active}
                                  </div>
                                  <div className="text-[#3B3B3B] dark:text-gray-200 font-normal">
                                    Total Hours: {item.hours}h
                                  </div>
                                  {item.topSubject && item.topSubject !== "—" && (
                                    <div className="text-[11px] text-[#696969] dark:text-gray-400 pt-1 border-t border-black/5 dark:border-white/10 font-normal">
                                      Top Subject: {item.topSubject}
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
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#3B3B3B" }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
                </div>

                {/* Chart 2: Subject Time Allocation (Horizontal Stacked Bar Chart) */}
                <div className="p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/5 dark:border-white/5">
                  <div>
                    <h3 className="text-xs font-normal text-[#3B3B3B] dark:text-white">
                      Subject Time Allocation
                    </h3>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-normal">
                      Lectures & reading vs. quizzes & mock exams per review domain
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-sm bg-[#3B3B3B] dark:bg-white" /> Lecture & Notes
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-sm bg-[#E9C46A]" /> Tests & Quizzes
                    </span>
                  </div>
                </div>

                <div className="w-full h-[280px]">
                  {(filteredActivityAnalytics?.chart2SubjectAllocation || []).every((d) => d.totalCategoryHours === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-neutral-400 dark:text-neutral-500 font-normal">
                      <BookOpen className="size-8 stroke-[1.5] mb-2 opacity-30" />
                      <span>No subject study hours logged for this period.</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={filteredActivityAnalytics?.chart2SubjectAllocation || []}
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
                                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1f1f1f] p-3 shadow-lg text-xs space-y-1 font-normal">
                                  <div className="text-[#3B3B3B] dark:text-white font-normal">
                                    {d.category}
                                  </div>
                                  <div className="text-[#3B3B3B] dark:text-gray-200 font-normal">
                                    Lecture & Reading: {d.lectureHours}h
                                  </div>
                                  <div className="text-amber-600 dark:text-amber-400 font-normal">
                                    Practice Tests & Quizzes: {d.testHours}h
                                  </div>
                                  <div className="text-[11px] text-[#696969] dark:text-gray-400 pt-1 border-t border-black/5 dark:border-white/10 font-normal">
                                    Cohort Study Share: {d.sharePct}%
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

              {/* Section Divider */}
              <div className="border-t border-black/5 dark:border-white/10" />

              {/* Bottom: Deep-Dive Curriculum & Student Accountability Tabs */}
              <div className="p-5 sm:p-6 space-y-4">
              {/* Tab Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
                <div className="inline-flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActivityTab("subjects")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                      activityTab === "subjects"
                        ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                        : "text-neutral-400 dark:text-neutral-500 hover:text-[#3B3B3B] dark:hover:text-white"
                    }`}
                  >
                    Subject Performance Breakdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityTab("roster")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                      activityTab === "roster"
                        ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                        : "text-neutral-400 dark:text-neutral-500 hover:text-[#3B3B3B] dark:hover:text-white"
                    }`}
                  >
                    Student Accountability & Roster
                  </button>
                </div>

                <div className="text-xs text-neutral-400 dark:text-neutral-500 font-normal">
                  {activityTab === "subjects"
                    ? "Curriculum domain engagement and completion rates"
                    : "Identify active candidates and intervene with at-risk students"}
                </div>
              </div>

              {/* Tab A: Subject Performance Breakdown Table */}
              {activityTab === "subjects" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-neutral-50/60 dark:bg-[#14161b]/80 backdrop-blur-md border-b border-black/5 dark:border-white/10">
                      <tr className="h-11 text-xs font-normal text-[#696969] dark:text-gray-300">
                        <th className="py-2.5 px-3 font-normal">Subject / Module Name</th>
                        <th className="py-2.5 px-3 font-normal">Active Reviewees</th>
                        <th className="py-2.5 px-3 font-normal">Total Hours Spent</th>
                        <th className="py-2.5 px-3 font-normal">Avg. Session Length</th>
                        <th className="py-2.5 px-3 text-center font-normal">Practice Tests Taken</th>
                        <th className="py-2.5 px-3 pr-4 text-right font-normal">Cohort Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs font-normal">
                      {(filteredActivityAnalytics?.tabA_subjectBreakdown || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500 font-normal">
                            No subjects configured or recorded yet.
                          </td>
                        </tr>
                      ) : (
                        (filteredActivityAnalytics?.tabA_subjectBreakdown || []).map((sub) => (
                          <tr key={sub.id} className="h-13 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-normal text-[13px] text-[#3B3B3B] dark:text-gray-100">
                                {sub.name}
                              </div>
                              <span className="inline-block mt-0.5 text-[11px] text-[#696969] dark:text-gray-400 font-normal">
                                {sub.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-300 font-normal">
                              {sub.activeReviewees} of {sub.totalEnrolled} students
                            </td>
                            <td className="py-2.5 px-3 text-[#3B3B3B] dark:text-white font-normal">
                              {sub.totalHoursStr}
                            </td>
                            <td className="py-2.5 px-3 text-neutral-500 dark:text-neutral-400 font-normal">
                              {sub.avgSessionLength}
                            </td>
                            <td className="py-2.5 px-3 text-center text-[#3B3B3B] dark:text-neutral-200 font-normal">
                              {sub.practiceTestsTaken}
                            </td>
                            <td className="py-2.5 px-3 pr-4 text-right">
                              <div className="flex items-center justify-end gap-2.5">
                                <div className="w-24 h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-[#E9C46A] rounded-full transition-all"
                                    style={{ width: `${sub.completionRate}%` }}
                                  />
                                </div>
                                <span className="font-normal text-[#3B3B3B] dark:text-white text-xs min-w-[34px]">
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
                    <thead className="sticky top-0 z-10 bg-neutral-50/60 dark:bg-[#14161b]/80 backdrop-blur-md border-b border-black/5 dark:border-white/10">
                      <tr className="h-11 text-xs font-normal text-[#696969] dark:text-gray-300">
                        <th className="py-2.5 px-3 font-normal">Student & Login ID</th>
                        <th className="py-2.5 px-3 font-normal">Status</th>
                        <th className="py-2.5 px-3 font-normal">Time Spent (Period)</th>
                        <th className="py-2.5 px-3 text-center font-normal">Modules Accessed</th>
                        <th className="py-2.5 px-3 text-center font-normal">Mock Tests Completed</th>
                        <th className="py-2.5 px-3 font-normal">Last Active</th>
                        <th className="py-2.5 px-3 text-right pr-4 font-normal">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs font-normal">
                      {(filteredActivityAnalytics?.tabB_studentRoster || []).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500 font-normal">
                            No student activity records found for this period.
                          </td>
                        </tr>
                      ) : (
                        (filteredActivityAnalytics?.tabB_studentRoster || []).map((st) => (
                          <tr key={st.id} className="h-13 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-3">
                              {/* Bold ONLY on student name */}
                              <div className="font-semibold text-[13px] text-[#3B3B3B] dark:text-gray-100">
                                {st.name}
                              </div>
                              {/* No font-mono, single font style */}
                              <div className="text-[11px] text-[#696969] dark:text-gray-400 font-normal mt-0.5">
                                {formatLoginId(st)} • {st.school}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-[11px] font-normal text-neutral-600 dark:text-neutral-300">
                                {st.statusBadge}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[#3B3B3B] dark:text-white font-normal">
                              {st.timeSpentStr}
                            </td>
                            <td className="py-2.5 px-3 text-center text-[#3B3B3B] dark:text-neutral-200 font-normal">
                              {st.modulesAccessed}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-normal text-[#3B3B3B] dark:text-white">
                                {st.mockTestsCompleted}
                              </span>
                              <span className="text-[11px] text-neutral-400 dark:text-neutral-500 block font-normal">
                                avg. {st.avgScore}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap font-normal">
                              {st.lastActiveText}
                            </td>
                            <td className="py-2.5 px-3 pr-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSearch(st.name)
                                  window.scrollTo({ top: 0, behavior: "smooth" })
                                }}
                                className="inline-flex items-center justify-center px-3 h-7 rounded-xl text-[11px] font-normal text-[#3B3B3B] dark:text-white bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-2xs hover:bg-neutral-50 dark:hover:bg-white/15 transition-all cursor-pointer whitespace-nowrap"
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
        </div>
      )}
    </div>

      {/* ═══ SECTION 4: User Registration Overview ═══ */}
      <div className="border-t border-black/5 dark:border-white/10" />
      <div className="space-y-6">
        {/* Section Header & Interactive Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setShowUserRegistration((prev) => !prev)}
            className="group text-left cursor-pointer focus:outline-none"
            title={showUserRegistration ? "Hide User Registration Overview" : "Show User Registration Overview"}
          >
            <div className="inline-flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-[#3B3B3B] dark:text-white tracking-tight">
                User Registration Overview
              </h2>
              <div className="text-neutral-400 group-hover:text-[#3B3B3B] dark:group-hover:text-white transition-colors">
                {showUserRegistration ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 font-normal">
              Track new student sign-ups, active accounts, and exam enrollments.
            </p>
          </button>

          {/* Right-aligned Controls: Exam Filter, Batch Filter, Date Picker, Quick Presets, Export CSV */}
          {showUserRegistration && (
            <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-auto">
              {/* Beside the button, add a label "Filter" */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-normal text-[#696969] dark:text-gray-400 select-none">
                  Filter
                </span>
                <div className="relative" ref={regFilterRef}>
                  <button
                    type="button"
                    onClick={() => setIsRegFilterOpen((prev) => !prev)}
                    className="h-8 sm:h-9 px-3 text-xs font-normal rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white hover:bg-neutral-50 dark:hover:bg-white/15 transition-all shadow-2xs cursor-pointer inline-flex items-center gap-2 select-none"
                    aria-expanded={isRegFilterOpen}
                    aria-haspopup="true"
                  >
                    <Filter className="size-3.5 opacity-60 shrink-0" />
                    <span className="truncate max-w-[140px] sm:max-w-[180px]">
                      {regFilterButtonLabel}
                    </span>
                    <ChevronDown
                      className={`size-3 opacity-60 shrink-0 transition-transform duration-200 ${
                        isRegFilterOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isRegFilterOpen && (
                    <div className="absolute left-0 sm:left-auto top-full mt-1.5 w-72 sm:w-80 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1b20] shadow-xl z-50 p-3 space-y-3 max-h-[440px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      {/* Section 1: Examinations */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                            Examinations
                          </span>
                          {selectedRegExamIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedRegExamIds([])}
                              className="text-[11px] text-[#a16207] dark:text-[#facc15] hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs font-medium text-[#3B3B3B] dark:text-gray-200 select-none">
                          <input
                            type="checkbox"
                            checked={selectedRegExamIds.length === 0}
                            onChange={() => setSelectedRegExamIds([])}
                            className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                          />
                          <span>All Examinations</span>
                        </label>

                        <div className="space-y-0.5 max-h-36 overflow-y-auto pr-1">
                          {examinationOptions.map((exam) => {
                            const isChecked = selectedRegExamIds.includes(String(exam.id))
                            return (
                              <label
                                key={exam.id}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs text-[#3B3B3B] dark:text-gray-200 select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedRegExamIds(selectedRegExamIds.filter((id) => id !== String(exam.id)))
                                    } else {
                                      setSelectedRegExamIds([...selectedRegExamIds, String(exam.id)])
                                    }
                                  }}
                                  className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                                />
                                <span className="truncate">{exam.name}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      {/* Section Divider */}
                      <div className="border-t border-black/5 dark:border-white/10" />

                      {/* Section 2: Batches */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                            Batches
                          </span>
                          {selectedRegBatchIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedRegBatchIds([])}
                              className="text-[11px] text-[#a16207] dark:text-[#facc15] hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs font-medium text-[#3B3B3B] dark:text-gray-200 select-none">
                          <input
                            type="checkbox"
                            checked={selectedRegBatchIds.length === 0}
                            onChange={() => setSelectedRegBatchIds([])}
                            className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                          />
                          <span>All Batches</span>
                        </label>

                        <div className="space-y-0.5 max-h-36 overflow-y-auto pr-1">
                          {regBatchOptions.map((batch) => {
                            const isChecked = selectedRegBatchIds.includes(String(batch.id))
                            return (
                              <label
                                key={batch.id}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs text-[#3B3B3B] dark:text-gray-200 select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedRegBatchIds(selectedRegBatchIds.filter((id) => id !== String(batch.id)))
                                    } else {
                                      setSelectedRegBatchIds([...selectedRegBatchIds, String(batch.id)])
                                    }
                                  }}
                                  className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                                />
                                <span className="truncate">{batch.name}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      {/* Bottom Reset Strip */}
                      {(selectedRegExamIds.length > 0 || selectedRegBatchIds.length > 0) && (
                        <>
                          <div className="border-t border-black/5 dark:border-white/10" />
                          <div className="flex items-center justify-between px-1 pt-0.5 text-xs">
                            <span className="text-neutral-400">
                              {selectedRegExamIds.length + selectedRegBatchIds.length} active
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRegExamIds([])
                                setSelectedRegBatchIds([])
                              }}
                              className="font-medium text-[#3B3B3B] dark:text-white hover:underline cursor-pointer"
                            >
                              Reset all
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Calendar Date Picker: Single-day lookup and custom dates */}
              <div className="relative flex items-center">
                <input
                  type="date"
                  id="reg-date-picker"
                  value={regDate || todayStr}
                  onChange={(e) => handleRegDateChange(e.target.value)}
                  className="h-8 sm:h-9 px-3 text-xs font-medium rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1 focus:ring-black/10 dark:focus:ring-white/20 transition-all shadow-2xs cursor-pointer"
                  title="Select registration date"
                />
              </div>

              {/* Quick Presets: Segmented Pill Buttons */}
              <div className="inline-flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
                {[
                  { id: "today", label: "Today" },
                  { id: "yesterday", label: "Yesterday" },
                  { id: "7days", label: "Last 7 Days" },
                  { id: "30days", label: "Last 30 Days" },
                  { id: "all", label: "All-Time" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => handleRegRangeChange(pill.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                      regRange === pill.id
                        ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                        : "text-neutral-400 dark:text-neutral-500 hover:text-[#3B3B3B] dark:hover:text-white"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Export CSV Action */}
              <button
                type="button"
                onClick={exportRegCSV}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 h-8 sm:h-9 rounded-xl text-xs font-semibold text-[#696969] dark:text-neutral-300 bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-2xs hover:bg-neutral-50 dark:hover:bg-white/15 transition-all cursor-pointer"
                title="Export User Registration data to CSV"
              >
                <Download className="size-3.5 text-neutral-400 dark:text-neutral-500" />
                <span>Export CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* ══ Collapsible Content ══ */}
        {showUserRegistration && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Phase 3: Top-Level KPI Summary Cards (4-Card Responsive Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: New Registrations */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    New Registrations
                  </span>
                  <UserPlus className="size-4 text-neutral-400 dark:text-neutral-500" />
                </div>

                <div>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {filteredRegistrationData?.kpis?.newRegistrations || "+0 in Period"}
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
                  <span className="truncate">Period Comparison</span>
                  <span className="text-neutral-600 dark:text-neutral-300 font-medium whitespace-nowrap">
                    {filteredRegistrationData?.kpis?.registrationDeltaText || "0 accounts"}
                  </span>
                </div>
              </div>

              {/* Card 2: Total Registered Reach */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Total Registered Reach
                  </span>
                  <Users className="size-4 text-neutral-400 dark:text-neutral-500" />
                </div>

                <div>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {filteredRegistrationData?.kpis?.totalRegisteredReach || "0 Candidates"}
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
                  <span className="truncate">Platform Share</span>
                  <span className="text-neutral-600 dark:text-neutral-300 font-medium whitespace-nowrap">
                    {filteredRegistrationData?.kpis?.reachSubtext || "100% of platform reach"}
                  </span>
                </div>
              </div>

              {/* Card 3: Leading Exam Track */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Leading Exam Track
                  </span>
                  <Award className="size-4 text-neutral-400 dark:text-neutral-500" />
                </div>

                <div>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white truncate">
                    {filteredRegistrationData?.kpis?.leadingExamTrack || "—"}
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
                  <span className="truncate">Examination Category</span>
                  <span className="text-neutral-600 dark:text-neutral-300 font-medium whitespace-nowrap">
                    {filteredRegistrationData?.kpis?.leadingExamSubtext || "Highest volume"}
                  </span>
                </div>
              </div>

              {/* Card 4: Active Account Rate */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Active Account Rate
                  </span>
                  <UserCheck className="size-4 text-neutral-400 dark:text-neutral-500" />
                </div>

                <div>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {filteredRegistrationData?.kpis?.activeCandidatesRate || "0% Active"}
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
                  <span className="truncate">Account Health</span>
                  <span className="text-neutral-600 dark:text-neutral-300 font-medium whitespace-nowrap">
                    {filteredRegistrationData?.kpis?.activeCandidatesCount || "0 active accounts"}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Charts: 2-Column Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Chart 1: Historical Sign-Up Trends (2 Columns on large screens) */}
              <div className="lg:col-span-2 rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/5 dark:border-white/5">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#3B3B3B] dark:text-white">
                      Historical Sign-Up Trends
                    </h3>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                      New candidate registrations and cumulative volume over the selected timeframe
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-sm bg-[#E9C46A]" /> New Registrations
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-sm bg-[#3B3B3B] dark:bg-white" /> Cumulative Total
                    </span>
                  </div>
                </div>

                <div className="w-full h-[280px]">
                  {(filteredRegistrationData?.trendChart || []).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-[#696969] dark:text-gray-400">
                      <Clock className="size-8 stroke-[1.5] mb-2 opacity-30" />
                      <span>No registration trends recorded for this period.</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={filteredRegistrationData?.trendChart || []}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis
                          dataKey={filteredRegistrationData?.isSingleDay ? "hour" : "date"}
                          tick={{ fontSize: 10, fill: "#888888" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 10, fill: "#888888" }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 10, fill: "#888888" }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0].payload
                              return (
                                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1f1f1f] p-3 shadow-lg text-xs space-y-1">
                                  <div className="font-semibold text-[#3B3B3B] dark:text-white border-b border-black/5 dark:border-white/10 pb-1">
                                    {item.date || label}
                                  </div>
                                  <div className="flex items-center justify-between gap-4 text-[#696969] dark:text-gray-300">
                                    <span>New Registrations:</span>
                                    <span className="font-bold text-[#E9C46A]">{item.registrations}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4 text-[#696969] dark:text-gray-300">
                                    <span>Cumulative:</span>
                                    <span className="font-bold text-[#3B3B3B] dark:text-white">{item.cumulative}</span>
                                  </div>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="registrations"
                          fill="#E9C46A"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="cumulative"
                          stroke="#3B3B3B"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#3B3B3B" }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: Licensure Examination Distribution (1 Column Donut) */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="pb-3 border-b border-black/5 dark:border-white/5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#3B3B3B] dark:text-white">
                    Licensure Examination Distribution
                  </h3>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                    Candidate allocation across board exam tracks
                  </p>
                </div>

                <div className="w-full h-[180px] relative">
                  {(filteredRegistrationData?.distributionChart || []).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-[#696969] dark:text-gray-400">
                      <span>No exam distribution data.</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={filteredRegistrationData?.distributionChart || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="count"
                        >
                          {(filteredRegistrationData?.distributionChart || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload
                              return (
                                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1f1f1f] p-2.5 shadow-lg text-xs space-y-0.5">
                                  <div className="font-semibold text-[#3B3B3B] dark:text-white">{d.name}</div>
                                  <div className="text-[11px] text-[#696969] dark:text-gray-300">
                                    {d.count} candidates ({d.percentage}%)
                                  </div>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Legend List */}
                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                  {(filteredRegistrationData?.distributionChart || []).map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                        <span className="font-medium text-[#3B3B3B] dark:text-gray-200 truncate" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 shrink-0 ml-2">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabbed Data Tables: Tab A (Tracks Breakdown) vs Tab B (Candidate Log) */}
            <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md p-5 sm:p-6 shadow-2xs space-y-4">
              {/* Tab Selector Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-3">
                <div className="inline-flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setRegTab("tracks")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      regTab === "tracks"
                        ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                        : "text-neutral-400 dark:text-neutral-500 hover:text-[#3B3B3B] dark:hover:text-white"
                    }`}
                  >
                    Licensure Track Breakdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegTab("log")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      regTab === "log"
                        ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                        : "text-neutral-400 dark:text-neutral-500 hover:text-[#3B3B3B] dark:hover:text-white"
                    }`}
                  >
                    Candidate Sign-Ups Log
                  </button>
                </div>

                <div className="text-xs text-neutral-400 dark:text-neutral-500">
                  {regTab === "tracks"
                    ? `${(filteredRegistrationData?.tabA_examTracks || []).length} Examination tracks active`
                    : `${(filteredRegistrationData?.tabB_candidateLog || []).length} Candidates listed`}
                </div>
              </div>

              {/* Tab A: Licensure Exam Track Breakdown Table */}
              {regTab === "tracks" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25 backdrop-blur-xs border-b border-[#E9C46A]/30">
                      <tr className="h-11 text-xs font-semibold text-[#696969] dark:text-gray-300">
                        <th className="py-2.5 px-3">Licensure Exam Track</th>
                        <th className="py-2.5 px-3 text-center">New in Period</th>
                        <th className="py-2.5 px-3">Total Candidates</th>
                        <th className="py-2.5 px-3">Active Candidates</th>
                        <th className="py-2.5 px-3">Active Rate</th>
                        <th className="py-2.5 px-3 pr-4 text-right">Cohort Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {(filteredRegistrationData?.tabA_examTracks || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
                            No exam tracks configured or registered yet.
                          </td>
                        </tr>
                      ) : (
                        (filteredRegistrationData?.tabA_examTracks || []).map((track) => (
                          <tr key={track.trackCode} className="h-13 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-xs text-[#3B3B3B] dark:text-gray-100">
                                {track.trackCode}
                              </div>
                              <span className="inline-block mt-0.5 text-[11px] text-[#696969] dark:text-gray-400 font-normal">
                                {track.trackName}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-[#E9C46A]">
                              +{track.newRegistrations}
                            </td>
                            <td className="py-3 px-3 font-semibold text-[#3B3B3B] dark:text-white">
                              {track.totalCandidates}
                            </td>
                            <td className="py-3 px-3 text-neutral-600 dark:text-neutral-300">
                              {track.activeCandidates}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                    style={{ width: `${track.activePercentage}%` }}
                                  />
                                </div>
                                <span className="font-medium text-[#3B3B3B] dark:text-white text-xs">
                                  {track.activePercentage}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 pr-4 text-right font-bold text-[#3B3B3B] dark:text-white">
                              {track.shareRate}%
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab B: Candidate Sign-Ups Log Table */}
              {regTab === "log" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25 backdrop-blur-xs border-b border-[#E9C46A]/30">
                      <tr className="h-11 text-xs font-semibold text-[#696969] dark:text-gray-300">
                        <th className="py-2.5 px-3">Candidate & Login ID</th>
                        <th className="py-2.5 px-3">Target Exam Track</th>
                        <th className="py-2.5 px-3">Batch</th>
                        <th className="py-2.5 px-3">School / Affiliation</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Registered At</th>
                        <th className="py-2.5 px-3 pr-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {(filteredRegistrationData?.tabB_candidateLog || []).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
                            No candidate registrations found for this filter.
                          </td>
                        </tr>
                      ) : (
                        (filteredRegistrationData?.tabB_candidateLog || []).map((cand) => (
                          <tr key={cand.id} className="h-13 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-xs text-[#3B3B3B] dark:text-gray-100">
                                {cand.name}
                              </div>
                              <div className="text-[11px] text-[#696969] dark:text-gray-400 font-mono mt-0.5">
                                {formatLoginId(cand)}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-medium text-neutral-600 dark:text-neutral-300">
                              {cand.target_exam || "General"}
                            </td>
                            <td className="py-3 px-3 font-medium text-neutral-600 dark:text-neutral-300">
                              {cand.batch_name || "—"}
                            </td>
                            <td className="py-3 px-3 text-neutral-500 dark:text-neutral-400">
                              {cand.school_name || "—"}
                            </td>
                            <td className="py-3 px-3">
                              <span className="capitalize text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                {cand.status || "active"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                              {cand.created_formatted || "—"}
                            </td>
                            <td className="py-3 px-3 pr-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSearch(cand.name)
                                  window.scrollTo({ top: 0, behavior: "smooth" })
                                }}
                                className="inline-flex items-center justify-center px-3 h-7 rounded-xl text-[11px] font-medium text-[#3B3B3B] dark:text-white bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-2xs hover:bg-neutral-50 dark:hover:bg-white/15 transition-all cursor-pointer whitespace-nowrap"
                              >
                                View Profile
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


