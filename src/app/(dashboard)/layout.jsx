import { getSession } from "@/lib/auth-session"
import { DashboardShell } from "@/components/dashboard-shell"

export default async function DashboardLayout({ children }) {
  const session = await getSession()
  const role = session?.role || "student"

  return <DashboardShell role={role}>{children}</DashboardShell>
}
