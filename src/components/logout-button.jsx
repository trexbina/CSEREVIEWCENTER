"use client"

import { useState } from "react"

export function LogoutButton() {
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)

    // Server-side redirect guarantees cookie clear + navigation happen together.
    window.location.assign("/api/auth/logout?redirect=/login")
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {loggingOut ? "Logging out..." : "Logout"}
    </button>
  )
}
