"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { 
  Bell, 
  ShieldAlert, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCheck, 
  Trash2, 
  ExternalLink, 
  RefreshCw,
  Users,
  Eye,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"

function formatTime(timestamp) {
  if (!timestamp) return "Just now"
  try {
    const d = new Date(timestamp)
    if (isNaN(d.getTime())) return "Recently"
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })
  } catch {
    return "Recently"
  }
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all") // 'all' | 'integrity' | 'concurrency' | 'unread'
  const [refreshing, setRefreshing] = useState(false)

  const fetchNotifications = async (force = false) => {
    // Check sessionStorage cache for bandwidth reduction
    const cacheKey = "admin_notifications_page_cache"
    if (!force) {
      try {
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached)
          // 2 minute cache validity
          if (Date.now() - parsed.timestamp < 120000) {
            setNotifications(parsed.notifications || [])
            setUnreadCount(parsed.unreadCount || 0)
            setLoading(false)
            return
          }
        }
      } catch {}
    }

    setRefreshing(true)
    try {
      const res = await fetch("/api/admin/notifications", {
        headers: { "Cache-Control": "no-cache" }
      })
      if (res.ok) {
        const data = await res.json()
        const notifs = data.notifications || []
        const count = data.unreadCount || 0
        setNotifications(notifs)
        setUnreadCount(count)

        // Update cache
        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ notifications: notifs, unreadCount: count, timestamp: Date.now() })
          )
        } catch {}
      }
    } catch (err) {
      console.error("Failed to fetch admin notifications:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAsRead = async (id) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      // Invalidate cache
      sessionStorage.removeItem("admin_notifications_page_cache")
      sessionStorage.removeItem("admin_notifications_cache")
    } catch (err) {
      console.error("Failed to mark notification read:", err)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return

    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true, notificationIds: unreadIds })
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      sessionStorage.removeItem("admin_notifications_page_cache")
      sessionStorage.removeItem("admin_notifications_cache")
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  const dismissNotification = async (id) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      sessionStorage.removeItem("admin_notifications_page_cache")
      sessionStorage.removeItem("admin_notifications_cache")
    } catch (err) {
      console.error("Failed to dismiss notification:", err)
    }
  }

  const clearAllNotifications = async () => {
    const allIds = notifications.map((n) => n.id)
    try {
      await fetch("/api/admin/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: allIds })
      })
      setNotifications([])
      setUnreadCount(0)
      sessionStorage.removeItem("admin_notifications_page_cache")
      sessionStorage.removeItem("admin_notifications_cache")
    } catch (err) {
      console.error("Failed to clear notifications:", err)
    }
  }

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "unread") return !n.is_read
      if (activeTab === "integrity") return n.type === "integrity"
      if (activeTab === "concurrency") return n.type === "concurrency"
      return true
    })
  }, [notifications, activeTab])

  // Aggregate metrics
  const integrityCount = useMemo(
    () => notifications.filter((n) => n.type === "integrity").length,
    [notifications]
  )
  const concurrencyCount = useMemo(
    () => notifications.filter((n) => n.type === "concurrency").length,
    [notifications]
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Bell className="size-6 text-primary" />
            Security & System Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dynamic notifications for Exam Integrity violations, High-Concurrency active session warnings, and security logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(true)}
            disabled={refreshing}
            className="gap-1.5 rounded-xl border-border/80 text-xs cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="gap-1.5 rounded-xl border-border/80 text-xs cursor-pointer text-primary hover:text-primary"
            >
              <CheckCheck className="size-3.5" />
              Mark all as read
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllNotifications}
              className="gap-1.5 rounded-xl border-border/80 text-xs cursor-pointer text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-2xs">
          <p className="text-xs font-semibold text-muted-foreground">Total Active Alerts</p>
          <p className="text-2xl font-bold text-foreground mt-1">{notifications.length}</p>
        </div>

        <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] shadow-2xs">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">High-Concurrency</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">{concurrencyCount}</p>
        </div>

        <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] shadow-2xs">
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">Exam Integrity</p>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1">{integrityCount}</p>
        </div>

        <div className="p-4 rounded-2xl border border-primary/20 bg-primary/[0.04] shadow-2xs">
          <p className="text-xs font-semibold text-primary">Unread Items</p>
          <p className="text-2xl font-bold text-primary mt-1">{unreadCount}</p>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2.5 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          All Alerts ({notifications.length})
        </button>

        <button
          onClick={() => setActiveTab("integrity")}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "integrity"
              ? "bg-rose-500 text-white font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <ShieldAlert className="size-3.5" />
          Exam Integrity ({integrityCount})
        </button>

        <button
          onClick={() => setActiveTab("concurrency")}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "concurrency"
              ? "bg-amber-500 text-white font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <AlertTriangle className="size-3.5" />
          Concurrency ({concurrencyCount})
        </button>

        {unreadCount > 0 && (
          <button
            onClick={() => setActiveTab("unread")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "unread"
                ? "bg-muted text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Unread Only ({unreadCount})
          </button>
        )}
      </div>

      {/* ── Notifications Feed ── */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
          <RefreshCw className="size-4 animate-spin" />
          Loading notifications…
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="py-16 rounded-2xl border border-dashed border-border bg-card/50 text-center flex flex-col items-center justify-center p-6 space-y-2">
          <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
            <ShieldCheck className="size-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">You&apos;re all caught up!</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            No active exam integrity incidents or high-concurrency multi-device warnings detected.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isConcurrency = notif.type === "concurrency"
            const isIntegrity = notif.type === "integrity"

            return (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all ${
                  notif.is_read
                    ? "border-border/60 bg-card/60 opacity-90"
                    : "border-primary/30 bg-card shadow-xs"
                } hover:border-primary/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Category Icon */}
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isIntegrity
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : isConcurrency
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {isIntegrity ? (
                      <ShieldAlert className="size-5" />
                    ) : isConcurrency ? (
                      <AlertTriangle className="size-5" />
                    ) : (
                      <Bell className="size-5" />
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isIntegrity
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                            : isConcurrency
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {notif.category}
                      </span>

                      {!notif.is_read && (
                        <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                      )}

                      <span className="text-xs text-muted-foreground">
                        {formatTime(notif.created_at)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-foreground leading-snug">
                      {notif.title}
                    </h4>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!notif.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notif.id)}
                      className="text-xs h-8 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Mark as read"
                    >
                      <CheckCheck className="size-3.5 mr-1" />
                      Read
                    </Button>
                  )}

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 rounded-xl border-border/80 cursor-pointer"
                  >
                    <Link href={notif.link || "/admin/settings/sessions"}>
                      Investigate
                      <ExternalLink className="size-3 ml-1" />
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissNotification(notif.id)}
                    className="size-8 p-0 text-muted-foreground hover:text-destructive cursor-pointer rounded-xl"
                    title="Dismiss"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
