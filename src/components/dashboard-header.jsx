"use client"

import { useEffect, useState } from "react"
import { Search, Bell, Maximize, Minimize, Trash, ChevronDown, User, Settings, ShieldCheck, CheckCheck } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import Link from "next/link"

function getInitials(name) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const ROLE_LABELS = {
  student: "STUDENT",
  teacher: "INSTRUCTOR",
  admin: "ADMIN",
}

export function DashboardHeader({ role }) {
  const [user, setUser] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [headerSearch, setHeaderSearch] = useState("")

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) return null
        return r.json()
      })
      .then((d) => d && d.user && setUser(d.user))
      .catch(() => { })

    if (role === "student") {
      fetch("/api/student/notifications")
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d && d.notifications) {
            setNotifications(d.notifications)
            setUnreadCount(d.unreadCount || 0)
          }
        })
        .catch(() => {})
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [role])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting fullscreen:", err)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const markNotificationAsRead = async (id, e) => {
    if (e) e.stopPropagation()
    try {
      await fetch("/api/student/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Error marking notification read:", err)
    }
  }

  const deleteAllNotifications = async (e) => {
    if (e) e.stopPropagation()
    try {
      await fetch("/api/student/notifications", { method: "DELETE" })
      setNotifications([])
      setUnreadCount(0)
    } catch (err) {
      console.error("Error deleting notifications:", err)
    }
  }

  const profileUrl = role === "student" ? "/student/profile" : role === "teacher" ? "/teacher/profile" : "/admin/settings"

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 px-4 lg:px-8 transition-all">
      {/* Left side: Mobile spacer + Persistent Light Gray Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="w-8 shrink-0 lg:hidden" />
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#696969]/80 dark:text-gray-400" />
          <input
            type="search"
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            placeholder="Search.."
            className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm rounded-xl bg-[#F2F2F2] dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/60 dark:placeholder:text-gray-400 border border-transparent focus:border-black/10 dark:focus:border-white/15 focus:bg-white dark:focus:bg-white/15 focus:outline-none focus:ring-1.5 focus:ring-black/10 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Right side controls & user profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
        {/* Fullscreen Toggle Button */}
        <button
          onClick={toggleFullscreen}
          className="relative inline-flex items-center justify-center size-9 rounded-xl border border-border/70 bg-card hover:bg-muted/70 transition-all text-muted-foreground hover:text-foreground cursor-pointer shadow-2xs active:scale-95"
          aria-label="Toggle Fullscreen"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative inline-flex items-center justify-center size-9 rounded-xl border border-border/70 bg-card hover:bg-muted/70 transition-all cursor-pointer shadow-2xs active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-background animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-xl p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={deleteAllNotifications}
                    type="button"
                    title="Clear All"
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer rounded-lg hover:bg-muted"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                  <Link
                    href={role === "admin" ? "/admin/notifications" : "/student/notifications"}
                    onClick={() => setShowNotifDropdown(false)}
                    className="text-xs font-semibold text-[#4382DF] hover:underline ml-1"
                  >
                    View All
                  </Link>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="py-8 text-center space-y-1">
                  <CheckCheck className="h-6 w-6 text-muted-foreground/50 mx-auto" />
                  <p className="text-xs text-muted-foreground font-medium">You're all caught up!</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {notifications.slice(0, 5).map((n) => (
                    <Link
                      key={n.id}
                      href={n.link || (role === "admin" ? "/admin/notifications" : "/student/notifications")}
                      onClick={() => {
                        if (!n.is_read) markNotificationAsRead(n.id)
                        setShowNotifDropdown(false)
                      }}
                      className="block p-3 rounded-xl border border-border/50 bg-background hover:bg-muted/50 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-foreground text-xs leading-snug">
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium line-clamp-2 mt-1">
                        {n.message}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border/80 mx-0.5 hidden sm:block" />

        {/* User Profile Button */}
        <Link 
          href={profileUrl}
          className="flex items-center gap-2.5 pl-1 pr-1.5 py-1 rounded-xl hover:bg-muted/60 transition-all cursor-pointer group"
          title="View Profile"
        >
          <Avatar className="size-9 border border-border group-hover:border-primary/50 transition-colors shadow-2xs">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>

          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[130px]">
              {user?.name || (role === "admin" ? "Admin User" : "User")}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
              {ROLE_LABELS[role] || role}
            </span>
          </div>
        </Link>
      </div>
    </header>
  )
}



