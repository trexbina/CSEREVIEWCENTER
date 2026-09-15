"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Search, ChevronDown, Check, X, Clock, Calendar, AlertCircle, Filter } from "lucide-react"
import { toast } from "@/components/ui/toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SubscriptionsView({ initialBatchFilter = "all" }) {
  const [data, setData] = useState({ metrics: {}, batches: [], students: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // all, active, expiring, expired
  const [batchFilter, setBatchFilter] = useState(initialBatchFilter)
  const [activeTab, setActiveTab] = useState("students") // students, batches

  // Modal states for moving student to another batch
  const [moveModal, setMoveModal] = useState({
    isOpen: false,
    student: null,
    targetBatchId: ""
  })
  const [savingMove, setSavingMove] = useState(false)

  // Modal states for extending batch term
  const [extendBatchModal, setExtendBatchModal] = useState({
    isOpen: false,
    batchId: null,
    batchName: "",
    currentEndDate: "",
    daysToAdd: 30,
    customDate: ""
  })
  const [savingBatchExtension, setSavingBatchExtension] = useState(false)

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

  // Filtered students
  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim()
    return (data.students || []).filter(s => {
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
  }, [data.students, search, statusFilter, batchFilter])

  // Filtered batches
  const filteredBatches = useMemo(() => {
    const q = search.toLowerCase().trim()
    return (data.batches || []).filter(b => {
      return !q || 
        (b.name || "").toLowerCase().includes(q) || 
        (b.exam_name || "").toLowerCase().includes(q)
    })
  }, [data.batches, search])

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

  const openExtendBatch = (batch) => {
    const end = batch.end_date ? new Date(batch.end_date).toISOString().split("T")[0] : ""
    setExtendBatchModal({
      isOpen: true,
      batchId: batch.id,
      batchName: batch.name,
      currentEndDate: end,
      daysToAdd: 30,
      customDate: ""
    })
  }

  const handleApplyBatchExtension = async () => {
    setSavingBatchExtension(true)
    try {
      const payload = {
        action: "EXTEND_BATCH",
        batchId: extendBatchModal.batchId,
        days: extendBatchModal.customDate ? undefined : extendBatchModal.daysToAdd,
        newEndDate: extendBatchModal.customDate || undefined
      }

      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast(`Successfully extended term for ${extendBatchModal.batchName}.`)
        setExtendBatchModal(prev => ({ ...prev, isOpen: false }))
        fetchData()
      } else {
        toast("Failed to update batch subscription.")
      }
    } catch {
      toast("Network error occurred.")
    } finally {
      setSavingBatchExtension(false)
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
      {/* ── Metric Summary Strip (Admin Dashboard Metric Strip Styling without icons) ── */}
      <div className="w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black/5 dark:divide-white/5">
          {/* 1. Total Reviewees */}
          <div
            className="flex flex-col justify-between select-none group/card cursor-pointer transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
            onClick={() => {
              setActiveTab("students")
              setStatusFilter("all")
            }}
          >
            <div className="relative z-10 px-5 py-3.5 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)] bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25">
              <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                Total Reviewees
              </span>
            </div>
            <div className="p-5 sm:p-6 pt-4 sm:pt-4">
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                {Number(data.metrics?.totalStudents || 0).toLocaleString()}
              </div>
              <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                Total student enrollments
              </p>
            </div>
          </div>

          {/* 2. Active Subscriptions */}
          <div
            className="flex flex-col justify-between select-none group/card cursor-pointer transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
            onClick={() => {
              setActiveTab("students")
              setStatusFilter("active")
            }}
          >
            <div className="relative z-10 px-5 py-3.5 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)] bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25">
              <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                Active Subscriptions
              </span>
            </div>
            <div className="p-5 sm:p-6 pt-4 sm:pt-4">
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                {Number(data.metrics?.activeCount || 0).toLocaleString()}
              </div>
              <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                Currently active review terms
              </p>
            </div>
          </div>

          {/* 3. Expiring Soon (7d) */}
          <div
            className="flex flex-col justify-between select-none group/card cursor-pointer transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
            onClick={() => {
              setActiveTab("students")
              setStatusFilter("expiring")
            }}
          >
            <div className="relative z-10 px-5 py-3.5 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)] bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25">
              <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                Expiring Soon (7d)
              </span>
            </div>
            <div className="p-5 sm:p-6 pt-4 sm:pt-4">
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                {Number(data.metrics?.expiringCount || 0).toLocaleString()}
              </div>
              <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                Ending within next 7 days
              </p>
            </div>
          </div>

          {/* 4. Expired / Inactive */}
          <div
            className="flex flex-col justify-between select-none group/card cursor-pointer transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
            onClick={() => {
              setActiveTab("students")
              setStatusFilter("expired")
            }}
          >
            <div className="relative z-10 px-5 py-3.5 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)] bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25">
              <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                Expired / Inactive
              </span>
            </div>
            <div className="p-5 sm:p-6 pt-4 sm:pt-4">
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                {Number(data.metrics?.expiredCount || 0).toLocaleString()}
              </div>
              <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                Term ended or disabled
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-tabs & Search Toolbar ── */}
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

          {activeTab === "students" && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                aria-label="Filter by status"
                className="h-9 px-3 rounded-xl border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-xs font-semibold text-[#696969] dark:text-gray-300 shadow-2xs focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20"
              >
                <div className="flex items-center gap-1.5">
                  <span>
                    {statusFilter === "all" && "All Statuses"}
                    {statusFilter === "active" && "Active Only"}
                    {statusFilter === "expiring" && "Expiring Soon (≤ 7 days)"}
                    {statusFilter === "expired" && "Expired / Inactive"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="active" className="text-xs">Active Only</SelectItem>
                <SelectItem value="expiring" className="text-xs">Expiring Soon (≤ 7 days)</SelectItem>
                <SelectItem value="expired" className="text-xs">Expired / Inactive</SelectItem>
              </SelectContent>
            </Select>
          )}

          {activeTab === "students" && data.batches?.length > 0 && (
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
                <SelectItem value="all" className="text-xs">All Batches</SelectItem>
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

      {/* ── Table Content ── */}
      {activeTab === "students" ? (
        <div className="w-full overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-card shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-[#696969]/80 dark:text-gray-400 bg-[#F2F2F2]/80 dark:bg-[#14161b]/90 backdrop-blur-xs">
                  <th className="py-2.5 px-4 font-semibold">Student</th>
                  <th className="py-2.5 px-4 font-semibold">Examination & Batch</th>
                  <th className="py-2.5 px-4 font-semibold">Scheduled End Date</th>
                  <th className="py-2.5 px-4 font-semibold">Remaining Term</th>
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
                          <p className="text-xs text-[#696969]/80 dark:text-gray-400 font-normal">{student.login_id || "—"}</p>
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
                          <span className="px-2 py-0.5 rounded border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 text-[#696969] dark:text-gray-300 font-normal">
                            {student.is_active === false ? "Disabled" : isExpired ? "Term Completed" : isExpiring ? "Expiring Soon" : "Active"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openMoveBatch(student)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#F2F2F2] hover:bg-[#E5E5E5] dark:bg-white/10 dark:hover:bg-white/20 text-[#3B3B3B] dark:text-white transition-colors cursor-pointer"
                            >
                              Move Batch
                            </button>
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
                <tr className="border-b border-black/5 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-[#696969]/80 dark:text-gray-400 bg-[#F2F2F2]/80 dark:bg-[#14161b]/90 backdrop-blur-xs">
                  <th className="py-2.5 px-4 font-semibold">Batch Name</th>
                  <th className="py-2.5 px-4 font-semibold">Target Exam</th>
                  <th className="py-2.5 px-4 font-semibold">Enrolled Students</th>
                  <th className="py-2.5 px-4 font-semibold">Scheduled End Date</th>
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
                          {endFormatted}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span className="px-2 py-0.5 rounded border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 text-[#696969] dark:text-gray-300 font-normal">
                            {isPast ? "Term Ended" : batch.status ? batch.status.charAt(0).toUpperCase() + batch.status.slice(1) : "Active"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openExtendBatch(batch)}
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#F2F2F2] hover:bg-[#E5E5E5] dark:bg-white/10 dark:hover:bg-white/20 text-[#3B3B3B] dark:text-white transition-colors cursor-pointer"
                          >
                            Extend Batch
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card border border-border/60 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm">
                Move Student to Another Batch
              </h3>
              <button 
                onClick={() => setMoveModal({ isOpen: false, student: null, targetBatchId: "" })}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Moving <strong className="text-foreground">{moveModal.student.name}</strong> will update their review term to align with the target batch schedule.
            </p>

            <div className="space-y-3 pt-1">
              <div className="rounded-xl border border-border/40 p-3 bg-muted/20 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Batch:</span>
                  <span className="font-semibold text-foreground">{moveModal.student.batch_name || "None"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Examination:</span>
                  <span className="text-foreground">{moveModal.student.exam_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current End Date:</span>
                  <span className="text-foreground">
                    {moveModal.student.effective_end_date 
                      ? new Date(moveModal.student.effective_end_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                      : "None"}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Select Target Batch
                </label>
                <select
                  value={moveModal.targetBatchId}
                  onChange={(e) => setMoveModal(prev => ({ ...prev, targetBatchId: e.target.value }))}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
                >
                  <option value="">Choose a batch…</option>
                  {(data.batches || []).map(b => {
                    const isCurrent = String(b.id) === String(moveModal.student.batch_id)
                    const endStr = b.end_date 
                      ? new Date(b.end_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                      : "No end date"
                    return (
                      <option key={b.id} value={b.id} disabled={isCurrent}>
                        {b.name} ({b.exam_name || "General"}) — Ends: {endStr} {isCurrent ? "(Current)" : ""}
                      </option>
                    )
                  })}
                </select>
              </div>

              {(() => {
                const targetBatch = (data.batches || []).find(b => String(b.id) === String(moveModal.targetBatchId))
                if (!targetBatch) return null
                return (
                  <div className="rounded-xl border border-border/40 p-3 bg-muted/20 text-xs space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>New End Date:</span>
                      <span className="font-semibold text-foreground">
                        {targetBatch.end_date 
                          ? new Date(targetBatch.end_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) 
                          : "No scheduled end"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-1">
                      Student review access will follow this batch's schedule.
                    </p>
                  </div>
                )
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <button
                type="button"
                onClick={() => setMoveModal({ isOpen: false, student: null, targetBatchId: "" })}
                className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingMove || !moveModal.targetBatchId || String(moveModal.targetBatchId) === String(moveModal.student.batch_id)}
                onClick={handleMoveBatch}
                className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 disabled:opacity-50 text-xs font-semibold px-4 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                {savingMove ? "Moving…" : "Move to Batch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Extend Batch Modal Dialog ── */}
      {extendBatchModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm">
                Extend Batch Term
              </h3>
              <button 
                onClick={() => setExtendBatchModal(prev => ({ ...prev, isOpen: false }))}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Extending schedule for <strong className="text-foreground">{extendBatchModal.batchName}</strong>.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Quick Add Days</label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 60].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExtendBatchModal(prev => ({ ...prev, daysToAdd: d, customDate: "" }))}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        extendBatchModal.daysToAdd === d && !extendBatchModal.customDate
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
                          : "border-border/60 hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      +{d} Days
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Or Specific End Date</label>
                <input
                  type="date"
                  value={extendBatchModal.customDate}
                  onChange={(e) => setExtendBatchModal(prev => ({ ...prev, customDate: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <button
                type="button"
                onClick={() => setExtendBatchModal(prev => ({ ...prev, isOpen: false }))}
                className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingBatchExtension}
                onClick={handleApplyBatchExtension}
                className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 disabled:opacity-50 text-xs font-semibold px-4 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                {savingBatchExtension ? "Saving…" : "Save Extension"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
