import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

async function adminGuard() {
    const session = await getSession()
    if (session?.role !== "admin") return null
    return session
}

// ── GET /api/admin/subcategories?category_id=… ───────────
export async function GET(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const categoryId = searchParams.get("category_id")

        let query = "SELECT * FROM subcategories"
        let params = []

        if (categoryId) {
            query += " WHERE category_id = $1"
            params = [categoryId]
        }

        query += " ORDER BY created_at ASC"

        const { rows } = await pool.query(query, params)
        return NextResponse.json({ subcategories: rows })
    } catch (err) {
        console.error("[admin/subcategories GET]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── POST /api/admin/subcategories ─────────────────────────
export async function POST(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        const { name, description, status, category_id } = await request.json()

        if (!name?.trim() || !category_id) {
            return NextResponse.json(
                { error: "Subcategory name and category_id are required." },
                { status: 400 }
            )
        }

        // check duplicate within same category
        const existing = await pool.query(
            "SELECT id FROM subcategories WHERE LOWER(name) = LOWER($1) AND category_id = $2",
            [name.trim(), category_id]
        )
        if (existing.rows.length > 0) {
            return NextResponse.json(
                { error: "A subcategory with this name already exists in this category." },
                { status: 409 }
            )
        }

        const { rows } = await pool.query(
            `INSERT INTO subcategories (name, description, status, category_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                name.trim(),
                description?.trim() || null,
                status === "inactive" ? "inactive" : "active",
                category_id
            ]
        )

        return NextResponse.json({ subcategory: rows[0] }, { status: 201 })
    } catch (err) {
        console.error("[admin/subcategories POST]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── DELETE /api/admin/subcategories?id=… ──────────────────
export async function DELETE(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        if (!id) {
            return NextResponse.json({ error: "Subcategory id is required." }, { status: 400 })
        }

        const { rowCount } = await pool.query(
            "DELETE FROM subcategories WHERE id = $1",
            [id]
        )

        if (rowCount === 0) {
            return NextResponse.json({ error: "Subcategory not found." }, { status: 404 })
        }

        return NextResponse.json({ message: "Subcategory deleted." })
    } catch (err) {
        console.error("[admin/subcategories DELETE]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── PUT /api/admin/subcategories?id=… ─────────────────────
export async function PUT(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        if (!id) {
            return NextResponse.json({ error: "Subcategory id is required." }, { status: 400 })
        }

        const { name, description, status } = await request.json()

        if (!name?.trim()) {
            return NextResponse.json(
                { error: "Subcategory name is required." },
                { status: 400 }
            )
        }

        // check duplicate inside the same category
        // we need the category_id of this subcategory to check properly
        const current = await pool.query("SELECT category_id FROM subcategories WHERE id = $1", [id])
        if (current.rows.length === 0) {
            return NextResponse.json({ error: "Subcategory not found." }, { status: 404 })
        }
        const category_id = current.rows[0].category_id

        const existing = await pool.query(
            "SELECT id FROM subcategories WHERE LOWER(name) = LOWER($1) AND category_id = $2 AND id != $3",
            [name.trim(), category_id, id]
        )
        if (existing.rows.length > 0) {
            return NextResponse.json(
                { error: "Another subcategory with this name already exists in this category." },
                { status: 409 }
            )
        }

        const { rows } = await pool.query(
            `UPDATE subcategories SET name = $1, description = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
            [
                name.trim(),
                description?.trim() || null,
                status === "inactive" ? "inactive" : "active",
                id
            ]
        )

        return NextResponse.json({ subcategory: rows[0] })
    } catch (err) {
        console.error("[admin/subcategories PUT]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}
