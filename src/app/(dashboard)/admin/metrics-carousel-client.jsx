"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Users, Calendar, AlertTriangle, UserPlus, Award } from "lucide-react"
import { LordIcon } from "@/components/ui/lord-icon"

// Icon mapping dictionary
const ICON_MAP = {
  users: Users,
  calendar: Calendar,
  award: Award,
  alertTriangle: AlertTriangle,
  userPlus: UserPlus,
}

function MetricCardItem({ item }) {
  const iconRef = useRef(null)

  return (
    <Link
      href={item.href}
      onMouseEnter={() => iconRef.current?.play()}
      onMouseLeave={() => iconRef.current?.stop()}
      className="flex flex-col justify-between select-none group/card"
    >
      {/* Header: Label without icon, with bottom border & dimensional soft shadow */}
      <div
        className={`relative z-10 px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between border-b border-black/5 dark:border-white/5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)] ${item.headerBg}`}
      >
        <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
          {item.label}
        </span>
      </div>

      {/* Body: Value + Note on left, Animated LordIcon on right */}
      <div className="p-5 sm:p-6 pt-4 sm:pt-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
            {Number(item.value).toLocaleString()}
          </div>
          <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal select-none">
            {item.meta}
          </p>
        </div>

        {/* Animated LordIcon on right side - triggered by whole card hover */}
        {item.lordIcon && (
          <div className="shrink-0 transition-transform duration-300 opacity-45 group-hover/card:scale-105">
            <LordIcon
              ref={iconRef}
              src={item.lordIcon}
              size={38}
              trigger="manual"
            />
          </div>
        )}
      </div>
    </Link>
  )
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
        {/* Sliding Track - using exact same bezier & smooth sliding translation as the banner */}
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform"
          style={{
            transform: `translateX(-${startIndex * (100 / CARDS_PER_VIEW)}%)`,
          }}
        >
          {items.map((item, idx) => {
            return (
              <div
                key={item.label || idx}
                style={{ width: `${100 / CARDS_PER_VIEW}%` }}
                className="shrink-0"
              >
                <MetricCardItem item={item} />
              </div>
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
