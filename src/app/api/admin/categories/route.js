import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { moveToTrash } from "@/lib/trash"
import { ensureCurriculumTierSchema, normalizeAccessTier } from "@/lib/curriculum-tier"

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
      name VARCHAR(255) NOT NULL,
      description TEXT,
      image_url TEXT,
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
    ALTER TABLE categories ADD COLUMN IF NOT EXISTS exam_id INTEGER REFERENCES examinations(id) ON DELETE RESTRICT;
    ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE categories ADD COLUMN IF NOT EXISTS access_tier VARCHAR(10) NOT NULL DEFAULT 'free';
  `)
  await ensureCurriculumTierSchema()
}

// ── GET /api/admin/categories ─────────────────────────────
export async function GET(request) {
    try {
        const session = await adminGuard()
        if (!session) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        await ensureTable()

        const examId = new URL(request.url).searchParams.get("exam_id")
        const { rows } = await pool.query(examId
            ? "SELECT * FROM categories WHERE exam_id = $1 ORDER BY created_at ASC"
            : "SELECT * FROM categories ORDER BY created_at ASC", examId ? [Number(examId)] : [])
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

        const { name, description, image_url, has_subcategories, target_course, target_program, target_major, access_tier, exam_id } = await request.json()

        if (!name?.trim() || !exam_id) {
            return NextResponse.json(
                { error: "Category name and examination are required." },
                { status: 400 }
            )
        }

        // check duplicate
        const existing = await pool.query(
            "SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND exam_id = $2",
            [name.trim(), Number(exam_id)]
        )
        if (existing.rows.length > 0) {
            return NextResponse.json(
                { error: "A category with this name already exists." },
                { status: 409 }
            )
        }

        const { rows } = await pool.query(
            `INSERT INTO categories (exam_id, name, description, image_url, has_subcategories, target_course, target_program, target_major, access_tier)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                Number(exam_id), name.trim(),
                description?.trim() || null,
                image_url || null,
                has_subcategories !== undefined ? has_subcategories : true,
                target_course || "all",
                target_program || "all",
                target_major || "all",
                normalizeAccessTier(access_tier)
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

        const catRes = await pool.query("SELECT * FROM categories WHERE id = $1", [id])
        if (catRes.rows.length > 0) {
            const cat = catRes.rows[0]
            await moveToTrash({
                entity_type: "CURRICULUM_CATEGORY",
                original_id: cat.id,
                item_name: cat.name,
                description: cat.description || `Target Course: ${cat.target_course || "all"}`,
                original_location: "/admin/curriculum",
                payload: cat,
                deleted_by: session.userId,
                deleted_by_name: session.name || session.email || null,
            })

            // Find all subcategories belonging to this category
            const subRes = await pool.query("SELECT * FROM subcategories WHERE category_id = $1", [id])
            const subIds = subRes.rows.map((s) => s.id)

            // Save child subcategories to trash
            for (const sub of subRes.rows) {
                await moveToTrash({
                    entity_type: "CURRICULUM_SUBCATEGORY",
                    original_id: sub.id,
                    item_name: sub.name,
                    description: sub.description || `Category: ${cat.name}`,
                    original_location: "/admin/curriculum",
                    payload: {
                        ...sub,
                        _parent_category_id: cat.id,
                        _parent_category_name: cat.name,
                    },
                    deleted_by: session.userId,
                    deleted_by_name: session.name || session.email || null,
                })
            }

            // Find all subjects belonging directly to category or through its subcategories
            let subjQuery = "SELECT * FROM subjects WHERE category_id = $1 OR LOWER(category) = LOWER($2)"
            let subjParams = [id, cat.name]
            if (subIds.length > 0) {
                subjQuery += " OR subcategory_id = ANY($3::int[])"
                subjParams.push(subIds)
            }
            const subjRes = await pool.query(subjQuery, subjParams)

            // Save child subjects to trash with their modules and contents
            for (const subj of subjRes.rows) {
                // Fetch modules and lessons/contents for this subject
                const mRes = await pool.query(
                    "SELECT * FROM subject_modules WHERE subject_id = $1 ORDER BY order_index ASC, id ASC",
                    [subj.id]
                )
                const subjectModules = mRes.rows
                let subjectContents = []
                if (subjectModules.length > 0) {
                    const mIds = subjectModules.map((m) => m.id)
                    const cRes = await pool.query(
                        "SELECT * FROM subject_contents WHERE module_id = ANY($1::int[]) ORDER BY order_index ASC, id ASC",
                        [mIds]
                    )
                    subjectContents = cRes.rows
                }

                await moveToTrash({
                    entity_type: "CURRICULUM_SUBJECT",
                    original_id: subj.id,
                    item_name: subj.title || subj.code,
                    description: `Code: ${subj.code} • Category: ${cat.name}`,
                    original_location: "/admin/curriculum",
                    payload: {
                        ...subj,
                        _parent_category_id: cat.id,
                        _parent_category_name: cat.name,
                        _modules: subjectModules,
                        _contents: subjectContents,
                    },
                    deleted_by: session.userId,
                    deleted_by_name: session.name || session.email || null,
                })
            }
        }

        // Clean up linked records before deleting category
        // 1. Delete subjects and their contents/modules linked to this category or its subcategories
        const childSubs = await pool.query("SELECT id FROM subcategories WHERE category_id = $1", [id])
        const childSubIds = childSubs.rows.map((s) => s.id)
        let subjIdsToDelete = []
        if (childSubIds.length > 0) {
            const findSubjs = await pool.query(
                "SELECT id FROM subjects WHERE category_id = $1 OR LOWER(category) = LOWER($2) OR subcategory_id = ANY($3::int[])",
                [id, catRes.rows[0]?.name || "", childSubIds]
            )
            subjIdsToDelete = findSubjs.rows.map((s) => s.id)
        } else {
            const findSubjs = await pool.query(
                "SELECT id FROM subjects WHERE category_id = $1 OR LOWER(category) = LOWER($2)",
                [id, catRes.rows[0]?.name || ""]
            )
            subjIdsToDelete = findSubjs.rows.map((s) => s.id)
        }

        if (subjIdsToDelete.length > 0) {
            const modRes = await pool.query(
                "SELECT id FROM subject_modules WHERE subject_id = ANY($1::int[])",
                [subjIdsToDelete]
            )
            const modIds = modRes.rows.map((m) => m.id)
            if (modIds.length > 0) {
                const conRes = await pool.query(
                    "SELECT id FROM subject_contents WHERE module_id = ANY($1::int[])",
                    [modIds]
                )
                const conIds = conRes.rows.map((c) => c.id)
                if (conIds.length > 0) {
                    await pool.query(
                        "DELETE FROM student_quiz_submissions WHERE content_id = ANY($1::int[])",
                        [conIds]
                    )
                    await pool.query(
                        "DELETE FROM subject_contents WHERE id = ANY($1::int[])",
                        [conIds]
                    )
                }
                await pool.query(
                    "DELETE FROM subject_modules WHERE id = ANY($1::int[])",
                    [modIds]
                )
            }
            await pool.query(
                "DELETE FROM student_subjects WHERE subject_id = ANY($1::int[])",
                [subjIdsToDelete]
            )
            await pool.query(
                "DELETE FROM subjects WHERE id = ANY($1::int[])",
                [subjIdsToDelete]
            )
        }

        // 2. Delete subcategories
        await pool.query("DELETE FROM subcategories WHERE category_id = $1", [id])

        // 3. Delete category
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

        const { name, image_url, has_subcategories, target_course, target_program, target_major, access_tier } = await request.json()

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
                 image_url = COALESCE($2, image_url),
                 has_subcategories = COALESCE($3, has_subcategories),
                 target_course = COALESCE($4, target_course),
                 target_program = COALESCE($5, target_program),
                 target_major = COALESCE($6, target_major),
                 access_tier = $7,
                 updated_at = NOW() 
             WHERE id = $8
             RETURNING *`,
            [
                name.trim(), 
                image_url || null,
                has_subcategories !== undefined ? has_subcategories : null,
                target_course || "all",
                target_program || "all",
                target_major || "all",
                normalizeAccessTier(access_tier),
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
