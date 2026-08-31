import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

const ADMIN_ROLES = ["admin", "super_admin", "academic_admin", "registrar"]

async function adminGuard() {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) return null
    return session
}

async function ensureTable() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      has_subcategories BOOLEAN DEFAULT TRUE,
      target_course TEXT DEFAULT 'all',
      target_program TEXT DEFAULT 'all',
      target_major TEXT DEFAULT 'all',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE categories ADD COLUMN IF NOT EXISTS has_subcategories BOOLEAN DEFAULT TRUE;
    ALTER TABLE categories ALTER COLUMN target_course TYPE TEXT;
    ALTER TABLE categories ALTER COLUMN target_program TYPE TEXT;
    ALTER TABLE categories ALTER COLUMN target_major TYPE TEXT;
    ALTER TABLE categories ADD COLUMN IF NOT EXISTS target_course TEXT DEFAULT 'all';
    ALTER TABLE categories ADD COLUMN IF NOT EXISTS target_program TEXT DEFAULT 'all';
    ALTER TABLE categories ADD COLUMN IF NOT EXISTS target_major TEXT DEFAULT 'all';
  `)
}

// ── GET /api/admin/categories ─────────────────────────────
export async function GET() {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        await ensureTable()

        const { rows } = await pool.query(
            "SELECT * FROM categories ORDER BY created_at ASC"
        )
        return NextResponse.json({ categories: rows })
    } catch (err) {
        console.error("[admin/categories GET]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── POST /api/admin/categories ────────────────────────────
export async function POST(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        await ensureTable()

        const { name, description, has_subcategories, target_course, target_program, target_major } = await request.json()

        if (!name?.trim()) {
            return NextResponse.json(
                { error: "Category name is required." },
                { status: 400 }
            )
        }

        // check duplicate
        const existing = await pool.query(
            "SELECT id FROM categories WHERE LOWER(name) = LOWER($1)",
            [name.trim()]
        )
        if (existing.rows.length > 0) {
            return NextResponse.json(
                { error: "A category with this name already exists." },
                { status: 409 }
            )
        }

        const { rows } = await pool.query(
            `INSERT INTO categories (name, description, has_subcategories, target_course, target_program, target_major)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                name.trim(), 
                description?.trim() || null, 
                has_subcategories !== undefined ? has_subcategories : true,
                target_course || "all",
                target_program || "all",
                target_major || "all"
            ]
        )

        return NextResponse.json({ category: rows[0] }, { status: 201 })
    } catch (err) {
        console.error("[admin/categories POST]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── DELETE /api/admin/categories?id=… ─────────────────────
export async function DELETE(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        if (!id) {
            return NextResponse.json({ error: "Category id is required." }, { status: 400 })
        }

        const { rowCount } = await pool.query(
            "DELETE FROM categories WHERE id = $1",
            [id]
        )

        if (rowCount === 0) {
            return NextResponse.json({ error: "Category not found." }, { status: 404 })
        }

        return NextResponse.json({ message: "Category deleted." })
    } catch (err) {
        console.error("[admin/categories DELETE]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── PUT /api/admin/categories?id=… ────────────────────────
export async function PUT(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        if (!id) {
            return NextResponse.json({ error: "Category id is required." }, { status: 400 })
        }

        const { name, has_subcategories, target_course, target_program, target_major } = await request.json()

        if (!name?.trim()) {
            return NextResponse.json(
                { error: "Category name is required." },
                { status: 400 }
            )
        }

        // check duplicate (ensure we don't conflict with another category)
        const existing = await pool.query(
            "SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2",
            [name.trim(), id]
        )
        if (existing.rows.length > 0) {
            return NextResponse.json(
                { error: "Another category with this name already exists." },
                { status: 409 }
            )
        }

        const { rows } = await pool.query(
            `UPDATE categories 
             SET name = $1, 
                 has_subcategories = COALESCE($2, has_subcategories),
                 target_course = COALESCE($3, target_course),
                 target_program = COALESCE($4, target_program),
                 target_major = COALESCE($5, target_major),
                 updated_at = NOW() 
             WHERE id = $6 
             RETURNING *`,
            [
                name.trim(), 
                has_subcategories !== undefined ? has_subcategories : null,
                target_course || "all",
                target_program || "all",
                target_major || "all",
                id
            ]
        )

        if (rows.length === 0) {
            return NextResponse.json({ error: "Category not found." }, { status: 404 })
        }

        return NextResponse.json({ category: rows[0] })
    } catch (err) {
        console.error("[admin/categories PUT]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}
