import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { saveUploadedFile } from "@/lib/storage"
import { moveToTrash } from "@/lib/trash"

// ── helpers ──────────────────────────────────────────────
async function ensureTable() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS subjects (
      id             SERIAL PRIMARY KEY,
      title          VARCHAR(255)  NOT NULL,
      code           VARCHAR(50)   UNIQUE NOT NULL,
      description    TEXT,
      image_url      TEXT,
      category       VARCHAR(100),
      subcategory_id INT REFERENCES subcategories(id) ON DELETE CASCADE,
      status         VARCHAR(20)   NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'inactive')),
      unlock_date    TIMESTAMPTZ,
      topics         JSONB         NOT NULL DEFAULT '[]',
      created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );
  `)
}

const ADMIN_ROLES = ["admin", "super_admin", "academic_admin", "registrar"]

async function adminGuard() {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) return null
    return session
}

// ── GET /api/admin/subjects ─────────────────────────────
export async function GET() {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        const { rows } = await pool.query(`
            SELECT 
                s.*,
                COALESCE(s.unlock_date, s.created_at) AS effective_release_date,
                GREATEST(
                    s.updated_at,
                    s.created_at,
                    COALESCE(sc_updates.max_updated, s.updated_at, s.created_at)
                ) AS latest_updated_at,
                COALESCE(m.modules_count, 0)::int AS modules_count,
                COALESCE(l.lessons_count, 0)::int AS lessons_count,
                COALESCE(q.quizzes_count, 0)::int AS quizzes_count
            FROM subjects s
            LEFT JOIN (
                SELECT subject_id, COUNT(*) AS modules_count 
                FROM subject_modules 
                GROUP BY subject_id
            ) m ON s.id = m.subject_id
            LEFT JOIN (
                SELECT sm.subject_id, COUNT(sc.id) AS lessons_count 
                FROM subject_modules sm
                JOIN subject_contents sc ON sm.id = sc.module_id
                WHERE sc.lesson_type != 'quiz' OR sc.lesson_type IS NULL
                GROUP BY sm.subject_id
            ) l ON s.id = l.subject_id
            LEFT JOIN (
                SELECT sm.subject_id, COUNT(sc.id) AS quizzes_count 
                FROM subject_modules sm
                JOIN subject_contents sc ON sm.id = sc.module_id
                WHERE sc.lesson_type = 'quiz'
                GROUP BY sm.subject_id
            ) q ON s.id = q.subject_id
            LEFT JOIN (
                SELECT sm.subject_id, MAX(sc.updated_at) AS max_updated
                FROM subject_modules sm
                JOIN subject_contents sc ON sm.id = sc.module_id
                GROUP BY sm.subject_id
            ) sc_updates ON s.id = sc_updates.subject_id
            ORDER BY s.created_at DESC
        `)
        return NextResponse.json({ subjects: rows })
    } catch (err) {
        console.error("[admin/subjects GET]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── helper for file upload ──
async function saveImage(file) {
    return await saveUploadedFile(file, "subjects")
}

// ── POST /api/admin/subjects ────────────────────────────
export async function POST(request) {
    try {
        const session = await adminGuard()
        if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 })

        await ensureTable()

        const formData = await request.formData()
        const title = formData.get("title")
        const code = formData.get("code")
        const description = formData.get("description")
        const category = formData.get("category")
        const subcategory_id = formData.get("subcategory_id")
        const status = formData.get("status")
        const unlock_date_raw = formData.get("unlock_date")
        const unlock_date = unlock_date_raw ? new Date(unlock_date_raw).toISOString() : null
        const imageFile = formData.get("image") // This is the File object

        let topics = []
        try { topics = JSON.parse(formData.get("topics") || "[]") } catch (e) {}

        if (!title?.trim() || !code?.trim()) {
            return NextResponse.json({ error: "Title and subject code are required." }, { status: 400 })
        }

        // check duplicate code
        const existing = await pool.query(
            "SELECT id FROM subjects WHERE code = $1",
            [code.trim().toUpperCase()]
        )
        if (existing.rows.length > 0) {
            return NextResponse.json({ error: "A subject with this code already exists." }, { status: 409 })
        }

        // Handle Image Upload
        let image_url = null
        if (imageFile && imageFile instanceof File && imageFile.name) {
            image_url = await saveImage(imageFile)
        }

        const { rows } = await pool.query(
            `INSERT INTO subjects (title, code, description, category, subcategory_id, image_url, status, unlock_date, topics)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                title.trim(),
                code.trim().toUpperCase(),
                description?.trim() || null,
                category?.trim() || null,
                subcategory_id || null,
                image_url,
                status === "inactive" ? "inactive" : "active",
                unlock_date,
                JSON.stringify(Array.isArray(topics) ? topics : []),
            ]
        )

        return NextResponse.json({ subject: rows[0] }, { status: 201 })
    } catch (err) {
        console.error("[admin/subjects POST]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── PUT /api/admin/subjects?id=… ────────────────────────
export async function PUT(request) {
    try {
        const session = await adminGuard()
        if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 })

        await ensureTable()

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        if (!id) return NextResponse.json({ error: "Subject id is required." }, { status: 400 })

        const formData = await request.formData()
        const title = formData.get("title")
        const code = formData.get("code")
        const description = formData.get("description")
        const category = formData.get("category")
        const subcategory_id = formData.get("subcategory_id")
        const status = formData.get("status")
        const unlock_date_raw = formData.get("unlock_date")
        const unlock_date = unlock_date_raw ? new Date(unlock_date_raw).toISOString() : null
        const imageFile = formData.get("image")
        
        // This is sent if the user didn't upload a new file but kept the old one
        const existingImageUrl = formData.get("image_url") 

        let topics = []
        try { topics = JSON.parse(formData.get("topics") || "[]") } catch (e) {}

        if (!title?.trim() || !code?.trim()) {
            return NextResponse.json({ error: "Title and subject code are required." }, { status: 400 })
        }

        // ensure code uniqueness
        const dup = await pool.query(
            "SELECT id FROM subjects WHERE code = $1 AND id != $2",
            [code.trim().toUpperCase(), id]
        )
        if (dup.rows.length > 0) {
            return NextResponse.json({ error: "Another subject already uses this code." }, { status: 409 })
        }

        // Handle Image Upload
        let final_image_url = existingImageUrl || null
        if (imageFile && imageFile instanceof File && imageFile.name) {
            const uploadedPath = await saveImage(imageFile)
            if (uploadedPath) final_image_url = uploadedPath
        }

        const { rows } = await pool.query(
            `UPDATE subjects
             SET title = $1, code = $2, description = $3, category = $4,
                 subcategory_id = $5, image_url = $6, status = $7, unlock_date = $8, topics = $9, updated_at = NOW()
             WHERE id = $10
             RETURNING *`,
            [
                title.trim(),
                code.trim().toUpperCase(),
                description?.trim() || null,
                category?.trim() || null,
                subcategory_id || null,
                final_image_url,
                status === "inactive" ? "inactive" : "active",
                unlock_date,
                JSON.stringify(Array.isArray(topics) ? topics : []),
                id,
            ]
        )

        if (rows.length === 0) return NextResponse.json({ error: "Subject not found." }, { status: 404 })

        return NextResponse.json({ subject: rows[0] })
    } catch (err) {
        console.error("[admin/subjects PUT]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}

// ── DELETE /api/admin/subjects?id=… ─────────────────────
export async function DELETE(request) {
    const client = await pool.connect()
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        await ensureTable()

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        if (!id) {
            return NextResponse.json({ error: "Subject id is required." }, { status: 400 })
        }

        const subjRes = await client.query("SELECT * FROM subjects WHERE id = $1", [id])
        if (subjRes.rows.length > 0) {
            const subj = subjRes.rows[0]
            await moveToTrash({
                entity_type: "CURRICULUM_SUBJECT",
                original_id: subj.id,
                item_name: subj.title || subj.code,
                description: `Code: ${subj.code} • Category: ${subj.category || "General"}`,
                original_location: "/admin/curriculum",
                payload: subj,
                deleted_by: session.userId,
                deleted_by_name: session.name || session.email || null,
            })
        }

        await client.query("BEGIN")

        // 1. Find all modules for this subject
        const modulesRes = await client.query(
            "SELECT id FROM subject_modules WHERE subject_id = $1",
            [id]
        )
        const moduleIds = modulesRes.rows.map((m) => m.id)

        if (moduleIds.length > 0) {
            // Find all contents for these modules
            const contentsRes = await client.query(
                "SELECT id FROM subject_contents WHERE module_id = ANY($1)",
                [moduleIds]
            )
            const contentIds = contentsRes.rows.map((c) => c.id)

            if (contentIds.length > 0) {
                // Delete any quiz submissions attached to these contents
                await client.query(
                    "DELETE FROM student_quiz_submissions WHERE content_id = ANY($1)",
                    [contentIds]
                )
                // Delete contents
                await client.query(
                    "DELETE FROM subject_contents WHERE id = ANY($1)",
                    [contentIds]
                )
            }

            // Delete modules
            await client.query(
                "DELETE FROM subject_modules WHERE id = ANY($1)",
                [moduleIds]
            )
        }

        // 2. Delete student enrollment links
        await client.query(
            "DELETE FROM student_subjects WHERE subject_id = $1",
            [id]
        )

        // 4. Delete the subject itself
        const { rowCount } = await client.query(
            "DELETE FROM subjects WHERE id = $1",
            [id]
        )

        if (rowCount === 0) {
            await client.query("ROLLBACK")
            return NextResponse.json({ error: "Subject not found." }, { status: 404 })
        }

        await client.query("COMMIT")
        return NextResponse.json({ message: "Subject deleted successfully." })
    } catch (err) {
        await client.query("ROLLBACK").catch(() => {})
        console.error("[admin/subjects DELETE]", err)
        return NextResponse.json({ error: err.message || "Failed to delete subject." }, { status: 500 })
    } finally {
        client.release()
    }
}
