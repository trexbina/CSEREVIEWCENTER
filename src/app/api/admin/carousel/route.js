import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES } from "@/lib/auth"
import pool from "@/lib/db"

async function adminGuard() {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) return null
    return session
}

async function ensureTableAndSeed() {
    // 1. Create table if not exists
    await pool.query(`
        CREATE TABLE IF NOT EXISTS carousel_slides (
            id SERIAL PRIMARY KEY,
            src TEXT NOT NULL,
            alt VARCHAR(255),
            badge VARCHAR(255) DEFAULT 'New Course Available',
            title VARCHAR(255) DEFAULT 'Advancing Through Neural Networks',
            description TEXT DEFAULT 'Explore the foundations of modern AI with our comprehensive advanced study module.',
            slide_order INT NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `)

    // 2. Check if table is empty, seed if empty
    const countRes = await pool.query("SELECT COUNT(*) FROM carousel_slides")
    if (parseInt(countRes.rows[0].count, 10) === 0) {
        await pool.query(`
            INSERT INTO carousel_slides (src, alt, badge, title, description, slide_order) VALUES
            ('/peakassestsimage/corousel.jpg', 'Peak Excellence Training Academy', 'New Course Available', 'Advancing Through Neural Networks', 'Explore the foundations of modern AI with our comprehensive advanced study module.', 0),
            ('/peakassestsimage/courosel 2.jpg', 'Peak Excellence 24th Anniversary', 'Special Event', 'Celebrating 24 Years of Excellence', 'Join us in celebrating 24 years of top-tier review preparation and academic tutoring.', 1),
            ('/peakassestsimage/courosel 3.jpg', 'Peak Excellence Branches', 'Branches', 'Our Learning Hubs', 'Visit any of our state-of-the-art review centers located across the country.', 2)
        `)
    }
}

// GET: anyone logged in can fetch the slides
export async function GET() {
    try {
        await ensureTableAndSeed()
        const result = await pool.query("SELECT * FROM carousel_slides ORDER BY slide_order ASC, id ASC")
        return NextResponse.json({ slides: result.rows })
    } catch (err) {
        console.error("[api/admin/carousel GET]", err)
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
    }
}

// POST: Add a new slide (Admin only)
export async function POST(request) {
    try {
        const session = await adminGuard()
        if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        await ensureTableAndSeed()
        const body = await request.json()
        const { src, alt, badge, title, description, slide_order } = body

        if (!src) {
            return NextResponse.json({ error: "Image URL (src) is required" }, { status: 400 })
        }

        const order = typeof slide_order === "number" ? slide_order : 0

        const result = await pool.query(
            `INSERT INTO carousel_slides (src, alt, badge, title, description, slide_order) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [src, alt || "", badge || "", title || "", description || "", order]
        )

        return NextResponse.json({ slide: result.rows[0] })
    } catch (err) {
        console.error("[api/admin/carousel POST]", err)
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
    }
}

// PUT: Update an existing slide or update slide order (Admin only)
export async function PUT(request) {
    try {
        const session = await adminGuard()
        if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        await ensureTableAndSeed()
        const body = await request.json()
        const { id, src, alt, badge, title, description, slide_order } = body

        if (!id) {
            return NextResponse.json({ error: "Slide ID is required" }, { status: 400 })
        }

        const result = await pool.query(
            `UPDATE carousel_slides 
             SET src = COALESCE($1, src), 
                 alt = COALESCE($2, alt), 
                 badge = COALESCE($3, badge), 
                 title = COALESCE($4, title), 
                 description = COALESCE($5, description), 
                 slide_order = COALESCE($6, slide_order), 
                 updated_at = NOW() 
             WHERE id = $7 
             RETURNING *`,
            [src, alt, badge, title, description, slide_order, id]
        )

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Slide not found" }, { status: 404 })
        }

        return NextResponse.json({ slide: result.rows[0] })
    } catch (err) {
        console.error("[api/admin/carousel PUT]", err)
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
    }
}

// DELETE: Delete a slide (Admin only)
export async function DELETE(request) {
    try {
        const session = await adminGuard()
        if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        await ensureTableAndSeed()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "Slide ID is required" }, { status: 400 })
        }

        const result = await pool.query("DELETE FROM carousel_slides WHERE id = $1 RETURNING *", [id])

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Slide not found" }, { status: 404 })
        }

        return NextResponse.json({ message: "Slide deleted successfully", slide: result.rows[0] })
    } catch (err) {
        console.error("[api/admin/carousel DELETE]", err)
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
    }
}
