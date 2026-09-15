"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Trash2,
  RotateCcw,
  Search,
  Check,
  Filter,
  Users,
  FileText,
  BookOpen,
  GraduationCap,
  Layers,
  Archive,
  RefreshCw,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import ConfirmDeleteModal from "@/components/confirm-delete-modal"
import { toast } from "@/components/ui/toast"

const SOURCE_FILTERS = [
  { id: "ALL", label: "All Items" },
  { id: "USERS", label: "Users" },
  { id: "PRE_REGISTRATIONS", label: "Pre-Registrations" },
  { id: "CURRICULUM", label: "Curriculum" },
  { id: "MOCK_EXAMS", label: "Mock Exams" },
  { id: "MASTER_DATA", label: "Master Data" },
]

export function TrashClient() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("ALL")
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState([])
  const [expandedIds, setExpandedIds] = useState(new Set())

  const [actionLoading, setActionLoading] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeFilter !== "ALL") params.append("type", activeFilter)
      if (search.trim()) params.append("search", search.trim())

      const res = await fetch(`/api/admin/trash?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setItems(data.items || [])
      } else {
        setItems([])
      }
    } catch (err) {
      console.error("Failed to load trash items:", err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
    setSelectedIds([])
  }, [activeFilter])

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems()
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const filteredItems = useMemo(() => {
    return items
  }, [items])

  const isAllSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item.id))
  const isSomeSelected = filteredItems.some((item) => selectedIds.includes(item.id))

  const handleToggleAll = () => {
    if (isAllSelected) {
      const pageItemIds = new Set(filteredItems.map((item) => item.id))
      setSelectedIds((prev) => prev.filter((id) => !pageItemIds.has(id)))
    } else {
      const allIds = filteredItems.map((item) => item.id)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allIds])))
    }
  }

  const handleToggleItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Restore handler
  const handleRecover = async (targetIds = selectedIds) => {
    if (targetIds.length === 0) return
    setActionLoading(true)
    try {
      const res = await fetch("/api/admin/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: targetIds }),
      })
      const data = await res.json()
      if (res.ok) {
        setSelectedIds((prev) => prev.filter((id) => !targetIds.includes(id)))
        await fetchItems()
        if (data.errors && data.errors.length > 0) {
          toast(`Recovered ${data.restoredCount || 0} item(s). Some items could not be restored.`)
        } else {
          toast(`Successfully recovered ${data.restoredCount || targetIds.length} item(s).`)
        }
      } else {
        toast(data.error || "Failed to recover selected items.")
      }
    } catch {
      toast("Network error occurred while recovering items.")
    } finally {
      setActionLoading(false)
    }
  }

  // Permanent delete confirmation
  const handlePermanentDelete = async () => {
    if (selectedIds.length === 0) return
    setActionLoading(true)
    try {
      const res = await fetch("/api/admin/trash", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      })
      const data = await res.json()
      if (res.ok) {
        setSelectedIds([])
        setConfirmModalOpen(false)
        await fetchItems()
        toast(`Successfully deleted ${data.deletedCount || selectedIds.length} item(s).`)
      } else {
        toast(data.error || "Failed to permanently delete items.")
      }
    } catch {
      toast("Network error occurred while deleting items.")
    } finally {
      setActionLoading(false)
    }
  }

  // Entity label helper (minimal, no pill badges)
  const getEntityDisplay = (type) => {
    switch (type) {
      case "USER":
        return { label: "User", origin: "User Management" }
      case "PRE_REGISTRATION":
        return { label: "Pre-Registration", origin: "Pre-Registrations" }
      case "CURRICULUM_CATEGORY":
        return { label: "Category", origin: "Curriculum" }
      case "CURRICULUM_SUBCATEGORY":
        return { label: "Subcategory", origin: "Curriculum" }
      case "CURRICULUM_SUBJECT":
        return { label: "Subject", origin: "Curriculum" }
      case "MOCK_EXAM":
        return { label: "Mock Exam", origin: "Mock Exams" }
      case "MASTER_DATA_EXAM":
        return { label: "Examination", origin: "Master Data" }
      case "MASTER_DATA_PROGRAM":
        return { label: "Course / Program", origin: "Master Data" }
      case "MASTER_DATA_MAJOR":
        return { label: "Specialization", origin: "Master Data" }
      case "MASTER_DATA_BATCH":
        return { label: "Batch", origin: "Master Data" }
      case "MASTER_DATA_SCHOOL":
        return { label: "Institution", origin: "Master Data" }
      case "MASTER_DATA_COURSE":
        return { label: "Course", origin: "Master Data" }
      case "MASTER_DATA_GRADEBOOK":
        return { label: "Gradebook", origin: "Master Data" }
      default:
        return { label: type || "Record", origin: "System" }
    }
  }

  return (
    <div className="space-y-5 w-full">

      {/* Top Filter Tabs & Selection Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        {/* Minimal Source Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F2F2F2]/80 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 overflow-x-auto max-w-full">
          {SOURCE_FILTERS.map((f) => {
            const isActive = activeFilter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                    : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Action Controls: Refresh, Selected counts, Recover & Purge */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <span className="text-xs font-medium text-[#696969] dark:text-gray-400 mr-1">
                {selectedIds.length} selected
              </span>

              {/* Minimal Recover Button */}
              <button
                type="button"
                onClick={() => handleRecover(selectedIds)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold text-[#3B3B3B] dark:text-white bg-white dark:bg-white/10 border border-black/10 dark:border-white/15 hover:bg-black/[0.03] dark:hover:bg-white/[0.08] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                title="Restore selected items to original location"
              >
                <RotateCcw className={`size-3.5 ${actionLoading ? "animate-spin" : ""}`} />
                <span>Recover</span>
              </button>

              {/* Minimal Delete Button */}
              <button
                type="button"
                onClick={() => setConfirmModalOpen(true)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                title="Permanently delete selected items"
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={fetchItems}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-medium text-[#696969] dark:text-gray-400 bg-white dark:bg-white/10 hover:text-[#3B3B3B] dark:hover:text-white border border-black/5 dark:border-white/10 transition-all shadow-2xs cursor-pointer"
              title="Refresh Trash"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#696969]/70" />
        <input
          type="search"
          placeholder="Search deleted items by name, description, or detail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/60 focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs"
        />
      </div>

      {/* Data Table / Centered Empty State */}
      <div className="w-full overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-card shadow-2xs">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
            <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-[#696969] dark:text-gray-400">Loading trash records…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          /* Centered Minimal Empty State */
          <div className="flex flex-col items-center justify-center min-h-[360px] p-8 text-center animate-in fade-in duration-200">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] text-[#696969] dark:text-gray-400 mb-3 border border-black/5 dark:border-white/5">
              <Trash2 className="size-5 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-semibold text-[#3B3B3B] dark:text-white tracking-wide">
              {search ? "No deleted items match your search" : "Trash is Empty"}
            </h3>
            <p className="text-xs text-[#696969] dark:text-gray-400 max-w-sm mt-1 leading-relaxed">
              {search
                ? `No items found for "${search}". Try searching for another term or change your category filter.`
                : "Deleted items from users, curriculum, mock exams, or master data are held here so you can recover them anytime."}
            </p>
          </div>
        ) : (
          <div className="max-h-[720px] overflow-y-auto">
            <table className="w-full text-left border-collapse" aria-label="Trash items table">
              <thead className="sticky top-0 z-10 bg-[#F2F2F2]/80 dark:bg-[#14161b]/90 backdrop-blur-xs border-b border-black/5 dark:border-white/10">
                <tr className="h-11 text-xs font-semibold text-[#696969]/80 dark:text-gray-400">
                  {/* Select All Checkbox */}
                  <th className="w-12 px-4 text-center" scope="col">
                    <button
                      type="button"
                      onClick={handleToggleAll}
                      className={`size-4.5 rounded-md border flex items-center justify-center transition-all cursor-pointer mx-auto ${
                        isAllSelected
                          ? "bg-neutral-200 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 shadow-2xs"
                          : isSomeSelected
                          ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600"
                          : "border-black/20 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40"
                      }`}
                      aria-label="Select all items"
                    />
                  </th>
                  <th className="px-4 py-2.5" scope="col">Item Name</th>
                  <th className="px-4 py-2.5" scope="col">Source / Category</th>
                  <th className="px-4 py-2.5" scope="col">Details</th>
                  <th className="px-4 py-2.5" scope="col">Deleted</th>
                  <th className="px-4 py-2.5 text-right pr-6" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
                {filteredItems.map((item) => {
                  const isChecked = selectedIds.includes(item.id)
                  const { label, origin } = getEntityDisplay(item.entity_type)
                  const hasChildren = Array.isArray(item.children) && item.children.length > 0
                  const isExpanded = expandedIds.has(item.id)

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className={`h-13 transition-colors ${
                          isChecked ? "bg-black/[0.02] dark:bg-white/[0.03]" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleItem(item.id)}
                            className={`size-4.5 rounded-md border flex items-center justify-center transition-all cursor-pointer mx-auto ${
                              isChecked
                                ? "bg-neutral-200 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 shadow-2xs"
                                : "border-black/20 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40"
                            }`}
                            aria-label={`Select item ${item.item_name}`}
                          />
                        </td>

                        {/* Item Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {hasChildren && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(item.id)}
                                className="flex items-center justify-center size-6 rounded-md text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer shrink-0"
                                title={isExpanded ? "Hide contents" : "Show contents"}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="size-4" />
                                ) : (
                                  <ChevronRight className="size-4" />
                                )}
                              </button>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-[#3B3B3B] dark:text-gray-100">
                                  {item.item_name || "—"}
                                </span>
                                {hasChildren && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpand(item.id)}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#E9C46A]/15 text-[#B08924] dark:text-[#F4A261] border border-[#E9C46A]/30 hover:bg-[#E9C46A]/25 transition-colors cursor-pointer"
                                  >
                                    <span>{item.children.length} {item.children.length === 1 ? "content" : "contents"}</span>
                                    {isExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                                  </button>
                                )}
                              </div>
                              {item.description && (
                                <div className="text-[11px] text-[#696969] dark:text-gray-400 mt-0.5 line-clamp-1">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Source / Category (minimal text, no pill badge) */}
                        <td className="px-4 py-3 text-xs text-[#696969] dark:text-gray-300">
                          <span className="font-medium text-[#3B3B3B] dark:text-gray-200">{label}</span>
                          <span className="text-[#696969] dark:text-gray-400 ml-1.5">• {origin}</span>
                        </td>

                        {/* Details / Location */}
                        <td className="px-4 py-3 text-xs text-[#696969] dark:text-gray-400">
                          {item.original_location ? (
                            <span className="font-mono text-[11px] opacity-75">{item.original_location}</span>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Deleted Date & Actor */}
                        <td className="px-4 py-3 text-xs text-[#696969] dark:text-gray-400 whitespace-nowrap">
                          <div>
                            {item.deleted_at
                              ? new Date(item.deleted_at).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </div>
                          {item.deleted_by_name && (
                            <div className="text-[10px] opacity-65 mt-0.5">
                              by {item.deleted_by_name}
                            </div>
                          )}
                        </td>

                        {/* Individual Actions */}
                        <td className="px-4 py-3 text-right pr-6 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Recover */}
                            <button
                              type="button"
                              onClick={() => handleRecover([item.id])}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#3B3B3B] dark:text-white bg-white dark:bg-white/10 hover:bg-black/[0.03] dark:hover:bg-white/[0.08] border border-black/10 dark:border-white/15 rounded-lg transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                              title="Restore item"
                            >
                              <RotateCcw className="size-3" />
                              <span>Recover</span>
                            </button>

                            {/* Delete permanently */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedIds([item.id])
                                setConfirmModalOpen(true)
                              }}
                              disabled={actionLoading}
                              className="inline-flex items-center justify-center p-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-200/50 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                              title="Delete permanently"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Dropdown for Nested Cascading Content */}
                      {hasChildren && isExpanded && (
                        <tr className="bg-black/[0.015] dark:bg-white/[0.015]">
                          <td colSpan={6} className="px-6 py-3.5 pl-14">
                            <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-black/20 p-3.5 shadow-2xs">
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5 dark:border-white/5">
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#696969] dark:text-gray-400">
                                  Contained Items ({item.children.length})
                                </div>
                                <div className="text-[11px] italic text-[#696969]/80 dark:text-gray-400/80">
                                  Restored or permanently deleted together with this {label}
                                </div>
                              </div>
                              <div className="space-y-2">
                                {item.children.map((child) => {
                                  const childInfo = getEntityDisplay(child.entity_type)
                                  return (
                                    <div
                                      key={child.id}
                                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.03] dark:border-white/[0.05]"
                                    >
                                      <div className="min-w-0 pr-4">
                                        <div className="font-medium text-[#3B3B3B] dark:text-gray-200 truncate">
                                          {child.item_name || "—"}
                                        </div>
                                        {child.description && (
                                          <div className="text-[11px] text-[#696969] dark:text-gray-400 truncate mt-0.5">
                                            {child.description}
                                          </div>
                                        )}
                                      </div>
                                      <div className="shrink-0 flex items-center gap-3">
                                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-[#696969] dark:text-gray-300 font-medium">
                                          {childInfo.label}
                                        </span>
                                        <span className="text-[10px] text-[#696969]/70 dark:text-gray-500 italic">
                                          Linked item
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Permanent Deletion Modal */}
      <ConfirmDeleteModal
        isOpen={confirmModalOpen}
        title="Permanently Delete Items"
        description={
          selectedIds.length === 1
            ? "Are you sure you want to permanently delete this item from Trash? This action is irreversible and cannot be recovered."
            : `Are you sure you want to permanently delete ${selectedIds.length} items from Trash? This action is irreversible and cannot be recovered.`
        }
        confirmText="Delete Permanently"
        cancelText="Cancel"
        isDeleting={actionLoading}
        onConfirm={handlePermanentDelete}
        onCancel={() => setConfirmModalOpen(false)}
      />
    </div>
  )
}
