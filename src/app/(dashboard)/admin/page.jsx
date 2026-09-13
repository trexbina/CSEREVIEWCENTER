import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-session"
import pool from "@/lib/db"

import { BannerSection } from "./banner-section"
import { TodoWidget } from "./todo-widget"
import { MetricsStrip } from "./metrics-strip"
import { ActiveBatchesOverview } from "./active-batches-overview"
import { ProgramsDistributionOverview } from "./programs-distribution-overview"
import { RecentEnrollmentsFeed } from "./recent-enrollments-feed"

export default async function AdminDashboard() {
  const session = await getSession()

  if (session?.role && session.role !== "student" && session.role !== "teacher") {
    try {
      const res = await pool.query(
        "SELECT permissions FROM custom_roles WHERE role_key = $1",
        [session.role]
      )
      if (res.rows.length > 0 && Array.isArray(res.rows[0].permissions)) {
        const perms = res.rows[0].permissions
        if (!perms.includes("/admin")) {
          const firstAllowed = perms.find((p) => p.startsWith("/admin/")) || perms[0]
          if (firstAllowed) {
            redirect(firstAllowed)
          }
        }
      }
    } catch (e) {
      if (e.digest?.startsWith("NEXT_REDIRECT")) throw e
      console.error("[AdminDashboard] role check error:", e)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Top Row: Wider Banner + Compact Notepad Widget (Altered to align top edges) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Banner with increased width (spans 9 cols) */}
        <div className="lg:col-span-9">
          <BannerSection />
        </div>

        {/* Compact Notepad To-do List Widget (spans 3 cols) */}
        <div className="lg:col-span-3">
          <TodoWidget />
        </div>
      </div>

      {/* ── Overview Metrics Strip (Single unified container, neutral, minimal) ── */}
      <MetricsStrip />

      {/* ── Review Batches & Schedules Overview ── */}
      <ActiveBatchesOverview />

      {/* ── Academic Programs & Degree Tracks Overview ── */}
      <ProgramsDistributionOverview />

      {/* ── Recent Registrations & User Activity Feed ── */}
      <RecentEnrollmentsFeed />
    </div>
  )
}

