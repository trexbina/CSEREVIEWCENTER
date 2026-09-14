"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Search, ChevronDown, Check, X, Clock, Calendar, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/toast"

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
        (s.email || "").toLowerCase().includes(q) ||
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
      {/* ── Metric Summary Cards (Minimal & Neutral) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs text-[#696969] font-medium">Total Reviewees</p>
          <p className="text-2xl font-bold text-[#3B3B3B] dark:text-white mt-1">
            {data.metrics?.totalStudents || 0}
          </p>
        </div>

        <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs text-[#696969] font-medium">Active Subscriptions</p>
          <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mt-1">
            {data.metrics?.activeCount || 0}
          </p>
        </div>

        <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs text-[#696969] font-medium">Expiring Soon (7d)</p>
          <p className="text-2xl font-bold text-neutral-700 dark:text-neutral-200 mt-1">
            {data.metrics?.expiringCount || 0}
          </p>
        </div>

        <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs text-[#696969] font-medium">Expired / Inactive</p>
          <p className="text-2xl font-bold text-neutral-500 dark:text-neutral-400 mt-1">
            {data.metrics?.expiredCount || 0}
          </p>
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
              Reviewees ({data.students?.length || 0})
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-xs font-semibold text-[#696969] dark:text-gray-300"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="expiring">Expiring Soon (≤ 7 days)</option>
              <option value="expired">Expired / Inactive</option>
            </select>
          )}

          {activeTab === "students" && data.batches?.length > 0 && (
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-xs font-semibold text-[#696969] dark:text-gray-300 max-w-[180px]"
            >
              <option value="all">All Batches</option>
              {data.batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
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
                <tr className="border-b border-border/40 text-xs font-medium text-muted-foreground bg-[#F2F2F2]/60 dark:bg-white/5">
                  <th className="py-2.5 px-4 font-semibold text-foreground">Student</th>
                  <th className="py-2.5 px-4 font-semibold text-foreground">Examination & Batch</th>
                  <th className="py-2.5 px-4 font-semibold text-foreground">Scheduled End Date</th>
                  <th className="py-2.5 px-4 font-semibold text-foreground">Remaining Term</th>
                  <th className="py-2.5 px-4 font-semibold text-foreground">Status</th>
                  <th className="py-2.5 px-4 text-right font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 text-sm">
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
                      <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-foreground text-xs sm:text-sm">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-foreground">
                          <p className="font-medium">{student.batch_name || "—"}</p>
                          <p className="text-muted-foreground">{student.exam_name || "—"}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-foreground">
                          {dateFormatted}
                          {student.subscription_end_date && (
                            <span className="block text-[10px] text-muted-foreground italic">Custom extension</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {student.days_remaining !== null ? (
                            <span className={student.days_remaining < 0 ? "text-neutral-500 font-medium" : isExpiring ? "text-neutral-700 dark:text-neutral-200 font-medium" : "text-muted-foreground"}>
                              {student.days_remaining < 0 ? `${Math.abs(student.days_remaining)} days ago` : `${student.days_remaining} days left`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span className="px-2 py-0.5 rounded border border-border/40 text-neutral-600 dark:text-neutral-300 font-medium">
                            {student.is_active === false ? "Disabled" : isExpired ? "Term Completed" : isExpiring ? "Expiring Soon" : "Active"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openMoveBatch(student)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 text-[#3B3B3B] dark:text-white transition-colors cursor-pointer"
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
                <tr className="border-b border-border/40 text-xs font-medium text-muted-foreground bg-[#F2F2F2]/60 dark:bg-white/5">
                  <th className="py-2.5 px-4 font-semibold text-foreground">Batch Name</th>
                  <th className="py-2.5 px-4 font-semibold text-foreground">Target Exam</th>
                  <th className="py-2.5 px-4 font-semibold text-foreground">Enrolled Students</th>
                  <th className="py-2.5 px-4 font-semibold text-foreground">Scheduled End Date</th>
                  <th className="py-2.5 px-4 font-semibold text-foreground">Status</th>
                  <th className="py-2.5 px-4 text-right font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 text-sm">
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
                      <tr key={batch.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground text-xs sm:text-sm">
                          {batch.name} ({batch.target_year})
                        </td>
                        <td className="py-3 px-4 text-xs text-foreground">
                          {batch.exam_name || "—"}
                        </td>
                        <td className="py-3 px-4 text-xs text-foreground">
                          <span className="font-semibold">{batch.student_count || 0}</span> reviewees
                          {batch.expired_count > 0 && (
                            <span className="text-muted-foreground ml-1">({batch.expired_count} inactive/expired)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-foreground">
                          {endFormatted}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span className="px-2 py-0.5 rounded border border-border/40 text-neutral-600 dark:text-neutral-300 font-medium">
                            {isPast ? "Term Ended" : batch.status ? batch.status.charAt(0).toUpperCase() + batch.status.slice(1) : "Active"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openExtendBatch(batch)}
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 text-[#3B3B3B] dark:text-white transition-colors cursor-pointer"
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
