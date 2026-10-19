import pool from "@/lib/db"

/**
 * Check if the session belongs to a Super Admin.
 * Matches role (super_admin, admin) or protected user account (admin00001, id=1).
 */
export function isSuperAdmin(session) {
  if (!session) return false
  if (session.role === "super_admin" || session.role === "admin") return true
  if (session.userId === 1 || session.id === 1) return true
  const loginId = session.loginId || session.login_id
  if (typeof loginId === "string" && loginId.toLowerCase() === "admin00001") return true
  return false
}

/**
 * Check if a session user has permission for a specific module path.
 * Super admin and admin roles have access to all modules.
 */
export async function hasPermission(session, requiredPath) {
  if (!session || !session.role) return false
  if (isSuperAdmin(session)) return true

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
  if (isSuperAdmin(session)) return true

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

/**
 * Specific check for viewing and managing Security & Access Policies in Settings.
 * Super admin always has access; custom roles must have "/admin/settings/security".
 */
export async function canManageSecurityPolicies(session) {
  if (!session || !session.role) return false
  if (isSuperAdmin(session)) return true

  try {
    const res = await pool.query(
      "SELECT permissions FROM custom_roles WHERE role_key = $1",
      [session.role]
    )
    if (res.rows.length > 0) {
      const perms = res.rows[0].permissions
      if (Array.isArray(perms)) {
        return perms.includes("/admin/settings/security")
      }
    }
  } catch (err) {
    console.error("[canManageSecurityPolicies] Error checking permission:", err)
  }
  return false
}

