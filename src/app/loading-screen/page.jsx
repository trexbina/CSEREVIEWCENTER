"use client"

import { useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

const ROLE_ROUTES = {
  student: [
    "/student",
    "/student/groups",
    "/student/mock-exams",
    "/student/progress",
    "/student/notifications",
    "/student/profile",
    "/student/settings",
  ],
  teacher: [
    "/teacher",
    "/teacher/content",
    "/teacher/exams",
    "/teacher/students",
    "/teacher/notifications",
    "/teacher/settings",
  ],
  admin: [
    "/admin",
    "/admin/users",
    "/admin/security",
    "/admin/curriculum",
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

  const prefetchRoutes = useCallback(async (userRole) => {
    const routes = ROLE_ROUTES[userRole] || []

    const chunkWarmups = [
      import("@/components/dashboard-sidebar"),
      import("@/components/dashboard-header"),
      import("@/components/dashboard-carousel"),
    ]

    const pageFetches = routes.map((route) =>
      fetch(route, {
        priority: "low",
        headers: { "RSC": "1", "Next-Router-Prefetch": "1" },
      }).catch(() => {})
    )

    await Promise.allSettled([
      ...routes.map((route) => router.prefetch(route)),
      ...chunkWarmups,
      ...pageFetches,
    ])
  }, [router])

  useEffect(() => {
    async function loadAndRedirect() {
      await prefetchRoutes(role)
      await new Promise((r) => setTimeout(r, 800))
      router.push(destination)
      router.refresh()
    }
    loadAndRedirect()
  }, [destination, role, prefetchRoutes, router])

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center w-full max-w-sm px-4 animate-in fade-in duration-500">
        
        {/* Logo */}
        <div className="relative w-48 md:w-56 flex justify-center mb-8 animate-pulse">
          <img 
            src="/peak_loading_screen-removebg-preview.png" 
            alt="Peak Excellence" 
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Message */}
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-lg font-bold text-[#0f172a]">Welcome back, {name}!</h2>
          <p className="text-sm text-gray-400 font-medium">Preparing your dashboard...</p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-[240px] h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div 
            className="h-full bg-[#3b82f6] rounded-full" 
            style={{ animation: "loading-bar-slide 1.5s ease-in-out infinite" }} 
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-bar-slide {
          0% { width: 10%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 10%; margin-left: 90%; }
        }
      `}</style>
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
