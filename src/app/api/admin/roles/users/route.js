import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES, isAdminRole } from "@/lib/auth"

const VALID_STATIC_ROLES = ["super_admin", "admin", "academic_admin", "registrar", "teacher", "student"]

/**
 * GET /api/admin/roles/users
 * Query params:
 *   - role_key: get all users assigned to this role
 *   - search: search users system-wide (for transferring into a role)
 */
export async function GET(req) {
  try {
    const session = await getSession()
    if (!session || !isAdminRole(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const roleKey = searchParams.get("role_key")
    const search = searchParams.get("search")

    if (search && search.trim()) {
      const q = `%${search.trim()}%`
      const result = await pool.query(
        `SELECT 
          u.id, 
          u.name, 
          u.first_name, 
          u.last_name, 
          u.email, 
          u.personal_email, 
          u.login_id, 
          u.role, 
          u.is_active, 
          u.avatar_url, 
          u.created_at,
          COALESCE(r.name, u.role) as role_name
        FROM users u
        LEFT JOIN custom_roles r ON r.role_key = u.role
        WHERE (
          u.name ILIKE $1 
          OR u.email ILIKE $1 
          OR u.login_id ILIKE $1 
          OR u.personal_email ILIKE $1
        )
        ORDER BY u.name ASC
        LIMIT 20`,
        [q]
      )
      return NextResponse.json({ users: result.rows })
    }

    if (!roleKey) {
      return NextResponse.json({ error: "role_key or search parameter is required." }, { status: 400 })
    }

    // If role_key is super_admin, also return users with legacy 'admin' role
    const result = await pool.query(
      `SELECT 
        u.id, 
        u.name, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.personal_email, 
        u.login_id, 
        u.role, 
        u.is_active, 
        u.avatar_url, 
        u.created_at,
        COALESCE(r.name, u.role) as role_name
      FROM users u
      LEFT JOIN custom_roles r ON r.role_key = u.role
      WHERE u.role = $1 OR ($1 = 'super_admin' AND u.role = 'admin')
      ORDER BY u.name ASC`,
      [roleKey]
    )

    return NextResponse.json({ users: result.rows })
  } catch (err) {
    console.error("[admin/roles/users GET] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/roles/users
 * Body: { userId, role, is_active }
 * Updates a user's role (transfer) and/or enable/disable status
 */
export async function PATCH(req) {
  try {
    const session = await getSession()
    if (!session || !isAdminRole(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const body = await req.json()
    const { userId, role, is_active } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 })
    }

    const userRes = await pool.query("SELECT id, name, role, is_active, email FROM users WHERE id = $1", [parseInt(userId)])
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 })
    }

    // Prevent administrator from disabling their own account
    if (is_active === false && parseInt(userId) === parseInt(session.userId)) {
      return NextResponse.json({ error: "You cannot disable your own administrator account." }, { status: 400 })
    }

    // Validate role if changing role
    let newRole = undefined
    if (role !== undefined) {
      const trimmedRole = String(role).trim()
      let isValidRole = VALID_STATIC_ROLES.includes(trimmedRole)
      if (!isValidRole) {
        const checkCustom = await pool.query("SELECT id FROM custom_roles WHERE role_key = $1", [trimmedRole])
        if (checkCustom.rows.length > 0) {
          isValidRole = true
        }
      }

      if (!isValidRole) {
        return NextResponse.json({ error: `Invalid role specified: ${trimmedRole}` }, { status: 400 })
      }
      newRole = trimmedRole
    }

    const updates = []
    const values = []
    let idx = 1

    if (newRole !== undefined) {
      updates.push(`role = $${idx++}`)
      values.push(newRole)
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${idx++}`)
      values.push(Boolean(is_active))
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update provided." }, { status: 400 })
    }

    values.push(parseInt(userId))
    const query = `
      UPDATE users 
      SET ${updates.join(", ")} 
      WHERE id = $${idx} 
      RETURNING id, name, email, login_id, role, is_active, avatar_url
    `

    const updateRes = await pool.query(query, values)

    return NextResponse.json({
      success: true,
      user: updateRes.rows[0]
    })
  } catch (err) {
    console.error("[admin/roles/users PATCH] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
