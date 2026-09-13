import pool from "@/lib/db"
import { Users, Calendar, AlertTriangle, UserPlus } from "lucide-react"
import Link from "next/link"

export async function MetricsStrip() {
  let stats = {
    students: 0,
    batches: 0,
    expiring: 0,
    preRegs: 0,
  }

  try {
    const [studentsRes, batchesRes, expiringRes, preRegsRes] = await Promise.all([
      // 1. Total Enrolled Reviewees
      pool.query("SELECT COUNT(*)::int as count FROM users WHERE role = 'student'"),

      // 2. Active Review Batches
      pool.query("SELECT COUNT(*)::int as count FROM batches WHERE LOWER(COALESCE(status, 'active')) = 'active'"),

      // 3. Subscriptions Expiring Soon (≤ 14 days and currently active)
      pool.query(`
        SELECT COUNT(*)::int as count FROM users u
        LEFT JOIN batches b ON u.batch_id = b.id
        WHERE u.role = 'student' 
          AND u.is_active = true 
          AND COALESCE(u.subscription_end_date, b.end_date) BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '14 days')
      `),

      // 4. Pending Pre-Registrations
      pool.query("SELECT COUNT(*)::int as count FROM pre_registrations WHERE status = 'PENDING'")
    ])

    stats = {
      students: studentsRes.rows[0]?.count || 0,
      batches: batchesRes.rows[0]?.count || 0,
      expiring: expiringRes.rows[0]?.count || 0,
      preRegs: preRegsRes.rows[0]?.count || 0,
    }
  } catch (err) {
    console.error("[MetricsStrip] Failed to load overview metrics:", err)
  }

  const items = [
    {
      label: "Enrolled Reviewees",
      value: stats.students,
      href: "/admin/users",
      icon: Users,
      meta: "Active student accounts",
    },
    {
      label: "Active Batches",
      value: stats.batches,
      href: "/admin/master-data",
      icon: Calendar,
      meta: "Ongoing review terms",
    },
    {
      label: "Expiring Soon",
      value: stats.expiring,
      href: "/admin/subscriptions",
      icon: AlertTriangle,
      meta: "Within next 14 days",
    },
    {
      label: "Pre-Registrations",
      value: stats.preRegs,
      href: "/admin/users?tab=pre-registrations",
      icon: UserPlus,
      meta: "Pending application review",
    },
  ]

  return (
    <div className="w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-black/5 dark:divide-white/5">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <Link
              key={index}
              href={item.href}
              className="flex flex-col justify-between group transition-colors"
            >
              {/* Header: Label + Icon with bottom border & background area */}
              <div className="px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-white/[0.015]">
                <span className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400 select-none">
                  {item.label}
                </span>
                <Icon className="size-4 text-neutral-400 dark:text-neutral-500 stroke-[1.75]" />
              </div>

              {/* Body: Value + Brief Note */}
              <div className="p-5 sm:p-6 pt-4 sm:pt-4">
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                  {item.value.toLocaleString()}
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
  )
}
