"use client"

import { useEffect, useRef } from "react"

/**
 * useStudyHeartbeat
 * Client-side heartbeat hook that pings every 60s when actively studying.
 * Automatically pauses when tab is hidden or user has been idle for > 2 minutes.
 *
 * @param {Object} options
 * @param {number|string|null} options.subjectId - Active subject id (if inside a subject/module)
 * @param {string} options.activityType - 'lecture' | 'reading' | 'quiz' | 'mock_exam' | 'practice_test'
 * @param {boolean} options.enabled - Whether heartbeat is active
 * @param {number} options.intervalMs - Ping interval (default: 60,000ms / 60 seconds)
 */
export function useStudyHeartbeat({
  subjectId = null,
  activityType = "lecture",
  enabled = true,
  intervalMs = 60000,
} = {}) {
  const isIdleRef = useRef(false)
  const lastActiveRef = useRef(Date.now())
  const timerRef = useRef(null)

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    // Idle threshold: 2 minutes of no user interactions
    const IDLE_TIMEOUT_MS = 120000

    const resetActivity = () => {
      lastActiveRef.current = Date.now()
      if (isIdleRef.current) {
        isIdleRef.current = false
      }
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"]
    events.forEach((ev) => window.addEventListener(ev, resetActivity, { passive: true }))

    const checkIdleAndSendPing = async () => {
      const now = Date.now()
      const timeSinceLastAction = now - lastActiveRef.current

      if (timeSinceLastAction > IDLE_TIMEOUT_MS) {
        isIdleRef.current = true
      }

      const isPageVisible = document.visibilityState === "visible"
      const isIdle = isIdleRef.current

      // Only dispatch heartbeat when tab is visible and candidate is actively interacting
      if (isPageVisible && !isIdle) {
        try {
          await fetch("/api/student/heartbeat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subjectId,
              activityType,
              durationSeconds: Math.round(intervalMs / 1000),
              pageVisible: isPageVisible,
              idle: isIdle,
            }),
          })
        } catch (e) {
          // Fail silently in background without disrupting student UI
        }
      }
    }

    // Set recurring timer
    timerRef.current = setInterval(checkIdleAndSendPing, intervalMs)

    // Handle visibility changes immediately
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetActivity()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      events.forEach((ev) => window.removeEventListener(ev, resetActivity))
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [subjectId, activityType, enabled, intervalMs])
}

export default function StudyHeartbeatTracker(props) {
  useStudyHeartbeat(props)
  return null
}
