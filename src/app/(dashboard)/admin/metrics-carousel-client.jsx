"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Users, Calendar, AlertTriangle, UserPlus, Award } from "lucide-react"

// Icon mapping dictionary
const ICON_MAP = {
  users: Users,
  calendar: Calendar,
  award: Award,
  alertTriangle: AlertTriangle,
  userPlus: UserPlus,
}

export function MetricsCarouselClient({ items }) {
  // We want to show a maximum of 3 cards at a time.
  const CARDS_PER_VIEW = 3
  const [startIndex, setStartIndex] = useState(0)

  const maxStartIndex = Math.max(0, items.length - CARDS_PER_VIEW)

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setStartIndex((prev) => Math.min(maxStartIndex, prev + 1))
  }

  const canPrev = startIndex > 0
  const canNext = startIndex < maxStartIndex

  // Extract visible 3 items
  const visibleItems = items.slice(startIndex, startIndex + CARDS_PER_VIEW)

  return (
    <div className="relative w-full flex items-center group">
      {/* ── Left Carousel Arrow (appears only on hover over metric strip) ── */}
      <div className="absolute -left-2.5 sm:-left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canPrev}
          aria-label="Previous metrics"
          className={`size-7 sm:size-7.5 rounded-lg flex items-center justify-center border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-md text-[#3B3B3B] dark:text-white shadow-sm transition-all ${
            canPrev
              ? "hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 cursor-pointer"
              : "opacity-30 cursor-not-allowed pointer-events-none"
          }`}
        >
          <ChevronLeft className="size-4 text-[#3B3B3B] dark:text-neutral-200" />
        </button>
      </div>

      {/* ── Metrics Strip Container ── */}
      <div className="w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {visibleItems.map((item, idx) => {
            const Icon = ICON_MAP[item.iconKey] || Users
            return (
              <Link
                key={item.label || idx}
                href={item.href}
                className="flex flex-col justify-between group/card transition-colors hover:bg-black/[0.01] dark:hover:bg-white/[0.01]"
              >
                {/* Header: Label + Icon with bottom border & dimensional soft shadow */}
                <div
                  className={`relative z-10 px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)] ${item.headerBg}`}
                >
                  <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                    {item.label}
                  </span>
                  <Icon className="size-4 text-neutral-500 dark:text-neutral-400 stroke-[1.75]" />
                </div>

                {/* Body: Value + Brief Note */}
                <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                  <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                    {Number(item.value).toLocaleString()}
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
                    {item.meta}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Right Carousel Arrow (appears only on hover over metric strip) ── */}
      <div className="absolute -right-2.5 sm:-right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          type="button"
          onClick={handleNext}
          disabled={!canNext}
          aria-label="Next metrics"
          className={`size-7 sm:size-7.5 rounded-lg flex items-center justify-center border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-md text-[#3B3B3B] dark:text-white shadow-sm transition-all ${
            canNext
              ? "hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 cursor-pointer"
              : "opacity-30 cursor-not-allowed pointer-events-none"
          }`}
        >
          <ChevronRight className="size-4 text-[#3B3B3B] dark:text-neutral-200" />
        </button>
      </div>
    </div>
  )
}
