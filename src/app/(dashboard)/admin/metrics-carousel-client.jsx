"use client"

import { useRef } from "react"
import Link from "next/link"
import { Users, Calendar, AlertTriangle, UserPlus, Award } from "lucide-react"

// Icon mapping dictionary
const ICON_MAP = {
  users: Users,
  calendar: Calendar,
  award: Award,
  alertTriangle: AlertTriangle,
  userPlus: UserPlus,
}

export function MetricsCarouselClient({ items }) {
  const scrollRef = useRef(null)

  return (
    <div className="w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-xs overflow-hidden">
      {/* 
        Horizontal scroll container:
        - Exactly 3 cards fit within the container width (w-1/3 on desktop)
        - Snap scroll to card boundaries
        - Hidden scrollbars for a clean, seamless look
        - Supports drag / trackpad swipe / touch swipe / mousewheel horizontal scrolling
      */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {items.map((item, idx) => {
          const Icon = ICON_MAP[item.iconKey] || Users
          return (
            <div
              key={item.label || idx}
              className="w-full sm:w-1/2 md:w-1/3 shrink-0 snap-start flex flex-col justify-between group/card transition-colors hover:bg-black/[0.01] dark:hover:bg-white/[0.01]"
            >
              <Link
                href={item.href}
                className="flex flex-col justify-between h-full"
              >
                {/* Header: Label + Icon with bottom border & dimensional soft shadow */}
                <div
                  className={`relative z-10 px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)] ${item.headerBg}`}
                >
                  <span className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400 select-none">
                    {item.label}
                  </span>
                  <Icon className="size-4 text-neutral-400 dark:text-neutral-500 stroke-[1.75]" />
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
