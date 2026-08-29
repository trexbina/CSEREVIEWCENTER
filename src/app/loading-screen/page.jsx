"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

const ROLE_ROUTES = {
  student: [
    "/student",
    "/student/subjects",
    "/student/assignments",
    "/student/calendar",
    "/student/mock-exams",
    "/student/progress",
    "/student/notifications",
    "/student/profile",
    "/student/settings",
  ],
  teacher: [
    "/teacher",
    "/teacher/modules",
  ],
  admin: [
    "/admin",
    "/admin/users",
    "/admin/master-data",
    "/admin/analytical-overview",
    "/admin/financials",
    "/admin/reports",
    "/admin/notifications",
    "/admin/settings",
  ],
}

function LoadingScreenInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const destination = searchParams.get("destination") || "/student"
  const role = searchParams.get("role") || "student"
  const name = searchParams.get("name") || "User"

  const [progress, setProgress] = useState(0)
  const hasNavigated = useRef(false)

  // Prefetch relevant static & dynamic routes using native Next.js router.prefetch
  const prefetchRoutes = useCallback((userRole, dest) => {
    try {
      // 1. Prefetch target destination first
      if (dest) {
        router.prefetch(dest)
      }

      // 2. Prefetch role-based UI routes (dashboard, master data, etc., excluding heavy pages like mock/curriculum)
      const routes = ROLE_ROUTES[userRole] || ROLE_ROUTES.student
      routes.forEach((route) => {
        router.prefetch(route)
      })

      // 3. Dynamic component chunk warmups
      import("@/components/dashboard-sidebar").catch(() => {})
      import("@/components/dashboard-header").catch(() => {})
      import("@/components/dashboard-carousel").catch(() => {})
    } catch (e) {
      console.warn("Prefetch error:", e)
    }
  }, [router])

  useEffect(() => {
    // Perform route prefetching
    prefetchRoutes(role, destination)

    let startTime = null
    const duration = 1200 // Smooth 1.2s load sequence
    let animationFrameId

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const currentProgress = Math.min(100, Math.floor((elapsed / duration) * 100))
      
      setProgress(currentProgress)

      if (currentProgress < 100) {
        animationFrameId = requestAnimationFrame(step)
      } else {
        if (!hasNavigated.current) {
          hasNavigated.current = true
          
          // Execute router push navigation (without router.refresh which cancels push)
          router.push(destination)

          // Fallback redirect if client-side router transition gets delayed
          setTimeout(() => {
            if (typeof window !== "undefined" && window.location.pathname === "/loading-screen") {
              window.location.href = destination
            }
          }, 500)
        }
      }
    }

    animationFrameId = requestAnimationFrame(step)

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [destination, role, prefetchRoutes, router])

  const messages = [
    "Authenticating session...",
    `Fetching ${role === "student" ? "student" : role === "teacher" ? "teacher" : "admin"} preferences...`,
    "Loading dashboard components...",
    "Finalizing setup...",
  ]

  const [msgIndex, setMsgIndex] = useState(0)
  const [msgDirection, setMsgDirection] = useState(1) // 1 = forward, -1 = backward

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => {
        const next = prev + msgDirection
        if (next >= messages.length - 1) {
          setMsgDirection(-1)
          return messages.length - 1
        }
        if (next <= 0) {
          setMsgDirection(1)
          return 0
        }
        return next
      })
    }, 800)
    return () => clearInterval(interval)
  }, [msgDirection, messages.length])

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center w-full max-w-sm px-4 animate-in fade-in duration-500">
        
        {/* Logo (Static / Non-blinking) */}
        <div className="relative w-28 md:w-32 flex justify-center mb-6">
          <img 
            src="/landingpageassets/logo.png" 
            alt="Peak Excellence" 
            className="w-full h-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Message */}
        <div className="text-center space-y-2 mb-6 min-h-[60px] flex flex-col items-center justify-center">
          <h2 className="text-lg font-bold text-[#0f172a]">Welcome back, {name}!</h2>
          <p className="text-sm text-gray-500 font-medium transition-all duration-300">
            {messages[msgIndex]}
          </p>
        </div>

        {/* Progress Bar (no percentage) */}
        <div className="w-full max-w-[260px]">
          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden shadow-inner relative">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-75 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoadingScreenPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-white" />
    }>
      <LoadingScreenInner />
    </Suspense>
  )
}
