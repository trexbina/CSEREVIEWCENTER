import pool from "@/lib/db"

/**
 * Check if a session user has permission for a specific module path.
 * Super admin and admin roles have access to all modules.
 */
export async function hasPermission(session, requiredPath) {
  if (!session || !session.role) return false
  if (session.role === "super_admin" || session.role === "admin") return true

  try {
    const res = await pool.query(
      "SELECT permissions FROM custom_roles WHERE role_key = $1",
      [session.role]
    )
    if (res.rows.length > 0) {
      const perms = res.rows[0].permissions
      if (Array.isArray(perms)) {
        return perms.includes(requiredPath)
      }
    }
  } catch (err) {
    console.error(`[hasPermission] Error checking permission for ${requiredPath}:`, err)
  }
  return false
}

/**
 * Specific check for managing roles and restrictions within Master Data.
 */
export async function canManageRoles(session) {
  if (!session || !session.role) return false
  if (session.role === "super_admin" || session.role === "admin") return true

  try {
    const res = await pool.query(
      "SELECT permissions FROM custom_roles WHERE role_key = $1",
      [session.role]
    )
    if (res.rows.length > 0) {
      const perms = res.rows[0].permissions
      if (Array.isArray(perms)) {
        return perms.includes("/admin/master-data/roles") || perms.includes("/admin/roles")
      }
    }
  } catch (err) {
    console.error("[canManageRoles] Error checking permission:", err)
  }
  return false
}
