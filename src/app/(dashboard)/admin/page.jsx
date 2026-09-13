import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-session"
import pool from "@/lib/db"

import { BannerSection } from "./banner-section"
import { TodoWidget } from "./todo-widget"
import { CalendarWidget } from "./calendar-widget"
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
    <div className="space-y-9 sm:space-y-10 pb-10">
      {/* ── Top Section: 9-col Banner + Metrics Strip / 3-col To-Do List + Calendar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 items-stretch">
        {/* Left Column (spans 9 cols): Banner + Metric Strip (same width as banner) */}
        <div className="lg:col-span-9 flex flex-col justify-between gap-6 sm:gap-7">
          <BannerSection />
          <MetricsStrip />
        </div>

        {/* Right Column (spans 3 cols): To-do List + Calendar Widget (flex-col justify-between to align bottom with metric strip) */}
        <div className="lg:col-span-3 flex flex-col justify-between gap-6 sm:gap-7">
          <TodoWidget />
          <CalendarWidget />
        </div>
      </div>

      {/* ── Review Batches & Schedules Overview ── */}
      <div className="pt-1">
        <ActiveBatchesOverview />
      </div>

      {/* ── Academic Programs & Degree Tracks Overview ── */}
      <div className="pt-1">
        <ProgramsDistributionOverview />
      </div>

      {/* ── Recent Registrations & User Activity Feed ── */}
      <div className="pt-1">
        <RecentEnrollmentsFeed />
      </div>
    </div>
  )
}

