"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"

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
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background font-medium text-foreground transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 shrink-0 ${
        iconOnly ? "h-8 w-8 p-0" : "h-8 px-2.5 text-xs"
      } ${className}`}
    >
      <LogOut className="h-3.5 w-3.5" />
      {!iconOnly && <span>{loggingOut ? "Logging out..." : "Logout"}</span>}
    </button>
  )
}

