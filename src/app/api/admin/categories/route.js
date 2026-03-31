import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

async function adminGuard() {
    const session = await getSession()
    if (session?.role !== "admin") return null
    return session
}

// ── GET /api/admin/categories ─────────────────────────────
export async function GET() {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

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

        const { name, description } = await request.json()

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
            `INSERT INTO categories (name, description)
             VALUES ($1, $2)
             RETURNING *`,
            [name.trim(), description?.trim() || null]
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

        const { name } = await request.json()

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
            `UPDATE categories SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [name.trim(), id]
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
