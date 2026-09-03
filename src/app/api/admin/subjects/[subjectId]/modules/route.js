import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES } from "@/lib/auth"

async function ensureTables() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS subject_modules (
      id          SERIAL PRIMARY KEY,
      subject_id  INT REFERENCES subjects(id) ON DELETE CASCADE,
      title       VARCHAR(255) NOT NULL,
      order_index INT DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS subject_contents (
      id                SERIAL PRIMARY KEY,
      module_id         INT REFERENCES subject_modules(id) ON DELETE CASCADE,
      subject_code      VARCHAR(50),
      title             VARCHAR(255) NOT NULL,
      lesson_type       VARCHAR(50) DEFAULT 'module',
      contentbuilder_id VARCHAR(100),
      pdf_files         JSONB DEFAULT '[]',
      quiz_content      TEXT,
      order_index       INT DEFAULT 0,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Try to add lesson_type if it doesn't exist (for existing tables)
    DO $$ 
    BEGIN 
        BEGIN
            ALTER TABLE subject_contents ADD COLUMN lesson_type VARCHAR(50) DEFAULT 'module';
        EXCEPTION
            WHEN duplicate_column THEN NULL;
        END;
    END $$;
  `)
}

async function adminGuard() {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) return null
    return session
}

export async function GET(request, props) {
    try {
        const session = await adminGuard()
        if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        await ensureTables()
        
        const params = await props.params
        const { subjectId } = params

        // Fetch modules
        const modulesResult = await pool.query(
            "SELECT * FROM subject_modules WHERE subject_id = $1 ORDER BY order_index ASC, created_at ASC",
            [subjectId]
        )
        
        const modules = modulesResult.rows

        // If there are modules, fetch their contents (lessons)
        let contents = []
        if (modules.length > 0) {
            const moduleIds = modules.map(m => m.id)
            const contentsResult = await pool.query(
                "SELECT * FROM subject_contents WHERE module_id = ANY($1) ORDER BY order_index ASC, created_at ASC",
                [moduleIds]
            )
            contents = contentsResult.rows
        }

        // Fetch subject details for breadcrumbs and back navigation
        const subjectResult = await pool.query(
            `SELECT s.id, s.title, s.code, s.subcategory_id,
                    COALESCE(sub.category_id, cat.id) as category_id
             FROM subjects s
             LEFT JOIN subcategories sub ON s.subcategory_id = sub.id
             LEFT JOIN categories cat ON (
                 s.category IS NOT NULL AND (
                     s.category = cat.id::text OR LOWER(s.category) = LOWER(cat.name)
                 )
             )
             WHERE s.id = $1`,
            [subjectId]
        )
        const subject = subjectResult.rows[0] || null

        // Structure it into a nested array for the frontend
        const structuredModules = modules.map(mod => ({
            ...mod,
            lessons: contents.filter(c => c.module_id === mod.id)
        }))

        return NextResponse.json({ modules: structuredModules, subject })
    } catch (err) {
        console.error("[admin/subjects/modules GET]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request, props) {
    try {
        const session = await adminGuard()
        if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        await ensureTables()
        
        const params = await props.params
        const { subjectId } = params
        const body = await request.json()
        const { type, title, module_id, subject_code, lesson_type } = body

        if (!title?.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 })
        }

        if (type === "module") {
            const { rows } = await pool.query(
                "INSERT INTO subject_modules (subject_id, title) VALUES ($1, $2) RETURNING *",
                [subjectId, title.trim()]
            )
            return NextResponse.json({ module: { ...rows[0], lessons: [] } }, { status: 201 })
        } else if (type === "lesson") {
            if (!module_id) return NextResponse.json({ error: "module_id is required" }, { status: 400 })
            const { rows } = await pool.query(
                "INSERT INTO subject_contents (module_id, subject_code, title, lesson_type) VALUES ($1, $2, $3, $4) RETURNING *",
                [module_id, subject_code || null, title.trim(), lesson_type || 'module']
            )
            const createdLesson = rows[0]

            // Dispatch notification to students ONLY if this is a new Quiz
            try {
              const isQuiz = (lesson_type || '').toLowerCase() === 'quiz' || title.trim().toLowerCase().includes('quiz')
              if (isQuiz) {
                const notifTitle = 'New Practice Quiz Published'
                const notifMsg = `New Practice Quiz added: "${title.trim()}"`
                const notifLink = `/student/subjects/${subjectId}?lessonId=${createdLesson.id}&type=quiz`

                await pool.query(
                  `INSERT INTO notifications (student_id, type, title, message, link, is_read, created_at)
                   VALUES (NULL, 'quiz', $1, $2, $3, FALSE, NOW())`,
                  [notifTitle, notifMsg, notifLink]
                )
              }
            } catch (notifErr) {
              console.error("Failed to insert content notification:", notifErr)
            }

            return NextResponse.json({ lesson: createdLesson }, { status: 201 })
        } else {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 })
        }
    } catch (err) {
        console.error("[admin/subjects/modules POST]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PUT(request, props) {
    try {
        const session = await adminGuard()
        if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const body = await request.json()
        const { type, id, title } = body

        if (!id || !title?.trim()) return NextResponse.json({ error: "ID and title required" }, { status: 400 })

        if (type === "module") {
            const { rows } = await pool.query(
                "UPDATE subject_modules SET title = $1 WHERE id = $2 RETURNING *",
                [title.trim(), id]
            )
            return NextResponse.json({ success: true, module: rows[0] })
        } else if (type === "lesson") {
            const { rows } = await pool.query(
                "UPDATE subject_contents SET title = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
                [title.trim(), id]
            )
            return NextResponse.json({ success: true, lesson: rows[0] })
        }
        return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    } catch (err) {
        console.error("[admin/subjects/modules PUT]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(request, props) {
    try {
        const session = await adminGuard()
        if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const url = new URL(request.url)
        const type = url.searchParams.get("type")
        const id = url.searchParams.get("id")

        if (!id || !type) return NextResponse.json({ error: "Missing type or id" }, { status: 400 })

        if (type === "module") {
            await pool.query("DELETE FROM subject_modules WHERE id = $1", [id])
        } else if (type === "lesson") {
            await pool.query("DELETE FROM subject_contents WHERE id = $1", [id])
        } else {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 })
        }
        
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("[admin/subjects/modules DELETE]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
