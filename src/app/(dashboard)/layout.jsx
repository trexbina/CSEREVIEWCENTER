import { getSession } from "@/lib/auth-session"
import { DashboardShell } from "@/components/dashboard-shell"
import pool from "@/lib/db"

export default async function DashboardLayout({ children }) {
  const session = await getSession()
  const role = session?.role || "student"

  let permissions = null
  let roleName = ""
  if (role !== "student" && role !== "teacher") {
    try {
      const res = await pool.query(
        "SELECT name, permissions FROM custom_roles WHERE role_key = $1",
        [role]
      )
      if (res.rows.length > 0) {
        roleName = res.rows[0].name || ""
        if (Array.isArray(res.rows[0].permissions)) {
          permissions = res.rows[0].permissions
        }
      }
    } catch (e) {
      console.error("[DashboardLayout] Error fetching role permissions:", e)
    }
  }

  return (
    <DashboardShell role={role} permissions={permissions} roleName={roleName}>
      {children}
    </DashboardShell>
  )
}

