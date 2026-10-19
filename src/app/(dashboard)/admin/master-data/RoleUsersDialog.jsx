"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  X,
  Search,
  Users,
  Shield,
  ArrowRightLeft,
  UserX,
  UserCheck,
  Check,
  AlertTriangle,
  Loader2,
  UserPlus,
  RefreshCw,
  ExternalLink
} from "lucide-react"
import { toast } from "@/components/ui/toast"

// Built-in standard roles in the system
const DEFAULT_SYSTEM_ROLES = [
  { role_key: "super_admin", name: "Super Admin (System Owner)" },
  { role_key: "academic_admin", name: "Academic Coordinator" },
  { role_key: "registrar", name: "Registrar" },
  { role_key: "teacher", name: "Teacher" },
  { role_key: "student", name: "Student (Reviewee)" }
]

export default function RoleUsersDialog({
  isOpen,
  onClose,
  role,
  allRoles = [],
  onRoleUpdated
}) {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("assigned") // "assigned" | "assign_new"

  // System-wide user search state (for assigning new users to this role)
  const [globalSearch, setGlobalSearch] = useState("")
  const [globalResults, setGlobalResults] = useState([])
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false)

  // Modals for confirmation
  const [confirmTransfer, setConfirmTransfer] = useState({
    isOpen: false,
    user: null,
    targetRoleKey: "",
    targetRoleName: ""
  })

  const [confirmDisable, setConfirmDisable] = useState({
    isOpen: false,
    user: null,
    willBeActive: false
  })

  const [isActionPending, setIsActionPending] = useState(false)

  // Fetch users assigned to this role
  const fetchRoleUsers = useCallback(async () => {
    if (!role?.role_key) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/roles/users?role_key=${encodeURIComponent(role.role_key)}`)
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users || [])
      } else {
        toast(data.error || "Failed to load users for this role.")
      }
    } catch (err) {
      console.error("Error fetching role users:", err)
      toast("Error loading role users.")
    } finally {
      setIsLoading(false)
    }
  }, [role?.role_key])

  useEffect(() => {
    if (isOpen && role?.role_key) {
      setSearch("")
      setGlobalSearch("")
      setGlobalResults([])
      setActiveTab("assigned")
      fetchRoleUsers()
    }
  }, [isOpen, role?.role_key, fetchRoleUsers])

  // Handle global search for users across the system
  useEffect(() => {
    if (activeTab !== "assign_new") return
    if (!globalSearch.trim() || globalSearch.trim().length < 2) {
      setGlobalResults([])
      setIsSearchingGlobal(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingGlobal(true)
      try {
        const res = await fetch(`/api/admin/roles/users?search=${encodeURIComponent(globalSearch.trim())}`)
        const data = await res.json()
        if (res.ok) {
          setGlobalResults(data.users || [])
        }
      } catch (err) {
        console.error("Error searching global users:", err)
      } finally {
        setIsSearchingGlobal(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [globalSearch, activeTab])

  // Build the complete list of selectable destination roles
  const destinationRoles = useMemo(() => {
    const list = [...DEFAULT_SYSTEM_ROLES]
    allRoles.forEach((r) => {
      if (!list.some((item) => item.role_key === r.role_key)) {
        list.push({
          role_key: r.role_key,
          name: r.name + (r.is_system ? "" : " (Custom)")
        })
      }
    })
    return list
  }, [allRoles])

  // Filter assigned users by local search
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.personal_email?.toLowerCase().includes(q) ||
        u.login_id?.toLowerCase().includes(q)
    )
  }, [users, search])

  // Execute Role Transfer
  const handleExecuteTransfer = async () => {
    if (!confirmTransfer.user || !confirmTransfer.targetRoleKey) return
    setIsActionPending(true)
    try {
      const res = await fetch("/api/admin/roles/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: confirmTransfer.user.id,
          role: confirmTransfer.targetRoleKey
        })
      })
      const data = await res.json()
      if (res.ok) {
        toast(`Transferred ${confirmTransfer.user.name} to ${confirmTransfer.targetRoleName}.`)
        setConfirmTransfer({ isOpen: false, user: null, targetRoleKey: "", targetRoleName: "" })
        // If the target role is different from the current role, remove from local list
        const isStillInRole =
          confirmTransfer.targetRoleKey === role.role_key ||
          (role.role_key === "super_admin" && confirmTransfer.targetRoleKey === "admin")
        if (!isStillInRole) {
          setUsers((prev) => prev.filter((u) => u.id !== confirmTransfer.user.id))
        } else {
          await fetchRoleUsers()
        }
        if (onRoleUpdated) onRoleUpdated()
      } else {
        toast(data.error || "Failed to transfer role.")
      }
    } catch (err) {
      console.error("Transfer role error:", err)
      toast("Error transferring role.")
    } finally {
      setIsActionPending(false)
    }
  }

  // Execute Toggle Active Status
  const handleExecuteToggleStatus = async () => {
    if (!confirmDisable.user) return
    setIsActionPending(true)
    try {
      const res = await fetch("/api/admin/roles/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: confirmDisable.user.id,
          is_active: confirmDisable.willBeActive
        })
      })
      const data = await res.json()
      if (res.ok) {
        const actionLabel = confirmDisable.willBeActive ? "enabled" : "disabled"
        toast(`User ${confirmDisable.user.name} has been ${actionLabel}.`)
        setUsers((prev) =>
          prev.map((u) => (u.id === confirmDisable.user.id ? { ...u, is_active: confirmDisable.willBeActive } : u))
        )
        setConfirmDisable({ isOpen: false, user: null, willBeActive: false })
        if (onRoleUpdated) onRoleUpdated()
      } else {
        toast(data.error || "Failed to update account status.")
      }
    } catch (err) {
      console.error("Toggle status error:", err)
      toast("Error updating account status.")
    } finally {
      setIsActionPending(false)
    }
  }

  // Assign user found via global search to current role
  const handleAssignUserToRole = async (targetUser) => {
    setIsActionPending(true)
    try {
      const res = await fetch("/api/admin/roles/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUser.id,
          role: role.role_key
        })
      })
      const data = await res.json()
      if (res.ok) {
        toast(`Successfully assigned ${targetUser.name} to ${role.name}.`)
        setGlobalResults((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: role.role_key, role_name: role.name } : u))
        )
        await fetchRoleUsers()
        setActiveTab("assigned")
        if (onRoleUpdated) onRoleUpdated()
      } else {
        toast(data.error || "Failed to assign user.")
      }
    } catch (err) {
      console.error("Assign user error:", err)
      toast("Error assigning user to role.")
    } finally {
      setIsActionPending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border/80 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 font-sans overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#E9C46A]/15 border border-[#E9C46A]/30 flex items-center justify-center text-[#E9C46A] shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-foreground text-base tracking-tight">
                  {role?.name || "Role"}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/40">
                  {role?.role_key}
                </span>
                {role?.is_system && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    System Default
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage accounts assigned to this role, transfer roles, or disable access.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchRoleUsers}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              title="Refresh User List"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              title="Close Dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher: Assigned Users vs Assign New */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-border/40 bg-card shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("assigned")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "assigned"
                  ? "bg-[#3B3B3B] dark:bg-white text-white dark:text-neutral-900 shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Assigned Users</span>
              <span className="ml-1 text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-black/20">
                {users.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("assign_new")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "assign_new"
                  ? "bg-[#3B3B3B] dark:bg-white text-white dark:text-neutral-900 shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Transfer User Here</span>
            </button>
          </div>

          <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
            {activeTab === "assigned" ? "Click Transfer or Status to modify" : "Search any system account"}
          </span>
        </div>

        {/* Tab 1: Assigned Users */}
        {activeTab === "assigned" && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Search filter within assigned users */}
            <div className="p-4 border-b border-border/30 bg-muted/10 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${users.length} assigned user${users.length === 1 ? "" : "s"} by name, email, or login ID…`}
                  className="w-full h-9 pl-9 pr-8 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[#E9C46A] shadow-2xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List Table */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-7 w-7 animate-spin text-[#E9C46A] mb-2" />
                  <p className="text-xs font-medium">Loading users assigned to {role?.name}…</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-muted/50 border border-border/40 flex items-center justify-center text-muted-foreground mb-3">
                    <Users className="h-6 w-6 opacity-40" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {search ? "No matching users found" : "No users assigned to this role"}
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">
                    {search
                      ? `No user in "${role?.name}" matches "${search}".`
                      : `Currently there are no active users assigned to "${role?.name}". You can transfer existing users into this role using the "Transfer User Here" tab.`}
                  </p>
                  {!search && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("assign_new")}
                      className="mt-4 bg-[#E9C46A] hover:bg-[#dfb550] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Transfer a User to this Role
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {filteredUsers.map((user) => {
                    const isActive = user.is_active !== false
                    return (
                      <div
                        key={user.id}
                        className="p-3.5 sm:px-5 hover:bg-muted/15 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        {/* User Details */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name}
                              className="h-9 w-9 rounded-full object-cover border border-border/40 shrink-0"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs text-foreground truncate">
                                {user.name}
                              </span>
                              {/* Status badge */}
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                                  isActive
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                                  }`}
                                />
                                {isActive ? "Active" : "Disabled"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                              {user.login_id && (
                                <span className="font-mono bg-muted/50 px-1.5 py-0.2 rounded border border-border/30">
                                  {user.login_id}
                                </span>
                              )}
                              <span className="truncate">
                                {user.personal_email || user.email || "No email"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions: Transfer Role & Disable/Enable */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {/* Transfer Role Dropdown */}
                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px] text-muted-foreground font-medium hidden md:inline">
                              Transfer:
                            </label>
                            <select
                              value={user.role || role.role_key}
                              onChange={(e) => {
                                const newKey = e.target.value
                                if (newKey !== user.role) {
                                  const targetObj = destinationRoles.find((r) => r.role_key === newKey)
                                  setConfirmTransfer({
                                    isOpen: true,
                                    user,
                                    targetRoleKey: newKey,
                                    targetRoleName: targetObj?.name || newKey
                                  })
                                }
                              }}
                              className="h-8 text-xs px-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-background text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#E9C46A] cursor-pointer"
                              title="Transfer user to another role"
                            >
                              <option value={role.role_key} disabled>
                                (Current: {role.name})
                              </option>
                              <optgroup label="Available Roles">
                                {destinationRoles
                                  .filter((r) => r.role_key !== role.role_key)
                                  .map((r) => (
                                    <option key={r.role_key} value={r.role_key}>
                                      {r.name}
                                    </option>
                                  ))}
                              </optgroup>
                            </select>
                          </div>

                          {/* Disable / Enable Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDisable({
                                isOpen: true,
                                user,
                                willBeActive: !isActive
                              })
                            }
                            className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                              isActive
                                ? "border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 active:scale-95"
                                : "border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 active:scale-95"
                            }`}
                            title={isActive ? "Disable user login access" : "Enable user login access"}
                          >
                            {isActive ? (
                              <>
                                <UserX className="h-3.5 w-3.5" />
                                <span>Disable</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Enable</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Transfer User Here (System-wide search) */}
        {activeTab === "assign_new" && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Search Bar */}
            <div className="p-4 border-b border-border/30 bg-muted/10 shrink-0">
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Search any user to transfer into "{role?.name}":
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Type name, email, or login ID (min. 2 characters)…"
                  autoFocus
                  className="w-full h-9 pl-9 pr-8 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[#E9C46A] shadow-2xs"
                />
                {globalSearch && (
                  <button
                    type="button"
                    onClick={() => setGlobalSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Global Search Results List */}
            <div className="flex-1 overflow-y-auto">
              {isSearchingGlobal ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-[#E9C46A] mb-2" />
                  <p className="text-xs font-medium">Searching accounts…</p>
                </div>
              ) : !globalSearch.trim() || globalSearch.trim().length < 2 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-muted-foreground">
                  <Search className="h-8 w-8 opacity-30 mb-2" />
                  <p className="text-xs font-medium">Type at least 2 characters to search across all registered users.</p>
                  <p className="text-[11px] opacity-70 mt-0.5">
                    You can quickly search students, teachers, coordinators, or admins to transfer into this role.
                  </p>
                </div>
              ) : globalResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-muted-foreground">
                  <UserX className="h-8 w-8 opacity-30 mb-2" />
                  <p className="text-xs font-medium">No users matched "{globalSearch}".</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {globalResults.map((user) => {
                    const isAlreadyInThisRole =
                      user.role === role.role_key ||
                      (role.role_key === "super_admin" && user.role === "admin")

                    return (
                      <div
                        key={user.id}
                        className="p-3.5 sm:px-5 hover:bg-muted/15 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name}
                              className="h-9 w-9 rounded-full object-cover border border-border/40 shrink-0"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs text-foreground truncate">
                                {user.name}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/40">
                                Current: {user.role_name || user.role}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              {user.login_id && <span className="font-mono">{user.login_id}</span>}
                              <span className="truncate">{user.personal_email || user.email}</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isAlreadyInThisRole ? (
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                              <Check className="h-3 w-3 stroke-[3]" />
                              Already in this role
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isActionPending}
                              onClick={() => handleAssignUserToRole(user)}
                              className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <ArrowRightLeft className="h-3 w-3" />
                              Transfer to {role.name}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 bg-muted/20 shrink-0">
          <div className="text-xs text-muted-foreground">
            Total users in role: <strong className="text-foreground">{users.length}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-background hover:bg-muted/50 border border-border/60 text-foreground rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Modal: Transfer Role */}
      {confirmTransfer.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border/80 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#E9C46A]/20 text-[#E9C46A] flex items-center justify-center shrink-0">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
              <h4 className="font-bold text-sm text-foreground">Confirm Role Transfer</h4>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to transfer{" "}
              <strong className="text-foreground">{confirmTransfer.user?.name}</strong> from{" "}
              <strong className="text-foreground">{role?.name}</strong> to{" "}
              <strong className="text-foreground">{confirmTransfer.targetRoleName}</strong>?
            </p>

            <div className="flex justify-end items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isActionPending}
                onClick={() =>
                  setConfirmTransfer({ isOpen: false, user: null, targetRoleKey: "", targetRoleName: "" })
                }
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionPending}
                onClick={handleExecuteTransfer}
                className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                {isActionPending ? "Transferring…" : "Confirm Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Disable / Enable Account */}
      {confirmDisable.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border/80 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmDisable.willBeActive
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                }`}
              >
                {confirmDisable.willBeActive ? (
                  <UserCheck className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
              </div>
              <h4 className="font-bold text-sm text-foreground">
                {confirmDisable.willBeActive ? "Enable Account Access" : "Disable Account Access"}
              </h4>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {confirmDisable.willBeActive ? (
                <>
                  Are you sure you want to enable account access for{" "}
                  <strong className="text-foreground">{confirmDisable.user?.name}</strong>? They will be able to
                  log in again immediately.
                </>
              ) : (
                <>
                  Are you sure you want to disable account access for{" "}
                  <strong className="text-foreground">{confirmDisable.user?.name}</strong>? They will be locked out
                  and unable to log into the portal until re-enabled.
                </>
              )}
            </p>

            <div className="flex justify-end items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isActionPending}
                onClick={() => setConfirmDisable({ isOpen: false, user: null, willBeActive: false })}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionPending}
                onClick={handleExecuteToggleStatus}
                className={`text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  confirmDisable.willBeActive
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isActionPending
                  ? "Updating…"
                  : confirmDisable.willBeActive
                  ? "Enable Account"
                  : "Disable Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
