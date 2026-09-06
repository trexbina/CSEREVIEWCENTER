"use client"

import { useState, useEffect } from "react"
import { Settings } from "@/components/animate-ui/icons/settings"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Switch } from "@/components/ui/switch"
import {
    X,
    Loader2,
    Laptop,
    Smartphone
} from "lucide-react"

export default function SystemSettingsPage() {
    const [loading, setLoading] = useState(true)
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
        } catch (err) {
            console.error("Failed to load security settings:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSecurityData()
    }, [])

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
                    userName: sessionItem.name,
                    targetUserId: sessionItem.id
                })
            })
            setSessions(prev => prev.filter(s => s.id !== sessionItem.id))
            fetchSecurityData()
        } catch (err) {
            console.error("Failed to terminate session:", err)
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

                {/* Security & Access Control */}
                <div className="pb-8 border-b border-border/60">
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
                        <div className="rounded-xl border border-border/80 bg-card p-5 space-y-3 shadow-xs flex flex-col justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-bold text-foreground">
                                        Session Monitoring
                                    </span>
                                    <Switch
                                        checked={settings.single_session_enabled}
                                        onCheckedChange={(val) => handleToggle("single_session_enabled", val)}
                                        aria-label="Toggle Single Session Enforcement"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Prevents account sharing by allowing only one device to be logged in at a time.
                                </p>
                            </div>

                            <div className="pt-2 flex items-center justify-end border-t border-border/60">
                                <button
                                    type="button"
                                    onClick={() => setActiveModal("sessions")}
                                    className="text-xs font-semibold text-foreground hover:underline cursor-pointer"
                                >
                                    Manage Sessions
                                </button>
                            </div>
                        </div>

                        {/* 2. Access & Audit Logs Card */}
                        <div className="rounded-xl border border-border/80 bg-card p-5 space-y-3 shadow-xs flex flex-col justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-bold text-foreground">
                                        Audit &amp; Auth Logs
                                    </span>
                                    <Switch
                                        checked={settings.audit_logging_enabled}
                                        onCheckedChange={(val) => handleToggle("audit_logging_enabled", val)}
                                        aria-label="Toggle Security Audit Logging"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Keeps a history of logins, role changes, and system activities.
                                </p>
                            </div>

                            <div className="pt-2 flex items-center justify-end border-t border-border/60">
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
                        <div className="rounded-xl border border-border/80 bg-card p-5 space-y-3 shadow-xs flex flex-col justify-between">
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
                                    Adds the student's name on handouts and reviewer files to prevent unauthorized leaks.
                                </p>
                            </div>

                            <div className="pt-2 flex items-center justify-end border-t border-border/60">
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
                </div>
            </div>

            {/* ═════════ ACTIVE SESSIONS MODAL ═════════ */}
            {activeModal === "sessions" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <div>
                                <h3 className="text-base font-bold text-foreground">Active User Sessions</h3>
                                <p className="text-xs text-muted-foreground">Live device connections and active tokens</p>
                            </div>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Alert header if concurrent accounts detected */}
                        {(() => {
                            const userCounts = sessions.reduce((acc, s) => {
                                acc[s.name] = (acc[s.name] || 0) + 1
                                return acc
                            }, {})
                            const hasConcurrent = Object.values(userCounts).some(count => count > 1)

                            return (
                                <>
                                    {hasConcurrent && (
                                        <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-700 dark:text-amber-300">
                                            <div className="flex items-center gap-2">
                                                <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                                                <span><strong>Alert:</strong> Multiple simultaneous devices detected on the same account.</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-2.5">
                                        {sessions.map((sess) => {
                                            const isDuplicate = userCounts[sess.name] > 1

                                            return (
                                                <div
                                                    key={sess.id}
                                                    className={`flex items-center justify-between gap-4 p-3 rounded-xl border transition-colors ${
                                                        isDuplicate && !sess.isCurrent
                                                            ? "border-amber-500/40 bg-amber-500/5"
                                                            : "border-border/70 bg-card hover:border-border"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                                            {sess.device.includes("iPhone") || sess.device.includes("Android") ? (
                                                                <Smartphone className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <Laptop className="h-3.5 w-3.5" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-semibold text-foreground truncate">
                                                                    {sess.name}
                                                                </span>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                                    {sess.role}
                                                                </span>
                                                                {sess.isCurrent && (
                                                                    <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                                        Current
                                                                    </span>
                                                                )}
                                                                {isDuplicate && !sess.isCurrent && (
                                                                    <span className="text-[10px] font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">
                                                                        Concurrent
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate font-normal">
                                                                {sess.device} &bull; {sess.ip} &bull; {new Date(sess.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {!sess.isCurrent && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTerminateSession(sess)}
                                                            className="px-3 py-1 rounded-lg border border-border/80 text-xs font-medium text-muted-foreground hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors shrink-0 cursor-pointer"
                                                        >
                                                            Revoke
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            )
                        })()}

                        {/* Modal Footer */}
                        <div className="flex justify-between items-center px-6 py-3 border-t border-border bg-muted/20">
                            <span className="text-xs text-muted-foreground">{sessions.length} active sessions</span>
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

            {/* ═════════ AUDIT LOGS MODAL ═════════ */}
            {activeModal === "logs" && (
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
            {activeModal === "watermark" && (
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
