import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

// ── helpers ──────────────────────────────────────────────
async function ensureContentTable() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS subject_content (
      id          SERIAL PRIMARY KEY,
      subject_id  INT          NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      type        VARCHAR(20)  NOT NULL CHECK (type IN ('text', 'image')),
      title       VARCHAR(255),
      body        TEXT,
      image_url   TEXT,
      sort_order  INT          NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_subject_content_subject
      ON subject_content (subject_id, sort_order);
  `)
}

async function adminGuard() {
    const session = await getSession()
    if (session?.role !== "admin") return null
    return session
}

// ── GET /api/admin/subjects/content?subjectId=… ─────────
export async function GET(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }
        await ensureContentTable()

        const { searchParams } = new URL(request.url)
        const subjectId = searchParams.get("subjectId")
        if (!subjectId) {
            return NextResponse.json({ error: "subjectId is required." }, { status: 400 })
        }

        const { rows } = await pool.query(
            "SELECT * FROM subject_content WHERE subject_id = $1 ORDER BY sort_order ASC, created_at ASC",
            [subjectId]
        )
        return NextResponse.json({ content: rows })
    } catch (err) {
        console.error("[admin/subjects/content GET]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── POST /api/admin/subjects/content ────────────────────
export async function POST(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }
        await ensureContentTable()

        const { subject_id, type, title, body, image_url, sort_order } =
            await request.json()

        if (!subject_id) {
            return NextResponse.json({ error: "subject_id is required." }, { status: 400 })
        }
        if (!type || !["text", "image"].includes(type)) {
            return NextResponse.json({ error: "type must be 'text' or 'image'." }, { status: 400 })
        }
        if (type === "text" && !body?.trim()) {
            return NextResponse.json({ error: "Text content body is required." }, { status: 400 })
        }
        if (type === "image" && !image_url?.trim()) {
            return NextResponse.json({ error: "Image URL is required." }, { status: 400 })
        }

        let order = sort_order
        if (order == null) {
            const maxRes = await pool.query(
                "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM subject_content WHERE subject_id = $1",
                [subject_id]
            )
            order = maxRes.rows[0].next
        }

        const { rows } = await pool.query(
            `INSERT INTO subject_content (subject_id, type, title, body, image_url, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [
                subject_id,
                type,
                title?.trim() || null,
                type === "text" ? body.trim() : null,
                type === "image" ? image_url.trim() : null,
                order,
            ]
        )
        return NextResponse.json({ block: rows[0] }, { status: 201 })
    } catch (err) {
        console.error("[admin/subjects/content POST]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── PUT /api/admin/subjects/content?id=… ────────────────
export async function PUT(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }
        await ensureContentTable()

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        if (!id) {
            return NextResponse.json({ error: "Content block id is required." }, { status: 400 })
        }

        const { type, title, body, image_url, sort_order } = await request.json()

        if (type && !["text", "image"].includes(type)) {
            return NextResponse.json({ error: "type must be 'text' or 'image'." }, { status: 400 })
        }

        const { rows } = await pool.query(
            `UPDATE subject_content
       SET type       = COALESCE($1, type),
           title      = $2,
           body       = $3,
           image_url  = $4,
           sort_order = COALESCE($5, sort_order),
           updated_at = NOW()
       WHERE id = $6 RETURNING *`,
            [
                type || null,
                title?.trim() || null,
                body?.trim() || null,
                image_url?.trim() || null,
                sort_order ?? null,
                id,
            ]
        )

        if (rows.length === 0) {
            return NextResponse.json({ error: "Content block not found." }, { status: 404 })
        }
        return NextResponse.json({ block: rows[0] })
    } catch (err) {
        console.error("[admin/subjects/content PUT]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── DELETE /api/admin/subjects/content?id=… ─────────────
export async function DELETE(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }
        await ensureContentTable()

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        if (!id) {
            return NextResponse.json({ error: "Content block id is required." }, { status: 400 })
        }

        const { rowCount } = await pool.query("DELETE FROM subject_content WHERE id = $1", [id])
        if (rowCount === 0) {
            return NextResponse.json({ error: "Content block not found." }, { status: 404 })
        }
        return NextResponse.json({ message: "Content block deleted." })
    } catch (err) {
        console.error("[admin/subjects/content DELETE]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── PATCH /api/admin/subjects/content?action=reorder ────
export async function PATCH(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }
        await ensureContentTable()

        const { searchParams } = new URL(request.url)
        const action = searchParams.get("action")

        if (action === "reorder") {
            const { blocks } = await request.json()
            if (!Array.isArray(blocks)) {
                return NextResponse.json({ error: "blocks array is required." }, { status: 400 })
            }

            const client = await pool.connect()
            try {
                await client.query("BEGIN")
                for (const { id, sort_order } of blocks) {
                    await client.query(
                        "UPDATE subject_content SET sort_order = $1, updated_at = NOW() WHERE id = $2",
                        [sort_order, id]
                    )
                }
                await client.query("COMMIT")
            } catch (txErr) {
                await client.query("ROLLBACK")
                throw txErr
            } finally {
                client.release()
            }
            return NextResponse.json({ message: "Reordered." })
        }

        return NextResponse.json({ error: "Unknown action." }, { status: 400 })
    } catch (err) {
        console.error("[admin/subjects/content PATCH]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}
