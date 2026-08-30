"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Check, X, Eye, Trash, Pencil } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import ConfirmDeleteModal from "@/components/confirm-delete-modal"

export function PreRegistrationsTab() {
  const router = useRouter()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedIds, setSelectedIds] = useState([])

  // Modal Review & Edit States
  const [selectedApp, setSelectedApp] = useState(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [customPassword, setCustomPassword] = useState("Student@123")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState(null)

  // Dropdown reference data for edit mode
  const [dropdownData, setDropdownData] = useState({
    examinations: [],
    batches: [],
    programs: [],
    majors: [],
    schools: [],
    academic_courses: [],
  })

  // Delete Modal States
  const [deleteTarget, setDeleteTarget] = useState(null) // { ids: [...], name: '...' }
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function loadApplications() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/pre-registrations")
      if (res.ok) {
        const data = await res.json()
        setApplications(data.preRegistrations || [])
      }
    } catch (err) {
      console.error("Failed to load pre-registrations:", err)
    } finally {
      setLoading(false)
    }
  }

  async function loadDropdowns() {
    try {
      const res = await fetch("/api/public/pre-register")
      if (res.ok) {
        const data = await res.json()
        setDropdownData(data)
      }
    } catch (err) {
      console.error("Failed to load dropdown options:", err)
    }
  }

  useEffect(() => {
    loadApplications()
    loadDropdowns()
  }, [])

  function openReviewModal(app) {
    setSelectedApp(app)
    setIsEditing(false)
    setEditForm({
      first_name: app.first_name || "",
      middle_name: app.middle_name || "",
      last_name: app.last_name || "",
      suffix: app.suffix || "",
      email: app.email || "",
      phone: app.phone || "",
      birthday: app.birthday ? new Date(app.birthday).toISOString().split("T")[0] : "",
      gender: app.gender || "",
      address: app.address || "",
      city: app.city || "",
      province: app.province || "",
      zip_code: app.zip_code || "",
      school_id: app.school_id ? app.school_id.toString() : "",
      school: app.school || "",
      academic_course_id: app.academic_course_id ? app.academic_course_id.toString() : "",
      course: app.course || "",
      year_graduated: app.year_graduated || "",
      highest_education: app.highest_education || "",
      exam_id: app.exam_id ? app.exam_id.toString() : "",
      program_id: app.program_id ? app.program_id.toString() : "",
      major_id: app.major_id ? app.major_id.toString() : "",
      batch_id: app.batch_id ? app.batch_id.toString() : "",
    })
    setActionMsg(null)
    setReviewOpen(true)
  }

  async function handleSaveEdit() {
    if (!selectedApp) return
    setActionLoading(true)
    setActionMsg(null)
    try {
      const selectedSchoolObj = dropdownData.schools.find((s) => s.id.toString() === editForm.school_id)
      const selectedCourseObj = dropdownData.academic_courses.find((c) => c.id.toString() === editForm.academic_course_id)

      const payload = {
        id: selectedApp.id,
        action: "UPDATE",
        first_name: editForm.first_name,
        middle_name: editForm.middle_name,
        last_name: editForm.last_name,
        suffix: editForm.suffix,
        email: editForm.email,
        phone: editForm.phone,
        birthday: editForm.birthday || null,
        gender: editForm.gender || null,
        address: editForm.address,
        city: editForm.city,
        province: editForm.province,
        zip_code: editForm.zip_code,
        school: selectedSchoolObj ? selectedSchoolObj.name : editForm.school,
        school_id: editForm.school_id || null,
        course: selectedCourseObj ? selectedCourseObj.name : editForm.course,
        academic_course_id: editForm.academic_course_id || null,
        year_graduated: editForm.year_graduated,
        highest_education: editForm.highest_education,
        exam_id: editForm.exam_id || null,
        program_id: editForm.program_id || null,
        major_id: editForm.major_id || null,
        batch_id: editForm.batch_id || null,
      }

      const res = await fetch("/api/admin/pre-registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok) {
        setActionMsg({ type: "success", text: "Pre-registration updated successfully." })
        setIsEditing(false)
        await loadApplications()
        router.refresh()
        // Update currently selected app
        if (data.application) {
          const updated = {
            ...selectedApp,
            ...data.application,
            exam_name: dropdownData.examinations.find((e) => e.id.toString() === editForm.exam_id)?.name || selectedApp.exam_name,
            batch_name: dropdownData.batches.find((b) => b.id.toString() === editForm.batch_id)?.name || selectedApp.batch_name,
            program_name: dropdownData.programs.find((p) => p.id.toString() === editForm.program_id)?.name || selectedApp.program_name,
            major_name: dropdownData.majors.find((m) => m.id.toString() === editForm.major_id)?.name || selectedApp.major_name,
            school_name: selectedSchoolObj?.name || editForm.school || selectedApp.school_name,
            academic_course_name: selectedCourseObj?.name || editForm.course || selectedApp.academic_course_name,
          }
          setSelectedApp(updated)
        }
      } else {
        setActionMsg({ type: "error", text: data.error || "Failed to update." })
      }
    } catch {
      setActionMsg({ type: "error", text: "Network error occurred." })
    } finally {
      setActionLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : app.status === statusFilter

      const q = search.toLowerCase().trim()
      const fullName = `${app.first_name || ""} ${app.last_name || ""}`.toLowerCase()
      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        app.email?.toLowerCase().includes(q) ||
        app.exam_name?.toLowerCase().includes(q) ||
        app.school_name?.toLowerCase().includes(q)

      return matchesStatus && matchesSearch
    })
  }, [applications, search, statusFilter])

  // Select all logic
  const isAllSelected = filtered.length > 0 && filtered.every((app) => selectedIds.includes(app.id))
  const isSomeSelected = filtered.some((app) => selectedIds.includes(app.id))

  function handleToggleAll() {
    if (isAllSelected) {
      const filteredIdSet = new Set(filtered.map((a) => a.id))
      setSelectedIds((prev) => prev.filter((id) => !filteredIdSet.has(id)))
    } else {
      const allFilteredIds = filtered.map((a) => a.id)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])))
    }
  }

  function handleToggleRow(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  async function handleApprove(appId) {
    setActionLoading(true)
    setActionMsg(null)
    try {
      const res = await fetch("/api/admin/pre-registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: appId,
          action: "APPROVE",
          customPassword: customPassword,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionMsg({
          type: "success",
          text: `Approved! Account created with password: ${data.initialPassword}`,
        })
        loadApplications()
        router.refresh()
      } else {
        setActionMsg({ type: "error", text: data.error || "Failed to approve." })
      }
    } catch {
      setActionMsg({ type: "error", text: "Network error occurred." })
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject(appId) {
    if (!confirm("Are you sure you want to reject this pre-registration?")) return
    setActionLoading(true)
    setActionMsg(null)
    try {
      const res = await fetch("/api/admin/pre-registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appId, action: "REJECT" }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionMsg({ type: "success", text: "Application marked as REJECTED." })
        loadApplications()
        router.refresh()
      } else {
        setActionMsg({ type: "error", text: data.error || "Failed to reject." })
      }
    } catch {
      setActionMsg({ type: "error", text: "Network error occurred." })
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget?.ids || deleteTarget.ids.length === 0) return
    setDeleteLoading(true)
    try {
      const res = await fetch("/api/admin/pre-registrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: deleteTarget.ids }),
      })
      if (res.ok) {
        setSelectedIds((prev) => prev.filter((id) => !deleteTarget.ids.includes(id)))
        setDeleteModalOpen(false)
        setDeleteTarget(null)
        loadApplications()
        router.refresh()
      }
    } catch (err) {
      console.error("Delete failed:", err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const pendingListCount = applications.filter((a) => a.status === "PENDING").length
  const approvedListCount = applications.filter((a) => a.status === "APPROVED").length
  const rejectedListCount = applications.filter((a) => a.status === "REJECTED").length

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        {/* Controls / Filter row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 flex-1 min-w-[260px]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#696969]/70 pointer-events-none" />
              <input
                type="search"
                placeholder="Search applicant name, email, exam..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/60 focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs"
              />
            </div>

            {/* Status Filter Dropdown */}
            <div className="w-44 shrink-0">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-full rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white px-3.5 shadow-2xs cursor-pointer">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 text-xs shadow-xl">
                  <SelectItem value="ALL" className="text-xs py-1.5 cursor-pointer">
                    All Statuses ({applications.length})
                  </SelectItem>
                  <SelectItem value="PENDING" className="text-xs py-1.5 cursor-pointer">
                    Pending ({pendingListCount})
                  </SelectItem>
                  <SelectItem value="APPROVED" className="text-xs py-1.5 cursor-pointer">
                    Approved ({approvedListCount})
                  </SelectItem>
                  <SelectItem value="REJECTED" className="text-xs py-1.5 cursor-pointer">
                    Rejected ({rejectedListCount})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right Action buttons: Deselect All & Delete Selected */}
          <div className="flex items-center gap-2">
            {filtered.length > 0 && (
              <button
                type="button"
                onClick={handleToggleAll}
                className="px-3.5 h-9 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 border border-black/5 dark:border-white/10 transition-all shadow-2xs cursor-pointer"
              >
                {isAllSelected ? "Deselect All" : `Select All (${filtered.length})`}
              </button>
            )}

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget({
                    ids: selectedIds,
                    name: `${selectedIds.length} pre-registration${selectedIds.length > 1 ? "s" : ""}`,
                  })
                  setDeleteModalOpen(true)
                }}
                className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 hover:bg-rose-100 transition-all shadow-2xs cursor-pointer"
              >
                Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Flat Data Table */}
        <div className="w-full overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-card shadow-2xs">
          <div className="max-h-[920px] overflow-y-auto">
            <table className="w-full text-left border-collapse" aria-label="Pre-registrations list">
              <thead className="sticky top-0 z-10 bg-[#F2F2F2]/80 dark:bg-[#14161b]/90 backdrop-blur-xs border-b border-black/5 dark:border-white/10">
                <tr className="h-11 text-xs font-semibold uppercase tracking-wider text-[#696969]/80 dark:text-gray-400">
                  <th className="w-12 px-4 text-center" scope="col">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = !isAllSelected && isSomeSelected
                        }
                      }}
                      onChange={handleToggleAll}
                      className="h-4 w-4 rounded border-black/15 cursor-pointer accent-[#E9C46A] align-middle"
                      aria-label="Select all pre-registrations"
                    />
                  </th>
                  <th className="px-4 py-2.5" scope="col">Applicant</th>
                  <th className="px-4 py-2.5" scope="col">Contact</th>
                  <th className="px-4 py-2.5" scope="col">Target Review</th>
                  <th className="px-4 py-2.5" scope="col">School / Course</th>
                  <th className="px-4 py-2.5" scope="col">Submitted</th>
                  <th className="px-4 py-2.5" scope="col">Status</th>
                  <th className="px-4 py-2.5 text-right pr-6" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm font-medium text-[#696969]">
                      Loading pre-registration records…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm font-medium text-[#696969]">
                      No pre-registration applications found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((app) => {
                    const isSelected = selectedIds.includes(app.id)
                    const fullName = [app.first_name, app.middle_name, app.last_name, app.suffix]
                      .filter(Boolean)
                      .join(" ")
                    return (
                      <tr
                        key={app.id}
                        className={`h-14 transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02] ${
                          isSelected ? "bg-[#F2F2F2]/50 dark:bg-white/5" : ""
                        }`}
                      >
                        <td className="w-12 px-4 text-center align-middle">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(app.id)}
                            className="h-4 w-4 rounded border-black/15 cursor-pointer accent-[#E9C46A] align-middle"
                            aria-label={`Select ${fullName}`}
                          />
                        </td>
                        <td className="px-4 align-middle">
                          <button
                            type="button"
                            onClick={() => openReviewModal(app)}
                            className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#60A5FA] dark:hover:text-[#93C5FD] hover:underline transition-colors cursor-pointer text-left"
                          >
                            {fullName}
                          </button>
                          <div className="text-xs text-[#696969] dark:text-gray-400">{app.gender || "—"}</div>
                        </td>
                        <td className="px-4 align-middle text-sm text-[#696969] dark:text-gray-300 font-normal">
                          <div className="text-[#3B3B3B] dark:text-white font-medium">{app.email}</div>
                          <div className="text-xs text-[#696969] dark:text-gray-400">{app.phone || "—"}</div>
                        </td>
                        <td className="px-4 align-middle text-sm">
                          <div className="font-medium text-[#3B3B3B] dark:text-white">{app.exam_name || "—"}</div>
                          <div className="text-xs text-[#696969] dark:text-gray-400">
                            {app.batch_name ? `Batch: ${app.batch_name}` : app.program_name || "—"}
                          </div>
                        </td>
                        <td className="px-4 max-w-[220px] align-middle text-sm">
                          <div className="text-[#3B3B3B] dark:text-white truncate font-medium">{app.school_name || "—"}</div>
                          <div className="text-xs text-[#696969] dark:text-gray-400 truncate">{app.academic_course_name || "—"}</div>
                        </td>
                        <td className="px-4 text-sm text-[#696969] dark:text-gray-400 font-normal whitespace-nowrap align-middle">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 whitespace-nowrap align-middle">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              app.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/30"
                                : app.status === "REJECTED"
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/30"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/30"
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="px-4 text-right pr-6 align-middle">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => openReviewModal(app)}
                                  className="h-8 w-8 rounded-xl flex items-center justify-center text-[#696969] hover:text-[#3B3B3B] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">Review Details</p>
                              </TooltipContent>
                            </Tooltip>

                            {app.status === "PENDING" && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleApprove(app.id)}
                                      disabled={actionLoading}
                                      className="h-8 w-8 rounded-xl flex items-center justify-center text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">Quick Approve</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleReject(app.id)}
                                      disabled={actionLoading}
                                      className="h-8 w-8 rounded-xl flex items-center justify-center text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">Reject</p>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => {
                                    setDeleteTarget({ ids: [app.id], name: fullName })
                                    setDeleteModalOpen(true)
                                  }}
                                  className="h-8 w-8 rounded-xl flex items-center justify-center text-[#696969] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">Delete Record</p>
                              </TooltipContent>
                            </Tooltip>
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

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setDeleteTarget(null)
        }}
        onConfirm={handleDeleteConfirm}
        itemName={deleteTarget?.name}
        title={
          deleteTarget?.ids?.length > 1
            ? "Delete Pre-Registrations"
            : "Delete Pre-Registration"
        }
        description={
          deleteTarget?.ids?.length > 1
            ? `Are you sure you want to delete ${deleteTarget.ids.length} pre-registration records? This action cannot be undone.`
            : `Are you sure you want to delete the pre-registration for "${deleteTarget?.name}"? This action cannot be undone.`
        }
        loading={deleteLoading}
      />

      {/* Review & Details Dialog */}
      {selectedApp && (
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto p-6 sm:p-7 bg-card border border-border/80 rounded-2xl shadow-xl">
            <DialogHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <DialogTitle className="text-base font-bold uppercase tracking-wider text-foreground">
                    {isEditing ? "Edit Pre-Registration" : "Application Review"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-1">
                    Submitted on {new Date(selectedApp.created_at).toLocaleString()}
                  </DialogDescription>
                </div>
                {selectedApp.status === "PENDING" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(!isEditing)
                      setActionMsg(null)
                    }}
                    className="gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{isEditing ? "Cancel Edit" : "Edit Form"}</span>
                  </Button>
                )}
              </div>
            </DialogHeader>

            {actionMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-medium text-center ${
                  actionMsg.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                {actionMsg.text}
              </div>
            )}

            {isEditing ? (
              /* ── EDIT MODE FORM ── */
              <div className="space-y-6 text-sm py-2">
                {/* Personal Details */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                    Applicant Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">First Name</label>
                      <Input
                        value={editForm.first_name}
                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                        className="text-sm h-9 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">Middle Name</label>
                      <Input
                        value={editForm.middle_name}
                        onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })}
                        className="text-sm h-9 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">Last Name</label>
                      <Input
                        value={editForm.last_name}
                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                        className="text-sm h-9 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">Suffix</label>
                      <Input
                        value={editForm.suffix}
                        onChange={(e) => setEditForm({ ...editForm, suffix: e.target.value })}
                        placeholder="Jr., III, etc."
                        className="text-sm h-9 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">Email Address</label>
                      <Input
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="text-sm h-9 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">Contact Number</label>
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="text-sm h-9 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">Gender</label>
                      <Select
                        value={editForm.gender}
                        onValueChange={(val) => setEditForm({ ...editForm, gender: val })}
                      >
                        <SelectTrigger className="text-sm h-9 rounded-xl w-full">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">Birthday</label>
                      <Input
                        type="date"
                        value={editForm.birthday}
                        onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                        className="text-sm h-9 rounded-xl"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">Address</label>
                      <Input
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        placeholder="Street Address, City, Province"
                        className="text-sm h-9 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Details */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                    Academic Background
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">School / University</label>
                      <Select
                        value={editForm.school_id || "custom"}
                        onValueChange={(val) => {
                          if (val === "custom") {
                            setEditForm({ ...editForm, school_id: "", school: "" })
                          } else {
                            const found = dropdownData.schools.find((s) => s.id.toString() === val)
                            setEditForm({ ...editForm, school_id: val, school: found?.name || "" })
                          }
                        }}
                      >
                        <SelectTrigger className="text-sm h-9 rounded-xl w-full">
                          <SelectValue placeholder="Select School" />
                        </SelectTrigger>
                        <SelectContent>
                          {dropdownData.schools.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Other / Custom School</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">Course / Degree</label>
                      <Select
                        value={editForm.academic_course_id || "custom"}
                        onValueChange={(val) => {
                          if (val === "custom") {
                            setEditForm({ ...editForm, academic_course_id: "", course: "" })
                          } else {
                            const found = dropdownData.academic_courses.find((c) => c.id.toString() === val)
                            setEditForm({ ...editForm, academic_course_id: val, course: found?.name || "" })
                          }
                        }}
                      >
                        <SelectTrigger className="text-sm h-9 rounded-xl w-full">
                          <SelectValue placeholder="Select Course" />
                        </SelectTrigger>
                        <SelectContent>
                          {dropdownData.academic_courses.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Other / Custom Course</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">Year Graduated</label>
                      <Input
                        value={editForm.year_graduated}
                        onChange={(e) => setEditForm({ ...editForm, year_graduated: e.target.value })}
                        className="text-sm h-9 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">Highest Education</label>
                      <Input
                        value={editForm.highest_education}
                        onChange={(e) => setEditForm({ ...editForm, highest_education: e.target.value })}
                        className="text-sm h-9 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Target Review Details (including Batch assignment) */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                    Target Review & Batch Assignment
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">Target Examination</label>
                      <Select
                        value={editForm.exam_id}
                        onValueChange={(val) =>
                          setEditForm({
                            ...editForm,
                            exam_id: val,
                            program_id: "",
                            major_id: "",
                            batch_id: "",
                          })
                        }
                      >
                        <SelectTrigger className="text-sm h-9 rounded-xl w-full">
                          <SelectValue placeholder="Select Exam" />
                        </SelectTrigger>
                        <SelectContent>
                          {dropdownData.examinations.map((e) => (
                            <SelectItem key={e.id} value={e.id.toString()}>
                              {e.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">
                        Assigned Batch / Term
                      </label>
                      <Select
                        value={editForm.batch_id}
                        onValueChange={(val) => setEditForm({ ...editForm, batch_id: val })}
                      >
                        <SelectTrigger className="text-sm h-9 rounded-xl w-full">
                          <SelectValue placeholder="Select Batch to Assign" />
                        </SelectTrigger>
                        <SelectContent>
                          {dropdownData.batches
                            .filter((b) => !editForm.exam_id || b.exam_id?.toString() === editForm.exam_id)
                            .map((b) => (
                              <SelectItem key={b.id} value={b.id.toString()}>
                                {b.name} {b.target_year ? `(${b.target_year})` : ""}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">Program / Level</label>
                      <Select
                        value={editForm.program_id}
                        onValueChange={(val) => setEditForm({ ...editForm, program_id: val, major_id: "" })}
                      >
                        <SelectTrigger className="text-sm h-9 rounded-xl w-full">
                          <SelectValue placeholder="Select Program" />
                        </SelectTrigger>
                        <SelectContent>
                          {dropdownData.programs
                            .filter((p) => !editForm.exam_id || p.exam_id?.toString() === editForm.exam_id)
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id.toString()}>
                                {p.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">Major / Specialization</label>
                      <Select
                        value={editForm.major_id}
                        onValueChange={(val) => setEditForm({ ...editForm, major_id: val })}
                      >
                        <SelectTrigger className="text-sm h-9 rounded-xl w-full">
                          <SelectValue placeholder="Select Major" />
                        </SelectTrigger>
                        <SelectContent>
                          {dropdownData.majors
                            .filter((m) => !editForm.program_id || m.program_id?.toString() === editForm.program_id)
                            .map((m) => (
                              <SelectItem key={m.id} value={m.id.toString()}>
                                {m.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── VIEW / READ-ONLY MODE ── */
              <div className="space-y-6 text-sm py-2">
                {/* Personal Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                    Applicant Information
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3.5">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Full Name</span>
                      <span className="font-semibold text-foreground leading-normal">
                        {[selectedApp.first_name, selectedApp.middle_name, selectedApp.last_name, selectedApp.suffix]
                          .filter(Boolean)
                          .join(" ") || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Email</span>
                      <span className="font-semibold text-foreground leading-normal break-all">{selectedApp.email}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Contact Number</span>
                      <span className="font-semibold text-foreground leading-normal">{selectedApp.phone || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Birthday</span>
                      <span className="font-semibold text-foreground leading-normal">
                        {selectedApp.birthday
                          ? new Date(selectedApp.birthday).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Gender</span>
                      <span className="font-semibold text-foreground leading-normal">{selectedApp.gender || "—"}</span>
                    </div>
                    <div className="sm:col-span-3">
                      <span className="text-xs text-muted-foreground block mb-0.5">Address</span>
                      <span className="font-semibold text-foreground leading-normal">
                        {[selectedApp.address, selectedApp.city, selectedApp.province, selectedApp.zip_code]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Educational Background */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                    Academic Background
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3.5">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">School / University</span>
                      <span className="font-semibold text-foreground leading-normal">{selectedApp.school_name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Course / Degree</span>
                      <span className="font-semibold text-foreground leading-normal">{selectedApp.academic_course_name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Year Graduated</span>
                      <span className="font-semibold text-foreground leading-normal">{selectedApp.year_graduated || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Highest Education</span>
                      <span className="font-semibold text-foreground leading-normal">{selectedApp.highest_education || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Review Program Selection */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                    Target Review Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3.5">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Examination</span>
                      <span className="font-semibold text-foreground leading-normal">{selectedApp.exam_name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Batch</span>
                      <span className="font-semibold text-foreground leading-normal">{selectedApp.batch_name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Program</span>
                      <span className="font-semibold text-foreground leading-normal">{selectedApp.program_name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Major</span>
                      <span className="font-semibold text-foreground leading-normal">{selectedApp.major_name || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Temporary Password for approval */}
                {selectedApp.status === "PENDING" && (
                  <div className="pt-3 border-t border-border/40 space-y-1.5">
                    <label className="text-xs font-semibold text-foreground block">
                      Initial Student Account Password:
                    </label>
                    <Input
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      placeholder="Student@123"
                      className="text-sm h-9 rounded-xl max-w-xs border-border"
                    />
                    <span className="text-xs text-muted-foreground block mt-1">
                      This password will be assigned to their new student account upon approval.
                    </span>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="border-t border-border/60 pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-xs font-medium cursor-pointer"
                >
                  Close
                </Button>
              </DialogClose>

              {isEditing ? (
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={actionLoading}
                    onClick={handleSaveEdit}
                    className="text-xs font-semibold cursor-pointer"
                  >
                    {actionLoading ? "Saving…" : "Save Changes"}
                  </Button>
                </div>
              ) : (
                selectedApp.status === "PENDING" && (
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={actionLoading}
                      onClick={() => handleReject(selectedApp.id)}
                      className="text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer border-destructive/20"
                    >
                      Reject Application
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={actionLoading}
                      onClick={() => handleApprove(selectedApp.id)}
                      className="text-xs font-semibold cursor-pointer"
                    >
                      {actionLoading ? "Processing…" : "Approve & Create Account"}
                    </Button>
                  </div>
                )
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
    </TooltipProvider>
  )
}
