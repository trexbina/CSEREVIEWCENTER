"use client"

import { useFont, FONT_OPTIONS } from "@/components/font-provider"
import { Type, ChevronDown } from "lucide-react"

export function FontSwitcher() {
  const { font, setFont } = useFont()
  const currentFont = FONT_OPTIONS.find((f) => f.key === font) || FONT_OPTIONS[0]

  return (
    <div className="w-full max-w-sm space-y-3">
      {/* Dropdown Container */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
          <Type className="h-4 w-4" />
        </div>
        <select
          value={font}
          onChange={(e) => setFont(e.target.value)}
          className="w-full h-11 pl-9 pr-10 rounded-lg border border-border bg-background text-sm font-medium text-foreground shadow-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition-all"
        >
          {/* Default / System */}
          <optgroup label="Default / Recommended">
            {FONT_OPTIONS.filter((f) => f.key === "geist").map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </optgroup>

          {/* Standard Fonts */}
          <optgroup label="Standard / Classic Fonts">
            {FONT_OPTIONS.filter((f) => f.category?.startsWith("Standard") || f.category === "Monospace" || f.category === "System Sans").map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label} ({opt.category})
              </option>
            ))}
          </optgroup>

          {/* Modern Web Fonts */}
          <optgroup label="Modern Google Fonts">
            {FONT_OPTIONS.filter((f) => f.category === "Modern Web").map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {/* Live Sample Preview Text */}
      <div className="rounded-lg border border-border/80 bg-muted/40 p-3.5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Preview: {currentFont.label}
          </p>
          <p className="text-sm font-medium text-foreground truncate mt-0.5" style={{ fontFamily: currentFont.family }}>
            The quick brown fox jumps over the lazy dog. 1234567890
          </p>
        </div>
        <span
          className="text-2xl font-bold text-primary shrink-0 px-2 py-0.5 rounded bg-primary/10"
          style={{ fontFamily: currentFont.family }}
        >
          Aa
        </span>
      </div>
    </div>
  )
}
