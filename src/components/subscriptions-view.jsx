"use client"

import React, { useState, useEffect, useMemo } from "react"
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
  const [data, setData] = useState({ metrics: {}, batches: [], students: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // all, active, expiring, expired
  const [batchFilter, setBatchFilter] = useState(initialBatchFilter)
  const [activeTab, setActiveTab] = useState("students") // students, batches

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

      return matchSearch && matchStatus && matchBatch
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
  }, [data.students, search, statusFilter, batchFilter, studentSortField, studentSortDir])

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

      const isPast = b.end_date ? new Date(b.end_date) < now : false
      const endDate = b.end_date ? new Date(b.end_date) : null
      const isExpiring = endDate && !isPast && endDate <= thirtyDaysLater

      const matchStatus = 
        statusFilter === "all" ? true :
        statusFilter === "active" ? (!isPast && b.status !== "inactive") :
        statusFilter === "expiring" ? isExpiring :
        statusFilter === "expired" ? (isPast || b.status === "inactive") : true

      return matchSearch && matchBatch && matchStatus
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
  }, [data.batches, search, batchFilter, statusFilter, batchSortField, batchSortDir])

  // Selected batch for label/subtext display
  const selectedBatch = useMemo(() => {
    if (batchFilter === "all") return null
    return (data.batches || []).find(b => String(b.id) === String(batchFilter))
  }, [data.batches, batchFilter])

  // Unified dynamic metrics reflecting current tab and active filters
  const currentMetrics = useMemo(() => {
    if (activeTab === "students") {
      const pool = (data.students || []).filter(s => {
        return batchFilter === "all" ? true : String(s.batch_id) === String(batchFilter)
      })

      const total = pool.length
      const active = pool.filter(s => s.computed_status === "active" || s.computed_status === "expiring").length
      const expiring = pool.filter(s => s.computed_status === "expiring").length
      const expired = pool.filter(s => s.computed_status === "expired" || s.computed_status === "disabled").length

      return {
        totalLabel: "Total Reviewees",
        totalSubtext: selectedBatch ? `In ${selectedBatch.name}` : "All enrolled students",
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
        return batchFilter === "all" ? true : String(b.id) === String(batchFilter)
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

      return {
        totalLabel: "Total Batches",
        totalSubtext: selectedBatch ? selectedBatch.name : "All review batches",
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
  }, [data.students, data.batches, batchFilter, activeTab, selectedBatch])

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

  return (
    <div className="space-y-6">
      {/* ── Sub-tabs & Search Toolbar (Moved above metric summary strip) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#F2F2F2]/80 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
            <button
              onClick={() => setActiveTab("students")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === "students"
                  ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                  : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B]"
              }`}
            >
              Reviewees
            </button>
            <button
              onClick={() => setActiveTab("batches")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === "batches"
                  ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                  : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B]"
              }`}
            >
              Batches ({data.batches?.length || 0})
            </button>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              aria-label="Filter by status"
              className="h-9 px-3 rounded-xl border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-xs font-semibold text-[#696969] dark:text-gray-300 shadow-2xs focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20"
            >
              <div className="flex items-center gap-1.5">
                <span>
                  {statusFilter === "all" && "All Statuses"}
                  {statusFilter === "active" && "Active Only"}
                  {statusFilter === "expiring" && (activeTab === "students" ? "Expiring Soon (≤ 7 days)" : "Expiring Soon (≤ 30 days)")}
                  {statusFilter === "expired" && (activeTab === "students" ? "Expired / Inactive" : "Term Ended / Inactive")}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="active" className="text-xs">Active Only</SelectItem>
              <SelectItem value="expiring" className="text-xs">{activeTab === "students" ? "Expiring Soon (≤ 7 days)" : "Expiring Soon (≤ 30 days)"}</SelectItem>
              <SelectItem value="expired" className="text-xs">{activeTab === "students" ? "Expired / Inactive" : "Term Ended / Inactive"}</SelectItem>
            </SelectContent>
          </Select>

          {data.batches?.length > 0 && (
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger
                aria-label="Filter by batch"
                className="h-9 px-3 rounded-xl border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-xs font-semibold text-[#696969] dark:text-gray-300 max-w-[200px] shadow-2xs focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">
                    {batchFilter === "all"
                      ? "All Batches"
                      : data.batches.find((b) => String(b.id) === String(batchFilter))?.name || "All Batches"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl max-w-sm">
                <SelectItem value="all" className="text-xs font-medium">All Batches</SelectItem>
                {data.batches.map(b => (
                  <SelectItem key={b.id} value={String(b.id)} className="text-xs truncate">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#696969]" />
          <input
            type="search"
            placeholder="Search subscriptions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/60 focus:outline-none focus:ring-1 focus:ring-neutral-400"
          />
        </div>
      </div>

      {/* ── Metric Summary Strip ("div full rounded") ── */}
      <div className="w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black/5 dark:divide-white/5">
          {/* 1. Total */}
          <div
            className={`flex flex-col justify-between select-none group/card cursor-pointer transition-colors ${
              statusFilter === "all" ? "bg-black/[0.03] dark:bg-white/[0.06]" : "hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
            }`}
            onClick={() => setStatusFilter("all")}
          >
            <div className="relative z-10 px-4 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)] bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300 select-none">
                {currentMetrics.totalLabel}
              </span>
            </div>
            <div className="p-4 sm:p-5 pt-3 sm:pt-3">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                {Number(currentMetrics.totalCount || 0).toLocaleString()}
              </div>
              <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500 font-normal select-none truncate">
                {currentMetrics.totalSubtext}
              </p>
            </div>
          </div>

          {/* 2. Active */}
          <div
            className={`flex flex-col justify-between select-none group/card cursor-pointer transition-colors ${
              statusFilter === "active" ? "bg-black/[0.03] dark:bg-white/[0.06]" : "hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
            }`}
            onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
          >
            <div className="relative z-10 px-4 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)] bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300 select-none">
                {currentMetrics.activeLabel}
              </span>
            </div>
            <div className="p-4 sm:p-5 pt-3 sm:pt-3">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                {Number(currentMetrics.activeCount || 0).toLocaleString()}
              </div>
              <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500 font-normal select-none truncate">
                {currentMetrics.activeSubtext}
              </p>
            </div>
          </div>

          {/* 3. Expiring Soon */}
          <div
            className={`flex flex-col justify-between select-none group/card cursor-pointer transition-colors ${
              statusFilter === "expiring" ? "bg-black/[0.03] dark:bg-white/[0.06]" : "hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
            }`}
            onClick={() => setStatusFilter(statusFilter === "expiring" ? "all" : "expiring")}
          >
            <div className="relative z-10 px-4 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)] bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300 select-none">
                {currentMetrics.expiringLabel}
              </span>
            </div>
            <div className="p-4 sm:p-5 pt-3 sm:pt-3">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                {Number(currentMetrics.expiringCount || 0).toLocaleString()}
              </div>
              <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500 font-normal select-none truncate">
                {currentMetrics.expiringSubtext}
              </p>
            </div>
          </div>

          {/* 4. Expired */}
          <div
            className={`flex flex-col justify-between select-none group/card cursor-pointer transition-colors ${
              statusFilter === "expired" ? "bg-black/[0.03] dark:bg-white/[0.06]" : "hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
            }`}
            onClick={() => setStatusFilter(statusFilter === "expired" ? "all" : "expired")}
          >
            <div className="relative z-10 px-4 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)] bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300 select-none">
                {currentMetrics.expiredLabel}
              </span>
            </div>
            <div className="p-4 sm:p-5 pt-3 sm:pt-3">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                {Number(currentMetrics.expiredCount || 0).toLocaleString()}
              </div>
              <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500 font-normal select-none truncate">
                {currentMetrics.expiredSubtext}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table Content ── */}
      {activeTab === "students" ? (
        <div className="w-full overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-card shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/10 text-xs font-semibold text-[#696969]/80 dark:text-gray-400 bg-[#F2F2F2]/80 dark:bg-[#14161b]/90 backdrop-blur-xs">
                  <th className="py-2.5 px-4 font-semibold">
                    <TableSortButton label="Student" field="name" sortField={studentSortField} sortDir={studentSortDir} onSort={handleStudentSort} type="alpha" />
                  </th>
                  <th className="py-2.5 px-4 font-semibold">
                    <TableSortButton label="Examination & Batch" field="batch_name" sortField={studentSortField} sortDir={studentSortDir} onSort={handleStudentSort} type="alpha" />
                  </th>
                  <th className="py-2.5 px-4 font-semibold">
                    <TableSortButton label="Scheduled End Date" field="effective_end_date" sortField={studentSortField} sortDir={studentSortDir} onSort={handleStudentSort} type="date" />
                  </th>
                  <th className="py-2.5 px-4 font-semibold">
                    <TableSortButton label="Remaining Term" field="days_remaining" sortField={studentSortField} sortDir={studentSortDir} onSort={handleStudentSort} type="number" />
                  </th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                      Loading subscriptions…
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                      No student subscriptions match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => {
                    const isExpired = student.computed_status === "expired" || student.computed_status === "disabled"
                    const isExpiring = student.computed_status === "expiring"
                    const dateFormatted = student.effective_end_date 
                      ? new Date(student.effective_end_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                      : "No scheduled end"

                    return (
                      <tr key={student.id} className="transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#696969] dark:text-gray-300 text-xs sm:text-sm">{student.name}</p>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <p className="font-medium text-[#3B3B3B] dark:text-gray-200">{student.batch_name || "—"}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-400 font-normal">{student.exam_name || "—"}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#696969] dark:text-gray-300">
                          {dateFormatted}
                          {student.subscription_end_date && (
                            <span className="block text-[10px] text-gray-400 dark:text-gray-400 italic">Custom extension</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {student.days_remaining !== null ? (
                            <span className={student.days_remaining < 0 ? "text-neutral-500 font-medium" : isExpiring ? "text-neutral-700 dark:text-neutral-200 font-medium" : "text-[#696969] dark:text-gray-400 font-normal"}>
                              {student.days_remaining < 0 ? `${Math.abs(student.days_remaining)} days ago` : `${student.days_remaining} days left`}
                            </span>
                          ) : (
                            <span className="text-[#696969]/60 dark:text-gray-500 font-normal">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {student.is_active === false ? (
                            <span className="font-medium text-rose-600 dark:text-rose-400">Disabled</span>
                          ) : isExpired ? (
                            <span className="font-medium text-gray-500 dark:text-gray-400">Term Completed</span>
                          ) : isExpiring ? (
                            <span className="font-medium text-[#C07028] dark:text-[#D48946]">Expiring Soon</span>
                          ) : (
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">Active</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => openMoveBatch(student)}
                                    className="h-7 w-7 rounded-lg flex items-center justify-center text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                    aria-label="Move Batch"
                                  >
                                    <ArrowRightLeft className="h-3.5 w-3.5" />
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
        </div>
      ) : (
        /* ── Batches Tab ── */
        <div className="w-full overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-card shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/10 text-xs font-semibold text-[#696969]/80 dark:text-gray-400 bg-[#F2F2F2]/80 dark:bg-[#14161b]/90 backdrop-blur-xs">
                  <th className="py-2.5 px-4 font-semibold">
                    <TableSortButton label="Batch Name" field="name" sortField={batchSortField} sortDir={batchSortDir} onSort={handleBatchSort} type="alpha" />
                  </th>
                  <th className="py-2.5 px-4 font-semibold">
                    <TableSortButton label="Target Exam" field="exam_name" sortField={batchSortField} sortDir={batchSortDir} onSort={handleBatchSort} type="alpha" />
                  </th>
                  <th className="py-2.5 px-4 font-semibold">
                    <TableSortButton label="Enrolled Students" field="student_count" sortField={batchSortField} sortDir={batchSortDir} onSort={handleBatchSort} type="number" />
                  </th>
                  <th className="py-2.5 px-4 font-semibold">
                    <TableSortButton label="Scheduled End Date" field="end_date" sortField={batchSortField} sortDir={batchSortDir} onSort={handleBatchSort} type="date" />
                  </th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                      No batches found.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map(batch => {
                    const endFormatted = batch.end_date 
                      ? new Date(batch.end_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                      : "No scheduled end"
                    const isPast = batch.end_date ? new Date(batch.end_date) < new Date(new Date().setHours(0,0,0,0)) : false

                    return (
                      <tr key={batch.id} className="transition-colors">
                        <td className="py-3 px-4 font-medium text-[#3B3B3B] dark:text-gray-200 text-xs sm:text-sm">
                          {batch.name} ({batch.target_year})
                        </td>
                        <td className="py-3 px-4 text-xs text-[#696969] dark:text-gray-300">
                          {batch.exam_name || "—"}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#696969] dark:text-gray-300">
                          <span className="font-semibold text-[#3B3B3B] dark:text-white">{batch.student_count || 0}</span> reviewees
                          {batch.expired_count > 0 && (
                            <span className="text-[#696969]/70 dark:text-gray-500 ml-1">({batch.expired_count} inactive/expired)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#696969] dark:text-gray-300">
                          <div>{endFormatted}</div>
                          {batch.start_date && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              Start: {new Date(batch.start_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {isPast ? (
                            <span className="font-medium text-gray-500 dark:text-gray-400">Term Ended</span>
                          ) : batch.status === "inactive" ? (
                            <span className="font-medium text-rose-600 dark:text-rose-400">Inactive</span>
                          ) : (
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">Active</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openEditSubscription(batch)}
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#F2F2F2] hover:bg-[#E5E5E5] dark:bg-white/10 dark:hover:bg-white/20 text-[#3B3B3B] dark:text-white transition-colors cursor-pointer"
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
        </div>
      )}

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
