"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  X,
  Search,
  Users,
  Shield,
  ArrowRightLeft,
  UserX,
  UserCheck,
  Check,
  Loader2,
  UserPlus,
  RefreshCw,
  Pencil,
} from "lucide-react"
import { toast } from "@/components/ui/toast"
import AddAdminUserDialog from "./AddAdminUserDialog"

// Base built-in system user roles in PEAK
const BASE_SYSTEM_USER_ROLES = [
  { role_key: "teacher", name: "Teacher", is_system: true },
  { role_key: "student", name: "Student (Reviewee)", is_system: true },
]

export function isSuperAdminUser(user) {
  if (!user) return false
  if (user.role === "super_admin" || user.role === "admin") return true
  if (user.id === 1 || user.userId === 1) return true
  const loginId = user.login_id || user.loginId
  if (typeof loginId === "string" && loginId.toLowerCase() === "admin00001") return true
  return false
}

export default function RoleUsersDialog({
  isOpen,
  onClose,
  role,
  allRoles = [],
  onRoleUpdated,
  currentUser: propCurrentUser = null
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

  const [currentUser, setCurrentUser] = useState(propCurrentUser)
  const [editingUser, setEditingUser] = useState(null)
  const [isActionPending, setIsActionPending] = useState(false)

  // Sync propCurrentUser if passed
  useEffect(() => {
    if (propCurrentUser) {
      setCurrentUser(propCurrentUser)
    }
  }, [propCurrentUser])

  // Fetch current user session to determine super admin rights if not passed
  useEffect(() => {
    if (propCurrentUser) return
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setCurrentUser(data.user)
      })
      .catch(console.error)
  }, [propCurrentUser])

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

  // Categorize selectable destination roles into System Roles and Custom Roles from currently existing roles
  const { systemRoles, customRoles, destinationRoles } = useMemo(() => {
    // 1. System Roles: Super Admin (from allRoles or fallback) + other is_system roles + standard user roles
    const superAdminRole = allRoles.find(
      (r) => r.role_key === "super_admin" || r.role_key === "admin"
    )
    const sysList = [
      {
        role_key: "super_admin",
        name: superAdminRole?.name || "Super Admin",
        is_system: true,
      },
    ]

    allRoles.forEach((r) => {
      if (
        r.is_system &&
        !["super_admin", "admin", "teacher", "student"].includes(r.role_key)
      ) {
        if (!sysList.some((item) => item.role_key === r.role_key)) {
          sysList.push({
            role_key: r.role_key,
            name: r.name,
            is_system: true,
          })
        }
      }
    })

    // Include standard user roles
    BASE_SYSTEM_USER_ROLES.forEach((ur) => {
      if (!sysList.some((item) => item.role_key === ur.role_key)) {
        sysList.push(ur)
      }
    })

    // 2. Custom Roles: All non-system roles currently existing in allRoles (Master Data)
    const custList = []
    allRoles.forEach((r) => {
      if (
        !r.is_system &&
        !["super_admin", "admin", "teacher", "student"].includes(r.role_key)
      ) {
        if (!custList.some((item) => item.role_key === r.role_key)) {
          custList.push({
            role_key: r.role_key,
            name: r.name,
            is_system: false,
          })
        }
      }
    })

    const allDest = [...sysList, ...custList]

    return {
      systemRoles: sysList,
      customRoles: custList,
      destinationRoles: allDest,
    }
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1E293B] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10 shrink-0 bg-white/50 dark:bg-white/[0.02]">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#3B3B3B] dark:text-white">
              {role?.name || "Role Users"}
            </h2>
            <p className="text-xs text-[#696969] dark:text-gray-400 mt-0.5">
              Manage accounts assigned to this role, transfer roles, or disable access.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchRoleUsers}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-[#3B3B3B] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Refresh User List"
            >
              <RefreshCw className={`size-4 ${isLoading ? "animate-spin text-[#E9C46A]" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-[#3B3B3B] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Dialog"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher: Assigned Users vs Transfer User Here */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] shrink-0 flex-wrap gap-2">
          {/* Minimal Tab Switcher Pill matching user management & master data */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F2F2F2]/80 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab("assigned")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === "assigned"
                  ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                  : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
              }`}
            >
              Assigned Users
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("assign_new")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === "assign_new"
                  ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                  : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
              }`}
            >
              Transfer User Here
            </button>
          </div>

          <span className="text-[11px] text-[#696969] dark:text-gray-400 hidden sm:inline-block">
            {activeTab === "assigned" ? "Click Transfer or Status to modify" : "Search any system account"}
          </span>
        </div>

        {/* Tab 1: Assigned Users */}
        {activeTab === "assigned" && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Search filter within assigned users */}
            <div className="px-6 py-3 border-b border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/[0.01] shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-[#696969] pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${users.length} assigned user${users.length === 1 ? "" : "s"} by name, email, or login ID…`}
                  className="w-full h-9.5 pl-9 pr-8 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#3B3B3B] dark:hover:text-white p-0.5 rounded cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List Table */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#696969]">
                  <Loader2 className="size-7 animate-spin text-[#E9C46A] mb-2" />
                  <p className="text-xs font-medium">Loading users assigned to {role?.name}…</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="size-12 rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center text-neutral-400 mb-3">
                    <Users className="size-6 opacity-40" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#3B3B3B] dark:text-white">
                    {search ? "No matching users found" : "No users assigned to this role"}
                  </h4>
                  <p className="text-xs text-[#696969] dark:text-gray-400 max-w-sm mt-1">
                    {search
                      ? `No user in "${role?.name}" matches "${search}".`
                      : `Currently there are no active users assigned to "${role?.name}". You can transfer existing users into this role using the "Transfer User Here" tab.`}
                  </p>
                  {!search && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("assign_new")}
                      className="mt-4 bg-[#E9C46A] hover:bg-[#dfb550] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <UserPlus className="size-3.5" />
                      Transfer a User to this Role
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-black/5 dark:divide-white/5">
                  {filteredUsers.map((user) => {
                    const isActive = user.is_active !== false
                    const isProtectedSuperAdmin = user.login_id?.toLowerCase() === "admin00001" || user.id === 1
                    const isTargetSuperAdmin = isSuperAdminUser(user)
                    const isCurrentSuperAdmin = !currentUser || isSuperAdminUser(currentUser)
                    const canEditThisUser = !isTargetSuperAdmin || isCurrentSuperAdmin

                    return (
                      <div
                        key={user.id}
                        className="px-6 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        {/* User Details */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name}
                              className="size-9 rounded-full object-cover border border-black/10 dark:border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="size-9 rounded-full bg-[#E9C46A]/15 border border-[#E9C46A]/25 text-[#b08826] dark:text-[#E9C46A] font-bold text-xs flex items-center justify-center shrink-0">
                              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs text-[#3B3B3B] dark:text-white truncate">
                                {user.name}
                              </span>
                              {/* Status pill matching batch management design */}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${
                                  isActive
                                    ? "bg-[#2A9D8F]/15 text-[#1b6b61] dark:bg-[#2A9D8F]/25 dark:text-[#68c9be]"
                                    : "bg-[#E17055]/15 text-[#b33920] dark:bg-[#E17055]/25 dark:text-[#f89b87]"
                                }`}
                              >
                                {isActive ? "Active" : "Disabled"}
                              </span>
                            </div>

                            {user.login_id && (
                              <p className="text-[11px] text-[#696969] dark:text-gray-400 mt-0.5">
                                {user.login_id}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions: Edit Profile, Transfer Role & Disable/Enable */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {canEditThisUser && (
                            <button
                              type="button"
                              onClick={() => setEditingUser(user)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              title="Edit user profile"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {!isProtectedSuperAdmin && (
                            <>
                              {/* Transfer Role Dropdown */}
                              <div className="flex items-center gap-1.5 font-sans">
                                <label className="text-[11px] text-[#696969] dark:text-gray-400 font-medium hidden md:inline font-sans">
                                  Transfer:
                                </label>
                                <select
                                  value={user.role || role.role_key}
                                  onChange={(e) => {
                                    const newKey = e.target.value
                                    if (newKey && newKey !== user.role && newKey !== role.role_key) {
                                      const targetObj = destinationRoles.find((r) => r.role_key === newKey)
                                      setConfirmTransfer({
                                        isOpen: true,
                                        user,
                                        targetRoleKey: newKey,
                                        targetRoleName: targetObj?.name || newKey
                                      })
                                    }
                                  }}
                                  className="h-8.5 text-xs px-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white shadow-2xs focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] cursor-pointer font-sans"
                                  title="Transfer user to another role"
                                >
                                  <option value={role.role_key} disabled className="font-sans text-neutral-400">
                                    (Current: {role.name})
                                  </option>

                                  {/* System Roles */}
                                  {systemRoles.filter((r) => r.role_key !== role.role_key).length > 0 && (
                                    <optgroup label="System Roles" className="font-sans font-semibold text-neutral-700 dark:text-neutral-200">
                                      {systemRoles
                                        .filter((r) => r.role_key !== role.role_key)
                                        .map((r) => (
                                          <option key={r.role_key} value={r.role_key} className="font-sans font-normal text-[#3B3B3B] dark:text-white">
                                            {r.name}
                                          </option>
                                        ))}
                                    </optgroup>
                                  )}

                                  {/* Custom Roles */}
                                  <optgroup label="Custom Roles" className="font-sans font-semibold text-neutral-700 dark:text-neutral-200">
                                    {customRoles.filter((r) => r.role_key !== role.role_key).length > 0 ? (
                                      customRoles
                                        .filter((r) => r.role_key !== role.role_key)
                                        .map((r) => (
                                          <option key={r.role_key} value={r.role_key} className="font-sans font-normal text-[#3B3B3B] dark:text-white">
                                            {r.name}
                                          </option>
                                        ))
                                    ) : (
                                      <option value="" disabled className="font-sans italic text-neutral-400">
                                        No custom roles available
                                      </option>
                                    )}
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
                                className={`h-8.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs active:scale-95 ${
                                  isActive
                                    ? "border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                                    : "border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                                }`}
                                title={isActive ? "Disable user login access" : "Enable user login access"}
                              >
                                {isActive ? (
                                  <>
                                    <UserX className="size-3.5" />
                                    <span>Disable</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="size-3.5" />
                                    <span>Enable</span>
                                  </>
                                )}
                              </button>
                            </>
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

        {/* Tab 2: Transfer User Here (System-wide search) */}
        {activeTab === "assign_new" && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Search Bar */}
            <div className="px-6 py-3 border-b border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/[0.01] shrink-0">
              <label className="text-xs font-semibold text-[#696969] dark:text-gray-400 block mb-1.5">
                Search any user to transfer into "{role?.name}":
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-[#696969] pointer-events-none" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Type name, email, or login ID (min. 2 characters)…"
                  autoFocus
                  className="w-full h-9.5 pl-9 pr-8 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                />
                {globalSearch && (
                  <button
                    type="button"
                    onClick={() => setGlobalSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#3B3B3B] dark:hover:text-white p-0.5 rounded cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Global Search Results List */}
            <div className="flex-1 overflow-y-auto">
              {isSearchingGlobal ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#696969]">
                  <Loader2 className="size-6 animate-spin text-[#E9C46A] mb-2" />
                  <p className="text-xs font-medium">Searching accounts…</p>
                </div>
              ) : !globalSearch.trim() || globalSearch.trim().length < 2 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-[#696969]">
                  <Search className="size-8 opacity-30 mb-2" />
                  <p className="text-xs font-medium">Type at least 2 characters to search across all registered users.</p>
                  <p className="text-[11px] opacity-70 mt-0.5">
                    You can quickly search students, teachers, coordinators, or admins to transfer into this role.
                  </p>
                </div>
              ) : globalResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-[#696969]">
                  <UserX className="size-8 opacity-30 mb-2" />
                  <p className="text-xs font-medium">No users matched "{globalSearch}".</p>
                </div>
              ) : (
                <div className="divide-y divide-black/5 dark:divide-white/5">
                  {globalResults.map((user) => {
                    const isAlreadyInThisRole =
                      user.role === role.role_key ||
                      (role.role_key === "super_admin" && user.role === "admin")

                    return (
                      <div
                        key={user.id}
                        className="px-6 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name}
                              className="size-9 rounded-full object-cover border border-black/10 dark:border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="size-9 rounded-full bg-[#E9C46A]/15 border border-[#E9C46A]/25 text-[#b08826] dark:text-[#E9C46A] font-bold text-xs flex items-center justify-center shrink-0">
                              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs text-[#3B3B3B] dark:text-white truncate">
                                {user.name}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-black/[0.05] dark:bg-white/[0.08] text-neutral-500 dark:text-neutral-400">
                                Current: {user.role_name || user.role}
                              </span>
                            </div>
                            {user.login_id && (
                              <p className="text-[11px] text-[#696969] dark:text-gray-400 mt-0.5">
                                {user.login_id}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {user.login_id?.toLowerCase() === "admin00001" || user.id === 1 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-black/[0.05] dark:bg-white/[0.08] text-neutral-500 dark:text-neutral-400">
                              Primary Super Admin
                            </span>
                          ) : isAlreadyInThisRole ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-[#2A9D8F]/15 text-[#1b6b61] dark:bg-[#2A9D8F]/25 dark:text-[#68c9be]">
                              Already in this role
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isActionPending}
                              onClick={() => handleAssignUserToRole(user)}
                              className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <ArrowRightLeft className="size-3.5" />
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
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] shrink-0">
          <div className="text-xs text-[#696969] dark:text-gray-400 font-medium">
            Total users in role: <strong className="text-[#3B3B3B] dark:text-white font-semibold">{users.length}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4.5 py-2 text-xs font-semibold bg-white dark:bg-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 text-[#3B3B3B] dark:text-white rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Modal: Transfer Role */}
      {confirmTransfer.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E293B] border border-black/10 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-[#E9C46A]/15 text-[#b08826] dark:text-[#E9C46A] flex items-center justify-center shrink-0">
                <ArrowRightLeft className="size-4.5" />
              </div>
              <h4 className="font-bold text-sm text-[#3B3B3B] dark:text-white">Confirm Role Transfer</h4>
            </div>

            <p className="text-xs text-[#696969] dark:text-gray-400 leading-relaxed">
              Are you sure you want to transfer{" "}
              <strong className="text-[#3B3B3B] dark:text-white font-semibold">{confirmTransfer.user?.name}</strong> from{" "}
              <strong className="text-[#3B3B3B] dark:text-white font-semibold">{role?.name}</strong> to{" "}
              <strong className="text-[#3B3B3B] dark:text-white font-semibold">{confirmTransfer.targetRoleName}</strong>?
            </p>

            <div className="flex justify-end items-center gap-2 pt-2 border-t border-black/5 dark:border-white/10">
              <button
                type="button"
                disabled={isActionPending}
                onClick={() => setConfirmTransfer({ isOpen: false, user: null, targetRoleKey: "", targetRoleName: "" })}
                className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-[#3B3B3B] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionPending}
                onClick={handleExecuteTransfer}
                className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                {isActionPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                <span>Confirm Transfer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Enable/Disable Account */}
      {confirmDisable.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E293B] border border-black/10 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div
                className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmDisable.willBeActive
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                }`}
              >
                {confirmDisable.willBeActive ? <UserCheck className="size-4.5" /> : <UserX className="size-4.5" />}
              </div>
              <h4 className="font-bold text-sm text-[#3B3B3B] dark:text-white">
                {confirmDisable.willBeActive ? "Enable Account Access" : "Disable Account Access"}
              </h4>
            </div>

            <p className="text-xs text-[#696969] dark:text-gray-400 leading-relaxed">
              {confirmDisable.willBeActive
                ? `Enable login access for "${confirmDisable.user?.name}"? The user will be able to log in to the system again.`
                : `Are you sure you want to disable login access for "${confirmDisable.user?.name}"? They will be immediately blocked from signing in.`}
            </p>

            <div className="flex justify-end items-center gap-2 pt-2 border-t border-black/5 dark:border-white/10">
              <button
                type="button"
                disabled={isActionPending}
                onClick={() => setConfirmDisable({ isOpen: false, user: null, willBeActive: false })}
                className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-[#3B3B3B] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionPending}
                onClick={handleExecuteToggleStatus}
                className={`text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  confirmDisable.willBeActive
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isActionPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : confirmDisable.willBeActive ? (
                  <UserCheck className="size-3.5" />
                ) : (
                  <UserX className="size-3.5" />
                )}
                <span>{confirmDisable.willBeActive ? "Enable Account" : "Disable Account"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin User Dialog */}
      {editingUser && (
        <AddAdminUserDialog
          isOpen={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          roles={allRoles}
          userToEdit={editingUser}
          onUserUpdated={async () => {
            setEditingUser(null)
            await fetchRoleUsers()
            if (onRoleUpdated) onRoleUpdated()
          }}
        />
      )}
    </div>
  )
}
