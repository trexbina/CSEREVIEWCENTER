"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Settings } from "@/components/animate-ui/icons/settings"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Switch } from "@/components/ui/switch"
import {
    X,
    Loader2,
    Laptop,
    Smartphone,
    Tablet,
    KeyRound,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    RefreshCw,
    AlertTriangle,
    ShieldAlert
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"

export default function SystemSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [canAccessSecurity, setCanAccessSecurity] = useState(false)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        single_session_enabled: true,
        audit_logging_enabled: true,
        watermark_enabled: true,
        watermark_text: "{name} - {email}",
        watermark_opacity: 15
    })
    const [auditLogs, setAuditLogs] = useState([])
    const [sessions, setSessions] = useState([])

    // Scanning & on-demand inspection states
    const [isScanningSessions, setIsScanningSessions] = useState(false)
    const [isScanningLogs, setIsScanningLogs] = useState(false)
    const [lastSessionScan, setLastSessionScan] = useState(null)
    const [showSessionsTable, setShowSessionsTable] = useState(false)

    // Change Password States
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordFeedback, setPasswordFeedback] = useState(null)

    // Active Modals
    const [activeModal, setActiveModal] = useState(null) // 'sessions' | 'logs' | 'watermark' | null
    const [watermarkForm, setWatermarkForm] = useState({
        watermark_text: "{name} - {email}",
        watermark_opacity: 15
    })

    // Fetch initial security data
    const fetchSecurityData = async () => {
        try {
            const res = await fetch("/api/admin/settings/security")
            if (res.ok) {
                const data = await res.json()
                if (data.canAccessSecurityPolicies === false) {
                    setCanAccessSecurity(false)
                } else {
                    setCanAccessSecurity(true)
                    if (data.settings) {
                        setSettings(data.settings)
                        setWatermarkForm({
                            watermark_text: data.settings.watermark_text || "{name} - {email}",
                            watermark_opacity: data.settings.watermark_opacity ?? 15
                        })
                    }
                    if (data.logs) setAuditLogs(data.logs)
                    if (data.sessions) setSessions(data.sessions)
                }
            } else {
                setCanAccessSecurity(false)
            }
        } catch (err) {
            console.error("Failed to load security settings:", err)
            setCanAccessSecurity(false)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSecurityData()
    }, [])

    // Explicit on-demand scan for active user sessions
    const handleScanSessions = async () => {
        setIsScanningSessions(true)
        try {
            const res = await fetch("/api/admin/settings/security")
            if (res.ok) {
                const data = await res.json()
                if (data.sessions) setSessions(data.sessions)
                if (data.settings) setSettings(data.settings)
                setLastSessionScan(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
                toast("Active session scan completed.")
            }
        } catch (err) {
            console.error("Failed to scan sessions:", err)
            toast("Error scanning sessions.")
        } finally {
            setIsScanningSessions(false)
        }
    }

    // Explicit on-demand scan for audit logs
    const handleScanAuditLogs = async () => {
        setIsScanningLogs(true)
        try {
            const res = await fetch("/api/admin/settings/security")
            if (res.ok) {
                const data = await res.json()
                if (data.logs) setAuditLogs(data.logs)
                toast("Audit logs refreshed.")
            }
        } catch {
            toast("Error scanning audit logs.")
        } finally {
            setIsScanningLogs(false)
        }
    }

    // Calculate number of accounts with multiple concurrent devices
    const concurrentUserCount = useMemo(() => {
        const userCounts = {}
        sessions.forEach(s => {
            const key = s.userId || s.name
            userCounts[key] = (userCounts[key] || 0) + 1
        })
        return Object.values(userCounts).filter(c => c > 1).length
    }, [sessions])

    // Update toggle state & persist to API
    const handleToggle = async (key, value) => {
        const updated = { ...settings, [key]: value }
        setSettings(updated)

        try {
            await fetch("/api/admin/settings/security", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update_settings",
                    ...updated
                })
            })
        } catch (err) {
            console.error("Failed to save toggle setting:", err)
        }
    }

    // Save watermark settings modal
    const handleSaveWatermark = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const updated = { ...settings, ...watermarkForm }
            await fetch("/api/admin/settings/security", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update_settings",
                    ...updated
                })
            })
            setSettings(updated)
            setActiveModal(null)
        } catch (err) {
            console.error("Failed to save watermark settings:", err)
        } finally {
            setSaving(false)
        }
    }

    // Terminate session
    const handleTerminateSession = async (sessionItem) => {
        try {
            await fetch("/api/admin/settings/security", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "terminate_session",
                    sessionId: sessionItem.id,
                    userName: sessionItem.name,
                    targetUserId: sessionItem.userId || sessionItem.id
                })
            })
            setSessions(prev => prev.filter(s => s.id !== sessionItem.id))
            toast(`Terminated session for ${sessionItem.name}.`)
        } catch (err) {
            console.error("Failed to terminate session:", err)
            toast("Failed to terminate session.")
        }
    }

    // Handle Password Change
    const handleChangePassword = async (e) => {
        e.preventDefault()
        setPasswordFeedback(null)

        if (!currentPassword || !currentPassword.trim()) {
            setPasswordFeedback({
                type: "error",
                message: "Current password is required."
            })
            return
        }

        if (!newPassword || newPassword.trim().length < 6) {
            setPasswordFeedback({
                type: "error",
                message: "New password must be at least 6 characters long."
            })
            return
        }

        if (newPassword !== confirmPassword) {
            setPasswordFeedback({
                type: "error",
                message: "New password and retype password do not match."
            })
            return
        }

        setPasswordLoading(true)
        try {
            const res = await fetch("/api/user/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: currentPassword.trim(),
                    newPassword: newPassword.trim(),
                    confirmPassword: confirmPassword.trim()
                })
            })

            const data = await res.json()

            if (!res.ok) {
                setPasswordFeedback({
                    type: "error",
                    message: data.error || "Failed to update password."
                })
                return
            }

            setPasswordFeedback({
                type: "success",
                message: "Password changed successfully."
            })
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } catch {
            setPasswordFeedback({
                type: "error",
                message: "Network error occurred. Please try again."
            })
        } finally {
            setPasswordLoading(false)
        }
    }

    return (
        <div className="space-y-8 w-full max-w-6xl mx-auto px-4 py-4 pb-16">
            {/* Page Header with Icon in Title only */}
            <div className="border-b border-border pb-5">
                <div className="flex items-center gap-2.5">
                    <Settings className="h-6 w-6 text-[#E9C46A]" animateOnHover />
                    <h1 className="text-2xl font-bold tracking-wider text-foreground uppercase">
                        SYSTEM SETTINGS
                    </h1>
                </div>
            </div>

            <div className="space-y-8">
                {/* Display / Theme */}
                <div className="pb-8 border-b border-border/60">
                    <div className="mb-3">
                        <h2 className="text-base font-bold uppercase tracking-wider text-foreground">
                            Display Theme
                        </h2>
                    </div>
                    <div className="pt-1">
                        <ThemeSwitcher />
                    </div>
                </div>

                {/* Security & Access Control — Restricted to Super Admin and authorized roles */}
                {canAccessSecurity && (
                    <div className="pb-8 border-b border-border/60 animate-in fade-in duration-200">
                        <div className="mb-4">
                            <h2 className="text-base font-bold uppercase tracking-wider text-foreground">
                                Security &amp; Access Policies
                            </h2>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Manage user login rules, activity history, and study material protection.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* 1. Session Monitoring Card */}
                            <div className="rounded-xl border border-border/80 bg-card p-5 space-y-3.5 shadow-xs flex flex-col justify-between relative overflow-hidden">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-foreground">
                                                Session Monitoring
                                            </span>
                                            {isScanningSessions && (
                                                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse">
                                                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> Scanning…
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleScanSessions}
                                                disabled={isScanningSessions}
                                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                                title="Scan active user sessions on demand"
                                            >
                                                <RefreshCw className={`h-3.5 w-3.5 ${isScanningSessions ? "animate-spin text-amber-500" : ""}`} />
                                            </button>
                                            <Switch
                                                checked={settings.single_session_enabled}
                                                onCheckedChange={(val) => handleToggle("single_session_enabled", val)}
                                                aria-label="Toggle Single Session Enforcement"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Prevents account sharing by allowing only one device to be logged in at a time.
                                    </p>

                                    {/* Dynamic Scanning Status & Concurrency Indicator */}
                                    <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                                        {sessions.length > 0 ? (
                                            <>
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] font-semibold">
                                                    <Laptop className="h-3 w-3 text-neutral-500" />
                                                    {sessions.length} active sessions
                                                </span>
                                                {concurrentUserCount > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[11px] font-bold border border-amber-500/20">
                                                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                                                        {concurrentUserCount} concurrent flagged
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        100% Single Device
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-[11px] text-muted-foreground italic">
                                                Press scan icon to detect live devices
                                            </span>
                                        )}
                                    </div>
                                    {lastSessionScan && (
                                        <p className="text-[10px] text-muted-foreground/70">
                                            Last scanned: {lastSessionScan}
                                        </p>
                                    )}
                                </div>

                                <div className="pt-2.5 flex items-center justify-between border-t border-border/60 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setShowSessionsTable(prev => !prev)}
                                        className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-foreground hover:underline cursor-pointer flex items-center gap-1"
                                    >
                                        <span>{showSessionsTable ? "Hide Quick Table" : "Show Quick Table"}</span>
                                    </button>
                                    <Link
                                        href="/admin/settings/sessions"
                                        className="text-xs font-semibold text-foreground hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>Full Table Page</span>
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </div>

                            {/* 2. Access & Audit Logs Card */}
                            <div className="rounded-xl border border-border/80 bg-card p-5 space-y-3.5 shadow-xs flex flex-col justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-foreground">
                                                Audit &amp; Auth Logs
                                            </span>
                                            {isScanningLogs && (
                                                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 animate-pulse">
                                                    Scanning…
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleScanAuditLogs}
                                                disabled={isScanningLogs}
                                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                                title="Scan latest audit events on demand"
                                            >
                                                <RefreshCw className={`h-3.5 w-3.5 ${isScanningLogs ? "animate-spin text-blue-500" : ""}`} />
                                            </button>
                                            <Switch
                                                checked={settings.audit_logging_enabled}
                                                onCheckedChange={(val) => handleToggle("audit_logging_enabled", val)}
                                                aria-label="Toggle Security Audit Logging"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Keeps a history of logins, role changes, and system activities.
                                    </p>
                                    <div className="pt-1 text-[11px] text-muted-foreground">
                                        {auditLogs.length} audit trail records logged
                                    </div>
                                </div>

                                <div className="pt-2.5 flex items-center justify-end border-t border-border/60">
                                    <button
                                        type="button"
                                        onClick={() => setActiveModal("logs")}
                                        className="text-xs font-semibold text-foreground hover:underline cursor-pointer"
                                    >
                                        View Audit Logs
                                    </button>
                                </div>
                            </div>

                            {/* 3. Watermark Protection Card */}
                            <div className="rounded-xl border border-border/80 bg-card p-5 space-y-3.5 shadow-xs flex flex-col justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-bold text-foreground">
                                            Watermark Protection
                                        </span>
                                        <Switch
                                            checked={settings.watermark_enabled}
                                            onCheckedChange={(val) => handleToggle("watermark_enabled", val)}
                                            aria-label="Toggle Watermark Protection"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Adds the student&apos;s name on handouts and reviewer files to prevent unauthorized leaks.
                                    </p>
                                    <div className="pt-1 text-[11px] text-muted-foreground truncate">
                                        Format: <code className="text-xs">{settings.watermark_text || "{name} - {email}"}</code> ({settings.watermark_opacity ?? 15}% opacity)
                                    </div>
                                </div>

                                <div className="pt-2.5 flex items-center justify-end border-t border-border/60">
                                    <button
                                        type="button"
                                        onClick={() => setActiveModal("watermark")}
                                        className="text-xs font-semibold text-foreground hover:underline cursor-pointer"
                                    >
                                        Configure
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Active Sessions Quick Table (Only shown when toggled or scanned) */}
                        {showSessionsTable && (
                            <div className="mt-4 rounded-2xl border border-black/5 dark:border-white/10 bg-card overflow-hidden shadow-2xs animate-in fade-in duration-200">
                                <div className="px-5 py-3 border-b border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 bg-[#F2F2F2]/60 dark:bg-white/[0.02]">
                                    <div className="flex items-center gap-2">
                                        <Laptop className="h-4 w-4 text-foreground" />
                                        <span className="text-xs font-bold text-foreground">
                                            Live Active Sessions &amp; Concurrency Table ({sessions.length})
                                        </span>
                                        {concurrentUserCount > 0 && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                                {concurrentUserCount} Concurrency Flagged
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleScanSessions}
                                            disabled={isScanningSessions}
                                            className="h-8 px-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-semibold text-foreground hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                        >
                                            <RefreshCw className={`h-3 w-3 ${isScanningSessions ? "animate-spin text-amber-500" : ""}`} />
                                            <span>Scan Now</span>
                                        </button>
                                        <Link
                                            href="/admin/settings/sessions"
                                            className="h-8 px-3 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
                                        >
                                            <span>Open Full Table Page</span>
                                            <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-black/5 dark:border-white/10 font-semibold text-muted-foreground bg-[#F2F2F2]/40 dark:bg-white/[0.02]">
                                                <th className="py-2.5 px-4 font-semibold">User Account</th>
                                                <th className="py-2.5 px-4 font-semibold">Role</th>
                                                <th className="py-2.5 px-4 font-semibold">Device</th>
                                                <th className="py-2.5 px-4 font-semibold">IP Address</th>
                                                <th className="py-2.5 px-4 font-semibold">Login Time</th>
                                                <th className="py-2.5 px-4 font-semibold">Concurrency Status</th>
                                                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                            {sessions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                                        No active sessions loaded. Click &quot;Scan Now&quot; to scan the network.
                                                    </td>
                                                </tr>
                                            ) : (
                                                sessions.slice(0, 10).map((sess) => {
                                                    const isCurrent = sess.isCurrent
                                                    const isConcurrent = sess.isConcurrent

                                                    return (
                                                        <tr
                                                            key={sess.id}
                                                            className={`transition-colors ${
                                                                isCurrent
                                                                    ? "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]"
                                                                    : isConcurrent
                                                                    ? "bg-amber-500/[0.04] dark:bg-amber-500/[0.06] hover:bg-amber-500/[0.08]"
                                                                    : "hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
                                                            }`}
                                                        >
                                                            <td className="py-2.5 px-4 font-medium text-foreground">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="size-6 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-[10px]">
                                                                        {(sess.name || "U")[0].toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-foreground truncate">{sess.name}</p>
                                                                        <p className="text-[10px] text-muted-foreground">{sess.email || sess.login_id || ""}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 px-4">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                                    {sess.role}
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 px-4 text-foreground">
                                                                <div className="flex items-center gap-1.5">
                                                                    {sess.deviceType === "mobile" ? (
                                                                        <Smartphone className="h-3 w-3 text-muted-foreground shrink-0" />
                                                                    ) : sess.deviceType === "tablet" ? (
                                                                        <Tablet className="h-3 w-3 text-muted-foreground shrink-0" />
                                                                    ) : (
                                                                        <Laptop className="h-3 w-3 text-muted-foreground shrink-0" />
                                                                    )}
                                                                    <span className="truncate">{sess.device}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground">
                                                                {sess.ip}
                                                            </td>
                                                            <td className="py-2.5 px-4 text-muted-foreground">
                                                                {new Date(sess.loginTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                            </td>
                                                            <td className="py-2.5 px-4">
                                                                {isCurrent ? (
                                                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                                        Current (You)
                                                                    </span>
                                                                ) : isConcurrent ? (
                                                                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 w-fit">
                                                                        <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                                                                        Concurrent ({sess.deviceCount} Devices)
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                                                                        Single Device
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-2.5 px-4 text-right">
                                                                {!isCurrent && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleTerminateSession(sess)}
                                                                        className="px-2 py-0.5 text-[11px] font-semibold rounded border border-border/80 text-muted-foreground hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                                                                    >
                                                                        Revoke
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {sessions.length > 10 && (
                                    <div className="p-3 text-center border-t border-black/5 dark:border-white/5 bg-muted/20">
                                        <Link
                                            href="/admin/settings/sessions"
                                            className="text-xs font-semibold text-[#E9C46A] hover:underline"
                                        >
                                            View all {sessions.length} sessions on the full table page &rarr;
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Account Security: Change Password */}
                <div className="pb-8">
                    <div className="mb-4">
                        <div className="flex items-center gap-2">
                            <KeyRound className="h-4.5 w-4.5 text-[#E9C46A]" />
                            <h2 className="text-base font-bold uppercase tracking-wider text-foreground">
                                Account Password
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Update your login password. Enter your new password and retype it to confirm.
                        </p>
                    </div>

                    <div className="max-w-2xl rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            {/* Feedback Banner */}
                            {passwordFeedback && (
                                <div
                                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
                                        passwordFeedback.type === "success"
                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                            : "bg-destructive/10 border-destructive/20 text-destructive"
                                    }`}
                                >
                                    {passwordFeedback.type === "success" ? (
                                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                        <AlertCircle className="size-4 shrink-0 text-destructive" />
                                    )}
                                    <span>{passwordFeedback.message}</span>
                                </div>
                            )}

                            {/* Current Password (Required) */}
                            <div className="space-y-1.5">
                                <Label htmlFor="current-password" className="text-xs font-semibold text-foreground">
                                    Current Password <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="current-password"
                                        required
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter your current password"
                                        className="h-10 pr-10 text-xs rounded-xl border-border/70"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        tabIndex={-1}
                                    >
                                        {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                <span className="text-[11px] text-muted-foreground block">
                                    Required to confirm your identity. If forgotten, only IT or an administrator with User Management access can reset your password.
                                </span>
                            </div>

                            {/* New Password & Retype Password Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="new-password" className="text-xs font-semibold text-foreground">
                                        New Password <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="new-password"
                                            required
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Minimum 6 characters"
                                            className="h-10 pr-10 text-xs rounded-xl border-border/70"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                            tabIndex={-1}
                                        >
                                            {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground block">
                                        At least 6 characters required.
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="confirm-password" className="text-xs font-semibold text-foreground">
                                        Retype New Password <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm-password"
                                            required
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Retype your new password"
                                            className="h-10 pr-10 text-xs rounded-xl border-border/70"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>

                                    {/* Password match indicator */}
                                    {confirmPassword.length > 0 && (
                                        <div className="pt-0.5">
                                            {newPassword === confirmPassword ? (
                                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                                    <CheckCircle2 className="size-3" /> Passwords match
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold flex items-center gap-1">
                                                    <AlertCircle className="size-3" /> Passwords do not match
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2 flex items-center justify-end">
                                <button
                                    type="submit"
                                    disabled={passwordLoading || !newPassword || !confirmPassword}
                                    className="h-10 px-6 rounded-xl bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                                >
                                    {passwordLoading ? (
                                        <>
                                            <Loader2 className="size-3.5 animate-spin" />
                                            <span>Updating…</span>
                                        </>
                                    ) : (
                                        <span>Update Password</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
                </div>
            )}

            {/* ═════════ AUDIT LOGS MODAL ═════════ */}
            {canAccessSecurity && activeModal === "logs" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                                    Security &amp; Auth Logs
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Audit trail of authentications, role updates, and system operations
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-2">
                            {auditLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start justify-between gap-4 p-3 rounded-xl border border-border/70 bg-card hover:border-border transition-colors text-xs"
                                >
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`size-1.5 rounded-full shrink-0 ${log.status === "warning" ? "bg-amber-500" : "bg-emerald-500"}`} />
                                            <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                                                {log.event_type}
                                            </span>
                                            <span className="text-muted-foreground text-[11px]">&bull; {log.user_name} ({log.user_role})</span>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed pl-3.5 text-xs">{log.description}</p>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center px-6 py-3 border-t border-border bg-muted/20">
                            <span className="text-xs text-muted-foreground">{auditLogs.length} audit trail records</span>
                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                className="px-4 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═════════ WATERMARK SETTINGS MODAL ═════════ */}
            {canAccessSecurity && activeModal === "watermark" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                                    Watermark Configuration
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Dynamic stamp rules for proprietary question handouts
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveWatermark} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-foreground">
                                    Watermark Template
                                </label>
                                <input
                                    type="text"
                                    value={watermarkForm.watermark_text}
                                    onChange={(e) => setWatermarkForm(prev => ({ ...prev, watermark_text: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    placeholder="{name} - {email}"
                                />
                                <p className="text-[11px] text-muted-foreground">Supported tags: <code>{'{name}'}</code>, <code>{'{email}'}</code>, <code>{'{date}'}</code></p>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                    <label className="font-semibold text-foreground">Opacity ({watermarkForm.watermark_opacity}%)</label>
                                    <span className="text-muted-foreground text-[11px]">Recommended: 10% – 20%</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="50"
                                    step="5"
                                    value={watermarkForm.watermark_opacity}
                                    onChange={(e) => setWatermarkForm(prev => ({ ...prev, watermark_opacity: parseInt(e.target.value, 10) }))}
                                    className="w-full cursor-pointer accent-[#E9C46A]"
                                />
                            </div>

                            {/* Live Minimal Preview Box */}
                            <div className="rounded-xl border border-border/80 bg-background/50 p-4 relative overflow-hidden h-20 flex items-center justify-center text-center">
                                <span className="text-xs text-muted-foreground pointer-events-none select-none">
                                    [ Sample Study Material Content ]
                                </span>
                                <div
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-foreground font-black tracking-widest text-xs uppercase -rotate-12"
                                    style={{ opacity: watermarkForm.watermark_opacity / 100 }}
                                >
                                    {watermarkForm.watermark_text.replace("{name}", "Juan Dela Cruz").replace("{email}", "juan@gmail.com").replace("{date}", "2026-08-26")}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setActiveModal(null)}
                                    className="px-3.5 h-8.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-2xs transition-all flex items-center justify-center cursor-pointer"
                                >
                                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                                    <span>Save Changes</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
