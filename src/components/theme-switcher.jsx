"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"


// Diri ka mag set ug Theme
const themes = [
  { name: "modern", label: "Modern", description: "Clean blue tones, smooth rounded edges" },
  { name: "classic", label: "Classic", description: "Warm earth tones, sharp square edges" },
  { name: "focus", label: "Focus", description: "High contrast dark mode, pill-shaped elements" },
  { name: "minimal-dark", label: "Minimal Dark", description: "Sleek dark mode with warm amber accents" },
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Skeleton placeholder during SSR — prevents layout shift
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Theme:</span>
        <div className="flex gap-1">
          {themes.map((t) => (
            <span
              key={t.name}
              className="rounded-md px-3 py-1.5 text-sm font-medium bg-secondary text-transparent animate-pulse"
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Theme:</span>
      <div className="flex gap-1">
        {themes.map((t) => (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            title={t.description}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${theme === t.name
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
