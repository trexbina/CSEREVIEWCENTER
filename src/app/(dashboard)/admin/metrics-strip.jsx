import pool from "@/lib/db"
import { MetricsCarouselClient } from "./metrics-carousel-client"

export async function MetricsStrip() {
  let stats = {
    students: 0,
    batches: 0,
    examinations: 0,
    expiring: 0,
    preRegs: 0,
  }

  try {
    const [studentsRes, batchesRes, examsRes, expiringRes, preRegsRes] = await Promise.all([
      // 1. Total Enrolled Reviewees
      pool.query("SELECT COUNT(*)::int as count FROM users WHERE role = 'student'"),

      // 2. Active Review Batches
      pool.query("SELECT COUNT(*)::int as count FROM batches WHERE LOWER(COALESCE(status, 'active')) = 'active'"),

      // 3. Registered Examinations (LEPT, etc.)
      pool.query("SELECT COUNT(*)::int as count FROM examinations"),

      // 4. Subscriptions Expiring Soon (≤ 14 days and currently active)
      pool.query(`
        SELECT COUNT(*)::int as count FROM users u
        LEFT JOIN batches b ON u.batch_id = b.id
        WHERE u.role = 'student' 
        AND u.is_active = true 
        AND COALESCE(u.subscription_end_date, b.end_date) BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '14 days')
      `),

      // 5. Pending Pre-Registrations
      pool.query("SELECT COUNT(*)::int as count FROM pre_registrations WHERE status = 'PENDING'")
    ])

    stats = {
      students: studentsRes.rows[0]?.count || 0,
      batches: batchesRes.rows[0]?.count || 0,
      examinations: examsRes.rows[0]?.count || 0,
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
      iconKey: "users",
      lordIcon: "/icons/knowifready.json",
      meta: "Active student accounts",
      headerBg: "bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25",
    },
    {
      label: "Active Batches",
      value: stats.batches,
      href: "/admin/master-data",
      iconKey: "calendar",
      lordIcon: "/icons/allinonespot.json",
      meta: "Ongoing review terms",
      headerBg: "bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25",
    },
    {
      label: "Examinations",
      value: stats.examinations,
      href: "/admin/master-data",
      iconKey: "award",
      lordIcon: "/icons/instantresults.json",
      meta: "Active board exams (LEPT, etc.)",
      headerBg: "bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25",
    },
    {
      label: "Expiring Soon",
      value: stats.expiring,
      href: "/admin/subscriptions",
      iconKey: "alertTriangle",
      lordIcon: "/icons/knowifready.json",
      meta: "Within next 14 days",
      headerBg: "bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25",
    },
    {
      label: "Pre-Registrations",
      value: stats.preRegs,
      href: "/admin/users?tab=pre-registrations",
      iconKey: "userPlus",
      lordIcon: "/icons/allinonespot.json",
      meta: "Pending application review",
      headerBg: "bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25",
    },
  ]

  return <MetricsCarouselClient items={items} />
}

