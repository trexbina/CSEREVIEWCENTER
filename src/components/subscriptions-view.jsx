"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { Search, ChevronDown, Check, X, Clock, Calendar, AlertCircle, Filter, ArrowRightLeft, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "@/components/ui/toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import ConfirmDeleteModal from "@/components/confirm-delete-modal"

function TableSortButton({ label, field, sortField, sortDir, onSort, type = "alpha" }) {
  const active = sortField === field

  const getTooltipText = () => {
    if (!active) {
      if (type === "date") return `Sort by ${label} (Soonest first)`
      if (type === "number") return `Sort by ${label} (Lowest first)`
      return `Sort by ${label} (A to Z)`
    }
    if (sortDir === "asc") {
      if (type === "date") return `Current: Earliest / Soonest first. Click for Latest first.`
      if (type === "number") return `Current: Lowest first. Click for Highest first.`
      return `Current: A to Z. Click for Z to A.`
    }
    if (type === "date") return `Current: Latest first. Click for Earliest / Soonest first.`
    if (type === "number") return `Current: Highest first. Click for Lowest first.`
    return `Current: Z to A. Click for A to Z.`
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onSort(field)}
            className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white transition-colors cursor-pointer font-semibold select-none group"
          >
            <span>{label}</span>
            {active ? (
              sortDir === "asc" ? (
                <ArrowUp className="h-3 w-3 text-[#3B3B3B] dark:text-white shrink-0" />
              ) : (
                <ArrowDown className="h-3 w-3 text-[#3B3B3B] dark:text-white shrink-0" />
              )
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-70 transition-opacity shrink-0" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-[11px] py-1 px-2">
          {getTooltipText()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function SubscriptionsView({ initialBatchFilter = "all" }) {
  const [data, setData] = useState({ metrics: {}, batches: [], students: [], examinations: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // all, active, expiring, expired
  const [batchFilter, setBatchFilter] = useState(initialBatchFilter)
  const [examFilter, setExamFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("students") // students, batches
  const [studentPage, setStudentPage] = useState(1)
  const [batchPage, setBatchPage] = useState(1)
  const PAGE_SIZE = 8

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filterDropdownRef = useRef(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setIsFilterOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (statusFilter !== "all") count++
    if (examFilter !== "all") count++
    if (batchFilter !== "all") count++
    return count
  }, [statusFilter, examFilter, batchFilter])

  // Format login ID matching the system standard
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

  // Sorting state for students and batches
  const [studentSortField, setStudentSortField] = useState("name")
  const [studentSortDir, setStudentSortDir] = useState("asc")

  const [batchSortField, setBatchSortField] = useState("name")
  const [batchSortDir, setBatchSortDir] = useState("asc")

  const handleStudentSort = (field) => {
    if (studentSortField === field) {
      setStudentSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setStudentSortField(field)
      // Dates and remaining terms default to asc (soonest/expiring first)
      setStudentSortDir("asc")
    }
  }

  const handleBatchSort = (field) => {
    if (batchSortField === field) {
      setBatchSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setBatchSortField(field)
      // End dates default to asc (soonest ending first)
      setBatchSortDir("asc")
    }
  }

  // Modal states for moving student to another batch
  const [moveModal, setMoveModal] = useState({
    isOpen: false,
    student: null,
    targetBatchId: ""
  })
  const [confirmMoveOpen, setConfirmMoveOpen] = useState(false)
  const [savingMove, setSavingMove] = useState(false)

  // Modal states for editing batch subscription
  const [editSubscriptionModal, setEditSubscriptionModal] = useState({
    isOpen: false,
    batchId: null,
    batchName: "",
    startDate: "",
    endDate: ""
  })
  const [savingBatchSubscription, setSavingBatchSubscription] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/subscriptions")
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error(err)
      toast("Failed to load subscription data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Available examinations list derived from API response or rows
  const examinationsList = useMemo(() => {
    if (Array.isArray(data.examinations) && data.examinations.length > 0) {
      return data.examinations
    }
    const map = new Map()
    ;(data.batches || []).forEach(b => {
      if (b.exam_id && b.exam_name) map.set(String(b.exam_id), { id: b.exam_id, name: b.exam_name })
    })
    ;(data.students || []).forEach(s => {
      if (s.exam_id && s.exam_name) map.set(String(s.exam_id), { id: s.exam_id, name: s.exam_name })
    })
    return Array.from(map.values()).sort((a, b) => (a.name || "").localeCompare(b.name || ""))
  }, [data.examinations, data.batches, data.students])

  const selectedExam = useMemo(() => {
    if (examFilter === "all") return null
    return examinationsList.find(e => String(e.id) === String(examFilter)) || null
  }, [examinationsList, examFilter])

  const displayedBatches = useMemo(() => {
    if (examFilter === "all") return data.batches || []
    return (data.batches || []).filter(b => String(b.exam_id) === String(examFilter))
  }, [data.batches, examFilter])

  const handleExamFilterChange = (val) => {
    setExamFilter(val)
    if (val !== "all" && batchFilter !== "all") {
      const b = (data.batches || []).find(x => String(x.id) === String(batchFilter))
      if (b && String(b.exam_id) !== String(val)) {
        setBatchFilter("all")
      }
    }
  }

  // Filtered & sorted students
  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim()
    const list = (data.students || []).filter(s => {
      const matchSearch = !q || 
        (s.name || "").toLowerCase().includes(q) || 
        (s.login_id || "").toLowerCase().includes(q) ||
        (s.batch_name || "").toLowerCase().includes(q) ||
        (s.exam_name || "").toLowerCase().includes(q)

      const matchStatus = 
        statusFilter === "all" ? true :
        statusFilter === "active" ? (s.computed_status === "active" || s.computed_status === "expiring") :
        statusFilter === "expiring" ? s.computed_status === "expiring" :
        statusFilter === "expired" ? (s.computed_status === "expired" || s.computed_status === "disabled") : true

      const matchBatch = batchFilter === "all" ? true : String(s.batch_id) === String(batchFilter)
      const matchExam = examFilter === "all" ? true : String(s.exam_id) === String(examFilter)

      return matchSearch && matchStatus && matchBatch && matchExam
    })

    return list.sort((a, b) => {
      let av = ""
      let bv = ""

      if (studentSortField === "name") {
        av = (a.name || "").toLowerCase()
        bv = (b.name || "").toLowerCase()
      } else if (studentSortField === "batch_name") {
        av = (a.batch_name || a.exam_name || "").toLowerCase()
        bv = (b.batch_name || b.exam_name || "").toLowerCase()
      } else if (studentSortField === "effective_end_date") {
        const timeA = a.effective_end_date ? new Date(a.effective_end_date).getTime() : 0
        const timeB = b.effective_end_date ? new Date(b.effective_end_date).getTime() : 0
        return studentSortDir === "asc" ? timeA - timeB : timeB - timeA
      } else if (studentSortField === "days_remaining") {
        const remA = a.days_remaining ?? 999999
        const remB = b.days_remaining ?? 999999
        return studentSortDir === "asc" ? remA - remB : remB - remA
      } else if (studentSortField === "status") {
        av = (a.computed_status || "").toLowerCase()
        bv = (b.computed_status || "").toLowerCase()
      } else {
        av = String(a[studentSortField] || "").toLowerCase()
        bv = String(b[studentSortField] || "").toLowerCase()
      }

      if (av < bv) return studentSortDir === "asc" ? -1 : 1
      if (av > bv) return studentSortDir === "asc" ? 1 : -1
      return 0
    })
  }, [data.students, search, statusFilter, batchFilter, examFilter, studentSortField, studentSortDir])

  // Filtered & sorted batches
  const filteredBatches = useMemo(() => {
    const q = search.toLowerCase().trim()
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const thirtyDaysLater = new Date(now)
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

    const list = (data.batches || []).filter(b => {
      const matchSearch = !q || 
        (b.name || "").toLowerCase().includes(q) || 
        (b.exam_name || "").toLowerCase().includes(q)

      const matchBatch = batchFilter === "all" ? true : String(b.id) === String(batchFilter)
      const matchExam = examFilter === "all" ? true : String(b.exam_id) === String(examFilter)

      const isPast = b.end_date ? new Date(b.end_date) < now : false
      const endDate = b.end_date ? new Date(b.end_date) : null
      const isExpiring = endDate && !isPast && endDate <= thirtyDaysLater

      const matchStatus = 
        statusFilter === "all" ? true :
        statusFilter === "active" ? (!isPast && b.status !== "inactive") :
        statusFilter === "expiring" ? isExpiring :
        statusFilter === "expired" ? (isPast || b.status === "inactive") : true

      return matchSearch && matchBatch && matchExam && matchStatus
    })

    return list.sort((a, b) => {
      let av = ""
      let bv = ""

      if (batchSortField === "name") {
        av = (a.name || "").toLowerCase()
        bv = (b.name || "").toLowerCase()
      } else if (batchSortField === "exam_name") {
        av = (a.exam_name || "").toLowerCase()
        bv = (b.exam_name || "").toLowerCase()
      } else if (batchSortField === "student_count") {
        const countA = Number(a.student_count || 0)
        const countB = Number(b.student_count || 0)
        return batchSortDir === "asc" ? countA - countB : countB - countA
      } else if (batchSortField === "end_date") {
        const timeA = a.end_date ? new Date(a.end_date).getTime() : 0
        const timeB = b.end_date ? new Date(b.end_date).getTime() : 0
        return batchSortDir === "asc" ? timeA - timeB : timeB - timeA
      } else if (batchSortField === "status") {
        av = (a.status || "").toLowerCase()
        bv = (b.status || "").toLowerCase()
      } else {
        av = String(a[batchSortField] || "").toLowerCase()
        bv = String(b[batchSortField] || "").toLowerCase()
      }

      if (av < bv) return batchSortDir === "asc" ? -1 : 1
      if (av > bv) return batchSortDir === "asc" ? 1 : -1
      return 0
    })
  }, [data.batches, search, batchFilter, examFilter, statusFilter, batchSortField, batchSortDir])

  // Selected batch for label/subtext display
  const selectedBatch = useMemo(() => {
    if (batchFilter === "all") return null
    return (data.batches || []).find(b => String(b.id) === String(batchFilter))
  }, [data.batches, batchFilter])

  // Unified dynamic metrics reflecting current tab and active filters
  const currentMetrics = useMemo(() => {
    if (activeTab === "students") {
      const pool = (data.students || []).filter(s => {
        const matchBatch = batchFilter === "all" ? true : String(s.batch_id) === String(batchFilter)
        const matchExam = examFilter === "all" ? true : String(s.exam_id) === String(examFilter)
        return matchBatch && matchExam
      })

      const total = pool.length
      const active = pool.filter(s => s.computed_status === "active" || s.computed_status === "expiring").length
      const expiring = pool.filter(s => s.computed_status === "expiring").length
      const expired = pool.filter(s => s.computed_status === "expired" || s.computed_status === "disabled").length

      let subtext = "All enrolled students"
      if (selectedBatch && selectedExam) {
        subtext = `${selectedBatch.name} • ${selectedExam.name}`
      } else if (selectedBatch) {
        subtext = `In ${selectedBatch.name}`
      } else if (selectedExam) {
        subtext = `In ${selectedExam.name}`
      }

      return {
        totalLabel: "Total Reviewees",
        totalSubtext: subtext,
        totalCount: total,

        activeLabel: "Active",
        activeSubtext: "Currently with access",
        activeCount: active,

        expiringLabel: "Expiring Soon",
        expiringSubtext: "Ends within 7 days",
        expiringCount: expiring,

        expiredLabel: "Expired",
        expiredSubtext: "Access ended or inactive",
        expiredCount: expired
      }
    } else {
      const pool = (data.batches || []).filter(b => {
        const matchBatch = batchFilter === "all" ? true : String(b.id) === String(batchFilter)
        const matchExam = examFilter === "all" ? true : String(b.exam_id) === String(examFilter)
        return matchBatch && matchExam
      })

      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const thirtyDaysLater = new Date(now)
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

      let active = 0
      let expiring = 0
      let expired = 0

      pool.forEach(b => {
        const isPast = b.end_date ? new Date(b.end_date) < now : false
        const endDate = b.end_date ? new Date(b.end_date) : null
        const isExp = endDate && !isPast && endDate <= thirtyDaysLater

        if (b.status === "inactive" || isPast) {
          expired++
        } else if (isExp) {
          expiring++
          active++
        } else {
          active++
        }
      })

      let subtext = "All review batches"
      if (selectedBatch && selectedExam) {
        subtext = `${selectedBatch.name} • ${selectedExam.name}`
      } else if (selectedBatch) {
        subtext = selectedBatch.name
      } else if (selectedExam) {
        subtext = selectedExam.name
      }

      return {
        totalLabel: "Total Batches",
        totalSubtext: subtext,
        totalCount: pool.length,

        activeLabel: "Active",
        activeSubtext: "Ongoing review terms",
        activeCount: active,

        expiringLabel: "Expiring Soon",
        expiringSubtext: "Term ends within 30 days",
        expiringCount: expiring,

        expiredLabel: "Term Ended",
        expiredSubtext: "Schedule ended or inactive",
        expiredCount: expired
      }
    }
  }, [data.students, data.batches, batchFilter, examFilter, activeTab, selectedBatch, selectedExam])

  const openMoveBatch = (student) => {
    setMoveModal({
      isOpen: true,
      student,
      targetBatchId: ""
    })
  }

  const handleMoveBatch = async () => {
    if (!moveModal.targetBatchId || !moveModal.student) return
    setSavingMove(true)
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MOVE_STUDENT_BATCH",
          studentId: moveModal.student.id,
          batchId: parseInt(moveModal.targetBatchId)
        })
      })

      const result = await res.json()
      if (res.ok) {
        toast(`Moved ${moveModal.student.name} to ${result.batchName}.`)
        setMoveModal({ isOpen: false, student: null, targetBatchId: "" })
        fetchData()
      } else {
        toast(result.error || "Failed to move student.")
      }
    } catch {
      toast("Network error occurred.")
    } finally {
      setSavingMove(false)
    }
  }

  const openEditSubscription = (batch) => {
    const start = batch.start_date ? new Date(batch.start_date).toISOString().split("T")[0] : ""
    const end = batch.end_date ? new Date(batch.end_date).toISOString().split("T")[0] : ""
    setEditSubscriptionModal({
      isOpen: true,
      batchId: batch.id,
      batchName: batch.name,
      startDate: start,
      endDate: end
    })
  }

  const handleSaveBatchSubscription = async () => {
    if (!editSubscriptionModal.startDate || !editSubscriptionModal.endDate) {
      toast("Please select both start date and end date.")
      return
    }
    if (new Date(editSubscriptionModal.startDate) > new Date(editSubscriptionModal.endDate)) {
      toast("Start date cannot be after end date.")
      return
    }

    setSavingBatchSubscription(true)
    try {
      const payload = {
        action: "EDIT_BATCH_SUBSCRIPTION",
        batchId: editSubscriptionModal.batchId,
        startDate: editSubscriptionModal.startDate,
        endDate: editSubscriptionModal.endDate
      }

      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast(`Successfully updated subscription for ${editSubscriptionModal.batchName}.`)
        setEditSubscriptionModal(prev => ({ ...prev, isOpen: false }))
        fetchData()
      } else {
        const errData = await res.json().catch(() => ({}))
        toast(errData.error || "Failed to update batch subscription.")
      }
    } catch {
      toast("Network error occurred.")
    } finally {
      setSavingBatchSubscription(false)
    }
  }

  const handleReactivate = async (studentId, studentName) => {
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REACTIVATE_STUDENT",
          studentId
        })
      })
      if (res.ok) {
        toast(`Account for ${studentName} reactivated.`)
        fetchData()
      }
    } catch {
      toast("Error reactivating account.")
    }
  }

  // Pagination calculations
  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE))
  const currentStudentPage = Math.min(Math.max(1, studentPage), totalStudentPages)
  const studentStartIndex = (currentStudentPage - 1) * PAGE_SIZE
  const paginatedStudents = filteredStudents.slice(studentStartIndex, studentStartIndex + PAGE_SIZE)

  const totalBatchPages = Math.max(1, Math.ceil(filteredBatches.length / PAGE_SIZE))
  const currentBatchPage = Math.min(Math.max(1, batchPage), totalBatchPages)
  const batchStartIndex = (currentBatchPage - 1) * PAGE_SIZE
  const paginatedBatches = filteredBatches.slice(batchStartIndex, batchStartIndex + PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* ── Top-Level Metric Summary Cards (4-Column Grid styled like Analytical Overview) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total */}
        <div
          onClick={() => {
            setStatusFilter("all")
            setStudentPage(1)
            setBatchPage(1)
          }}
          className={`rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none cursor-pointer transition-all hover:border-black/15 dark:hover:border-white/20 ${
            statusFilter === "all" ? "ring-2 ring-black/15 dark:ring-white/20" : ""
          }`}
        >
          <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
            <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
              {currentMetrics.totalLabel}
            </span>
          </div>
          <div className="p-5 sm:p-6 pt-4 sm:pt-4">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
              {Number(currentMetrics.totalCount || 0).toLocaleString()}
            </div>
            <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none truncate">
              {currentMetrics.totalSubtext}
            </p>
          </div>
        </div>

        {/* Card 2: Active */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === "active" ? "all" : "active")
            setStudentPage(1)
            setBatchPage(1)
          }}
          className={`rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none cursor-pointer transition-all hover:border-black/15 dark:hover:border-white/20 ${
            statusFilter === "active" ? "ring-2 ring-emerald-500/40" : ""
          }`}
        >
          <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#2A9D8F]/20 dark:bg-[#2A9D8F]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
            <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
              {currentMetrics.activeLabel}
            </span>
          </div>
          <div className="p-5 sm:p-6 pt-4 sm:pt-4">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
              {Number(currentMetrics.activeCount || 0).toLocaleString()}
            </div>
            <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none truncate">
              {currentMetrics.activeSubtext}
            </p>
          </div>
        </div>

        {/* Card 3: Expiring Soon */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === "expiring" ? "all" : "expiring")
            setStudentPage(1)
            setBatchPage(1)
          }}
          className={`rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none cursor-pointer transition-all hover:border-black/15 dark:hover:border-white/20 ${
            statusFilter === "expiring" ? "ring-2 ring-amber-500/40" : ""
          }`}
        >
          <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#E17055]/20 dark:bg-[#E17055]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
            <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
              {currentMetrics.expiringLabel}
            </span>
          </div>
          <div className="p-5 sm:p-6 pt-4 sm:pt-4">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
              {Number(currentMetrics.expiringCount || 0).toLocaleString()}
            </div>
            <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none truncate">
              {currentMetrics.expiringSubtext}
            </p>
          </div>
        </div>

        {/* Card 4: Expired */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === "expired" ? "all" : "expired")
            setStudentPage(1)
            setBatchPage(1)
          }}
          className={`rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between select-none cursor-pointer transition-all hover:border-black/15 dark:hover:border-white/20 ${
            statusFilter === "expired" ? "ring-2 ring-blue-500/40" : ""
          }`}
        >
          <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#3B82F6]/20 dark:bg-[#3B82F6]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
            <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
              {currentMetrics.expiredLabel}
            </span>
          </div>
          <div className="p-5 sm:p-6 pt-4 sm:pt-4">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
              {Number(currentMetrics.expiredCount || 0).toLocaleString()}
            </div>
            <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none truncate">
              {currentMetrics.expiredSubtext}
            </p>
          </div>
        </div>
      </div>

      {/* ── Unified Table Card (Styled like Analytical Overview) ── */}
      <div className={`w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs ${isFilterOpen ? "relative z-50" : "relative z-10"}`}>
        {/* Card Top Header: Tabs (left) + Search & Filter Controls (right) */}
        <div className={`px-4 py-3 border-b border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/40 dark:bg-white/[0.02] rounded-t-2xl relative ${isFilterOpen ? "z-50" : "z-20"}`}>
          {/* Left: Tab Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab("students")
                setStudentPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "students"
                  ? "bg-black/[0.07] dark:bg-white/15 text-[#3B3B3B] dark:text-white font-semibold shadow-2xs"
                  : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              Reviewees
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("batches")
                setBatchPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "batches"
                  ? "bg-black/[0.07] dark:bg-white/15 text-[#3B3B3B] dark:text-white font-semibold shadow-2xs"
                  : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              Batches ({data.batches?.length || 0})
            </button>
          </div>

          {/* Right: Search & Filter Popover */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Search Control (Expandable) */}
            <div className="relative" ref={searchRef}>
              {isSearchOpen ? (
                <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 pointer-events-none" />
                    <input
                      type="search"
                      autoFocus
                      placeholder={activeTab === "batches" ? "Search batch…" : "Search student…"}
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setStudentPage(1)
                        setBatchPage(1)
                      }}
                      className="w-44 sm:w-56 h-8 pl-8 pr-2.5 text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 transition-all shadow-2xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("")
                      setStudentPage(1)
                      setBatchPage(1)
                      setIsSearchOpen(false)
                    }}
                    className="h-8 px-2 text-[11px] text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
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
                  activeFiltersCount > 0
                    ? "ring-1 ring-black/20 dark:ring-white/20 text-[#3B3B3B] dark:text-white font-medium"
                    : ""
                }`}
                aria-expanded={isFilterOpen}
                aria-haspopup="true"
                title="Filter subscriptions"
              >
                <Filter className="size-3.5" />
                {activeFiltersCount > 0 && (
                  <span className="text-[11px]">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1b20] shadow-2xl z-[100] p-3 space-y-3 max-h-[460px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  {/* Section 1: Status */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </span>
                      {statusFilter !== "all" && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusFilter("all")
                            setStudentPage(1)
                            setBatchPage(1)
                          }}
                          className="text-[11px] text-[#a16207] dark:text-[#facc15] hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      {[
                        { value: "all", label: "All Statuses" },
                        { value: "active", label: "Active" },
                        { value: "expiring", label: activeTab === "students" ? "Expiring Soon (≤ 7 days)" : "Expiring Soon (≤ 30 days)" },
                        { value: "expired", label: activeTab === "students" ? "Expired / Inactive" : "Term Ended / Inactive" }
                      ].map((st) => (
                        <label
                          key={st.value}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs text-[#3B3B3B] dark:text-gray-200 select-none"
                        >
                          <input
                            type="radio"
                            name="subStatusFilter"
                            checked={statusFilter === st.value}
                            onChange={() => {
                              setStatusFilter(st.value)
                              setStudentPage(1)
                              setBatchPage(1)
                            }}
                            className="size-3.5 border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                          />
                          <span className={statusFilter === st.value ? "font-semibold text-[#3B3B3B] dark:text-white" : ""}>
                            {st.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Section Divider */}
                  {examinationsList.length > 0 && <div className="border-t border-black/5 dark:border-white/10" />}

                  {/* Section 2: Examinations */}
                  {examinationsList.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                          Examinations
                        </span>
                        {examFilter !== "all" && (
                          <button
                            type="button"
                            onClick={() => {
                              handleExamFilterChange("all")
                              setStudentPage(1)
                              setBatchPage(1)
                            }}
                            className="text-[11px] text-[#a16207] dark:text-[#facc15] hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs font-medium text-[#3B3B3B] dark:text-gray-200 select-none">
                        <input
                          type="radio"
                          name="subExamFilter"
                          checked={examFilter === "all"}
                          onChange={() => {
                            handleExamFilterChange("all")
                            setStudentPage(1)
                            setBatchPage(1)
                          }}
                          className="size-3.5 border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                        />
                        <span className={examFilter === "all" ? "font-semibold text-[#3B3B3B] dark:text-white" : ""}>
                          All Examinations
                        </span>
                      </label>

                      <div className="space-y-0.5 max-h-36 overflow-y-auto pr-1">
                        {examinationsList.map((exam) => (
                          <label
                            key={exam.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs text-[#3B3B3B] dark:text-gray-200 select-none"
                          >
                            <input
                              type="radio"
                              name="subExamFilter"
                              checked={String(examFilter) === String(exam.id)}
                              onChange={() => {
                                handleExamFilterChange(String(exam.id))
                                setStudentPage(1)
                                setBatchPage(1)
                              }}
                              className="size-3.5 border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                            />
                            <span className={`truncate ${String(examFilter) === String(exam.id) ? "font-semibold text-[#3B3B3B] dark:text-white" : ""}`}>
                              {exam.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section Divider */}
                  {displayedBatches.length > 0 && <div className="border-t border-black/5 dark:border-white/10" />}

                  {/* Section 3: Batches */}
                  {displayedBatches.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                          Batches
                        </span>
                        {batchFilter !== "all" && (
                          <button
                            type="button"
                            onClick={() => {
                              setBatchFilter("all")
                              setStudentPage(1)
                              setBatchPage(1)
                            }}
                            className="text-[11px] text-[#a16207] dark:text-[#facc15] hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs font-medium text-[#3B3B3B] dark:text-gray-200 select-none">
                        <input
                          type="radio"
                          name="subBatchFilter"
                          checked={batchFilter === "all"}
                          onChange={() => {
                            setBatchFilter("all")
                            setStudentPage(1)
                            setBatchPage(1)
                          }}
                          className="size-3.5 border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                        />
                        <span className={batchFilter === "all" ? "font-semibold text-[#3B3B3B] dark:text-white" : ""}>
                          All Batches
                        </span>
                      </label>

                      <div className="space-y-0.5 max-h-36 overflow-y-auto pr-1">
                        {displayedBatches.map((batch) => (
                          <label
                            key={batch.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs text-[#3B3B3B] dark:text-gray-200 select-none"
                          >
                            <input
                              type="radio"
                              name="subBatchFilter"
                              checked={String(batchFilter) === String(batch.id)}
                              onChange={() => {
                                setBatchFilter(String(batch.id))
                                setStudentPage(1)
                                setBatchPage(1)
                              }}
                              className="size-3.5 border-black/20 text-[#3B3B3B] focus:ring-0 cursor-pointer accent-[#3B3B3B]"
                            />
                            <span className={`truncate ${String(batchFilter) === String(batch.id) ? "font-semibold text-[#3B3B3B] dark:text-white" : ""}`}>
                              {batch.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom Reset Strip */}
                  {activeFiltersCount > 0 && (
                    <>
                      <div className="border-t border-black/5 dark:border-white/10" />
                      <div className="flex items-center justify-between px-1 pt-0.5 text-xs">
                        <span className="text-neutral-400">
                          {activeFiltersCount} active filter{activeFiltersCount > 1 ? "s" : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setStatusFilter("all")
                            handleExamFilterChange("all")
                            setBatchFilter("all")
                            setStudentPage(1)
                            setBatchPage(1)
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

        {/* Table Content */}
        {activeTab === "students" ? (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label="Reviewees Subscriptions Table">
                <thead className="sticky top-0 z-10 bg-[#f8f8fa] dark:bg-[#16181d] backdrop-blur-md border-b border-black/5 dark:border-white/10">
                  <tr className="h-11 text-xs font-semibold text-[#696969] dark:text-gray-300">
                    <th className="w-16 px-4 py-2.5 text-center font-semibold text-[#696969] dark:text-gray-400" scope="col">
                      Rank
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                      <TableSortButton label="Student" field="name" sortField={studentSortField} sortDir={studentSortDir} onSort={handleStudentSort} type="alpha" />
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                      <TableSortButton label="Examination & Batch" field="batch_name" sortField={studentSortField} sortDir={studentSortDir} onSort={handleStudentSort} type="alpha" />
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                      <TableSortButton label="Scheduled End Date" field="effective_end_date" sortField={studentSortField} sortDir={studentSortDir} onSort={handleStudentSort} type="date" />
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                      <TableSortButton label="Remaining Term" field="days_remaining" sortField={studentSortField} sortDir={studentSortDir} onSort={handleStudentSort} type="number" />
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold pr-6" scope="col">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-xs font-normal text-neutral-400 dark:text-neutral-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span>Loading subscriptions…</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-xs font-normal text-neutral-400 dark:text-neutral-500">
                        {search ? `No subscriptions found matching "${search}"` : "No student subscriptions match the selected criteria."}
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student, idx) => {
                      const displayRank = studentStartIndex + idx + 1
                      const isExpired = student.computed_status === "expired" || student.computed_status === "disabled"
                      const isExpiring = student.computed_status === "expiring"
                      const dateFormatted = student.effective_end_date 
                        ? new Date(student.effective_end_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                        : "No scheduled end"

                      return (
                        <tr key={student.id} className="h-13 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors">
                          {/* Rank */}
                          <td className="w-16 px-4 py-2.5 text-center font-normal text-xs text-[#696969] dark:text-gray-400">
                            {displayRank}
                          </td>

                          {/* Student Name with Avatar & Login ID */}
                          <td className="px-4 py-2.5 text-left">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 flex items-center justify-center font-medium text-xs text-[#3B3B3B] dark:text-gray-200 shrink-0 overflow-hidden">
                                {(student.avatar_url || student.avatarUrl) ? (
                                  <img
                                    src={student.avatar_url || student.avatarUrl}
                                    alt={student.name || "Student"}
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
                                  className={`size-full flex items-center justify-center ${(student.avatar_url || student.avatarUrl) ? "hidden" : ""}`}
                                >
                                  {(student.name || "U").charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-[13px] text-[#3B3B3B] dark:text-gray-100">
                                  {student.name || "—"}
                                </div>
                                <div className="text-[11px] font-normal text-[#696969] dark:text-gray-400 mt-0.5">
                                  {formatLoginId(student)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Examination & Batch */}
                          <td className="px-4 py-2.5 text-left text-xs">
                            <div className="font-semibold text-xs text-[#3B3B3B] dark:text-gray-200">
                              {student.batch_name || "—"}
                            </div>
                            <div className="text-[11px] text-[#696969] dark:text-gray-400 font-normal mt-0.5">
                              {student.exam_name || "—"}
                            </div>
                          </td>

                          {/* Scheduled End Date */}
                          <td className="px-4 py-2.5 text-left text-xs text-[#696969] dark:text-gray-300">
                            <div>{dateFormatted}</div>
                            {student.subscription_end_date && (
                              <span className="block text-[10px] text-neutral-400 dark:text-neutral-500 italic mt-0.5">
                                Custom extension
                              </span>
                            )}
                          </td>

                          {/* Remaining Term */}
                          <td className="px-4 py-2.5 text-left text-xs">
                            {student.days_remaining !== null ? (
                              <span className={student.days_remaining < 0 ? "text-neutral-500 font-medium" : isExpiring ? "text-amber-700 dark:text-amber-400 font-medium" : "text-[#696969] dark:text-gray-400 font-normal"}>
                                {student.days_remaining < 0 ? `${Math.abs(student.days_remaining)} days ago` : `${student.days_remaining} days left`}
                              </span>
                            ) : (
                              <span className="text-[#696969]/60 dark:text-gray-500 font-normal">—</span>
                            )}
                          </td>

                          {/* Status Pill Badge */}
                          <td className="px-4 py-2.5 text-left text-xs">
                            {student.is_active === false ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40">
                                Disabled
                              </span>
                            ) : isExpired ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-neutral-100 text-neutral-600 border border-neutral-200 dark:bg-white/10 dark:text-neutral-300 dark:border-white/10">
                                Term Completed
                              </span>
                            ) : isExpiring ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-[#E9C46A]/20 text-[#A06010] dark:text-[#E9C46A] border border-[#E9C46A]/40 dark:border-[#E9C46A]/30">
                                Expiring Soon
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40">
                                Active
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-2.5 text-right pr-6">
                            <div className="flex items-center justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => openMoveBatch(student)}
                                      className="size-8 rounded-lg flex items-center justify-center text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                      aria-label="Move Batch"
                                    >
                                      <ArrowRightLeft className="size-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Move Batch</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {student.is_active === false && (
                                <button
                                  onClick={() => handleReactivate(student.id, student.name)}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-200 hover:bg-neutral-300 dark:bg-white/15 dark:hover:bg-white/25 text-neutral-800 dark:text-white transition-colors cursor-pointer"
                                >
                                  Enable
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalStudentPages > 1 && (
              <div className="px-4 py-3 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-center gap-3 bg-white/20 dark:bg-white/[0.01] rounded-b-2xl">
                <div className="flex items-center gap-3">
                  {Array.from({ length: totalStudentPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setStudentPage(pageNum)}
                      className={`text-xs transition-colors cursor-pointer ${
                        pageNum === currentStudentPage
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
        ) : (
          /* ── Batches Tab ── */
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label="Batches Subscriptions Table">
                <thead className="sticky top-0 z-10 bg-[#f8f8fa] dark:bg-[#16181d] backdrop-blur-md border-b border-black/5 dark:border-white/10">
                  <tr className="h-11 text-xs font-semibold text-[#696969] dark:text-gray-300">
                    <th className="w-16 px-4 py-2.5 text-center font-semibold text-[#696969] dark:text-gray-400" scope="col">
                      Rank
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                      <TableSortButton label="Batch Name" field="name" sortField={batchSortField} sortDir={batchSortDir} onSort={handleBatchSort} type="alpha" />
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                      <TableSortButton label="Target Exam" field="exam_name" sortField={batchSortField} sortDir={batchSortDir} onSort={handleBatchSort} type="alpha" />
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                      <TableSortButton label="Enrolled Students" field="student_count" sortField={batchSortField} sortDir={batchSortDir} onSort={handleBatchSort} type="number" />
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                      <TableSortButton label="Scheduled End Date" field="end_date" sortField={batchSortField} sortDir={batchSortDir} onSort={handleBatchSort} type="date" />
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-left" scope="col">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold pr-6" scope="col">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-xs font-normal text-neutral-400 dark:text-neutral-500">
                        {search ? `No batches found matching "${search}"` : "No batches found."}
                      </td>
                    </tr>
                  ) : (
                    paginatedBatches.map((batch, idx) => {
                      const displayRank = batchStartIndex + idx + 1
                      const endFormatted = batch.end_date 
                        ? new Date(batch.end_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                        : "No scheduled end"
                      const isPast = batch.end_date ? new Date(batch.end_date) < new Date(new Date().setHours(0,0,0,0)) : false

                      return (
                        <tr key={batch.id} className="h-13 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors">
                          {/* Rank */}
                          <td className="w-16 px-4 py-2.5 text-center font-normal text-xs text-[#696969] dark:text-gray-400">
                            {displayRank}
                          </td>

                          {/* Batch Name */}
                          <td className="px-4 py-2.5 text-left">
                            <div className="font-semibold text-xs text-[#3B3B3B] dark:text-gray-100">
                              {batch.name}
                            </div>
                            <div className="text-[11px] text-[#696969] dark:text-gray-400 font-normal mt-0.5">
                              Target Year: {batch.target_year || "—"}
                            </div>
                          </td>

                          {/* Target Exam */}
                          <td className="px-4 py-2.5 text-left text-xs text-[#696969] dark:text-gray-300">
                            {batch.exam_name || "—"}
                          </td>

                          {/* Enrolled Students */}
                          <td className="px-4 py-2.5 text-left text-xs text-[#696969] dark:text-gray-300">
                            <span className="font-semibold text-[#3B3B3B] dark:text-white">{batch.student_count || 0}</span> reviewees
                            {batch.expired_count > 0 && (
                              <span className="text-[#696969]/70 dark:text-gray-500 ml-1">({batch.expired_count} inactive/expired)</span>
                            )}
                          </td>

                          {/* Scheduled End Date */}
                          <td className="px-4 py-2.5 text-left text-xs text-[#696969] dark:text-gray-300">
                            <div>{endFormatted}</div>
                            {batch.start_date && (
                              <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                                Start: {new Date(batch.start_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                              </div>
                            )}
                          </td>

                          {/* Status Pill Badge */}
                          <td className="px-4 py-2.5 text-left text-xs">
                            {isPast ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-neutral-100 text-neutral-600 border border-neutral-200 dark:bg-white/10 dark:text-neutral-300 dark:border-white/10">
                                Term Ended
                              </span>
                            ) : batch.status === "inactive" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40">
                                Inactive
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40">
                                Active
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-2.5 text-right pr-6">
                            <button
                              onClick={() => openEditSubscription(batch)}
                              className="px-3 py-1 text-xs font-semibold rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-[#3B3B3B] dark:text-white transition-colors cursor-pointer"
                            >
                              Edit Subscription
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalBatchPages > 1 && (
              <div className="px-4 py-3 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-center gap-3 bg-white/20 dark:bg-white/[0.01] rounded-b-2xl">
                <div className="flex items-center gap-3">
                  {Array.from({ length: totalBatchPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setBatchPage(pageNum)}
                      className={`text-xs transition-colors cursor-pointer ${
                        pageNum === currentBatchPage
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
        )}
      </div>

      {/* ── Move Student Batch Modal ── */}
      {moveModal.isOpen && moveModal.student && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm tracking-tight">
                Move Student to Another Batch
              </h3>
              <button 
                onClick={() => setMoveModal({ isOpen: false, student: null, targetBatchId: "" })}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Transfer <strong className="text-foreground font-medium">{moveModal.student.name}</strong> to a new batch. Their access schedule will update automatically.
            </p>

            <div className="space-y-3.5 pt-0.5">
              <div className="rounded-xl border border-border/50 p-3 bg-muted/20 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current Batch</span>
                  <span className="font-medium text-foreground">{moveModal.student.batch_name || "None"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Examination</span>
                  <span className="text-foreground">{moveModal.student.exam_name || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current End Date</span>
                  <span className="text-foreground">
                    {moveModal.student.effective_end_date 
                      ? new Date(moveModal.student.effective_end_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                      : "None"}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">
                  Select Target Batch
                </label>
                <Select
                  value={moveModal.targetBatchId ? String(moveModal.targetBatchId) : ""}
                  onValueChange={(val) => setMoveModal(prev => ({ ...prev, targetBatchId: val }))}
                >
                  <SelectTrigger className="w-full h-9 px-3 text-xs font-sans rounded-xl border border-border/80 bg-background text-foreground shadow-2xs cursor-pointer focus:ring-1 focus:ring-[#E9C46A]">
                    <SelectValue placeholder="Choose a batch…" />
                  </SelectTrigger>
                  <SelectContent className="font-sans text-xs max-h-56">
                    {(data.batches || []).map(b => {
                      const isCurrent = String(b.id) === String(moveModal.student.batch_id)
                      const endStr = b.end_date 
                        ? new Date(b.end_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                        : "No end date"
                      return (
                        <SelectItem 
                          key={b.id} 
                          value={String(b.id)} 
                          disabled={isCurrent}
                          className="text-xs font-sans py-1.5"
                        >
                          <span>{b.name} <span className="text-muted-foreground">({b.exam_name || "General"})</span> — <span className="text-muted-foreground">Ends: {endStr}</span>{isCurrent ? " (Current)" : ""}</span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {(() => {
                const targetBatch = (data.batches || []).find(b => String(b.id) === String(moveModal.targetBatchId))
                if (!targetBatch) return null
                return (
                  <div className="rounded-xl border border-border/50 p-3 bg-muted/20 text-xs space-y-1">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>New End Date</span>
                      <span className="font-medium text-foreground">
                        {targetBatch.end_date 
                          ? new Date(targetBatch.end_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) 
                          : "No scheduled end"}
                      </span>
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className="flex justify-end items-center gap-2 pt-2.5 border-t border-border/40">
              <button
                type="button"
                onClick={() => setMoveModal({ isOpen: false, student: null, targetBatchId: "" })}
                className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingMove || !moveModal.targetBatchId || String(moveModal.targetBatchId) === String(moveModal.student.batch_id)}
                onClick={() => setConfirmMoveOpen(true)}
                className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal Before Moving ── */}
      {confirmMoveOpen && moveModal.student && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left font-sans">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border/80 p-5 sm:p-6 space-y-4 text-left animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                Confirm Move
              </h3>
              <button
                type="button"
                onClick={() => setConfirmMoveOpen(false)}
                disabled={savingMove}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to move <strong className="text-foreground font-medium">{moveModal.student.name}</strong> to <strong className="text-foreground font-medium">{((data.batches || []).find(b => String(b.id) === String(moveModal.targetBatchId))?.name) || "the selected batch"}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
              <button
                type="button"
                onClick={() => setConfirmMoveOpen(false)}
                disabled={savingMove}
                className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleMoveBatch()
                  setConfirmMoveOpen(false)
                }}
                disabled={savingMove}
                className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                {savingMove ? "Moving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Subscription Modal Dialog ── */}
      {editSubscriptionModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm tracking-tight">
                Edit Subscription
              </h3>
              <button 
                onClick={() => setEditSubscriptionModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Editing subscription schedule for <strong className="text-foreground font-medium">{editSubscriptionModal.batchName}</strong>.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Start Date</label>
                <input
                  type="date"
                  value={editSubscriptionModal.startDate}
                  onChange={(e) => setEditSubscriptionModal(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#E9C46A]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">End Date</label>
                <input
                  type="date"
                  value={editSubscriptionModal.endDate}
                  onChange={(e) => setEditSubscriptionModal(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#E9C46A]"
                />
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 pt-2.5 border-t border-border/40">
              <button
                type="button"
                onClick={() => setEditSubscriptionModal(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingBatchSubscription}
                onClick={handleSaveBatchSubscription}
                className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                {savingBatchSubscription ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
