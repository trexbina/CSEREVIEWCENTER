"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const themes = [
  { name: "light", label: "Light" },
  { name: "dark", label: "Dark" },
]

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-10 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-muted/30 animate-pulse" />
    )
  }

  // Normalize active value to 'light' or 'dark'
  const currentTheme = theme === "dark" || theme === "minimal-dark" || theme === "focus" ? "dark" : "light"

  return (
    <div className="w-full max-w-sm">
      <Select value={currentTheme} onValueChange={setTheme}>
        <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-background/50 text-sm font-medium px-4 shadow-2xs hover:bg-muted/40 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-slate-400 dark:focus:border-slate-500 transition-all cursor-pointer">
          <SelectValue placeholder="Select Theme" />
        </SelectTrigger>
        <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-700 bg-card shadow-xl p-1.5 z-50">
          {themes.map((t) => (
            <SelectItem 
              key={t.name} 
              value={t.name}
              className="text-sm font-medium rounded-lg cursor-pointer py-2.5 px-3 focus:bg-muted focus:text-foreground"
            >
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
