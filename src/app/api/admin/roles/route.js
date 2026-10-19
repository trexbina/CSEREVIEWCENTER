import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES, isAdminRole } from "@/lib/auth"
import { canManageRoles } from "@/lib/role-permissions"

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS custom_roles (
      id SERIAL PRIMARY KEY,
      role_key VARCHAR(60) UNIQUE NOT NULL,
      name VARCHAR(120) NOT NULL,
      description TEXT,
      permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
      is_system BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `).catch(console.error)
}

/**
 * GET /api/admin/roles
 * Retrieve all system and custom roles with user count
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || !isAdminRole(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    await ensureTable()

    const result = await pool.query(`
      SELECT 
        r.id, 
        r.role_key, 
        r.name, 
        r.description, 
        r.permissions, 
        r.is_system, 
        r.created_at, 
        r.updated_at,
        (SELECT COUNT(*) FROM users u WHERE u.role = r.role_key OR (r.role_key = 'super_admin' AND u.role = 'admin')) as user_count
      FROM custom_roles r
      ORDER BY r.is_system DESC, r.name ASC
    `)

    return NextResponse.json({ roles: result.rows })
  } catch (err) {
    console.error("[admin/roles GET] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

/**
 * POST /api/admin/roles
 * Create a new custom role with dashboard restrictions
 */
export async function POST(req) {
  try {
    const session = await getSession()
    if (!session || !isAdminRole(session.role) || !(await canManageRoles(session))) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to manage roles and restrictions." }, { status: 403 })
    }

    await ensureTable()

    const body = await req.json()
    const { name, role_key, description, permissions } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Role name is required." }, { status: 400 })
    }

    // Format role_key: lowercase alphanumeric with underscores
    let key = (role_key || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")

    if (!key) {
      key = `role_${Date.now()}`
    }

    // Check if key already exists
    const existing = await pool.query("SELECT id FROM custom_roles WHERE role_key = $1", [key])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: `A role with the identifier "${key}" already exists.` }, { status: 400 })
    }

    const permsJson = JSON.stringify(Array.isArray(permissions) ? permissions : [])

    const result = await pool.query(
      `INSERT INTO custom_roles (role_key, name, description, permissions, is_system)
       VALUES ($1, $2, $3, $4::jsonb, false)
       RETURNING *`,
      [key, name.trim(), description?.trim() || null, permsJson]
    )

    return NextResponse.json({ role: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error("[admin/roles POST] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

/**
 * PUT /api/admin/roles
 * Update an existing role's name, description, and permissions
 */
export async function PUT(req) {
  try {
    const session = await getSession()
    if (!session || !isAdminRole(session.role) || !(await canManageRoles(session))) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to manage roles and restrictions." }, { status: 403 })
    }

    await ensureTable()

    const body = await req.json()
    const { id, name, description, permissions } = body

    if (!id) {
      return NextResponse.json({ error: "Role ID is required." }, { status: 400 })
    }

    const permsJson = JSON.stringify(Array.isArray(permissions) ? permissions : [])

    const result = await pool.query(
      `UPDATE custom_roles
       SET name = COALESCE($1, name),
           description = $2,
           permissions = $3::jsonb,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [name?.trim() || null, description?.trim() || null, permsJson, parseInt(id)]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Role not found." }, { status: 404 })
    }

    return NextResponse.json({ role: result.rows[0] })
  } catch (err) {
    console.error("[admin/roles PUT] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/roles
 * Delete a custom non-system role
 */
export async function DELETE(req) {
  try {
    const session = await getSession()
    if (!session || !isAdminRole(session.role) || !(await canManageRoles(session))) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to manage roles and restrictions." }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Role ID is required." }, { status: 400 })
    }

    const roleRes = await pool.query("SELECT * FROM custom_roles WHERE id = $1", [parseInt(id)])
    if (roleRes.rows.length === 0) {
      return NextResponse.json({ error: "Role not found." }, { status: 404 })
    }

    const role = roleRes.rows[0]
    if (role.is_system) {
      return NextResponse.json({ error: "System default roles cannot be deleted." }, { status: 400 })
    }

    // Check if any users are currently assigned to this role
    const usersRes = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = $1", [role.role_key])
    const count = parseInt(usersRes.rows[0]?.count || "0", 10)
    if (count > 0) {
      return NextResponse.json({
        error: `Cannot delete role "${role.name}" because ${count} user(s) are currently assigned to it. Reassign them first.`
      }, { status: 400 })
    }

    await pool.query("DELETE FROM custom_roles WHERE id = $1", [parseInt(id)])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[admin/roles DELETE] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
