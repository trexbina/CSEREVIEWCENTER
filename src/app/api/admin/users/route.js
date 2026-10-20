import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { moveToTrash } from "@/lib/trash"

import { generateNextLoginId } from "@/lib/login-id"
import { isSuperAdmin } from "@/lib/role-permissions"

const ADMIN_ROLES = ["admin", "super_admin", "academic_admin", "registrar"]
const VALID_ROLES = ["student", "teacher", ...ADMIN_ROLES]

/** GET /api/admin/users — list all users (admin only). */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const { rows } = await pool.query(
      "SELECT id, name, email, login_id, login_prefix, login_number, role, created_at FROM users ORDER BY created_at DESC"
    )
    return NextResponse.json({ users: rows })
  } catch (err) {
    console.error("[admin/users GET] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

async function ensureTable() {
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS targets JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_email VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS login_prefix VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS login_number VARCHAR(20);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS login_id VARCHAR(120);
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_id_unique ON users(LOWER(login_id));
  `).catch(console.error)
}

/** POST /api/admin/users — create a student or teacher (admin only). */
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    await ensureTable()

    const body = await request.json()
    const { name, password, role, personal_email } = body

    if (!name || !password) {
      return NextResponse.json(
        { error: "Name and password are required." },
        { status: 400 }
      )
    }

    let isValidRole = VALID_ROLES.includes(role)
    if (!isValidRole && role) {
      const customRoleCheck = await pool.query("SELECT id FROM custom_roles WHERE role_key = $1", [role])
      if (customRoleCheck.rows.length > 0) {
        isValidRole = true
      }
    }

    if (!isValidRole) {
      return NextResponse.json(
        { error: "Invalid role selected." },
        { status: 400 }
      )
    }

    // Automatically generate next Login ID based on last_name, name, and role
    const generated = await generateNextLoginId(
      pool,
      body.last_name,
      name,
      role || "student"
    )

    // Fallback for legacy email NOT NULL column if email is not provided
    const userEmail = (body.email || `${generated.login_id}@peak.edu.ph`).toLowerCase().trim()

    // Check if email already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [userEmail])
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Email or account already registered." },
        { status: 409 }
      )
    }

    const hash = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `INSERT INTO users (
        name, email, password, role,
        first_name, middle_name, last_name, suffix,
        birthday, gender, phone, address, city, province, zip_code,
        school, course, year_graduated, highest_education,
        exam_id, batch_id, program_id, major_id, job_role_description,
        school_id, academic_course_id, avatar_url, targets, personal_email,
        is_active, subscription_end_date, login_prefix, login_number, login_id, created_at
      )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34, NOW())
       RETURNING id, name, email, login_id, login_prefix, login_number, personal_email, role, is_active, subscription_end_date, created_at, avatar_url`,
      [
        name.trim(),
        userEmail,
        hash,
        role,
        body.first_name?.trim() || null,
        body.middle_name?.trim() || null,
        body.last_name?.trim() || null,
        body.suffix?.trim() || null,
        body.birthday || null,
        body.gender || null,
        body.phone?.trim() || null,
        body.address?.trim() || null,
        body.city?.trim() || null,
        body.province?.trim() || null,
        body.zip_code?.trim() || null,
        body.school?.trim() || null,
        body.course?.trim() || null,
        body.year_graduated?.toString().trim() || null,
        body.highest_education || null,
        body.exam_id || null,
        body.batch_id || null,
        body.program_id || null,
        body.major_id || null,
        body.job_role_description?.trim() || null,
        body.school_id || null,
        body.academic_course_id || null,
        body.avatar_url || null,
        JSON.stringify(body.targets || []),
        personal_email?.toLowerCase().trim() || userEmail,
        body.is_active !== undefined ? Boolean(body.is_active) : true,
        body.subscription_end_date ? body.subscription_end_date : null,
        generated.login_prefix,
        generated.login_number,
        generated.login_id,
      ]
    )

    revalidatePath("/admin/users")
    revalidatePath("/admin/users/all")

    return NextResponse.json({ user: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error("[admin/users POST] error:", err)
    return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 })
  }
}

/** DELETE /api/admin/users — delete single user (?id=123) or multiple users ({ ids: [123, 456] } or ?ids=123,456). */
export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    let targetIds = []
    let bodyData = null
    try {
      bodyData = await request.json()
    } catch {
      // Body parsing optional
    }

    if (bodyData?.ids && Array.isArray(bodyData.ids)) {
      targetIds = bodyData.ids.map((id) => Number(id)).filter((id) => !isNaN(id))
    } else if (bodyData?.id) {
      targetIds = [Number(bodyData.id)].filter((id) => !isNaN(id))
    } else {
      const { searchParams } = new URL(request.url)
      const idsParam = searchParams.get("ids")
      const idParam = searchParams.get("id")
      if (idsParam) {
        targetIds = idsParam.split(",").map((id) => Number(id.trim())).filter((id) => !isNaN(id))
      } else if (idParam) {
        targetIds = [Number(idParam)].filter((id) => !isNaN(id))
      }
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ error: "User id(s) required." }, { status: 400 })
    }

    // Check for default system Super Admin (admin00001 or id=1)
    const protectedUsers = await pool.query(
      "SELECT id, login_id FROM users WHERE id = ANY($1::int[]) AND (LOWER(login_id) = 'admin00001' OR id = 1)",
      [targetIds]
    )

    if (protectedUsers.rows.length > 0 && targetIds.length === 1) {
      return NextResponse.json({ error: "The default system Super Admin (admin00001) is protected and cannot be deleted." }, { status: 400 })
    }

    const protectedIds = new Set(protectedUsers.rows.map((u) => u.id))
    // Exclude current session admin and protected admin from deletion
    const validIdsToDelete = targetIds.filter((id) => id !== Number(session.userId) && !protectedIds.has(id))

    if (validIdsToDelete.length === 0) {
      return NextResponse.json({ error: "Cannot delete yourself or the default system Super Admin." }, { status: 400 })
    }

    // Fetch user records before deletion so they can be saved to trash
    const usersToTrash = await pool.query(
      "SELECT * FROM users WHERE id = ANY($1::int[])",
      [validIdsToDelete]
    )

    for (const u of usersToTrash.rows) {
      await moveToTrash({
        entity_type: "USER",
        original_id: u.id,
        item_name: u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
        description: `Role: ${u.role} • ${u.email}`,
        original_location: "/admin/users",
        payload: u,
        deleted_by: session.userId,
        deleted_by_name: session.name || session.email || null,
      })
    }

    const { rowCount } = await pool.query(
      "DELETE FROM users WHERE id = ANY($1::int[])",
      [validIdsToDelete]
    )

    if (rowCount === 0) {
      return NextResponse.json({ error: "User(s) not found." }, { status: 404 })
    }

    revalidatePath("/admin/users")
    revalidatePath("/admin/users/all")
    revalidatePath("/admin/trash")

    return NextResponse.json({ ok: true, deletedCount: rowCount })
  } catch (err) {
    console.error("[admin/users DELETE] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

/** PUT /api/admin/users?id=123 — update a user (admin only). */
export async function PUT(request) {
  try {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "User id is required." }, { status: 400 })
    }

    const body = await request.json()
    const { name, role, password, personal_email } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      )
    }

    // Fetch existing user to preserve fields if needed
    const existingUserRes = await pool.query("SELECT id, email, login_id, role, is_active FROM users WHERE id = $1", [userId])
    if (existingUserRes.rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 })
    }
    const currentUser = existingUserRes.rows[0]
    const userEmail = (body.email || currentUser.email || `${currentUser.login_id}@peak.edu.ph`).toLowerCase().trim()

    // Protection for default Super Admin account (admin00001 or id=1)
    const isProtectedSuperAdmin = currentUser.login_id?.toLowerCase() === "admin00001" || currentUser.id === 1

    // Permission rule: only Super Admins can edit Super Admin profiles
    const isTargetSuperAdmin = isProtectedSuperAdmin || currentUser.role === "super_admin" || currentUser.role === "admin"
    if (isTargetSuperAdmin && !isSuperAdmin(session)) {
      return NextResponse.json(
        { error: "Only Super Admins can edit Super Admin profiles." },
        { status: 403 }
      )
    }

    let finalRole = role || currentUser.role || "student"
    if (isProtectedSuperAdmin) {
      if (role && role !== "super_admin" && role !== "admin") {
        return NextResponse.json(
          { error: "The default system Super Admin (admin00001) is protected and cannot be changed to another role." },
          { status: 400 }
        )
      }
      finalRole = "super_admin"
    } else if (role) {
      let isValidRole = VALID_ROLES.includes(role)
      if (!isValidRole) {
        const customRoleCheck = await pool.query("SELECT id FROM custom_roles WHERE role_key = $1", [role])
        if (customRoleCheck.rows.length > 0) {
          isValidRole = true
        }
      }
      if (!isValidRole) {
        return NextResponse.json(
          { error: "Invalid role selected." },
          { status: 400 }
        )
      }
    }

    // Check if email is taken by another user
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [userEmail, userId]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Email already in use by another account." },
        { status: 409 }
      )
    }

    let result
    let isActiveVal = body.is_active !== undefined ? Boolean(body.is_active) : true
    if (isProtectedSuperAdmin) {
      if (body.is_active === false) {
        return NextResponse.json(
          { error: "The default system Super Admin (admin00001) is protected and cannot be disabled." },
          { status: 400 }
        )
      }
      isActiveVal = true
    }
    const subEndDateVal = body.subscription_end_date ? body.subscription_end_date : null

    let finalLoginId = body.login_id?.trim() || null
    let finalLoginPrefix = body.login_prefix?.trim() || null
    let finalLoginNumber = body.login_number?.trim() || null

    if (finalLoginId) {
      finalLoginPrefix = finalLoginPrefix || finalLoginId.replace(/[0-9]+$/, "")
      const rawNum = finalLoginNumber || finalLoginId.replace(/^[^0-9]+/, "") || "1"
      finalLoginNumber = String(rawNum).replace(/[^0-9]/g, "").padStart(5, "0")
      finalLoginId = `${finalLoginPrefix}${finalLoginNumber}`
    }

    // Check if login_id is taken by another user if updated
    if (finalLoginId) {
      const existingLogin = await pool.query(
        "SELECT id FROM users WHERE LOWER(login_id) = $1 AND id != $2",
        [finalLoginId.toLowerCase(), userId]
      )
      if (existingLogin.rows.length > 0) {
        return NextResponse.json(
          { error: `Login ID "${finalLoginId}" is already in use by another user.` },
          { status: 409 }
        )
      }
    }

    if (password?.trim()) {
      const hash = await bcrypt.hash(password.trim(), 10)
      result = await pool.query(
        `UPDATE users SET
          name = $1, email = $2, role = $3, password = $4,
          first_name = $5, middle_name = $6, last_name = $7, suffix = $8,
          birthday = $9, gender = $10, phone = $11, address = $12, city = $13, province = $14, zip_code = $15,
          school = $16, course = $17, year_graduated = $18, highest_education = $19,
          exam_id = $20, batch_id = $21, program_id = $22, major_id = $23, job_role_description = $24,
          school_id = $25, academic_course_id = $26, avatar_url = $27, targets = $28,
          personal_email = $29, is_active = $30, subscription_end_date = $31,
          login_id = COALESCE($32, login_id),
          login_prefix = COALESCE($33, login_prefix),
          login_number = COALESCE($34, login_number)
         WHERE id = $35
         RETURNING id, name, email, login_id, login_prefix, login_number, personal_email, role, is_active, subscription_end_date, created_at, avatar_url`,
        [
          name.trim(),
          userEmail,
          finalRole,
          hash,
          body.first_name?.trim() || null,
          body.middle_name?.trim() || null,
          body.last_name?.trim() || null,
          body.suffix?.trim() || null,
          body.birthday || null,
          body.gender || null,
          body.phone?.trim() || null,
          body.address?.trim() || null,
          body.city?.trim() || null,
          body.province?.trim() || null,
          body.zip_code?.trim() || null,
          body.school?.trim() || null,
          body.course?.trim() || null,
          body.year_graduated?.toString().trim() || null,
          body.highest_education || null,
          body.exam_id || null,
          body.batch_id || null,
          body.program_id || null,
          body.major_id || null,
          body.job_role_description?.trim() || null,
          body.school_id || null,
          body.academic_course_id || null,
          body.avatar_url || null,
          body.targets !== undefined ? JSON.stringify(body.targets) : null,
          personal_email?.toLowerCase().trim() || userEmail,
          isActiveVal,
          subEndDateVal,
          finalLoginId,
          finalLoginPrefix,
          finalLoginNumber,
          userId,
        ]
      )
    } else {
      result = await pool.query(
        `UPDATE users SET
          name = $1, email = $2, role = $3,
          first_name = $4, middle_name = $5, last_name = $6, suffix = $7,
          birthday = $8, gender = $9, phone = $10, address = $11, city = $12, province = $13, zip_code = $14,
          school = $15, course = $16, year_graduated = $17, highest_education = $18,
          exam_id = $19, batch_id = $20, program_id = $21, major_id = $22, job_role_description = $23,
          school_id = $24, academic_course_id = $25, avatar_url = $26, targets = $27,
          personal_email = $28, is_active = $29, subscription_end_date = $30,
          login_id = COALESCE($31, login_id),
          login_prefix = COALESCE($32, login_prefix),
          login_number = COALESCE($33, login_number)
         WHERE id = $34
         RETURNING id, name, email, login_id, login_prefix, login_number, personal_email, role, is_active, subscription_end_date, created_at, avatar_url`,
        [
          name.trim(),
          userEmail,
          finalRole,
          body.first_name?.trim() || null,
          body.middle_name?.trim() || null,
          body.last_name?.trim() || null,
          body.suffix?.trim() || null,
          body.birthday || null,
          body.gender || null,
          body.phone?.trim() || null,
          body.address?.trim() || null,
          body.city?.trim() || null,
          body.province?.trim() || null,
          body.zip_code?.trim() || null,
          body.school?.trim() || null,
          body.course?.trim() || null,
          body.year_graduated?.toString().trim() || null,
          body.highest_education || null,
          body.exam_id || null,
          body.batch_id || null,
          body.program_id || null,
          body.major_id || null,
          body.job_role_description?.trim() || null,
          body.school_id || null,
          body.academic_course_id || null,
          body.avatar_url || null,
          body.targets !== undefined ? JSON.stringify(body.targets) : null,
          personal_email?.toLowerCase().trim() || userEmail,
          isActiveVal,
          subEndDateVal,
          finalLoginId,
          finalLoginPrefix,
          finalLoginNumber,
          userId,
        ]
      )
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 })
    }

    revalidatePath("/admin/users")
    revalidatePath("/admin/users/all")

    return NextResponse.json({ user: result.rows[0] })
  } catch (err) {
    console.error("[admin/users PUT] error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
