"use client"

import { useState } from "react"
import { LogOut, Loader2 } from "lucide-react"

export function LogoutButton({ iconOnly = false, className = "" }) {
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)

    // Server-side redirect guarantees cookie clear + navigation happen together.
    window.location.assign("/api/auth/logout?redirect=/")
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      title="Logout"
      aria-label="Logout"
      className={`group/logout inline-flex items-center gap-2.5 rounded-xl border border-transparent font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 ${
        iconOnly
          ? "size-9 justify-center p-0 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 shadow-2xs"
          : "w-full h-9.5 px-3 justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
      } ${className}`}
    >
      {loggingOut ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />
      ) : (
        <LogOut className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/logout:-translate-x-0.5" />
      )}
      {!iconOnly && (
        <span className="truncate">
          {loggingOut ? "Logging out..." : "Log Out"}
        </span>
      )}
    </button>
  )
}

