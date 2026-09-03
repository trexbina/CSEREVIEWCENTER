import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { saveUploadedFile } from "@/lib/storage"
import { moveToTrash } from "@/lib/trash"

const ADMIN_ROLES = ["admin", "super_admin", "academic_admin", "registrar"]

async function adminGuard() {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) return null
    return session
}

async function ensureSubcategorySchema() {
    await pool.query(`
        ALTER TABLE subcategories
        ADD COLUMN IF NOT EXISTS image_url TEXT
    `)
}

async function saveImage(file) {
    return await saveUploadedFile(file, "subcategories")
}

async function readPayload(request) {
    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData()
        return {
            name: formData.get("name"),
            description: formData.get("description"),
            status: formData.get("status"),
            category_id: formData.get("category_id"),
            imageFile: formData.get("image"),
            image_url: formData.get("image_url"),
        }
    }

    const body = await request.json()
    return {
        name: body.name,
        description: body.description,
        status: body.status,
        category_id: body.category_id,
        imageFile: null,
        image_url: body.image_url,
    }
}

// ── GET /api/admin/subcategories?category_id=… ───────────
export async function GET(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        await ensureSubcategorySchema()

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

        await ensureSubcategorySchema()

        const { name, description, status, category_id, imageFile } = await readPayload(request)

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

        let image_url = null
        if (imageFile && imageFile instanceof File && imageFile.name) {
            image_url = await saveImage(imageFile)
        }

        const { rows } = await pool.query(
            `INSERT INTO subcategories (name, description, status, category_id, image_url)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                name.trim(),
                description?.trim() || null,
                status === "inactive" ? "inactive" : "active",
                category_id,
                image_url,
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

        const subRes = await pool.query("SELECT * FROM subcategories WHERE id = $1", [id])
        if (subRes.rows.length > 0) {
            const sub = subRes.rows[0]
            await moveToTrash({
                entity_type: "CURRICULUM_SUBCATEGORY",
                original_id: sub.id,
                item_name: sub.name,
                description: sub.description || `Category ID: ${sub.category_id}`,
                original_location: "/admin/curriculum",
                payload: sub,
                deleted_by: session.userId,
                deleted_by_name: session.name || session.email || null,
            })
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

        await ensureSubcategorySchema()

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        if (!id) {
            return NextResponse.json({ error: "Subcategory id is required." }, { status: 400 })
        }

        const { name, description, status, imageFile, image_url: existingImageUrl } = await readPayload(request)

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

        const currentImage = await pool.query("SELECT image_url FROM subcategories WHERE id = $1", [id])
        const currentImageUrl = currentImage.rows[0]?.image_url || null

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

        let finalImageUrl = existingImageUrl || currentImageUrl
        if (imageFile && imageFile instanceof File && imageFile.name) {
            const uploadedPath = await saveImage(imageFile)
            if (uploadedPath) finalImageUrl = uploadedPath
        }

        const { rows } = await pool.query(
            `UPDATE subcategories SET name = $1, description = $2, status = $3, image_url = $4, updated_at = NOW() WHERE id = $5 RETURNING *`,
            [
                name.trim(),
                description?.trim() || null,
                status === "inactive" ? "inactive" : "active",
                finalImageUrl,
                id
            ]
        )

        return NextResponse.json({ subcategory: rows[0] })
    } catch (err) {
        console.error("[admin/subcategories PUT]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}
