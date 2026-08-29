"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CheckCheck, Trash, Loader2 } from "lucide-react"

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // "all" | "unread"

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/student/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error("Failed to load notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAllRead = async () => {
    try {
      await fetch("/api/student/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true })
      })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      console.error("Failed to mark all read:", err)
    }
  }

  const deleteAllNotifications = async () => {
    try {
      await fetch("/api/student/notifications", { method: "DELETE" })
      setNotifications([])
    } catch (err) {
      console.error("Failed to delete notifications:", err)
    }
  }

  const markSingleRead = async (id) => {
    try {
      await fetch("/api/student/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (err) {
      console.error("Failed to mark read:", err)
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.is_read
    return true
  })

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto px-4 py-4 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-wider text-[#4d4d4d] dark:text-slate-200 uppercase mb-1">
            NOTIFICATIONS
          </h1>
          <p className="text-[#8c8c8c] dark:text-slate-400 text-sm font-medium">
            Stay updated with your latest activities, announcements, and content updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={markAllRead}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer shadow-2xs"
          >
            <CheckCheck className="h-4 w-4 text-muted-foreground" />
            <span>Mark all read</span>
          </button>

          <button
            onClick={deleteAllNotifications}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer shadow-2xs"
          >
            <Trash className="h-4 w-4 text-muted-foreground" />
            <span>Clear all</span>
          </button>
        </div>
      </div>

      {/* Minimal Filter Tabs */}
      <div className="flex gap-6 pb-1 text-sm font-medium">
        <button
          onClick={() => setFilter("all")}
          className={`pb-2 border-b-2 cursor-pointer transition-all ${
            filter === "all"
              ? "border-foreground text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          onClick={() => setFilter("unread")}
          className={`pb-2 border-b-2 cursor-pointer transition-all ${
            filter === "unread"
              ? "border-foreground text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Unread ({notifications.filter(n => !n.is_read).length})
        </button>
      </div>

      {/* Minimal Notification List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span>Loading notifications…</span>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-14 text-center text-sm text-muted-foreground font-medium">
          {filter === "unread" ? "No unread notifications." : "No notifications available."}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/60">
          {filteredNotifications.map((n) => (
            <Link
              key={n.id}
              href={n.link || "#"}
              onClick={() => {
                if (!n.is_read) markSingleRead(n.id)
              }}
              className="block p-5 sm:p-6 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer space-y-1.5"
            >
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-base font-bold text-foreground leading-snug">
                  {n.title}
                </h3>
                <div className="flex items-center gap-2.5 shrink-0 mt-0.5">
                  <span className="text-xs text-muted-foreground/70 font-medium">
                    {new Date(n.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                  {!n.is_read && (
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                {n.message}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
