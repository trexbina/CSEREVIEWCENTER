"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { Loader2 } from "lucide-react"

export function ThemeTransitionLoader() {
  const { resolvedTheme } = useTheme()
  const previousTheme = useRef(resolvedTheme)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!previousTheme.current) {
      previousTheme.current = resolvedTheme
      return
    }
    if (previousTheme.current === resolvedTheme) return

    previousTheme.current = resolvedTheme
    setVisible(true)
    const timer = window.setTimeout(() => setVisible(false), 360)
    return () => window.clearTimeout(timer)
  }, [resolvedTheme])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-sky-50/45 backdrop-blur-[2px] dark:bg-slate-950/35" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#155267] shadow-[0_12px_32px_rgba(21,82,103,.16)] dark:bg-slate-900 dark:text-sky-200">
        <Loader2 className="h-4 w-4 animate-spin text-sky-600 dark:text-sky-300" />
        Updating your theme
      </div>
    </div>
  )
}
