"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AlarmClock } from "lucide-react"
import { LordIcon } from "@/components/ui/lord-icon"

/**
 * UpcomingExamTimer
 * Dynamic alarm & timer for upcoming mock examinations:
 * 1. If no upcoming/active exams: shows a neutral, disabled "No exams yet" button with no fill color.
 * 2. If an exam is scheduled in the future: displays countdown timer beside a disabled "Start Exam" button.
 * 3. Once timer reaches zero or exam is active: shows startexam animated icon with minimal neutral message "Mock exam has started! Good luck!" and an enabled "Start Exam" button.
 */
export function UpcomingExamTimer({ upcomingExam }) {
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Avoid hydration mismatch by rendering static placeholder until mounted
  if (!mounted) {
    if (!upcomingExam) {
      return (
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-neutral-400 dark:text-neutral-500 bg-transparent border border-black/5 dark:border-white/10 cursor-not-allowed select-none shadow-2xs opacity-60"
        >
          No exams yet
        </button>
      )
    }

    return (
      <div className="inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-neutral-400 dark:text-neutral-500 bg-black/[0.04] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 select-none shadow-2xs">
        Loading...
      </div>
    )
  }

  // Case 1: No upcoming or active exams
  if (!upcomingExam) {
    return (
      <div className="flex items-center">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-neutral-400 dark:text-neutral-500 bg-transparent border border-black/5 dark:border-white/10 cursor-not-allowed select-none transition-all shadow-2xs opacity-60"
        >
          No exams yet
        </button>
      </div>
    )
  }

  const unlockTime = upcomingExam.unlockDate ? new Date(upcomingExam.unlockDate).getTime() : null
  const isFuture = unlockTime && unlockTime > now

  // Case 2: Scheduled in the future (Countdown active, button disabled)
  if (isFuture) {
    const diffMs = Math.max(0, unlockTime - now)
    const totalSeconds = Math.floor(diffMs / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    let countdownText = ""
    if (days > 0) {
      countdownText = `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`
    } else {
      countdownText = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    }

    return (
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Alarm Timer Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 h-8 rounded-xl text-xs font-medium text-[#3B3B3B] dark:text-neutral-200 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-black/5 dark:border-white/10 shadow-2xs select-none">
          <AlarmClock className="size-3.5 text-[#E9C46A] shrink-0" />
          <span className="text-neutral-400 dark:text-neutral-500 text-[11px]">Starts in</span>
          <span className="font-mono font-semibold tabular-nums text-[#3B3B3B] dark:text-white">
            {countdownText}
          </span>
        </div>

        {/* Disabled Start Exam Button (cannot press yet) */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Exam has not started yet. Please wait for the timer."
          className="inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-neutral-400 dark:text-neutral-500 bg-black/[0.04] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 cursor-not-allowed select-none transition-all shadow-2xs"
        >
          Start Exam
        </button>
      </div>
    )
  }

  // Case 3: Timer reached zero OR Exam is active and uncompleted
  const examUrl = upcomingExam.id
    ? `/student/mock-exams?examId=${upcomingExam.id}`
    : "/student/mock-exams"

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {/* Minimal & Neutral message with animated icon in an admin-styled glass container */}
      <div className="inline-flex items-center gap-2 px-3.5 h-8 rounded-xl text-xs font-medium text-[#3B3B3B] dark:text-neutral-200 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-black/5 dark:border-white/10 shadow-2xs select-none">
        <LordIcon
          src="/icons/startexam.json"
          size={20}
          trigger="loop"
          delay={2500}
          className="shrink-0"
        />
        <span className="text-xs font-medium text-[#3B3B3B] dark:text-neutral-200">
          Mock exam has started! Good luck!
        </span>
      </div>

      {/* Enabled Start Exam Button */}
      <Link
        href={examUrl}
        className="inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-white bg-[#3B3B3B] hover:bg-[#2B2B2B] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
      >
        Start Exam
      </Link>
    </div>
  )
}

