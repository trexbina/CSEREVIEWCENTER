"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ── Animated single digit (rolling-number effect from AnimatedTimer) ── */
function CountdownChar({ char }) {
  const ref = React.useRef(null)
  const [height, setHeight] = React.useState(0)

  React.useEffect(() => {
    if (ref.current) setHeight(ref.current.offsetHeight)
  }, [])

  if (char === ":") {
    return (
      <div className="flex items-center justify-center h-[48px] sm:h-[56px] md:h-[72px] w-3 sm:w-4 md:w-5">
        <span className="text-primary text-2xl sm:text-3xl md:text-5xl font-bold">:</span>
      </div>
    )
  }

  const number = parseInt(char, 10)
  const top = height > 0 ? number * height * -1 : 0

  return (
    <div
      ref={ref}
      className="relative h-[48px] sm:h-[56px] md:h-[72px] w-[26px] sm:w-[32px] md:w-[44px] overflow-hidden"
    >
      <div
        className="absolute left-0 flex flex-col w-full transition-[top] duration-300 ease-out"
        style={{ top }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <div
            key={digit}
            className="flex items-center justify-center h-[48px] sm:h-[56px] md:h-[72px] w-full"
          >
            <span
              className={cn(
                "font-bold transition-all duration-300",
                number === digit
                  ? "text-2xl sm:text-3xl md:text-5xl text-foreground opacity-100"
                  : "text-base sm:text-lg md:text-2xl text-foreground opacity-[0.06]"
              )}
            >
              {digit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Single countdown segment (e.g. "30" with label "Days") ── */
function CountdownSegment({ value, label }) {
  const str = value < 10 ? `0${value}` : String(value)
  const chars = str.split("")

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex rounded-lg bg-card border border-border shadow-sm px-1.5 sm:px-2">
        {chars.map((ch, i) => (
          <CountdownChar key={i} char={ch} />
        ))}
      </div>
      <span className="text-[10px] sm:text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

/* ── Colon separator between segments ── */
function Separator() {
  return (
    <div className="flex items-center pb-5">
      <span className="text-2xl sm:text-3xl md:text-5xl font-bold text-primary/60 animate-pulse">
        :
      </span>
    </div>
  )
}

/* ── Main exported component ── */
export function ExamCountdownTimer({
  /** Target date for the exam */
  targetDate,
  /** Label shown above the timer */
  examLabel = "LET Examination",
  className,
}) {
  const [now, setNow] = React.useState(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    setNow(new Date())
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [mounted])

  const target = React.useMemo(() => new Date(targetDate), [targetDate])

  const diff = React.useMemo(() => {
    if (!now) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
    const ms = Math.max(target - now, 0)
    return {
      total: ms,
      days: Math.floor(ms / (1000 * 60 * 60 * 24)),
      hours: Math.floor((ms / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((ms / (1000 * 60)) % 60),
      seconds: Math.floor((ms / 1000) % 60),
    }
  }, [now, target])

  const isUrgent = diff.days <= 7 && diff.total > 0
  const isExpired = diff.total <= 0

  /* skeleton while SSR / not mounted */
  if (!mounted) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse",
          className
        )}
      >
        <div className="h-6 w-48 bg-muted rounded mb-4 mx-auto" />
        <div className="h-16 w-72 bg-muted rounded mx-auto" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card shadow-sm transition-colors",
        isUrgent && !isExpired
          ? "border-destructive/50 bg-destructive/5"
          : "border-border",
        className
      )}
    >
      {/* Gradient accent bar at top */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-primary/30" />

      <div className="flex flex-col items-center gap-4 px-4 py-5 sm:px-6 sm:py-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-xs sm:text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Countdown to
          </p>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
            {examLabel}
          </h3>
        </div>

        {isExpired ? (
          <div className="py-3 text-center">
            <p className="text-xl sm:text-2xl font-bold text-primary">
              Exam Day is Here — Good Luck! 🎉
            </p>
          </div>
        ) : (
          <>
            {/* Timer digits */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <CountdownSegment value={diff.days} label="Days" />
              <Separator />
              <CountdownSegment value={diff.hours} label="Hours" />
              <Separator />
              <CountdownSegment value={diff.minutes} label="Mins" />
              <Separator />
              <CountdownSegment value={diff.seconds} label="Secs" />
            </div>

            {/* Urgency message */}
            {isUrgent && (
              <p className="text-sm font-medium text-destructive animate-pulse">
                Less than a week left — keep pushing!
              </p>
            )}

            {/* Exam date label */}
            <p className="text-xs sm:text-sm text-muted-foreground">
              {target.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
