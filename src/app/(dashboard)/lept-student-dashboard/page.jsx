import { StudentDashboardView } from "../student/page"
import { getSession } from "@/lib/auth-session"
import { getStudentDashboardPath, LEPT_DASHBOARD_PATH } from "@/lib/examination-dashboard"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function LEPTStudentDashboard() {
  const session = await getSession()
  if (!session?.userId) redirect("/?login=1")
  const dashboardPath = await getStudentDashboardPath(session.userId)
  if (dashboardPath !== LEPT_DASHBOARD_PATH) redirect(dashboardPath)
  return <StudentDashboardView dashboardName="LEPT Student Dashboard" />
}

