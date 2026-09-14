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
    <label className="flex items-start gap-3 p-2.5 rounded-xl border border-border/30 hover:border-border/70 hover:bg-muted/20 cursor-pointer transition-all select-none">
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div
          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
            checked
              ? "bg-foreground border-foreground text-background"
              : "border-border bg-background"
          }`}
        >
          {checked && <Check className="h-3 w-3 stroke-[3]" />}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{description}</p>
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full shadow-lg space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center pb-2 border-b border-border/30 shrink-0">
          <div>
            <h3 className="font-bold text-foreground text-base">
              {isEdit ? "Configure Role & Restrictions" : "Add New Role"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set role title and check the dashboard modules this role can access.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Role Name *</label>
            <input
              type="text"
              required
              disabled={roleForm.is_system && isEdit}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm outline-none focus:border-slate-400 disabled:opacity-60"
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              placeholder="e.g. Branch Coordinator, Admissions Head"
            />
            {roleForm.is_system && (
              <p className="text-[11px] text-muted-foreground italic">
                System default role name cannot be modified.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm outline-none focus:border-slate-400"
              value={roleForm.description || ""}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              placeholder="Brief description of responsibilities and scope"
            />
          </div>

          {/* Checklist of Dashboard Modules */}
          <div className="space-y-2 pt-2 border-t border-border/30">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Dashboard Module Permissions ({selectedPerms.length}/{DASHBOARD_MODULES.length})
              </label>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-muted-foreground hover:text-foreground font-medium underline cursor-pointer"
              >
                {selectedPerms.length === DASHBOARD_MODULES.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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

          <div className="flex justify-end gap-2 pt-4 border-t border-border/30 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-2xs transition-all flex items-center justify-center cursor-pointer"
            >
              {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Create Role"}
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
      is_system: !!role.is_system
    })
    setIsEdit(true)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!roleForm.name.trim()) return

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
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border/40">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          title="Back to Master Data"
        >
          <ChevronRight className="h-5 w-5 rotate-180" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-foreground truncate">
            Roles and Limitation
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure administrative roles and granular dashboard restrictions.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
            {roles.length} {roles.length === 1 ? "Role" : "Roles"}
          </span>
          <button
            onClick={handleOpenAdd}
            className="bg-[#E9C46A] hover:bg-[#dfb550] text-white font-semibold py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition-all text-xs cursor-pointer active:scale-95"
          >
            Add New Role
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="mb-4 max-w-sm">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles..."
            className="w-full px-3 py-1.5 border border-border/40 rounded-lg bg-background text-foreground text-xs outline-none focus:border-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Roles Table */}
      <div className="rounded-xl border border-border/30 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-transparent border-b border-border/40 text-xs">
              <TableHead className="py-2.5 px-4 font-medium text-muted-foreground">Role Name</TableHead>
              <TableHead className="py-2.5 px-4 font-medium text-muted-foreground">Description</TableHead>
              <TableHead className="py-2.5 px-4 font-medium text-muted-foreground">Accessible Modules</TableHead>
              <TableHead className="py-2.5 px-4 text-center font-medium text-muted-foreground">Users</TableHead>
              <TableHead className="py-2.5 px-4 text-right font-medium text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-sm">
            {filteredRoles.length === 0 && (
              <TableRow className="border-0">
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-xs">
                  {search ? `No roles matching "${search}"` : "No roles configured."}
                </TableCell>
              </TableRow>
            )}
            {filteredRoles.map((role) => {
              const perms = Array.isArray(role.permissions) ? role.permissions : []
              const allAccess = perms.length === DASHBOARD_MODULES.length

              return (
                <TableRow
                  key={role.id}
                  className="border-b border-border/20 last:border-b-0 hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-xs">{role.name}</span>
                      {role.is_system && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
                          System Default
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                      {role.role_key}
                    </span>
                  </TableCell>

                  <TableCell className="py-3 px-4 text-muted-foreground text-xs max-w-xs">
                    {role.description || <span className="opacity-50 italic">No description</span>}
                  </TableCell>

                  <TableCell className="py-3 px-4">
                    {allAccess ? (
                      <span className="inline-block text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded">
                        Full Access (All Modules)
                      </span>
                    ) : perms.length === 0 ? (
                      <span className="inline-block text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded">
                        No Dashboard Access
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {perms.slice(0, 3).map((p) => {
                          const m = DASHBOARD_MODULES.find((mod) => mod.path === p)
                          return (
                            <span
                              key={p}
                              className="text-[10px] font-medium bg-muted/40 text-foreground px-1.5 py-0.5 rounded border border-border/30"
                            >
                              {m?.name || p}
                            </span>
                          )
                        })}
                        {perms.length > 3 && (
                          <span className="text-[10px] font-semibold text-muted-foreground self-center px-1">
                            +{perms.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="py-3 px-4 text-center font-medium text-xs text-foreground whitespace-nowrap">
                    {role.user_count || 0}
                  </TableCell>

                  <TableCell className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(role)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        title="Configure Role & Restrictions"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      {!role.is_system && (
                        <button
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              roleId: role.id,
                              roleName: role.name
                            })
                          }
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete Role"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
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
