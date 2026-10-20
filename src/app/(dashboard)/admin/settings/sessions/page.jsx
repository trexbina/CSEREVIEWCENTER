"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Laptop,
  Smartphone,
  Tablet,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  Copy,
  LogOut,
  X,
  Loader2,
  AlertCircle
} from "lucide-react"
import { toast } from "@/components/ui/toast"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from "@/components/ui/select"

export default function ActiveSessionsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanTime, setLastScanTime] = useState(null)
  const [canAccess, setCanAccess] = useState(true)
  const [sessions, setSessions] = useState([])
  const [settings, setSettings] = useState({
    single_session_enabled: true
  })

  // Filter & Search states
  const [search, setSearch] = useState("")
  const [concurrencyFilter, setConcurrencyFilter] = useState("all") // 'all' | 'concurrent' | 'single'
  const [roleFilter, setRoleFilter] = useState("all")
  const [deviceFilter, setDeviceFilter] = useState("all") // 'all' | 'desktop' | 'mobile' | 'tablet'

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Modal states for revocation confirmation
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'single' | 'user_concurrent' | 'all_concurrent' | 'batch'
    session: null,
    title: "",
    description: "",
    count: 0
  })
  const [revoking, setRevoking] = useState(false)
  const [copiedIp, setCopiedIp] = useState(null)

  // Fetch security and session data on demand
  const fetchData = async (isManualScan = false) => {
    if (isManualScan) setIsScanning(true)
    try {
      const res = await fetch("/api/admin/settings/security")
      if (res.ok) {
        const data = await res.json()
        if (data.canAccessSecurityPolicies === false) {
          setCanAccess(false)
        } else {
          setCanAccess(true)
          if (data.sessions) setSessions(data.sessions)
          if (data.settings) setSettings(data.settings)
          setLastScanTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
          if (isManualScan) toast("Active devices scan complete.")
        }
      } else {
        setCanAccess(false)
      }
    } catch (err) {
      console.error("Failed to load sessions:", err)
      toast("Failed to scan active sessions.")
    } finally {
      setLoading(false)
      setRefreshing(false)
      setIsScanning(false)
    }
  }

  // Only scan once upon opening page (no auto-polling in background)
  useEffect(() => {
    fetchData(false)
  }, [])

  // Toggle single session enforcement policy
  const handleToggleSingleSession = async (val) => {
    setSettings((prev) => ({ ...prev, single_session_enabled: val }))
    try {
      await fetch("/api/admin/settings/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_settings",
          single_session_enabled: val
        })
      })
      toast(val ? "Single-session policy enabled." : "Single-session policy disabled.")
    } catch (err) {
      console.error(err)
      toast("Failed to update policy.")
    }
  }

  // Copy IP address helper
  const handleCopyIp = (ip) => {
    if (!ip) return
    navigator.clipboard.writeText(ip)
    setCopiedIp(ip)
    toast(`Copied IP: ${ip}`)
    setTimeout(() => setCopiedIp(null), 2000)
  }

  // Compute metrics
  const metrics = useMemo(() => {
    const totalSessions = sessions.length
    const uniqueUserIds = new Set(sessions.map((s) => s.userId || s.name))
    const totalUsers = uniqueUserIds.size

    // User session counts
    const userCounts = {}
    sessions.forEach((s) => {
      const key = s.userId || s.name
      userCounts[key] = (userCounts[key] || 0) + 1
    })

    const concurrentUsers = Object.keys(userCounts).filter((k) => userCounts[k] > 1)
    const concurrentSessionsCount = sessions.filter((s) => (userCounts[s.userId || s.name] || 0) > 1).length
    const excessSessionsCount = Object.values(userCounts).reduce((acc, c) => acc + (c > 1 ? c - 1 : 0), 0)

    return {
      totalSessions,
      totalUsers,
      concurrentUserCount: concurrentUsers.length,
      concurrentSessionsCount,
      excessSessionsCount,
      singleDeviceCount: totalUsers - concurrentUsers.length
    }
  }, [sessions])

  // Filtered session list
  const filteredSessions = useMemo(() => {
    const q = search.toLowerCase().trim()

    return sessions.filter((s) => {
      // Search match
      const matchSearch =
        !q ||
        (s.name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.login_id || "").toLowerCase().includes(q) ||
        (s.ip || "").toLowerCase().includes(q) ||
        (s.device || "").toLowerCase().includes(q) ||
        (s.location || "").toLowerCase().includes(q)

      // Concurrency filter
      const matchConcurrency =
        concurrencyFilter === "all"
          ? true
          : concurrencyFilter === "concurrent"
          ? s.isConcurrent
          : !s.isConcurrent

      // Role filter
      const matchRole =
        roleFilter === "all" ? true : String(s.role || "").toLowerCase() === roleFilter.toLowerCase()

      // Device type filter
      const matchDevice =
        deviceFilter === "all"
          ? true
          : String(s.deviceType || "").toLowerCase() === deviceFilter.toLowerCase()

      return matchSearch && matchConcurrency && matchRole && matchDevice
    })
  }, [sessions, search, concurrencyFilter, roleFilter, deviceFilter])

  // Selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      // Select all non-current sessions
      const selectableIds = filteredSessions.filter((s) => !s.isCurrent).map((s) => s.id)
      setSelectedIds(new Set(selectableIds))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Revocation actions
  const openRevokeSingle = (session) => {
    setConfirmModal({
      isOpen: true,
      type: "single",
      session,
      title: "Revoke Active Session",
      description: `Are you sure you want to terminate the session on ${session.device} for ${session.name}? The user will be logged out of this device immediately.`,
      count: 1
    })
  }

  const openRevokeUserConcurrent = (session) => {
    const otherCount = (session.deviceCount || 2) - 1
    setConfirmModal({
      isOpen: true,
      type: "user_concurrent",
      session,
      title: `Revoke Other Devices for ${session.name}`,
      description: `This will terminate ${otherCount} other concurrent device session(s) for ${session.name}, leaving only 1 active session.`,
      count: otherCount
    })
  }

  const openRevokeBatch = () => {
    if (selectedIds.size === 0) return
    setConfirmModal({
      isOpen: true,
      type: "batch",
      session: null,
      title: `Revoke ${selectedIds.size} Selected Sessions`,
      description: `Are you sure you want to terminate all ${selectedIds.size} selected device sessions? The affected users will be logged out immediately.`,
      count: selectedIds.size
    })
  }

  const openRevokeAllConcurrent = () => {
    setConfirmModal({
      isOpen: true,
      type: "all_concurrent",
      session: null,
      title: "Revoke All Concurrent Sessions",
      description: `This will terminate all ${metrics.excessSessionsCount} excess concurrent devices across the system, ensuring every user has at most one active device in compliance with your single-session policy.`,
      count: metrics.excessSessionsCount
    })
  }

  const handleExecuteRevoke = async () => {
    setRevoking(true)
    try {
      let body = {}
      if (confirmModal.type === "single" && confirmModal.session) {
        body = {
          action: "terminate_session",
          sessionId: confirmModal.session.id,
          userName: confirmModal.session.name,
          targetUserId: confirmModal.session.userId
        }
      } else if (confirmModal.type === "user_concurrent" && confirmModal.session) {
        body = {
          action: "terminate_user_concurrent",
          userId: confirmModal.session.userId,
          userName: confirmModal.session.name
        }
      } else if (confirmModal.type === "batch") {
        body = {
          action: "terminate_batch",
          sessionIds: Array.from(selectedIds)
        }
      } else if (confirmModal.type === "all_concurrent") {
        body = {
          action: "terminate_all_concurrent"
        }
      }

      const res = await fetch("/api/admin/settings/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        toast("Session(s) revoked successfully.")
        setSelectedIds(new Set())
        setConfirmModal({ isOpen: false, type: null, session: null, title: "", description: "", count: 0 })
        fetchData()
      } else {
        toast("Failed to revoke session(s).")
      }
    } catch (err) {
      console.error(err)
      toast("Error executing session revocation.")
    } finally {
      setRevoking(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <p className="text-xs text-muted-foreground">Loading active sessions & concurrency monitor…</p>
      </div>
    )
  }

  if (!canAccess) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="size-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-foreground">Access Restricted</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          You do not have the required permissions to view or manage Security & Access Policies.
        </p>
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Settings
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans animate-in fade-in duration-200">
      {/* ── Top Navigation & Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/5 dark:border-white/10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-foreground hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to System Settings</span>
            </Link>
            <span className="text-xs text-muted-foreground font-medium">/</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Security &amp; Access Policies
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Active User Sessions &amp; Concurrency Monitor
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Monitoring
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            View simultaneous logins in table format, enforce single-device rules, and detect unauthorized account sharing in real time.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isScanning}
            className="h-9 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-semibold text-foreground hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
            title="Scan active connections and concurrent devices"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? "animate-spin text-amber-500" : ""}`} />
            <span>{isScanning ? "Scanning Devices…" : "Scan / Refresh"}</span>
          </button>

          {metrics.excessSessionsCount > 0 && (
            <button
              type="button"
              onClick={openRevokeAllConcurrent}
              className="h-9 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Revoke All Concurrent ({metrics.excessSessionsCount})</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-black/10 dark:border-white/10">
            <span className="text-xs font-medium text-muted-foreground">Single Session:</span>
            <Switch
              checked={settings.single_session_enabled}
              onCheckedChange={handleToggleSingleSession}
              aria-label="Toggle single session enforcement"
            />
          </div>
        </div>
      </div>

      {/* ── Scanning Status Banner ── */}
      {isScanning ? (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300 animate-pulse">
          <RefreshCw className="h-4 w-4 animate-spin text-amber-600 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Scanning Active Connections…</span> Analyzing live device tokens, checking IP origins, and verifying single-session compliance across all student and staff accounts.
          </div>
        </div>
      ) : lastScanTime ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 rounded-xl bg-neutral-100/70 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Scan completed at <strong>{lastScanTime}</strong></span>
            <span>&bull;</span>
            <span><strong>{metrics.totalSessions}</strong> live sessions analyzed</span>
            {metrics.concurrentUserCount > 0 ? (
              <span className="text-amber-700 dark:text-amber-400 font-semibold">
                &bull; {metrics.concurrentUserCount} accounts flagged for concurrency
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                &bull; 100% compliant with single-session policy
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fetchData(true)}
            className="font-semibold text-foreground hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="h-2.5 w-2.5" /> Re-scan network
          </button>
        </div>
      ) : null}

      {/* ── Metric Summary Strip ("div full rounded") ── */}
      <div className="w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black/5 dark:divide-white/5">
          {/* 1. Total Active Sessions */}
          <div
            className={`flex flex-col justify-between select-none group/card cursor-pointer transition-colors ${
              concurrencyFilter === "all"
                ? "bg-black/[0.03] dark:bg-white/[0.06]"
                : "hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
            }`}
            onClick={() => setConcurrencyFilter("all")}
          >
            <div className="px-4 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                Total Active Sessions
              </span>
              <Laptop className="h-3.5 w-3.5 text-neutral-500" />
            </div>
            <div className="p-4 sm:p-5 pt-3">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                {metrics.totalSessions}
              </div>
              <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
                Active device tokens currently online
              </p>
            </div>
          </div>

          {/* 2. Unique Users Online */}
          <div className="flex flex-col justify-between select-none">
            <div className="px-4 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between border-b border-black/5 dark:divide-white/5 bg-emerald-500/10">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Unique Users Online
              </span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="p-4 sm:p-5 pt-3">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
                {metrics.totalUsers}
              </div>
              <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
                Distinct student and staff accounts
              </p>
            </div>
          </div>

          {/* 3. Concurrent Flagged Accounts */}
          <div
            className={`flex flex-col justify-between select-none group/card cursor-pointer transition-colors ${
              concurrencyFilter === "concurrent"
                ? "bg-amber-500/10"
                : "hover:bg-amber-500/5"
            }`}
            onClick={() => setConcurrencyFilter("concurrent")}
          >
            <div className="px-4 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between border-b border-amber-500/20 bg-amber-500/15">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                {metrics.concurrentUserCount > 0 && (
                  <span className="size-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                )}
                Multiple Concurrency Flagged
              </span>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="p-4 sm:p-5 pt-3">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {metrics.concurrentUserCount}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  ({metrics.excessSessionsCount} excess)
                </span>
              </div>
              <p className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-400/80 truncate">
                Accounts with &gt; 1 simultaneous device
              </p>
            </div>
          </div>

          {/* 4. Single-Device Accounts */}
          <div
            className={`flex flex-col justify-between select-none group/card cursor-pointer transition-colors ${
              concurrencyFilter === "single"
                ? "bg-black/[0.03] dark:bg-white/[0.06]"
                : "hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
            }`}
            onClick={() => setConcurrencyFilter("single")}
          >
            <div className="px-4 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between border-b border-black/5 dark:divide-white/5 bg-sky-500/10">
              <span className="text-xs font-semibold text-sky-800 dark:text-sky-300">
                Compliant (Single Device)
              </span>
              <Smartphone className="h-3.5 w-3.5 text-sky-600" />
            </div>
            <div className="p-4 sm:p-5 pt-3">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-700 dark:text-sky-400">
                {metrics.singleDeviceCount}
              </div>
              <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
                Accounts following 1-device policy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Concurrency Alert Banner ── */}
      {metrics.concurrentUserCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Multiple Concurrency Violation Detected ({metrics.concurrentUserCount} Accounts)
              </p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                {metrics.concurrentUserCount} users are currently signed in from {metrics.concurrentSessionsCount} devices simultaneously ({metrics.excessSessionsCount} excess sessions).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {concurrencyFilter !== "concurrent" && (
              <button
                type="button"
                onClick={() => setConcurrencyFilter("concurrent")}
                className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-white/60 dark:bg-black/20 hover:bg-white text-xs font-semibold text-amber-900 dark:text-amber-200 transition-colors cursor-pointer"
              >
                Filter Concurrent Only
              </button>
            )}
            <button
              type="button"
              onClick={openRevokeAllConcurrent}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              Revoke All Duplicate Devices
            </button>
          </div>
        </div>
      )}

      {/* ── Filter Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* Concurrency Segmented Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#F2F2F2]/80 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
            <button
              type="button"
              onClick={() => setConcurrencyFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                concurrencyFilter === "all"
                  ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                  : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B]"
              }`}
            >
              All Sessions ({metrics.totalSessions})
            </button>
            <button
              type="button"
              onClick={() => setConcurrencyFilter("concurrent")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                concurrencyFilter === "concurrent"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              }`}
            >
              {metrics.concurrentUserCount > 0 && <span className="size-1.5 rounded-full bg-current animate-ping" />}
              Concurrent Only ({metrics.concurrentSessionsCount})
            </button>
            <button
              type="button"
              onClick={() => setConcurrencyFilter("single")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                concurrencyFilter === "single"
                  ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                  : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B]"
              }`}
            >
              Single Device ({metrics.singleDeviceCount})
            </button>
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger
              aria-label="Filter by role"
              className="h-9 px-3 rounded-xl border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-xs font-semibold text-[#696969] dark:text-gray-300 shadow-2xs focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20"
            >
              <span>
                {roleFilter === "all" && "All Roles"}
                {roleFilter === "student" && "Students Only"}
                {roleFilter === "admin" && "Admins Only"}
                {roleFilter === "teacher" && "Teachers Only"}
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
              <SelectItem value="all" className="text-xs">All Roles</SelectItem>
              <SelectItem value="student" className="text-xs">Students Only</SelectItem>
              <SelectItem value="admin" className="text-xs">Admins Only</SelectItem>
              <SelectItem value="teacher" className="text-xs">Teachers Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Device Type Filter */}
          <Select value={deviceFilter} onValueChange={setDeviceFilter}>
            <SelectTrigger
              aria-label="Filter by device type"
              className="h-9 px-3 rounded-xl border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-xs font-semibold text-[#696969] dark:text-gray-300 shadow-2xs focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20"
            >
              <span>
                {deviceFilter === "all" && "All Devices"}
                {deviceFilter === "desktop" && "Desktops / Laptops"}
                {deviceFilter === "mobile" && "Mobile Phones"}
                {deviceFilter === "tablet" && "Tablets / iPads"}
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
              <SelectItem value="all" className="text-xs">All Devices</SelectItem>
              <SelectItem value="desktop" className="text-xs">Desktops / Laptops</SelectItem>
              <SelectItem value="mobile" className="text-xs">Mobile Phones</SelectItem>
              <SelectItem value="tablet" className="text-xs">Tablets / iPads</SelectItem>
            </SelectContent>
          </Select>

          {/* Bulk Revoke Button */}
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={openRevokeBatch}
              className="h-9 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Revoke Selected ({selectedIds.size})</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px] flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#696969]" />
          <input
            type="search"
            placeholder="Search by user, email, ID, IP or device…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/60 focus:outline-none focus:ring-1 focus:ring-neutral-400"
          />
        </div>
      </div>

      {/* ── Sessions Table Form ── */}
      <div className="w-full overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/10 font-semibold text-[#696969]/80 dark:text-gray-400 bg-[#F2F2F2]/80 dark:bg-[#14161b]/90 backdrop-blur-xs">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    aria-label="Select all sessions"
                    checked={
                      filteredSessions.filter((s) => !s.isCurrent).length > 0 &&
                      filteredSessions.filter((s) => !s.isCurrent).every((s) => selectedIds.has(s.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="size-3.5 rounded border-black/20 accent-[#E9C46A] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-semibold">User Account</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Device &amp; Browser</th>
                <th className="py-3 px-4 font-semibold">IP Address &amp; Location</th>
                <th className="py-3 px-4 font-semibold">Login Timestamp</th>
                <th className="py-3 px-4 font-semibold">Concurrency Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ShieldCheck className="h-8 w-8 text-muted-foreground/40" />
                      <p className="font-medium text-xs">No active sessions match your current filter.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("")
                          setConcurrencyFilter("all")
                          setRoleFilter("all")
                          setDeviceFilter("all")
                        }}
                        className="text-xs text-[#E9C46A] hover:underline font-semibold cursor-pointer"
                      >
                        Reset all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((sess) => {
                  const isChecked = selectedIds.has(sess.id)
                  const isConcurrent = sess.isConcurrent
                  const isCurrent = sess.isCurrent

                  return (
                    <tr
                      key={sess.id}
                      className={`transition-colors ${
                        isCurrent
                          ? "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]"
                          : isConcurrent
                          ? "bg-amber-500/[0.04] dark:bg-amber-500/[0.06]"
                          : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        {!isCurrent && (
                          <input
                            type="checkbox"
                            aria-label={`Select session for ${sess.name}`}
                            checked={isChecked}
                            onChange={() => handleSelectOne(sess.id)}
                            className="size-3.5 rounded border-black/20 accent-[#E9C46A] cursor-pointer"
                          />
                        )}
                      </td>

                      {/* User Account */}
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`size-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                              isCurrent
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : isConcurrent
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                            }`}
                          >
                            {(sess.name || "U")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground truncate">{sess.name}</span>
                              {sess.login_id && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                                  {sess.login_id}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">{sess.email || "No email"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            sess.role === "admin" || sess.role === "super_admin"
                              ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                              : sess.role === "teacher"
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700"
                          }`}
                        >
                          {sess.role}
                        </span>
                      </td>

                      {/* Device & Browser */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                            {sess.deviceType === "mobile" ? (
                              <Smartphone className="h-3.5 w-3.5" />
                            ) : sess.deviceType === "tablet" ? (
                              <Tablet className="h-3.5 w-3.5" />
                            ) : (
                              <Laptop className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-xs">{sess.device}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                              {sess.deviceType || "desktop"} client
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* IP Address & Location */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs text-foreground bg-muted/40 px-1 rounded">
                              {sess.ip}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopyIp(sess.ip)}
                              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              title="Copy IP"
                            >
                              {copiedIp === sess.ip ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{sess.location || "Philippines"}</p>
                        </div>
                      </td>

                      {/* Login Timestamp */}
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">
                            {new Date(sess.loginTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(sess.loginTime).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric"
                          })}
                        </p>
                      </td>

                      {/* Concurrency Status */}
                      <td className="py-3.5 px-4">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Current Session (You)
                          </span>
                        ) : isConcurrent ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                              <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                              CONCURRENT ({sess.deviceCount} Devices)
                            </span>
                            <p className="text-[10px] text-amber-800/80 dark:text-amber-400/80 pl-0.5">
                              Device {sess.deviceIndex} of {sess.deviceCount}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/5">
                            Single Device
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isCurrent ? (
                          <span className="text-[11px] text-muted-foreground italic">Protected (You)</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openRevokeSingle(sess)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-black/10 dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400 text-neutral-700 dark:text-gray-300 transition-colors cursor-pointer"
                              title="Revoke only this device"
                            >
                              Revoke
                            </button>

                            {isConcurrent && (
                              <button
                                type="button"
                                onClick={() => openRevokeUserConcurrent(sess)}
                                className="px-2 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 transition-colors cursor-pointer"
                                title="Revoke all other devices for this user"
                              >
                                Revoke Others
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-6 py-3 border-t border-black/5 dark:border-white/5 bg-[#F2F2F2]/40 dark:bg-white/[0.02] text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong>{filteredSessions.length}</strong> of <strong>{sessions.length}</strong> active device sessions
            </span>
            {metrics.concurrentUserCount > 0 && (
              <span className="text-amber-700 dark:text-amber-400 font-medium">
                &bull; {metrics.concurrentUserCount} accounts flagged for concurrency
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                  <LogOut className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-foreground text-sm">{confirmModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: null, session: null, title: "", description: "", count: 0 })}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{confirmModal.description}</p>

            {confirmModal.session && (
              <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User:</span>
                  <span className="font-semibold text-foreground">{confirmModal.session.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Device:</span>
                  <span className="text-foreground">{confirmModal.session.device}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP Address:</span>
                  <span className="text-[11px] text-foreground">{confirmModal.session.ip}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                disabled={revoking}
                onClick={() => setConfirmModal({ isOpen: false, type: null, session: null, title: "", description: "", count: 0 })}
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revoking}
                onClick={handleExecuteRevoke}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {revoking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                <span>Confirm Revoke</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
