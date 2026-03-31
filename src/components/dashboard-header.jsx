"use client"

import { useEffect, useState } from "react"
import { Search, Bell } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

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

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.user && setUser(d.user))
      .catch(() => { })
  }, [])

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-8">
      {/* Left spacer — keeps search centred; on mobile leaves room for hamburger */}
      <div className="w-10 shrink-0 lg:hidden" />

      {/* Left-aligned search bar */}
      <div className="flex-1 flex justify-start">
        <div className="relative w-full max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            type="search"
            placeholder="Type to search something..."
            className="h-10 pl-10 rounded-full border border-border/60 bg-background shadow-sm focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Right — notification + avatar + name + role */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Notification bell */}
        <button
          className="relative inline-flex items-center justify-center size-9 rounded-full border border-border bg-muted/50 hover:bg-muted transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
        </button>

        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
            {user?.name ?? ""}
          </span>
          {role && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {ROLE_LABELS[role] || role}
            </span>
          )}
        </div>

        <Avatar className="size-9 border border-border">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {getInitials(user?.name)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
