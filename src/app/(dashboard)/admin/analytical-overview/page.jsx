"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
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
  ChevronLeft,
  ChevronRight,
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
  // Section 1 filter & selection state
  const [selectedExamIds, setSelectedExamIds] = useState([])
  const [selectedBatchIds, setSelectedBatchIds] = useState([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSection1SearchOpen, setIsSection1SearchOpen] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const filterDropdownRef = useRef(null)
  const section1SearchRef = useRef(null)
  const [perfStudentsPage, setPerfStudentsPage] = useState(1)
  const [perfSchoolsPage, setPerfSchoolsPage] = useState(1)
  const [perfAtRiskPage, setPerfAtRiskPage] = useState(1)
  const PERF_PAGE_SIZE = 8

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
  const [isRegTableFilterOpen, setIsRegTableFilterOpen] = useState(false)
  const regTableFilterRef = useRef(null)
  const [regSearch, setRegSearch] = useState("")
  const [isRegSearchOpen, setIsRegSearchOpen] = useState(false)
  const regSearchRef = useRef(null)
  const [regTracksPage, setRegTracksPage] = useState(1)
  const [regLogPage, setRegLogPage] = useState(1)
  const REG_PAGE_SIZE = 8

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setIsFilterOpen(false)
      }
      if (section1SearchRef.current && !section1SearchRef.current.contains(e.target)) {
        setIsSection1SearchOpen(false)
      }
      if (passersFilterRef.current && !passersFilterRef.current.contains(e.target)) {
        setIsPassersFilterOpen(false)
      }
      if (activityFilterRef.current && !activityFilterRef.current.contains(e.target)) {
        setIsActivityFilterOpen(false)
      }
      if (activitySearchRef.current && !activitySearchRef.current.contains(e.target)) {
        setIsActivitySearchOpen(false)
      }
      if (activityTableFilterRef.current && !activityTableFilterRef.current.contains(e.target)) {
        setIsActivityTableFilterOpen(false)
      }
      if (regFilterRef.current && !regFilterRef.current.contains(e.target)) {
        setIsRegFilterOpen(false)
      }
      if (regTableFilterRef.current && !regTableFilterRef.current.contains(e.target)) {
        setIsRegTableFilterOpen(false)
      }
      if (regSearchRef.current && !regSearchRef.current.contains(e.target)) {
        setIsRegSearchOpen(false)
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
  const [activitySearch, setActivitySearch] = useState("")
  const [isActivitySearchOpen, setIsActivitySearchOpen] = useState(false)
  const activitySearchRef = useRef(null)
  const [isActivityTableFilterOpen, setIsActivityTableFilterOpen] = useState(false)
  const activityTableFilterRef = useRef(null)
  const [activitySubjectPage, setActivitySubjectPage] = useState(1)
  const [activityRosterPage, setActivityRosterPage] = useState(1)
  const [selectedActivityCourse, setSelectedActivityCourse] = useState("all") // 'all' | 'bsed' | 'beed' | 'beced' | 'bsned'
  const ACTIVITY_PAGE_SIZE = 8
  const [subjectSortField, setSubjectSortField] = useState("totalHoursDecimal")
  const [subjectSortDir, setSubjectSortDir] = useState("desc")
  const [rosterSortField, setRosterSortField] = useState("name")
  const [rosterSortDir, setRosterSortDir] = useState("asc")
  const [activityLoading, setActivityLoading] = useState(false)

  // Filter subjects by LEPT course (e.g. BSEd, BEEd, BECEd, BSNEd)
  const matchesActivityCourse = (sub, courseKey) => {
    if (!courseKey || courseKey === "all") return true

    const cat = (sub.category || "").toLowerCase()
    const name = (sub.name || "").toLowerCase()
    const targetProg = (sub.target_program || "").toLowerCase()
    const targetCourse = (sub.target_course || "").toLowerCase()

    // Core curriculum common to all teacher education candidates
    const isGenEd = cat.includes("general education") || cat.includes("gen ed") || name.includes("general education")
    const isProfEd = cat.includes("professional education") || cat.includes("prof ed") || name.includes("professional education")
    const isCoreCommon = isGenEd || isProfEd

    // Secondary specializations / majors (BSEd)
    const isSecondarySpec =
      cat.includes("specialization") ||
      cat.includes("major") ||
      cat.includes("secondary") ||
      targetProg.includes("bsed") ||
      targetCourse.includes("bsed") ||
      cat.includes("physical science") ||
      cat.includes("biological science") ||
      cat.includes("english") ||
      cat.includes("filipino") ||
      cat.includes("mathematics") ||
      cat.includes("social science") ||
      cat.includes("social studies") ||
      cat.includes("science") ||
      name.includes("physical science") ||
      name.includes("biological science") ||
      name.includes("english") ||
      name.includes("filipino") ||
      name.includes("mathematics") ||
      name.includes("social science") ||
      name.includes("social studies") ||
      name.includes("science") ||
      name.includes("values education")

    // Elementary Education (BEEd)
    const isElementary =
      cat.includes("elementary") ||
      cat.includes("beed") ||
      name.includes("elementary") ||
      name.includes("beed") ||
      targetProg.includes("beed") ||
      targetCourse.includes("beed")

    // Early Childhood (BECEd)
    const isEarlyChildhood =
      cat.includes("early childhood") ||
      cat.includes("beced") ||
      name.includes("early childhood") ||
      name.includes("beced") ||
      targetProg.includes("beced") ||
      targetCourse.includes("beced")

    // Special Needs (BSNEd)
    const isSpecialNeeds =
      cat.includes("special needs") ||
      cat.includes("bsned") ||
      name.includes("special needs") ||
      name.includes("bsned") ||
      targetProg.includes("bsned") ||
      targetCourse.includes("bsned")

    if (courseKey === "beed") {
      if (isSecondarySpec && !isElementary && !isCoreCommon) return false
      if (isCoreCommon || isElementary) return true
      return !isSecondarySpec && !isEarlyChildhood && !isSpecialNeeds
    }

    if (courseKey === "bsed") {
      if (isCoreCommon || isSecondarySpec) return true
      if (isElementary || isEarlyChildhood || isSpecialNeeds) return false
      return true
    }

    if (courseKey === "beced") {
      if (isCoreCommon || isEarlyChildhood) return true
      return false
    }

    if (courseKey === "bsned") {
      if (isCoreCommon || isSpecialNeeds) return true
      return false
    }

    return true
  }

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
        "Curriculum Subject",
        "Category",
        "Modules Count",
        "Active Reviewees",
        "Total Enrolled",
        "Total Hours Spent",
        "Avg Session Length",
        "Practice Tests Taken",
        "Completion Rate (%)",
      ])
      const exportSubjects = (act.tabA_subjectBreakdown || []).filter((row) =>
        matchesActivityCourse(row, selectedActivityCourse)
      )
      exportSubjects.forEach((row) => {
        csvRows.push([
          `"${(row.name || "").replace(/"/g, '""')}"`,
          `"${(row.category || "").replace(/"/g, '""')}"`,
          row.modules_count || 0,
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

    // Filter candidates by student role, selected examination and batch
    const filteredCandidates = allCandidates.filter((c) => {
      if (c.role && c.role !== "student") return false
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
        reachSubtext:
          totalScoped === platformTotal
            ? "Total registered students"
            : `${reachPct}% of all students (${totalScoped} of ${platformTotal})`,
        leadingExamTrack: leadingTrack !== "—" ? `${leadingTrack} (${leadingShare}%)` : "—",
        leadingExamSubtext: "Most popular examination chosen",
        activeCandidatesRate: `${activeRate}%`,
        activeCandidatesCount: `${activeCandidates.length} of ${totalScoped} active students`,
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
        badgeBg: "bg-[#E17055]/20 text-[#b33920] dark:bg-[#E17055]/25 dark:text-[#f89b87]",
      }
    }
    if (val >= 70) {
      return {
        label: "ADEQUATELY PREPARED",
        badgeBg: "bg-[#3B82F6]/20 text-[#1d4ed8] dark:bg-[#3B82F6]/25 dark:text-[#93c5fd]",
      }
    }
    if (val >= 60) {
      return {
        label: "NEEDS REINFORCEMENT",
        badgeBg: "bg-[#2A9D8F]/20 text-[#1b6b61] dark:bg-[#2A9D8F]/25 dark:text-[#68c9be]",
      }
    }
    return {
      label: "FOR MONITORING",
      badgeBg: "bg-[#E9C46A]/20 text-[#a16207] dark:bg-[#E9C46A]/25 dark:text-[#facc15]",
    }
  }

  // Format student identifier (display email)
  const formatLoginId = (item) => {
    if (item?.email) return item.email
    if (item?.loginId) return item.loginId
    if (item?.login_id) return item.login_id
    return item?.name || `user${item?.id || 1}`
  }

  // Reset sorting when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearch("")
    setSelectedRowKeys([])
    setPerfStudentsPage(1)
    setPerfSchoolsPage(1)
    setPerfAtRiskPage(1)
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
    <div className="space-y-9 sm:space-y-10 pb-10">
      {/* ═══ SECTION 1: Performance Rating Overview (Top Students, Schools, At-Risk) ═══ */}
      <div className={`space-y-4 ${isFilterOpen ? "relative z-50" : "relative z-10"}`}>
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
          <div className={`space-y-4 animate-in fade-in duration-200 ${isFilterOpen ? "relative z-50" : "relative z-10"}`}>
            {/* Shopify-Style Unified Table Card */}
            <div className={`w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs relative ${isFilterOpen ? "z-50" : "z-10"}`}>
              {/* Card Top Header: Tabs (left) + Search & Filter Controls (right) */}
              <div className={`px-4 py-3 border-b border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/40 dark:bg-white/[0.02] rounded-t-2xl relative ${isFilterOpen ? "z-50" : "z-20"}`}>
                {/* Left: Tab Pills */}
                <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                  <button
                    type="button"
                    onClick={() => handleTabChange("students")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                      activeTab === "students"
                        ? "bg-black/[0.07] dark:bg-white/15 text-[#3B3B3B] dark:text-white font-semibold shadow-2xs"
                        : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
                    }`}
                  >
                    Top Students
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange("schools")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                      activeTab === "schools"
                        ? "bg-black/[0.07] dark:bg-white/15 text-[#3B3B3B] dark:text-white font-semibold shadow-2xs"
                        : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
                    }`}
                  >
                    Top Schools
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange("at-risk")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                      activeTab === "at-risk"
                        ? "bg-black/[0.07] dark:bg-white/15 text-[#3B3B3B] dark:text-white font-semibold shadow-2xs"
                        : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
                    }`}
                  >
                    Students at Risk
                  </button>
                </div>

                {/* Right: Search & Filter/Sort Icons */}
                <div className="flex items-center gap-2 ml-auto">
                  {/* Search Control */}
                  <div className="relative" ref={section1SearchRef}>
                    {isSection1SearchOpen ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 pointer-events-none" />
                          <input
                            type="search"
                            autoFocus
                            placeholder={
                              activeTab === "schools"
                                ? "Search school…"
                                : "Search student…"
                            }
                            value={search}
                            onChange={(e) => {
                              setSearch(e.target.value)
                              setPerfStudentsPage(1)
                              setPerfSchoolsPage(1)
                              setPerfAtRiskPage(1)
                            }}
                            className="w-44 sm:w-56 h-8 pl-8 pr-2.5 text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 transition-all shadow-2xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("")
                            setPerfStudentsPage(1)
                            setPerfSchoolsPage(1)
                            setPerfAtRiskPage(1)
                            setIsSection1SearchOpen(false)
                          }}
                          className="h-8 px-2 text-[11px] text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsSection1SearchOpen(true)}
                        className={`size-8 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center text-neutral-600 dark:text-neutral-300 ${
                          search ? "ring-1 ring-black/20 dark:ring-white/20 text-[#3B3B3B] dark:text-white" : ""
                        }`}
                        title="Search"
                      >
                        <Search className="size-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Popover Button */}
                  <div className="relative" ref={filterDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen((prev) => !prev)}
                      className={`h-8 px-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 select-none ${
                        (selectedExamIds.length > 0 || selectedBatchIds.length > 0)
                          ? "ring-1 ring-black/20 dark:ring-white/20 text-[#3B3B3B] dark:text-white font-medium"
                          : ""
                      }`}
                      aria-expanded={isFilterOpen}
                      aria-haspopup="true"
                      title="Filter examinations & batches"
                    >
                      <Filter className="size-3.5" />
                      {(selectedExamIds.length > 0 || selectedBatchIds.length > 0) && (
                        <span className="text-[11px]">
                          {selectedExamIds.length + selectedBatchIds.length}
                        </span>
                      )}
                    </button>

                    {/* Dropdown Menu */}
                    {isFilterOpen && (
                      <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1b20] shadow-2xl z-[100] p-3 space-y-3 max-h-[460px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                        {/* Section 1: Examinations */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                              Examinations
                            </span>
                            {selectedExamIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedExamIds([])
                                  setPerfStudentsPage(1)
                                  setPerfSchoolsPage(1)
                                  setPerfAtRiskPage(1)
                                }}
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
                              onChange={() => {
                                setSelectedExamIds([])
                                setPerfStudentsPage(1)
                                setPerfSchoolsPage(1)
                                setPerfAtRiskPage(1)
                              }}
                              className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                            />
                            <span>All Examinations</span>
                          </label>

                          <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
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
                                      setPerfStudentsPage(1)
                                      setPerfSchoolsPage(1)
                                      setPerfAtRiskPage(1)
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
                                onClick={() => {
                                  setSelectedBatchIds([])
                                  setPerfStudentsPage(1)
                                  setPerfSchoolsPage(1)
                                  setPerfAtRiskPage(1)
                                }}
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
                              onChange={() => {
                                setSelectedBatchIds([])
                                setPerfStudentsPage(1)
                                setPerfSchoolsPage(1)
                                setPerfAtRiskPage(1)
                              }}
                              className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                            />
                            <span>All Batches</span>
                          </label>

                          <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
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
                                      setPerfStudentsPage(1)
                                      setPerfSchoolsPage(1)
                                      setPerfAtRiskPage(1)
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
                                  setPerfStudentsPage(1)
                                  setPerfSchoolsPage(1)
                                  setPerfAtRiskPage(1)
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

              {/* Table Body Area */}
              {loading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
                  <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-normal text-neutral-400 dark:text-neutral-500">Loading ranking data…</p>
                </div>
              ) : activeTab === "students" ? (
                /* ── Top Students Table ── */
                (() => {
                  const totalStudents = filteredStudents.length
                  const totalPages = Math.max(1, Math.ceil(totalStudents / PERF_PAGE_SIZE))
                  const currentPage = Math.min(Math.max(1, perfStudentsPage), totalPages)
                  const startIndex = (currentPage - 1) * PERF_PAGE_SIZE
                  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + PERF_PAGE_SIZE)

                  return totalStudents === 0 ? (
                    <div className="py-16 text-center text-xs font-normal text-neutral-400 dark:text-neutral-500">
                      {search ? `No students found matching "${search}"` : "No student performance records available."}
                    </div>
                  ) : (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse" aria-label="Top Students Table">
                          <thead className="sticky top-0 z-10 bg-[#f8f8fa] dark:bg-[#16181d] backdrop-blur-md border-b border-black/5 dark:border-white/10">
                            <tr className="h-11 text-xs font-semibold text-[#696969] dark:text-gray-300">
                              {/* Rank Column */}
                              <th className="w-16 px-4 py-2.5 text-center font-semibold text-[#696969] dark:text-gray-400" scope="col">
                                Rank
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                                Student
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Performance Rating
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                                Institution
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                                Major / Specialization
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-right pr-6" scope="col">
                                Batch
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                            {paginatedStudents.map((st, idx) => {
                              const displayRank = startIndex + idx + 1
                              const rating = getPerformanceRating(st.avgScore)
                              return (
                                <tr
                                  key={st.id}
                                  className="h-13"
                                >
                                  {/* Rank */}
                                  <td className="w-16 px-4 py-2.5 text-center font-normal text-xs text-[#696969] dark:text-gray-400">
                                    {displayRank}
                                  </td>

                                  {/* Student Name with Avatar & Login ID */}
                                  <td className="px-4 py-2.5 text-left">
                                    <Link
                                      href={`/admin/users/${st.id || st.student_id}`}
                                      className="flex items-center gap-3 group cursor-pointer"
                                    >
                                      <div className="size-9 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 flex items-center justify-center font-medium text-xs text-[#3B3B3B] dark:text-gray-200 shrink-0 overflow-hidden transition-transform group-hover:scale-105">
                                        {(st.avatarUrl || st.avatar_url) ? (
                                          <img
                                            src={st.avatarUrl || st.avatar_url}
                                            alt={st.name || "Student"}
                                            className="size-full object-cover rounded-full"
                                            onError={(e) => {
                                              e.currentTarget.style.display = "none"
                                              if (e.currentTarget.nextElementSibling) {
                                                e.currentTarget.nextElementSibling.style.display = "flex"
                                              }
                                            }}
                                          />
                                        ) : null}
                                        <span
                                          className={`size-full flex items-center justify-center ${(st.avatarUrl || st.avatar_url) ? "hidden" : ""}`}
                                        >
                                          {(st.name || "U").charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="font-normal text-[13px] text-[#3B3B3B] dark:text-gray-100 group-hover:text-black dark:group-hover:text-white group-hover:underline transition-colors">
                                          {st.name || "—"}
                                        </div>
                                        <div className="text-[11px] font-normal text-[#696969] dark:text-gray-400 mt-0.5">
                                          {formatLoginId(st)}
                                        </div>
                                      </div>
                                    </Link>
                                  </td>

                                  {/* Performance Rating Status Pill */}
                                  <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                    <div className="inline-flex items-center gap-2">
                                      <span
                                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${rating.badgeBg}`}
                                      >
                                        {rating.label}
                                      </span>
                                      <span className="font-medium text-xs text-[#3B3B3B] dark:text-gray-100">
                                        {st.avgScore ? `${Number(st.avgScore).toFixed(1)}%` : "0.0%"}
                                      </span>
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
                                  <td className="px-4 py-2.5 text-right pr-6 text-xs text-[#696969] dark:text-gray-300 font-normal">
                                    {st.batch || "—"}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages >= 1 && (
                        <div className="px-4 py-3 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-center gap-3 bg-white/20 dark:bg-white/[0.01] rounded-b-2xl">
                          <div className="flex items-center gap-3">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <button
                                key={pageNum}
                                type="button"
                                onClick={() => setPerfStudentsPage(pageNum)}
                                className={`text-xs transition-colors cursor-pointer ${
                                  pageNum === currentPage
                                    ? "font-semibold text-[#3B3B3B] dark:text-white"
                                    : "font-normal text-neutral-400 hover:text-[#3B3B3B] dark:text-neutral-500 dark:hover:text-white"
                                }`}
                              >
                                {pageNum}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()
              ) : activeTab === "schools" ? (
                /* ── Top Schools Table ── */
                (() => {
                  const totalSchools = filteredSchools.length
                  const totalPages = Math.max(1, Math.ceil(totalSchools / PERF_PAGE_SIZE))
                  const currentPage = Math.min(Math.max(1, perfSchoolsPage), totalPages)
                  const startIndex = (currentPage - 1) * PERF_PAGE_SIZE
                  const paginatedSchools = filteredSchools.slice(startIndex, startIndex + PERF_PAGE_SIZE)

                  return totalSchools === 0 ? (
                    <div className="py-16 text-center text-xs font-normal text-neutral-400 dark:text-neutral-500">
                      {search ? `No schools found matching "${search}"` : "No institutional performance records available."}
                    </div>
                  ) : (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse" aria-label="Top Schools Table">
                          <thead className="sticky top-0 z-10 bg-[#f8f8fa] dark:bg-[#16181d] backdrop-blur-md border-b border-black/5 dark:border-white/10">
                            <tr className="h-11 text-xs font-semibold text-[#696969] dark:text-gray-300">
                              {/* Rank Column */}
                              <th className="w-16 px-4 py-2.5 text-center font-semibold text-[#696969] dark:text-gray-400" scope="col">
                                Rank
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                                Institution
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Total Students
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Proficient Students
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Passing Rate
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-right pr-6" scope="col">
                                Average Progress
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                            {paginatedSchools.map((sch, idx) => {
                              const displayRank = startIndex + idx + 1
                              return (
                                <tr
                                  key={sch.schoolName}
                                  className="h-13"
                                >
                                  {/* Rank */}
                                  <td className="w-16 px-4 py-2.5 text-center font-normal text-xs text-[#696969] dark:text-gray-400">
                                    {displayRank}
                                  </td>

                                  {/* School Name with Icon */}
                                  <td className="px-4 py-2.5 text-left">
                                    <div className="flex items-center gap-3">
                                      <div className="size-9 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 flex items-center justify-center font-medium text-xs text-[#3B3B3B] dark:text-gray-200 shrink-0">
                                        {(sch.schoolName || "S").charAt(0).toUpperCase()}
                                      </div>
                                      <div className="font-normal text-[13px] text-[#3B3B3B] dark:text-gray-100">
                                        {sch.schoolName || "—"}
                                      </div>
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

                      {/* Pagination Controls */}
                      {totalPages >= 1 && (
                        <div className="px-4 py-3 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-center gap-3 bg-white/20 dark:bg-white/[0.01] rounded-b-2xl">
                          <div className="flex items-center gap-3">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <button
                                key={pageNum}
                                type="button"
                                onClick={() => setPerfSchoolsPage(pageNum)}
                                className={`text-xs transition-colors cursor-pointer ${
                                  pageNum === currentPage
                                    ? "font-semibold text-[#3B3B3B] dark:text-white"
                                    : "font-normal text-neutral-400 hover:text-[#3B3B3B] dark:text-neutral-500 dark:hover:text-white"
                                }`}
                              >
                                {pageNum}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()
              ) : (
                /* ── Students at Risk Table ── */
                (() => {
                  const totalAtRisk = filteredAtRiskStudents.length
                  const totalPages = Math.max(1, Math.ceil(totalAtRisk / PERF_PAGE_SIZE))
                  const currentPage = Math.min(Math.max(1, perfAtRiskPage), totalPages)
                  const startIndex = (currentPage - 1) * PERF_PAGE_SIZE
                  const paginatedAtRisk = filteredAtRiskStudents.slice(startIndex, startIndex + PERF_PAGE_SIZE)

                  return totalAtRisk === 0 ? (
                    <div className="py-16 text-center text-xs font-normal text-neutral-400 dark:text-neutral-500">
                      {search
                        ? `No at-risk students found matching "${search}"`
                        : "No students currently identified as at-risk in this scope."}
                    </div>
                  ) : (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse" aria-label="Students at Risk Table">
                          <thead className="sticky top-0 z-10 bg-[#f8f8fa] dark:bg-[#16181d] backdrop-blur-md border-b border-black/5 dark:border-white/10">
                            <tr className="h-11 text-xs font-semibold text-[#696969] dark:text-gray-300">
                              {/* Rank Column */}
                              <th className="w-16 px-4 py-2.5 text-center font-semibold text-[#696969] dark:text-gray-400" scope="col">
                                Rank
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                                Student
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Performance Rating
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                                Institution
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                                Major / Specialization
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-right pr-6" scope="col">
                                Batch
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                            {paginatedAtRisk.map((st, idx) => {
                              const displayRank = startIndex + idx + 1
                              const rating = getPerformanceRating(st.avgScore)
                              return (
                                <tr
                                  key={st.id}
                                  className="h-13"
                                >
                                  {/* Rank */}
                                  <td className="w-16 px-4 py-2.5 text-center font-normal text-xs text-[#696969] dark:text-gray-400">
                                    {displayRank}
                                  </td>

                                  {/* Student Name with Avatar & Login ID */}
                                  <td className="px-4 py-2.5 text-left">
                                    <Link
                                      href={`/admin/users/${st.id || st.student_id}`}
                                      className="flex items-center gap-3 group cursor-pointer"
                                    >
                                      <div className="size-9 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 flex items-center justify-center font-medium text-xs text-[#3B3B3B] dark:text-gray-200 shrink-0 overflow-hidden transition-transform group-hover:scale-105">
                                        {(st.avatarUrl || st.avatar_url) ? (
                                          <img
                                            src={st.avatarUrl || st.avatar_url}
                                            alt={st.name || "Student"}
                                            className="size-full object-cover rounded-full"
                                            onError={(e) => {
                                              e.currentTarget.style.display = "none"
                                              if (e.currentTarget.nextElementSibling) {
                                                e.currentTarget.nextElementSibling.style.display = "flex"
                                              }
                                            }}
                                          />
                                        ) : null}
                                        <span
                                          className={`size-full flex items-center justify-center ${(st.avatarUrl || st.avatar_url) ? "hidden" : ""}`}
                                        >
                                          {(st.name || "U").charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="font-normal text-[13px] text-[#3B3B3B] dark:text-gray-100 group-hover:text-black dark:group-hover:text-white group-hover:underline transition-colors">
                                          {st.name || "—"}
                                        </div>
                                        <div className="text-[11px] font-normal text-[#696969] dark:text-gray-400 mt-0.5">
                                          {formatLoginId(st)}
                                        </div>
                                      </div>
                                    </Link>
                                  </td>

                                  {/* Performance Rating Status Pill */}
                                  <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                    <div className="inline-flex items-center gap-2">
                                      <span
                                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${rating.badgeBg}`}
                                      >
                                        {rating.label}
                                      </span>
                                      <span className="font-medium text-xs text-[#3B3B3B] dark:text-gray-100">
                                        {st.avgScore ? `${Number(st.avgScore).toFixed(1)}%` : "0.0%"}
                                      </span>
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
                                  <td className="px-4 py-2.5 text-right pr-6 text-xs text-[#696969] dark:text-gray-300 font-normal">
                                    {st.batch || "—"}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages >= 1 && (
                        <div className="px-4 py-3 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-center gap-3 bg-white/20 dark:bg-white/[0.01] rounded-b-2xl">
                          <div className="flex items-center gap-3">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <button
                                key={pageNum}
                                type="button"
                                onClick={() => setPerfAtRiskPage(pageNum)}
                                className={`text-xs transition-colors cursor-pointer ${
                                  pageNum === currentPage
                                    ? "font-semibold text-[#3B3B3B] dark:text-white"
                                    : "font-normal text-neutral-400 hover:text-[#3B3B3B] dark:text-neutral-500 dark:hover:text-white"
                                }`}
                              >
                                {pageNum}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()
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

          {showPassersRate && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="relative" ref={passersFilterRef}>
                <button
                  type="button"
                  onClick={() => setIsPassersFilterOpen((prev) => !prev)}
                  className={`h-8 px-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 select-none ${
                    (selectedPassersExamIds.length > 0 || selectedPassersBatchIds.length > 0 || selectedMockExamIds.length > 0)
                      ? "ring-1 ring-black/20 dark:ring-white/20 text-[#3B3B3B] dark:text-white font-medium"
                      : ""
                  }`}
                  aria-expanded={isPassersFilterOpen}
                  aria-haspopup="true"
                  title="Filter examinations, batches & mock exams"
                >
                  <Filter className="size-3.5" />
                  {(selectedPassersExamIds.length > 0 || selectedPassersBatchIds.length > 0 || selectedMockExamIds.length > 0) && (
                    <span className="text-[11px]">
                      {selectedPassersExamIds.length + selectedPassersBatchIds.length + selectedMockExamIds.length}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isPassersFilterOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1b20] shadow-xl z-50 p-3 space-y-3 max-h-[440px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
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
          )}
        </div>

        {/* Collapsible Content */}
        {showPassersRate && (
          <div className="space-y-4 animate-in fade-in duration-200">
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
      <div className="space-y-6">
        {/* Section Header & Interactive Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setShowStudentActivity((prev) => !prev)}
            className="group text-left cursor-pointer focus:outline-none"
            title={showStudentActivity ? "Hide Student Activity & Engagement" : "Show Student Activity & Engagement"}
          >
            <div className="inline-flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-[#3B3B3B] dark:text-white tracking-tight">
                Student Activity & Engagement
              </h2>
              <div className="text-neutral-400 group-hover:text-[#3B3B3B] dark:group-hover:text-white transition-colors">
                {showStudentActivity ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 font-normal">
              Track daily study time, student attendance, and subject engagement.
            </p>
          </button>

          {/* Right-aligned Controls: Preset Range, Exam/Batch Filter, Date Picker, Export CSV */}
          {showStudentActivity && (
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              {/* Presets: Segmented Pill Buttons */}
              <div className="inline-flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
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
              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                <div className="relative" ref={activityFilterRef}>
                  <button
                    type="button"
                    onClick={() => setIsActivityFilterOpen((prev) => !prev)}
                    className={`h-8 px-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 select-none ${
                      (selectedActivityExamIds.length > 0 || selectedActivityBatchIds.length > 0)
                        ? "ring-1 ring-black/20 dark:ring-white/20 text-[#3B3B3B] dark:text-white font-medium"
                        : ""
                    }`}
                    aria-expanded={isActivityFilterOpen}
                    aria-haspopup="true"
                    title="Filter examinations & batches"
                  >
                    <Filter className="size-3.5" />
                    {(selectedActivityExamIds.length > 0 || selectedActivityBatchIds.length > 0) && (
                      <span className="text-[11px]">
                        {selectedActivityExamIds.length + selectedActivityBatchIds.length}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isActivityFilterOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1b20] shadow-xl z-50 p-3 space-y-3 max-h-[440px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
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
          )}
        </div>

        {/* ══ Collapsible Content ══ */}
        {showStudentActivity && (
          <div className="space-y-4 animate-in fade-in duration-200">

            {/* 1. Top-Level Metric Summary Cards (4-Column Grid styled like Student Dashboard) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Card 1: Active Students */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none">
                <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                  <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                    Active Students
                  </span>
                </div>
                <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {filteredActivityAnalytics?.kpis?.activeReviewees || "0 / 0"}
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                    {filteredActivityAnalytics?.kpis?.participationDeltaText || "0% • 0% vs yesterday"}
                  </p>
                </div>
              </div>

              {/* Card 2: Study Time */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none">
                <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#2A9D8F]/20 dark:bg-[#2A9D8F]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                  <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                    Study Time
                  </span>
                </div>
                <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {filteredActivityAnalytics?.kpis?.totalStudyTime || "0h 0m"}
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                    {filteredActivityAnalytics?.kpis?.avgStudyTimePerActive || "Avg 0h 0m per active student"}
                  </p>
                </div>
              </div>

              {/* Card 3: Lessons Opened */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none">
                <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#E17055]/20 dark:bg-[#E17055]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                  <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                    Lessons Opened
                  </span>
                </div>
                <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {filteredActivityAnalytics?.kpis?.curriculumInteractions || "0 opens"}
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                    {filteredActivityAnalytics?.kpis?.activeSubjectsCount || "Across active subjects & modules"}
                  </p>
                </div>
              </div>

              {/* Card 4: Peak Study Hours */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none">
                <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#3B82F6]/20 dark:bg-[#3B82F6]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                  <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                    Peak Study Hours
                  </span>
                </div>
                <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#3B3B3B] dark:text-white truncate">
                    {filteredActivityAnalytics?.kpis?.peakActivityWindow || "—"}
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                    {filteredActivityAnalytics?.kpis?.peakConcurrentText || "No active students online in this period"}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Combined Analytics Visualizations & Performance Breakdown Card */}
            <div className="relative z-20 w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs">
              {/* Top: 2-Column Analytics Visualizations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-black/5 dark:divide-white/10">
                {/* Chart 1: Study Hours & Peak Times */}
                <div className="p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/5 dark:border-white/5">
                    <div>
                      <h3 className="text-xs font-normal text-[#3B3B3B] dark:text-white">
                        Study Hours & Peak Times
                      </h3>
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-normal">
                        {filteredActivityAnalytics?.isSingleDay
                          ? "Active students and study hours throughout the day"
                          : "Daily active students and total study hours"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2 rounded-sm bg-[#CBD5E1] dark:bg-slate-500" /> Active Students
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2 rounded-sm bg-[#E9C46A]" /> Study Hours
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-[280px]">
                    {(filteredActivityAnalytics?.chart1Distribution || []).length === 0 ||
                    (filteredActivityAnalytics?.kpis?.activeCount === 0 && (filteredActivityAnalytics?.chart1Distribution || []).every((d) => d.active === 0 && d.hours === 0)) ? (
                      <div className="h-full flex flex-col items-center justify-center text-xs text-neutral-400 dark:text-neutral-500 font-normal">
                        <Clock className="size-8 stroke-[1.5] mb-2 opacity-30" />
                        <span>No study activity recorded for this period.</span>
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
                            interval={filteredActivityAnalytics?.isSingleDay ? 2 : 0}
                          />
                          <YAxis
                            yAxisId="left"
                            allowDecimals={false}
                            tick={{ fontSize: 10, fill: "#888888" }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            allowDecimals={false}
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
                                    <div className="text-slate-500 dark:text-slate-400 font-normal">
                                      Active Students: {item.active}
                                    </div>
                                    <div className="text-amber-600 dark:text-amber-400 font-normal">
                                      Study Hours: {item.hours}h
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
                            fill="#CBD5E1"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="hours"
                            name="Study Hours"
                            stroke="#E9C46A"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#E9C46A" }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Chart 2: Time Spent per Subject */}
                <div className="p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/5 dark:border-white/5">
                    <div>
                      <h3 className="text-xs font-normal text-[#3B3B3B] dark:text-white">
                        Time Spent per Subject
                      </h3>
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-normal">
                        Breakdown between reading lessons and taking tests
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2 rounded-sm bg-[#E9C46A]" /> Lessons & Reading
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2 rounded-sm bg-[#CBD5E1] dark:bg-slate-500" /> Tests & Quizzes
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-[280px]">
                    {(filteredActivityAnalytics?.chart2SubjectAllocation || []).every((d) => d.totalCategoryHours === 0) ? (
                      <div className="h-full flex flex-col items-center justify-center text-xs text-neutral-400 dark:text-neutral-500 font-normal">
                        <BookOpen className="size-8 stroke-[1.5] mb-2 opacity-30" />
                        <span>No study time recorded yet for this period.</span>
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
                                    <div className="text-amber-600 dark:text-amber-400 font-normal">
                                      Lessons & Reading: {d.lectureHours}h
                                    </div>
                                    <div className="text-slate-500 dark:text-slate-400 font-normal">
                                      Tests & Quizzes: {d.testHours}h
                                    </div>
                                    <div className="text-[11px] text-[#696969] dark:text-gray-400 pt-1 border-t border-black/5 dark:border-white/10 font-normal">
                                      Share of Total Study: {d.sharePct}%
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Bar dataKey="lectureHours" name="Lessons & Reading" stackId="a" fill="#E9C46A" radius={[4, 0, 0, 4]} />
                          <Bar dataKey="testHours" name="Tests & Quizzes" stackId="a" fill="#CBD5E1" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Section Divider */}
              <div className="border-t border-black/5 dark:border-white/10" />

              {/* Bottom: Deep-Dive Curriculum & Student Accountability Tabs */}
              <div className="p-0 rounded-b-2xl">
                {/* Unified Card Header: Tabs (Left) + Search Control (Right) */}
                <div className="relative z-30 px-4 py-3 border-b border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/40 dark:bg-white/[0.02]">
                  {/* Left: Tab Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setActivityTab("subjects")
                        setActivitySearch("")
                        setActivitySubjectPage(1)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                        activityTab === "subjects"
                          ? "bg-black/[0.07] dark:bg-white/15 text-[#3B3B3B] dark:text-white font-semibold shadow-2xs"
                          : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
                      }`}
                    >
                      Subject Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActivityTab("roster")
                        setActivitySearch("")
                        setActivityRosterPage(1)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                        activityTab === "roster"
                          ? "bg-black/[0.07] dark:bg-white/15 text-[#3B3B3B] dark:text-white font-semibold shadow-2xs"
                          : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
                      }`}
                    >
                      Student Activity List
                    </button>
                  </div>

                  {/* Right: Filter & Search Controls */}
                  <div className="flex items-center gap-2 ml-auto">
                    {/* LEPT Course Filter Dropdown (Subject Progress tab) */}
                    {activityTab === "subjects" && (
                      <div className="relative">
                        <select
                          aria-label="Filter by LEPT Course"
                          value={selectedActivityCourse}
                          onChange={(e) => {
                            setSelectedActivityCourse(e.target.value)
                            setActivitySubjectPage(1)
                          }}
                          className="h-8 pl-2.5 pr-7 text-xs font-normal rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white hover:bg-neutral-50 dark:hover:bg-white/15 focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 transition-all shadow-2xs cursor-pointer appearance-none"
                        >
                          <option value="all" className="bg-white dark:bg-[#1a1b20] text-[#3B3B3B] dark:text-white">All Courses</option>
                          <option value="bsed" className="bg-white dark:bg-[#1a1b20] text-[#3B3B3B] dark:text-white">BSEd (Secondary)</option>
                          <option value="beed" className="bg-white dark:bg-[#1a1b20] text-[#3B3B3B] dark:text-white">BEEd (Elementary)</option>
                          <option value="beced" className="bg-white dark:bg-[#1a1b20] text-[#3B3B3B] dark:text-white">BECEd (Early Childhood)</option>
                          <option value="bsned" className="bg-white dark:bg-[#1a1b20] text-[#3B3B3B] dark:text-white">BSNEd (Special Needs)</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-neutral-400 pointer-events-none" />
                      </div>
                    )}

                    {/* Examination Filter Button & Dropdown */}
                    <div className="relative" ref={activityTableFilterRef}>
                      <button
                        type="button"
                        onClick={() => setIsActivityTableFilterOpen((prev) => !prev)}
                        className={`size-8 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center text-neutral-600 dark:text-neutral-300 ${
                          selectedActivityExamIds.length > 0
                            ? "ring-1 ring-black/20 dark:ring-white/20 text-[#3B3B3B] dark:text-white font-medium"
                            : ""
                        }`}
                        aria-expanded={isActivityTableFilterOpen}
                        aria-haspopup="true"
                        title="Filter examinations"
                      >
                        <Filter className="size-3.5" />
                        {selectedActivityExamIds.length > 0 && (
                          <span className="sr-only">({selectedActivityExamIds.length} active)</span>
                        )}
                      </button>

                      {/* Examination Filter Dropdown */}
                      {isActivityTableFilterOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-64 sm:w-72 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1b20] shadow-xl z-50 p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                              Filter Examinations
                            </span>
                            {selectedActivityExamIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedActivityExamIds([])
                                  setActivitySubjectPage(1)
                                  setActivityRosterPage(1)
                                }}
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
                              onChange={() => {
                                setSelectedActivityExamIds([])
                                setActivitySubjectPage(1)
                                setActivityRosterPage(1)
                              }}
                              className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                            />
                            <span>All Examinations</span>
                          </label>

                          <div className="space-y-0.5 max-h-44 overflow-y-auto pr-1">
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
                                      setActivitySubjectPage(1)
                                      setActivityRosterPage(1)
                                      if (isChecked) {
                                        setSelectedActivityExamIds(
                                          selectedActivityExamIds.filter((id) => id !== String(exam.id))
                                        )
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
                      )}
                    </div>

                    {/* Search Control */}
                    <div className="flex items-center" ref={activitySearchRef}>
                      {isActivitySearchOpen ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 pointer-events-none" />
                            <input
                              type="search"
                              autoFocus
                              placeholder={
                                activityTab === "subjects"
                                  ? "Search subject or category…"
                                  : "Search student, ID, or school…"
                              }
                              value={activitySearch}
                              onChange={(e) => {
                                setActivitySearch(e.target.value)
                                setActivitySubjectPage(1)
                                setActivityRosterPage(1)
                              }}
                              className="w-48 sm:w-60 h-8 pl-8 pr-2.5 text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 transition-all shadow-2xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActivitySearch("")
                              setActivitySubjectPage(1)
                              setActivityRosterPage(1)
                              setIsActivitySearchOpen(false)
                            }}
                            className="h-8 px-2 text-[11px] text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsActivitySearchOpen(true)}
                          className={`size-8 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center text-neutral-600 dark:text-neutral-300 ${
                            activitySearch ? "ring-1 ring-black/20 dark:ring-white/20 text-[#3B3B3B] dark:text-white" : ""
                          }`}
                          title="Search"
                        >
                          <Search className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tab A: Subject Performance Breakdown Table */}
                {activityTab === "subjects" && (() => {
                  const subjectList = (filteredActivityAnalytics?.tabA_subjectBreakdown || []).filter((sub) => {
                    if (!matchesActivityCourse(sub, selectedActivityCourse)) return false
                    if (!activitySearch.trim()) return true
                    const q = activitySearch.trim().toLowerCase()
                    return (
                      (sub.name || "").toLowerCase().includes(q) ||
                      (sub.category || "").toLowerCase().includes(q)
                    )
                  })

                  const totalSubjects = subjectList.length
                  const totalPages = Math.max(1, Math.ceil(totalSubjects / ACTIVITY_PAGE_SIZE))
                  const currentPage = Math.min(Math.max(1, activitySubjectPage), totalPages)
                  const startIndex = (currentPage - 1) * ACTIVITY_PAGE_SIZE
                  const paginatedSubjects = subjectList.slice(startIndex, startIndex + ACTIVITY_PAGE_SIZE)

                  return totalSubjects === 0 ? (
                    <div className="py-16 text-center text-xs font-normal text-neutral-400 dark:text-neutral-500">
                      {activitySearch
                        ? `No subjects found matching "${activitySearch}"`
                        : selectedActivityCourse !== "all"
                        ? "No subjects found for this course filter."
                        : "No subjects configured or recorded yet."}
                    </div>
                  ) : (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse" aria-label="Subject Performance Table">
                          <thead className="sticky top-0 z-10 bg-[#f8f8fa] dark:bg-[#16181d] backdrop-blur-md border-b border-black/5 dark:border-white/10">
                            <tr className="h-11 text-xs font-semibold text-[#696969] dark:text-gray-300">
                              <th className="px-4 py-2.5 font-semibold text-left pl-6" scope="col">
                                Subject
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Active Students
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Total Time
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Avg. Session
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Practice Tests
                              </th>
                              <th className="px-4 py-2.5 pr-6 font-semibold text-right" scope="col">
                                Completion
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                            {paginatedSubjects.map((sub, idx) => {
                              return (
                                <tr key={sub.id || idx} className="h-13">
                                  {/* Subject & Category */}
                                  <td className="px-4 py-2.5 text-left pl-6">
                                    <div>
                                      <div className="font-normal text-[13px] text-[#3B3B3B] dark:text-gray-100">
                                        {sub.name || "—"}
                                      </div>
                                      <div className="text-[11px] font-normal text-[#696969] dark:text-gray-400 mt-0.5">
                                        {sub.category || "General"}
                                        {sub.modules_count !== undefined && sub.modules_count > 0 && (
                                          <span> • {sub.modules_count} {sub.modules_count === 1 ? "module" : "modules"}</span>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Active Students */}
                                  <td className="px-4 py-2.5 text-center text-xs text-neutral-600 dark:text-neutral-300 font-normal">
                                    <span className="font-normal text-[#3B3B3B] dark:text-gray-200">
                                      {sub.activeReviewees || 0}
                                    </span>
                                    <span className="text-[11px] text-[#696969]/80 dark:text-gray-400 ml-1 font-normal">
                                      / {sub.totalEnrolled || 0}
                                    </span>
                                  </td>

                                  {/* Total Time */}
                                  <td className="px-4 py-2.5 text-center text-xs text-[#3B3B3B] dark:text-white font-normal whitespace-nowrap">
                                    {sub.totalHoursStr || "0h 0m"}
                                  </td>

                                  {/* Avg. Session */}
                                  <td className="px-4 py-2.5 text-center text-xs text-neutral-500 dark:text-neutral-400 font-normal whitespace-nowrap">
                                    {sub.avgSessionLength || "0m"}
                                  </td>

                                  {/* Practice Tests */}
                                  <td className="px-4 py-2.5 text-center text-xs text-[#3B3B3B] dark:text-neutral-200 font-normal">
                                    {sub.practiceTestsTaken || 0}
                                  </td>

                                  {/* Completion */}
                                  <td className="px-4 py-2.5 pr-6 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-2.5">
                                      <div className="w-20 sm:w-24 h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                                        <div
                                          className="h-full bg-[#E9C46A] rounded-full transition-all"
                                          style={{ width: `${Math.min(100, sub.completionRate || 0)}%` }}
                                        />
                                      </div>
                                      <span className="font-normal text-[#3B3B3B] dark:text-white text-xs min-w-[34px]">
                                        {sub.completionRate || 0}%
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages >= 1 && (
                        <div className="px-4 py-3 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-center gap-3 bg-white/20 dark:bg-white/[0.01] rounded-b-2xl">

                          <div className="flex items-center gap-3">{Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (<button key={pageNum} type="button" onClick={() => setActivitySubjectPage(pageNum)} className={`text-xs transition-colors cursor-pointer ${pageNum === currentPage ? "font-semibold text-[#3B3B3B] dark:text-white" : "font-normal text-neutral-400 hover:text-[#3B3B3B] dark:text-neutral-500 dark:hover:text-white"}`}>{pageNum}</button>))}</div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Tab B: Student Accountability & Roster Table */}
                {activityTab === "roster" && (() => {
                  const rosterList = (filteredActivityAnalytics?.tabB_studentRoster || []).filter((st) => {
                    if (!activitySearch.trim()) return true
                    const q = activitySearch.trim().toLowerCase()
                    return (
                      (st.name || "").toLowerCase().includes(q) ||
                      formatLoginId(st).toLowerCase().includes(q) ||
                      (st.school || "").toLowerCase().includes(q) ||
                      (st.major || "").toLowerCase().includes(q) ||
                      (st.batch || "").toLowerCase().includes(q)
                    )
                  })

                  const totalStudents = rosterList.length
                  const totalPages = Math.max(1, Math.ceil(totalStudents / ACTIVITY_PAGE_SIZE))
                  const currentPage = Math.min(Math.max(1, activityRosterPage), totalPages)
                  const startIndex = (currentPage - 1) * ACTIVITY_PAGE_SIZE
                  const paginatedRoster = rosterList.slice(startIndex, startIndex + ACTIVITY_PAGE_SIZE)

                  return totalStudents === 0 ? (
                    <div className="py-16 text-center text-xs font-normal text-neutral-400 dark:text-neutral-500">
                      {activitySearch ? `No students found matching "${activitySearch}"` : "No student activity records found for this period."}
                    </div>
                  ) : (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse" aria-label="Student Activity Roster Table">
                          <thead className="sticky top-0 z-10 bg-[#f8f8fa] dark:bg-[#16181d] backdrop-blur-md border-b border-black/5 dark:border-white/10">
                            <tr className="h-11 text-xs font-semibold text-[#696969] dark:text-gray-300">
                              <th className="px-4 py-2.5 font-semibold text-left pl-6" scope="col">
                                Student
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Status
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Time Spent
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Lessons Opened
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Tests Completed
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-left pr-6" scope="col">
                                Last Active
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                            {paginatedRoster.map((st, idx) => {
                              return (
                                <tr key={st.id || idx} className="h-13">
                                  {/* Student Name with Avatar & Login ID */}
                                  <td className="px-4 py-2.5 text-left pl-6">
                                    <Link
                                      href={`/admin/users/${st.id || st.student_id}`}
                                      className="flex items-center gap-3 group cursor-pointer"
                                    >
                                      <div className="size-9 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 flex items-center justify-center font-medium text-xs text-[#3B3B3B] dark:text-gray-200 shrink-0 overflow-hidden transition-transform group-hover:scale-105">
                                        {(st.avatarUrl || st.avatar_url) ? (
                                          <img
                                            src={st.avatarUrl || st.avatar_url}
                                            alt={st.name || "Student"}
                                            className="size-full object-cover rounded-full"
                                            onError={(e) => {
                                              e.currentTarget.style.display = "none"
                                              if (e.currentTarget.nextElementSibling) {
                                                e.currentTarget.nextElementSibling.style.display = "flex"
                                              }
                                            }}
                                          />
                                        ) : null}
                                        <span
                                          className={`size-full flex items-center justify-center ${(st.avatarUrl || st.avatar_url) ? "hidden" : ""}`}
                                        >
                                          {(st.name || "U").charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="font-normal text-[13px] text-[#3B3B3B] dark:text-gray-100 group-hover:text-black dark:group-hover:text-white group-hover:underline transition-colors">
                                          {st.name || "—"}
                                        </div>
                                        <div className="text-[11px] font-normal text-[#696969] dark:text-gray-400 mt-0.5">
                                          {formatLoginId(st)}
                                        </div>
                                      </div>
                                    </Link>
                                  </td>

                                  {/* Status Badge */}
                                  <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${
                                        st.statusBadge === "Active This Week" || st.statusBadge === "Active Today"
                                          ? "bg-[#2A9D8F]/20 text-[#1b6b61] dark:bg-[#2A9D8F]/25 dark:text-[#68c9be]"
                                          : "bg-[#E17055]/20 text-[#b33920] dark:bg-[#E17055]/25 dark:text-[#f89b87]"
                                      }`}
                                    >
                                      {st.statusBadge}
                                    </span>
                                  </td>

                                  {/* Time Spent */}
                                  <td className="px-4 py-2.5 text-center text-xs text-[#3B3B3B] dark:text-white font-normal whitespace-nowrap">
                                    {st.timeSpentStr || "0h 0m"}
                                  </td>

                                  {/* Lessons Opened */}
                                  <td className="px-4 py-2.5 text-center text-xs text-[#3B3B3B] dark:text-neutral-200 font-normal">
                                    {st.modulesAccessed || 0}
                                  </td>

                                  {/* Tests Completed */}
                                  <td className="px-4 py-2.5 text-center">
                                    <span className="font-normal text-[#3B3B3B] dark:text-white text-xs">
                                      {st.mockTestsCompleted || 0}
                                    </span>
                                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 block font-normal">
                                      avg. {st.avgScore || 0}%
                                    </span>
                                  </td>

                                  {/* Last Active */}
                                  <td className="px-4 py-2.5 text-left text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap font-normal pr-6">
                                    {st.lastActiveText || "—"}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages >= 1 && (
                        <div className="px-4 py-3 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-center gap-3 bg-white/20 dark:bg-white/[0.01] rounded-b-2xl">

                          <div className="flex items-center gap-3">{Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (<button key={pageNum} type="button" onClick={() => setActivityRosterPage(pageNum)} className={`text-xs transition-colors cursor-pointer ${pageNum === currentPage ? "font-semibold text-[#3B3B3B] dark:text-white" : "font-normal text-neutral-400 hover:text-[#3B3B3B] dark:text-neutral-500 dark:hover:text-white"}`}>{pageNum}</button>))}</div>
                        </div>
                      )}
                    </div>
                  )
                })()}
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

          {/* Right-aligned Controls: Preset Range, Exam/Batch Filter, Date Picker, Export CSV */}
          {showUserRegistration && (
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              {/* Presets: Segmented Pill Buttons */}
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                      regRange === pill.id
                        ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                        : "text-neutral-400 dark:text-neutral-500 hover:text-[#3B3B3B] dark:hover:text-white"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Filters Row: Filter Dropdown, Date Picker, Export CSV */}
              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                <div className="relative" ref={regFilterRef}>
                  <button
                    type="button"
                    onClick={() => setIsRegFilterOpen((prev) => !prev)}
                    className={`h-8 px-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 select-none ${
                      (selectedRegExamIds.length > 0 || selectedRegBatchIds.length > 0)
                        ? "ring-1 ring-black/20 dark:ring-white/20 text-[#3B3B3B] dark:text-white font-medium"
                        : ""
                    }`}
                    aria-expanded={isRegFilterOpen}
                    aria-haspopup="true"
                    title="Filter examinations & batches"
                  >
                    <Filter className="size-3.5" />
                    {(selectedRegExamIds.length > 0 || selectedRegBatchIds.length > 0) && (
                      <span className="text-[11px]">
                        {selectedRegExamIds.length + selectedRegBatchIds.length}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isRegFilterOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1b20] shadow-xl z-50 p-3 space-y-3 max-h-[440px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      {/* Section 1: Examinations */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                            Examinations
                          </span>
                          {selectedRegExamIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRegExamIds([])
                                setRegTracksPage(1)
                                setRegLogPage(1)
                              }}
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
                            onChange={() => {
                              setSelectedRegExamIds([])
                              setRegTracksPage(1)
                              setRegLogPage(1)
                            }}
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
                                    setRegTracksPage(1)
                                    setRegLogPage(1)
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
                              onClick={() => {
                                setSelectedRegBatchIds([])
                                setRegTracksPage(1)
                                setRegLogPage(1)
                              }}
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
                            onChange={() => {
                              setSelectedRegBatchIds([])
                              setRegTracksPage(1)
                              setRegLogPage(1)
                            }}
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
                                    setRegTracksPage(1)
                                    setRegLogPage(1)
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
                                setRegTracksPage(1)
                                setRegLogPage(1)
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

                {/* Calendar Date Picker: Single-day selector */}
                <input
                  type="date"
                  id="reg-date-picker"
                  aria-label="Filter by date"
                  value={regDate || todayStr}
                  onChange={(e) => handleRegDateChange(e.target.value)}
                  className="h-8.5 sm:h-9 px-3 text-xs font-normal rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs cursor-pointer"
                  title="Select specific date"
                />

                {/* Export CSV Action */}
                <button
                  type="button"
                  onClick={exportRegCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 h-8.5 sm:h-9 rounded-xl text-xs font-normal text-[#3B3B3B] dark:text-white bg-white dark:bg-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 transition-all shadow-2xs cursor-pointer"
                  title="Export currently filtered metrics to CSV"
                >
                  <Download className="size-3.5 text-neutral-400" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══ Collapsible Content ══ */}
        {showUserRegistration && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 1. Top-Level Metric Summary Cards (4-Column Grid matching Student Activity style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Card 1: New Students */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none">
                <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                  <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                    New Students
                  </span>
                </div>
                <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {filteredRegistrationData?.kpis?.newRegistrationsCount !== undefined
                      ? `+${filteredRegistrationData.kpis.newRegistrationsCount}`
                      : "+0"}
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                    {filteredRegistrationData?.isSingleDay
                      ? (regRange === "today" ? "Registered today" : "Registered on selected date")
                      : `Registered in ${
                          regRange === "7days"
                            ? "last 7 days"
                            : regRange === "30days"
                            ? "last 30 days"
                            : regRange === "yesterday"
                            ? "yesterday"
                            : "selected period"
                        }`}
                  </p>
                </div>
              </div>

              {/* Card 2: Total Students */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none">
                <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#2A9D8F]/20 dark:bg-[#2A9D8F]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                  <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                    Total Students
                  </span>
                </div>
                <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {filteredRegistrationData?.kpis?.totalRegisteredCount || 0}
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                    {filteredRegistrationData?.kpis?.reachSubtext || "Total registered students"}
                  </p>
                </div>
              </div>

              {/* Card 3: Top Examination */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none">
                <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#E17055]/20 dark:bg-[#E17055]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                  <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                    Top Examination
                  </span>
                </div>
                <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                  <div
                    className="text-xl sm:text-2xl font-bold tracking-tight text-[#3B3B3B] dark:text-white truncate"
                    title={filteredRegistrationData?.kpis?.leadingExamTrack || ""}
                  >
                    {filteredRegistrationData?.kpis?.leadingExamTrack || "—"}
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                    Most popular examination chosen
                  </p>
                </div>
              </div>

              {/* Card 4: Active Rate */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none">
                <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#3B82F6]/20 dark:bg-[#3B82F6]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                  <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                    Active Rate
                  </span>
                </div>
                <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {filteredRegistrationData?.kpis?.activeCandidatesRate || "0%"}
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                    {filteredRegistrationData?.kpis?.activeCandidatesCount || "Active student accounts"}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Combined Analytics Visualizations & Performance Breakdown Card */}
            <div className="relative z-20 w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs">
              {/* Top: 2-Column Analytics Visualizations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-black/5 dark:divide-white/10">
                {/* Chart 1: Registration Trends */}
                <div className="p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/5 dark:border-white/5">
                    <div>
                      <h3 className="text-xs font-normal text-[#3B3B3B] dark:text-white">
                        Registration Trends
                      </h3>
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-normal">
                        New student sign-ups over time
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2 rounded-sm bg-[#E9C46A]" /> New Students
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2 rounded-sm bg-[#CBD5E1] dark:bg-slate-500" /> Total Students
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-[280px]">
                    {(filteredRegistrationData?.trendChart || []).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-xs text-neutral-400 dark:text-neutral-500 font-normal">
                        <Clock className="size-8 stroke-[1.5] mb-2 opacity-30" />
                        <span>No sign-ups recorded for this period.</span>
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
                                  <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1f1f1f] p-3 shadow-lg text-xs space-y-1 font-normal">
                                    <div className="text-[#3B3B3B] dark:text-white font-normal">
                                      {item.date || label}
                                    </div>
                                    <div className="text-amber-600 dark:text-amber-400 font-normal">
                                      New Students: {item.registrations}
                                    </div>
                                    <div className="text-slate-500 dark:text-slate-400 font-normal">
                                      Total Students: {item.cumulative}
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
                            maxBarSize={32}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="cumulative"
                            stroke="#CBD5E1"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#CBD5E1" }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Chart 2: Students by Examination */}
                <div className="p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/5 dark:border-white/5">
                    <div>
                      <h3 className="text-xs font-normal text-[#3B3B3B] dark:text-white">
                        Students by Examination
                      </h3>
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-normal">
                        Number of students per examination type
                      </p>
                    </div>
                  </div>

                  <div className="w-full h-[280px] flex flex-col justify-between">
                    {(filteredRegistrationData?.distributionChart || []).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-xs text-neutral-400 dark:text-neutral-500 font-normal">
                        <Users className="size-8 stroke-[1.5] mb-2 opacity-30" />
                        <span>No examination distribution data.</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-full h-[175px]">
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
                                      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1f1f1f] p-2.5 shadow-lg text-xs space-y-0.5 font-normal">
                                        <div className="text-[#3B3B3B] dark:text-white">{d.name}</div>
                                        <div className="text-[11px] text-[#696969] dark:text-gray-300">
                                          {d.count} students ({d.percentage}%)
                                        </div>
                                      </div>
                                    )
                                  }
                                  return null
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Legend List */}
                        <div className="space-y-1.5 max-h-[95px] overflow-y-auto pr-1">
                          {(filteredRegistrationData?.distributionChart || []).map((item) => (
                            <div key={item.name} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 truncate">
                                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                                <span className="text-[#3B3B3B] dark:text-gray-200 truncate font-normal" title={item.name}>
                                  {item.name}
                                </span>
                              </div>
                              <span className="text-[11px] text-[#696969] dark:text-gray-400 shrink-0 ml-2 font-normal">
                                {item.count} ({item.percentage}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Section Divider */}
              <div className="border-t border-black/5 dark:border-white/10" />

              {/* Bottom: Tabbed Tables Area */}
              <div className="p-0 rounded-b-2xl">
                {/* Unified Card Header: Tabs (Left) + Search & Filter (Right) */}
                <div className="relative z-30 px-4 py-3 border-b border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/40 dark:bg-white/[0.02]">
                  {/* Left: Tab Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setRegTab("tracks")
                        setRegSearch("")
                        setRegTracksPage(1)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                        regTab === "tracks"
                          ? "bg-black/[0.07] dark:bg-white/15 text-[#3B3B3B] dark:text-white font-semibold shadow-2xs"
                          : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
                      }`}
                    >
                      Examination Breakdown
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRegTab("log")
                        setRegSearch("")
                        setRegLogPage(1)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                        regTab === "log"
                          ? "bg-black/[0.07] dark:bg-white/15 text-[#3B3B3B] dark:text-white font-semibold shadow-2xs"
                          : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
                      }`}
                    >
                      Student Sign-Ups
                    </button>
                  </div>

                  {/* Right: Filter & Search Controls */}
                  <div className="flex items-center gap-2 ml-auto">
                    {/* Examination Filter Button & Dropdown */}
                    <div className="relative" ref={regTableFilterRef}>
                      <button
                        type="button"
                        onClick={() => setIsRegTableFilterOpen((prev) => !prev)}
                        className={`size-8 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center text-neutral-600 dark:text-neutral-300 ${
                          selectedRegExamIds.length > 0
                            ? "ring-1 ring-black/20 dark:ring-white/20 text-[#3B3B3B] dark:text-white font-medium"
                            : ""
                        }`}
                        aria-expanded={isRegTableFilterOpen}
                        aria-haspopup="true"
                        title="Filter examinations"
                      >
                        <Filter className="size-3.5" />
                        {selectedRegExamIds.length > 0 && (
                          <span className="sr-only">({selectedRegExamIds.length} active)</span>
                        )}
                      </button>

                      {/* Examination Filter Dropdown */}
                      {isRegTableFilterOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-64 sm:w-72 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1b20] shadow-xl z-50 p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                              Filter Examinations
                            </span>
                            {selectedRegExamIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRegExamIds([])
                                  setRegTracksPage(1)
                                  setRegLogPage(1)
                                }}
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
                              onChange={() => {
                                setSelectedRegExamIds([])
                                setRegTracksPage(1)
                                setRegLogPage(1)
                              }}
                              className="size-3.5 rounded border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                            />
                            <span>All Examinations</span>
                          </label>

                          <div className="space-y-0.5 max-h-44 overflow-y-auto pr-1">
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
                                      setRegTracksPage(1)
                                      setRegLogPage(1)
                                      if (isChecked) {
                                        setSelectedRegExamIds(
                                          selectedRegExamIds.filter((id) => id !== String(exam.id))
                                        )
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
                      )}
                    </div>

                    {/* Search Control */}
                    <div className="flex items-center" ref={regSearchRef}>
                      {isRegSearchOpen ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 pointer-events-none" />
                            <input
                              type="search"
                              autoFocus
                              placeholder={
                                regTab === "tracks"
                                  ? "Search examination…"
                                  : "Search student, ID, or school…"
                              }
                              value={regSearch}
                              onChange={(e) => {
                                setRegSearch(e.target.value)
                                setRegTracksPage(1)
                                setRegLogPage(1)
                              }}
                              className="w-48 sm:w-60 h-8 pl-8 pr-2.5 text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 transition-all shadow-2xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setRegSearch("")
                              setRegTracksPage(1)
                              setRegLogPage(1)
                              setIsRegSearchOpen(false)
                            }}
                            className="h-8 px-2 text-[11px] text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsRegSearchOpen(true)}
                          className={`size-8 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center text-neutral-600 dark:text-neutral-300 ${
                            regSearch ? "ring-1 ring-black/20 dark:ring-white/20 text-[#3B3B3B] dark:text-white" : ""
                          }`}
                          title="Search"
                        >
                          <Search className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tab A: Examination Breakdown Table */}
                {regTab === "tracks" && (() => {
                  const tracksList = (filteredRegistrationData?.tabA_examTracks || []).filter((tr) => {
                    if (!regSearch.trim()) return true
                    const q = regSearch.trim().toLowerCase()
                    return (
                      (tr.trackCode || "").toLowerCase().includes(q) ||
                      (tr.trackName || "").toLowerCase().includes(q)
                    )
                  })

                  const totalTracks = tracksList.length
                  const totalPages = Math.max(1, Math.ceil(totalTracks / REG_PAGE_SIZE))
                  const currentPage = Math.min(Math.max(1, regTracksPage), totalPages)
                  const startIndex = (currentPage - 1) * REG_PAGE_SIZE
                  const paginatedTracks = tracksList.slice(startIndex, startIndex + REG_PAGE_SIZE)

                  return totalTracks === 0 ? (
                    <div className="py-16 text-center text-xs font-normal text-neutral-400 dark:text-neutral-500">
                      {regSearch ? `No examinations found matching "${regSearch}"` : "No examination records found."}
                    </div>
                  ) : (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse" aria-label="Examination Breakdown Table">
                          <thead className="sticky top-0 z-10 bg-[#f8f8fa] dark:bg-[#16181d] backdrop-blur-md border-b border-black/5 dark:border-white/10">
                            <tr className="h-11 text-xs font-semibold text-[#696969] dark:text-gray-300">
                              <th className="px-4 py-2.5 font-semibold text-left pl-6" scope="col">
                                Examination
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                New Students
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Total Students
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Active Students
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Active Rate
                              </th>
                              <th className="px-4 py-2.5 pr-6 font-semibold text-right" scope="col">
                                Share
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                            {paginatedTracks.map((tr, idx) => {
                              return (
                                <tr key={tr.trackCode || idx} className="h-13">
                                  <td className="px-4 py-2.5 text-left pl-6">
                                    <div>
                                      <div className="font-normal text-[13px] text-[#3B3B3B] dark:text-gray-100">
                                        {tr.trackName || tr.trackCode || "—"}
                                      </div>
                                      <div className="text-[11px] font-normal text-[#696969] dark:text-gray-400 mt-0.5">
                                        {tr.trackCode}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-center text-xs font-normal text-[#E9C46A] whitespace-nowrap">
                                    +{tr.newRegistrations || 0}
                                  </td>
                                  <td className="px-4 py-2.5 text-center text-xs text-[#3B3B3B] dark:text-white font-normal whitespace-nowrap">
                                    {tr.totalCandidates || 0}
                                  </td>
                                  <td className="px-4 py-2.5 text-center text-xs text-neutral-600 dark:text-neutral-300 font-normal whitespace-nowrap">
                                    {tr.activeCandidates || 0}
                                  </td>
                                  <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="w-16 sm:w-20 h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                                        <div
                                          className="h-full bg-[#2A9D8F] rounded-full transition-all"
                                          style={{ width: `${Math.min(100, tr.activePercentage || 0)}%` }}
                                        />
                                      </div>
                                      <span className="font-normal text-[#3B3B3B] dark:text-white text-xs min-w-[32px]">
                                        {tr.activePercentage || 0}%
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 pr-6 text-right font-normal text-[#3B3B3B] dark:text-white text-xs whitespace-nowrap">
                                    {tr.shareRate || 0}%
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages >= 1 && (
                        <div className="px-4 py-3 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-center gap-3 bg-white/20 dark:bg-white/[0.01] rounded-b-2xl">
                          <div className="flex items-center gap-3">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <button
                                key={pageNum}
                                type="button"
                                onClick={() => setRegTracksPage(pageNum)}
                                className={`text-xs transition-colors cursor-pointer ${
                                  pageNum === currentPage
                                    ? "font-semibold text-[#3B3B3B] dark:text-white"
                                    : "font-normal text-neutral-400 hover:text-[#3B3B3B] dark:text-neutral-500 dark:hover:text-white"
                                }`}
                              >
                                {pageNum}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Tab B: Student Sign-Ups Table */}
                {regTab === "log" && (() => {
                  const logList = (filteredRegistrationData?.tabB_candidateLog || []).filter((cand) => {
                    if (cand.role && cand.role !== "student") return false
                    if (!regSearch.trim()) return true
                    const q = regSearch.trim().toLowerCase()
                    return (
                      (cand.name || "").toLowerCase().includes(q) ||
                      formatLoginId(cand).toLowerCase().includes(q) ||
                      (cand.target_exam || "").toLowerCase().includes(q) ||
                      (cand.batch_name || "").toLowerCase().includes(q) ||
                      (cand.school_name || "").toLowerCase().includes(q)
                    )
                  })

                  const totalLogs = logList.length
                  const totalPages = Math.max(1, Math.ceil(totalLogs / REG_PAGE_SIZE))
                  const currentPage = Math.min(Math.max(1, regLogPage), totalPages)
                  const startIndex = (currentPage - 1) * REG_PAGE_SIZE
                  const paginatedLogs = logList.slice(startIndex, startIndex + REG_PAGE_SIZE)

                  return totalLogs === 0 ? (
                    <div className="py-16 text-center text-xs font-normal text-neutral-400 dark:text-neutral-500">
                      {regSearch ? `No student registrations found matching "${regSearch}"` : "No student registrations found for this period."}
                    </div>
                  ) : (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse" aria-label="Student Sign-Ups Table">
                          <thead className="sticky top-0 z-10 bg-[#f8f8fa] dark:bg-[#16181d] backdrop-blur-md border-b border-black/5 dark:border-white/10">
                            <tr className="h-11 text-xs font-semibold text-[#696969] dark:text-gray-300">
                              <th className="px-4 py-2.5 font-semibold text-left pl-6" scope="col">
                                Student
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Examination
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Batch
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                                School
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-center" scope="col">
                                Status
                              </th>
                              <th className="px-4 py-2.5 font-semibold text-left pr-6" scope="col">
                                Date Registered
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                            {paginatedLogs.map((cand, idx) => {
                              return (
                                <tr key={cand.id || idx} className="h-13">
                                  <td className="px-4 py-2.5 text-left pl-6">
                                    <Link
                                      href={`/admin/users/${cand.id || cand.user_id}`}
                                      className="flex items-center gap-3 group cursor-pointer"
                                    >
                                      <div className="size-9 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 flex items-center justify-center font-medium text-xs text-[#3B3B3B] dark:text-gray-200 shrink-0 overflow-hidden transition-transform group-hover:scale-105">
                                        {(cand.avatarUrl || cand.avatar_url) ? (
                                          <img
                                            src={cand.avatarUrl || cand.avatar_url}
                                            alt={cand.name || "Student"}
                                            className="size-full object-cover rounded-full"
                                            onError={(e) => {
                                              e.currentTarget.style.display = "none"
                                              if (e.currentTarget.nextElementSibling) {
                                                e.currentTarget.nextElementSibling.style.display = "flex"
                                              }
                                            }}
                                          />
                                        ) : null}
                                        <span className={`size-full flex items-center justify-center ${(cand.avatarUrl || cand.avatar_url) ? "hidden" : ""}`}>
                                          {(cand.name || "S").charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="font-normal text-[13px] text-[#3B3B3B] dark:text-gray-100 group-hover:text-black dark:group-hover:text-white group-hover:underline transition-colors">
                                          {cand.name || "—"}
                                        </div>
                                        <div className="text-[11px] font-normal text-[#696969] dark:text-gray-400 mt-0.5">
                                          {formatLoginId(cand)}
                                        </div>
                                      </div>
                                    </Link>
                                  </td>
                                  <td className="px-4 py-2.5 text-center text-xs text-[#3B3B3B] dark:text-neutral-200 font-normal whitespace-nowrap">
                                    {cand.target_exam || "General"}
                                  </td>
                                  <td className="px-4 py-2.5 text-center text-xs text-neutral-500 dark:text-neutral-400 font-normal whitespace-nowrap">
                                    {cand.batch_name || "—"}
                                  </td>
                                  <td className="px-4 py-2.5 text-left text-xs text-neutral-500 dark:text-neutral-400 font-normal">
                                    {cand.school_name || "—"}
                                  </td>
                                  <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${
                                        cand.status === "active"
                                          ? "bg-[#2A9D8F]/20 text-[#1b6b61] dark:bg-[#2A9D8F]/25 dark:text-[#68c9be]"
                                          : "bg-[#E17055]/20 text-[#b33920] dark:bg-[#E17055]/25 dark:text-[#f89b87]"
                                      }`}
                                    >
                                      {cand.status === "active" ? "Active" : (cand.status || "Inactive")}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-left text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap font-normal pr-6">
                                    {cand.created_formatted || "—"}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages >= 1 && (
                        <div className="px-4 py-3 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-center gap-3 bg-white/20 dark:bg-white/[0.01] rounded-b-2xl">
                          <div className="flex items-center gap-3">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <button
                                key={pageNum}
                                type="button"
                                onClick={() => setRegLogPage(pageNum)}
                                className={`text-xs transition-colors cursor-pointer ${
                                  pageNum === currentPage
                                    ? "font-semibold text-[#3B3B3B] dark:text-white"
                                    : "font-normal text-neutral-400 hover:text-[#3B3B3B] dark:text-neutral-500 dark:hover:text-white"
                                }`}
                              >
                                {pageNum}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


