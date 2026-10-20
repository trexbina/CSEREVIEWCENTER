"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  ChevronRight,
  Plus,
  Settings,
  Trash,
  X,
  Check,
  Shield,
  Lock,
  Search,
  Users,
  UserPlus,
  ExternalLink,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import ConfirmDeleteModal from "@/components/confirm-delete-modal"
import RoleUsersDialog from "./RoleUsersDialog"
import AddAdminUserDialog from "./AddAdminUserDialog"
import { toast } from "@/components/ui/toast"

// Predefined available dashboard modules/restrictions for administrators
export const DASHBOARD_MODULES = [
  {
    path: "/admin",
    name: "Admin Dashboard",
    description: "System overview, live status and global statistics"
  },
  {
    path: "/admin/users",
    name: "User Management",
    description: "Manage students, teachers, administrators, and admissions"
  },
  {
    path: "/admin/subscriptions",
    name: "Subscriptions & Terms",
    description: "Monitor scheduled batch deadlines, active reviewee access, and renewals"
  },
  {
    path: "/admin/curriculum",
    name: "Curriculum Manager",
    description: "Manage examination programs, subjects, and study modules"
  },
  {
    path: "/admin/mock-exams",
    name: "Mock Exams",
    description: "Create, schedule, and grade mock exams"
  },
  {
    path: "/admin/master-data",
    name: "Master Data (Academic)",
    description: "Manage board exams, batches, schools, and gradebooks"
  },
  {
    path: "/admin/analytical-overview",
    name: "Analytical Overview",
    description: "Performance reports, exam charts, and cohort analytics"
  },
  {
    path: "/admin/trash",
    name: "Trash & Recovery",
    description: "Recycle bin and item restoration manager"
  },
  {
    path: "/admin/settings",
    name: "Settings",
    description: "General theme preferences and account password settings"
  },
  {
    path: "/admin/settings/security",
    name: "Security & Access Policies",
    description: "Session monitoring, audit & auth logs, and watermark policies in Settings"
  }
]

export const SECURITY_MODULES = [
  {
    path: "/admin/master-data/roles",
    name: "Roles & Limitations (Security)",
    description: "Access and configure administrative roles, user assignments, and permissions within Master Data"
  }
]

// Minimal neutral checkbox
function NeutralCheckbox({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-black/5 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer transition-all select-none group">
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div
          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
            checked
              ? "bg-[#3B3B3B] dark:bg-white border-[#3B3B3B] dark:border-white text-white dark:text-neutral-900 shadow-2xs"
              : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 group-hover:border-neutral-400"
          }`}
        >
          {checked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[#3B3B3B] dark:text-gray-200 leading-tight">{label}</p>
        {description && (
          <p className="text-[11px] text-[#696969] dark:text-gray-400 mt-0.5 leading-snug">{description}</p>
        )}
      </div>
    </label>
  )
}

// Role Configure / Add Dialog
function RoleDialog({ isOpen, roleForm, setRoleForm, onSubmit, onCancel, isEdit, isSaving }) {
  if (!isOpen) return null

  const selectedPerms = roleForm.permissions || []

  const togglePermission = (path) => {
    if (selectedPerms.includes(path)) {
      setRoleForm({
        ...roleForm,
        permissions: selectedPerms.filter((p) => p !== path)
      })
    } else {
      setRoleForm({
        ...roleForm,
        permissions: [...selectedPerms, path]
      })
    }
  }

  const allRegularPaths = DASHBOARD_MODULES.map((m) => m.path)
  const allRegularSelected = allRegularPaths.every((p) => selectedPerms.includes(p))

  const toggleAll = () => {
    if (allRegularSelected) {
      setRoleForm({
        ...roleForm,
        permissions: selectedPerms.filter((p) => !allRegularPaths.includes(p))
      })
    } else {
      setRoleForm({
        ...roleForm,
        permissions: Array.from(new Set([...selectedPerms, ...allRegularPaths]))
      })
    }
  }

  const hasRolesPerm = selectedPerms.includes("/admin/master-data/roles") || selectedPerms.includes("/admin/roles")

  const toggleRolesPerm = () => {
    const raw = roleForm.permissions || []
    if (hasRolesPerm) {
      setRoleForm({
        ...roleForm,
        permissions: raw.filter((p) => p !== "/admin/master-data/roles" && p !== "/admin/roles")
      })
    } else {
      setRoleForm({
        ...roleForm,
        permissions: [
          ...raw.filter((p) => p !== "/admin/master-data/roles" && p !== "/admin/roles"),
          "/admin/master-data/roles",
          "/admin/roles"
        ]
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150 font-sans">
        <div className="flex justify-between items-center pb-3 border-b border-border/40 shrink-0">
          <div>
            <h3 className="font-semibold text-foreground text-sm tracking-tight">
              {isEdit ? "Configure Role & Restrictions" : "Add New Role"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set role title and check the dashboard modules this role can access.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Role Name *</label>
            <input
              type="text"
              required
              disabled={roleForm.is_system && isEdit}
              className="w-full h-9 px-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-background text-foreground placeholder:text-muted-foreground/60 shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#E9C46A] disabled:opacity-50 transition-all"
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              placeholder="e.g. Branch Coordinator, Admissions Head"
            />
            {roleForm.is_system && (
              <p className="text-[11px] text-muted-foreground">
                System default role name cannot be modified.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Description</label>
            <input
              type="text"
              className="w-full h-9 px-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-background text-foreground placeholder:text-muted-foreground/60 shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#E9C46A] transition-all"
              value={roleForm.description || ""}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              placeholder="Brief description of responsibilities and scope"
            />
          </div>

          {/* Checklist of Dashboard Modules */}
          <div className="space-y-2.5 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                Dashboard Permissions ({selectedPerms.filter((p) => allRegularPaths.includes(p)).length}/{DASHBOARD_MODULES.length})
              </label>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
              >
                {allRegularSelected ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              {DASHBOARD_MODULES.map((mod) => (
                <NeutralCheckbox
                  key={mod.path}
                  checked={selectedPerms.includes(mod.path)}
                  onChange={() => togglePermission(mod.path)}
                  label={mod.name}
                  description={mod.description}
                />
              ))}
            </div>

            {/* Separate Elevated Security Selection: Roles & Limitations */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] dark:bg-amber-500/10 p-3 space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-semibold text-foreground">
                    Roles & Limitation (Access Control)
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  Separate Restriction
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Separated from Master Data. Granting &quot;Master Data (Academic)&quot; above only allows managing Exams, Batches, Schools, and Gradebooks. Check this box only to authorize editing and adding administrator roles.
              </p>
              <NeutralCheckbox
                checked={hasRolesPerm}
                onChange={toggleRolesPerm}
                label="Allow Editing & Adding Roles"
                description="Grants permission to configure roles, restrictions, and reassign user roles."
              />
            </div>
          </div>

          <div className="flex justify-end items-center gap-2 pt-3 border-t border-border/40 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-2xs transition-all flex items-center justify-center cursor-pointer active:scale-95"
            >
              {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RolesAndLimitationView({ onBack, roles = [], fetchData, apiCall }) {
  const [search, setSearch] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [filterType, setFilterType] = useState("all") // "all" | "system" | "custom"
  const [filterAccess, setFilterAccess] = useState("all") // "all" | "full" | "custom" | "none"
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [sortField, setSortField] = useState("name")
  const [sortDir, setSortDir] = useState("asc")

  const searchRef = React.useRef(null)
  const filterRef = React.useRef(null)

  // Close search/filter popover on click outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        if (!search) setIsSearchOpen(false)
      }
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [search])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [roleForm, setRoleForm] = useState({
    id: "",
    name: "",
    description: "",
    permissions: [],
    is_system: false
  })

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    roleId: null,
    roleName: ""
  })

  // State for Role Users Management Dialog
  const [viewUsersRole, setViewUsersRole] = useState(null)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const activeFilterCount = (filterAccess !== "all" ? 1 : 0)

  // Filter and sort roles
  const filteredRoles = useMemo(() => {
    let result = (roles || []).filter((r) => {
      // Tab filter: System vs Custom
      if (filterType === "system" && !r.is_system) return false
      if (filterType === "custom" && r.is_system) return false

      // Popover Access filter
      const perms = Array.isArray(r.permissions) ? r.permissions : []
      const allAccess = perms.length === DASHBOARD_MODULES.length
      if (filterAccess === "full" && !allAccess) return false
      if (filterAccess === "custom" && (allAccess || perms.length === 0)) return false
      if (filterAccess === "none" && perms.length !== 0) return false

      // Search query
      if (search.trim()) {
        const s = search.toLowerCase()
        const matchName = r.name?.toLowerCase().includes(s)
        const matchKey = r.role_key?.toLowerCase().includes(s)
        const matchDesc = r.description?.toLowerCase().includes(s)
        if (!matchName && !matchKey && !matchDesc) return false
      }

      return true
    })

    result.sort((a, b) => {
      let valA = ""
      let valB = ""
      if (sortField === "name") {
        valA = (a.name || "").toLowerCase()
        valB = (b.name || "").toLowerCase()
      } else if (sortField === "description") {
        valA = (a.description || "").toLowerCase()
        valB = (b.description || "").toLowerCase()
      } else if (sortField === "users") {
        valA = a.user_count || 0
        valB = b.user_count || 0
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1
      if (valA > valB) return sortDir === "asc" ? 1 : -1
      return 0
    })

    return result
  }, [roles, search, filterType, filterAccess, sortField, sortDir])

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage)
  const validPage = Math.max(1, Math.min(currentPage, totalPages || 1))
  const paginatedRoles = useMemo(() => {
    const start = (validPage - 1) * itemsPerPage
    return filteredRoles.slice(start, start + itemsPerPage)
  }, [filteredRoles, validPage, itemsPerPage])

  const SortButton = ({ label, field, sortField, sortDir, onSort }) => {
    const active = sortField === field
    return (
      <button
        type="button"
        onClick={() => onSort(field)}
        className="flex items-center gap-1 hover:text-foreground transition-colors font-semibold cursor-pointer text-foreground select-none"
      >
        <span>{label}</span>
        <span className="flex flex-col text-[10px] leading-[8px] opacity-70">
          {active ? (
            sortDir === "asc" ? (
              <ArrowUp className="h-3 w-3 text-primary stroke-[2.5]" />
            ) : (
              <ArrowDown className="h-3 w-3 text-primary stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100 transition-opacity" />
          )}
        </span>
      </button>
    )
  }

  const handleOpenAdd = () => {
    setRoleForm({
      id: "",
      name: "",
      description: "",
      permissions: ["/admin"], // Default dashboard access
      is_system: false
    })
    setIsEdit(false)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (role) => {
    setRoleForm({
      id: role.id,
      name: role.name,
      description: role.description || "",
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
      is_system: Boolean(role.is_system)
    })
    setIsEdit(true)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!roleForm.name.trim()) {
      toast("Role name is required.")
      return
    }

    setIsSaving(true)
    try {
      if (isEdit) {
        await apiCall("UPDATE", "ROLE", {
          id: roleForm.id,
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.permissions
        })
        toast("Role and permissions updated successfully.")
      } else {
        await apiCall("ADD", "ROLE", {
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.permissions
        })
        toast("New role created successfully.")
      }
      setIsDialogOpen(false)
      await fetchData()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("role-permissions-updated"))
      }
    } catch (err) {
      console.error(err)
      toast(err.message || "Failed to save role.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.roleId) return
    try {
      await apiCall("DELETE", "ROLE", { id: deleteModal.roleId })
      toast("Role deleted successfully.")
      setDeleteModal({ isOpen: false, roleId: null, roleName: "" })
      await fetchData()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("role-permissions-updated"))
      }
    } catch (err) {
      console.error(err)
      toast(err.message || "Failed to delete role.")
    }
  }

  return (
    <div className="w-full bg-card border border-border/40 rounded-2xl p-6 shadow-xs animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 mb-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Back to Master Data"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
              Roles and Limitation
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Configure administrative roles and granular dashboard restrictions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 px-3 py-1.5 rounded-lg">
            {roles.length} {roles.length === 1 ? "Role" : "Roles"}
          </span>
          <button
            type="button"
            onClick={() => setIsAddUserOpen(true)}
            className="bg-white dark:bg-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 text-[#3B3B3B] dark:text-white border border-black/10 dark:border-white/10 font-semibold py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-2xs active:scale-95"
          >
            <UserPlus className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
            <span>Add User</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="bg-[#E9C46A] hover:bg-[#dfb550] text-white font-semibold py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add New Role</span>
          </button>
        </div>
      </div>

      {/* Unified Table Card matching Batch Management Data & Gradebook */}
      <div className={`w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs relative ${isFilterOpen ? "z-50" : "z-10"}`}>
        {/* Card Top Header: Tabs (left) + Filter & Search Controls (right) */}
        <div className={`px-4 py-3 border-b border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/40 dark:bg-white/[0.02] rounded-t-2xl relative ${isFilterOpen ? "z-50" : "z-20"}`}>
          {/* Left: Quick Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {[
              { key: "all", label: "All" },
              { key: "system", label: "System Roles" },
              { key: "custom", label: "Custom Roles" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setFilterType(tab.key)
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                  filterType === tab.key
                    ? "bg-black/[0.07] dark:bg-white/15 text-[#3B3B3B] dark:text-white font-semibold shadow-2xs"
                    : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: Search & Filter Icons */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Search Control */}
            <div className="relative" ref={searchRef}>
              {isSearchOpen ? (
                <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 pointer-events-none" />
                    <input
                      type="search"
                      autoFocus
                      placeholder="Search roles…"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-44 sm:w-60 h-8 pl-8 pr-2.5 text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 transition-all shadow-2xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("")
                      setCurrentPage(1)
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
                  title="Search roles"
                >
                  <Search className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filter Popover Button */}
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className={`size-8 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center text-neutral-600 dark:text-neutral-300 relative ${
                  activeFilterCount > 0 ? "ring-1 ring-black/20 dark:ring-white/20 text-[#3B3B3B] dark:text-white font-medium" : ""
                }`}
                aria-expanded={isFilterOpen}
                aria-haspopup="true"
                title="Filter by permissions"
              >
                <Filter className="size-3.5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-4 rounded-full bg-[#3B3B3B] text-white dark:bg-white dark:text-black text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Filter Dropdown Popover */}
              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1b20] shadow-2xl z-[100] p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-semibold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                        Access Level
                      </span>
                      {filterAccess !== "all" && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilterAccess("all")
                            setCurrentPage(1)
                          }}
                          className="text-[11px] text-[#a16207] dark:text-[#facc15] hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {[
                        { key: "all", label: "All Access Levels" },
                        { key: "full", label: "Full System Access" },
                        { key: "custom", label: "Restricted Access" },
                        { key: "none", label: "No Access" }
                      ].map((opt) => (
                        <label
                          key={opt.key}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs font-medium text-[#3B3B3B] dark:text-gray-200 select-none"
                        >
                          <input
                            type="radio"
                            name="filter-role-access"
                            checked={filterAccess === opt.key}
                            onChange={() => {
                              setFilterAccess(opt.key)
                              setCurrentPage(1)
                            }}
                            className="size-3.5 text-[#3B3B3B] cursor-pointer accent-[#3B3B3B]"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <>
                      <div className="border-t border-black/5 dark:border-white/10" />
                      <div className="flex items-center justify-between px-1 pt-0.5 text-xs">
                        <span className="text-neutral-400">1 active filter</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFilterAccess("all")
                            setCurrentPage(1)
                          }}
                          className="font-medium text-[#3B3B3B] dark:text-white hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Roles Table Area */}
        {filteredRoles.length === 0 ? (
          <div className="py-16 text-center text-xs font-normal text-neutral-400 dark:text-neutral-500">
            {search || activeFilterCount > 0 || filterType !== "all"
              ? "No matching roles found for this criteria."
              : "No roles configured yet. Click 'Add New Role' above to create one."}
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label="Roles list">
                <thead className="sticky top-0 z-10 bg-[#f8f8fa] dark:bg-[#16181d] backdrop-blur-md border-b border-black/5 dark:border-white/10">
                  <tr className="h-11 text-xs font-semibold text-[#696969] dark:text-gray-300">
                    <th className="px-4 py-2.5 text-left min-w-[180px] whitespace-nowrap" scope="col">
                      <SortButton label="Role Name" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="px-4 py-2.5 text-left min-w-[220px]" scope="col">
                      <SortButton label="Description" field="description" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="px-4 py-2.5 text-left min-w-[220px]" scope="col">
                      <span className="font-semibold text-[#696969] dark:text-gray-300">Accessible Modules</span>
                    </th>
                    <th className="px-4 py-2.5 text-center min-w-[110px] whitespace-nowrap" scope="col">
                      <SortButton label="Assigned Users" field="users" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="px-4 py-2.5 pr-6 text-right min-w-[100px] whitespace-nowrap font-semibold text-[#696969] dark:text-gray-300" scope="col">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                  {paginatedRoles.map((role) => {
                    const perms = Array.isArray(role.permissions) ? role.permissions : []
                    const allAccess = perms.length === DASHBOARD_MODULES.length

                    return (
                      <tr
                        key={role.id}
                        onClick={() => handleOpenEdit(role)}
                        className="h-13 hover:bg-black/[0.025] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[13px] text-[#3B3B3B] dark:text-gray-100">
                              {role.name}
                            </span>
                            {role.is_system && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-black/[0.05] dark:bg-white/[0.08] text-neutral-500 dark:text-neutral-400">
                                System Default
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono block mt-0.5">
                            {role.role_key}
                          </span>
                        </td>

                        <td className="px-4 py-2.5 text-xs text-neutral-600 dark:text-neutral-300 font-normal max-w-xs">
                          {role.description ? (
                            <span className="line-clamp-2">{role.description}</span>
                          ) : (
                            <span className="opacity-40 italic">—</span>
                          )}
                        </td>

                        <td className="px-4 py-2.5 text-xs max-w-sm">
                          {allAccess ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-[#2A9D8F]/15 text-[#1b6b61] dark:bg-[#2A9D8F]/25 dark:text-[#68c9be]">
                              Full Access (All Modules)
                            </span>
                          ) : perms.length === 0 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-[#E17055]/15 text-[#b33920] dark:bg-[#E17055]/25 dark:text-[#f89b87]">
                              No Dashboard Access
                            </span>
                          ) : (
                            <div className="text-xs text-neutral-600 dark:text-neutral-300 font-normal leading-relaxed truncate" title={perms.map((p) => DASHBOARD_MODULES.find((mod) => mod.path === p)?.name || p).join(", ")}>
                              {perms
                                .slice(0, 3)
                                .map((p) => DASHBOARD_MODULES.find((mod) => mod.path === p)?.name || p)
                                .join(", ")}
                              {perms.length > 3 && (
                                <span className="text-neutral-400 dark:text-neutral-500 ml-1">
                                  +{perms.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-2.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setViewUsersRole(role)
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 hover:bg-[#E9C46A]/20 hover:text-[#a16207] text-[#3B3B3B] dark:text-neutral-200 transition-all cursor-pointer group border border-transparent hover:border-[#E9C46A]/30 active:scale-95"
                            title={`View ${role.user_count || 0} user${role.user_count === 1 ? "" : "s"} under ${role.name}`}
                          >
                            <Users className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                            <span>{role.user_count || 0}</span>
                          </button>
                        </td>

                        <td className="px-4 py-2.5 pr-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setViewUsersRole(role)
                              }}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              title="View & Manage Assigned Users"
                            >
                              <Users className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenEdit(role)
                              }}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              title="Configure Role & Restrictions"
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </button>
                            {!role.is_system && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteModal({
                                    isOpen: true,
                                    roleId: role.id,
                                    roleName: role.name
                                  })
                                }}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Delete Role"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls matching Batch Management & Gradebook */}
            {totalPages >= 1 && (
              <div className="px-4 py-3 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-center gap-3 bg-white/20 dark:bg-white/[0.01] rounded-b-2xl">
                <div className="flex items-center gap-3">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`text-xs transition-colors cursor-pointer ${
                        pageNum === validPage
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

      {/* Configure/Add Role Dialog */}
      <RoleDialog
        isOpen={isDialogOpen}
        roleForm={roleForm}
        setRoleForm={setRoleForm}
        onSubmit={handleSubmit}
        onCancel={() => setIsDialogOpen(false)}
        isEdit={isEdit}
        isSaving={isSaving}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title="Delete Custom Role"
        description={`Are you sure you want to delete the role "${deleteModal.roleName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, roleId: null, roleName: "" })}
      />

      {/* View & Manage Role Users Dialog */}
      <RoleUsersDialog
        isOpen={Boolean(viewUsersRole)}
        onClose={() => setViewUsersRole(null)}
        role={
          viewUsersRole
            ? roles.find((r) => r.role_key === viewUsersRole.role_key) || viewUsersRole
            : null
        }
        allRoles={roles}
        onRoleUpdated={async () => {
          await fetchData()
        }}
      />

      {/* Add Admin User Dialog */}
      <AddAdminUserDialog
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        roles={roles}
        onUserCreated={async () => {
          await fetchData()
        }}
      />
    </div>
  )
}
