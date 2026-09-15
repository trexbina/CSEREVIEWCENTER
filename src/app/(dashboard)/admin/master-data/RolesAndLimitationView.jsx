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
  Users
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
    name: "Master Data",
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
    description: "Theme preferences, security protocols, and session controls"
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

  const toggleAll = () => {
    if (selectedPerms.length === DASHBOARD_MODULES.length) {
      setRoleForm({ ...roleForm, permissions: [] })
    } else {
      setRoleForm({
        ...roleForm,
        permissions: DASHBOARD_MODULES.map((m) => m.path)
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
                Dashboard Permissions ({selectedPerms.length}/{DASHBOARD_MODULES.length})
              </label>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
              >
                {selectedPerms.length === DASHBOARD_MODULES.length ? "Deselect All" : "Select All"}
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
          </div>

          <div className="flex justify-end items-center gap-2 pt-3 border-t border-border/40 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-2xs transition-all flex items-center justify-center cursor-pointer"
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

  // Filter roles by search
  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles
    const s = search.toLowerCase()
    return roles.filter(
      (r) =>
        r.name?.toLowerCase().includes(s) ||
        r.role_key?.toLowerCase().includes(s) ||
        r.description?.toLowerCase().includes(s)
    )
  }, [roles, search])

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
    <div className="w-full bg-white dark:bg-[#1E1E1E] border border-black/5 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xs animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center size-9 rounded-xl bg-[#F2F2F2]/60 hover:bg-[#F2F2F2] dark:bg-white/10 dark:hover:bg-white/15 text-[#696969] hover:text-[#3B3B3B] dark:text-gray-300 dark:hover:text-white border border-black/5 dark:border-white/10 shadow-2xs transition-all cursor-pointer"
            title="Back to Master Data"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#3B3B3B] dark:text-white">
              Roles and Limitation
            </h2>
            <p className="text-xs text-[#8c8c8c] mt-0.5">
              Configure administrative roles and granular dashboard restrictions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-[#8c8c8c] px-1">
            {roles.length} {roles.length === 1 ? "Role" : "Roles"}
          </span>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="bg-[#E9C46A] hover:bg-[#dfb550] text-white font-semibold py-1.5 px-4 rounded-xl shadow-2xs flex items-center gap-1.5 transition-all text-xs cursor-pointer active:scale-95"
          >
            Add New Role
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#696969]/70" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles…"
            className="w-full h-9 pl-9 pr-8 text-xs rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/60 focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Roles Table */}
      <div className="w-full overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" aria-label="Roles list">
            <thead className="bg-[#F2F2F2]/80 dark:bg-white/5 border-b border-black/5 dark:border-white/10">
              <tr className="h-10 text-xs font-semibold text-[#696969] dark:text-gray-400">
                <th className="py-2.5 px-4 font-semibold">Role Name</th>
                <th className="py-2.5 px-4 font-semibold">Description</th>
                <th className="py-2.5 px-4 font-semibold">Accessible Modules</th>
                <th className="py-2.5 px-4 text-center font-semibold">Users</th>
                <th className="py-2.5 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs text-foreground">
              {filteredRoles.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-muted-foreground text-xs">
                    {search ? `No roles matching "${search}"` : "No roles configured."}
                  </td>
                </tr>
              )}
              {filteredRoles.map((role) => {
                const perms = Array.isArray(role.permissions) ? role.permissions : []
                const allAccess = perms.length === DASHBOARD_MODULES.length

                return (
                  <tr
                    key={role.id}
                    className="transition-colors"
                  >
                    <td className="py-3 px-4 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-xs">{role.name}</span>
                        {role.is_system && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground">
                            System Default
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                        {role.role_key}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-muted-foreground text-xs max-w-xs">
                      {role.description || <span className="opacity-50 italic">No description</span>}
                    </td>

                    <td className="py-3 px-4">
                      {allAccess ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Full Access (All Modules)
                        </span>
                      ) : perms.length === 0 ? (
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          No Dashboard Access
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {perms.slice(0, 3).map((p) => {
                            const m = DASHBOARD_MODULES.find((mod) => mod.path === p)
                            return (
                              <span
                                key={p}
                                className="text-[10px] font-medium bg-muted/40 text-foreground px-2 py-0.5 rounded-md border border-black/5 dark:border-white/10"
                              >
                                {m?.name || p}
                              </span>
                            )
                          })}
                          {perms.length > 3 && (
                            <span className="text-[10px] font-medium text-muted-foreground self-center px-1">
                              +{perms.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-medium text-xs text-foreground whitespace-nowrap">
                      {role.user_count || 0}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(role)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          title="Configure Role & Restrictions"
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </button>
                        {!role.is_system && (
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                roleId: role.id,
                                roleName: role.name
                              })
                            }
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-[#696969] hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
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
    </div>
  )
}
