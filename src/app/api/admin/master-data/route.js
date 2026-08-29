import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

export async function POST(req) {
  try {
    const session = await getSession()
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const { action, entity, payload } = await req.json()

    // ── EXAM ──
    if (entity === "EXAM") {
      if (action === "ADD") {
        const res = await pool.query("INSERT INTO examinations (name) VALUES ($1) RETURNING id, name", [payload.name])
        return NextResponse.json(res.rows[0])
      }
      if (action === "RENAME") {
        await pool.query("UPDATE examinations SET name = $1 WHERE id = $2", [payload.name, parseInt(payload.id)])
        return NextResponse.json({ success: true })
      }
      if (action === "DELETE") {
        await pool.query("DELETE FROM examinations WHERE id = $1", [parseInt(payload.id)])
        return NextResponse.json({ success: true })
      }
    }

    // ── PROGRAM ──
    if (entity === "PROGRAM") {
      if (action === "ADD") {
        const res = await pool.query("INSERT INTO programs (exam_id, name) VALUES ($1, $2) RETURNING id, name, exam_id", [parseInt(payload.examId), payload.name])
        return NextResponse.json(res.rows[0])
      }
      if (action === "RENAME") {
        await pool.query("UPDATE programs SET name = $1 WHERE id = $2", [payload.name, parseInt(payload.id)])
        return NextResponse.json({ success: true })
      }
      if (action === "DELETE") {
        await pool.query("DELETE FROM programs WHERE id = $1", [parseInt(payload.id)])
        return NextResponse.json({ success: true })
      }
    }

    // ── MAJOR ──
    if (entity === "MAJOR") {
      if (action === "ADD") {
        const res = await pool.query("INSERT INTO majors (program_id, name) VALUES ($1, $2) RETURNING id, name, program_id", [parseInt(payload.programId), payload.name])
        return NextResponse.json(res.rows[0])
      }
      if (action === "RENAME") {
        await pool.query("UPDATE majors SET name = $1 WHERE id = $2", [payload.name, parseInt(payload.id)])
        return NextResponse.json({ success: true })
      }
      if (action === "DELETE") {
        await pool.query("DELETE FROM majors WHERE id = $1", [parseInt(payload.id)])
        return NextResponse.json({ success: true })
      }
    }

    // ── BATCH ──
    if (entity === "BATCH") {
      if (action === "ADD" || action === "UPDATE") {
        const { id, name, target_year, status, exam_id } = payload
        if (id) {
          await pool.query(
            "UPDATE batches SET name = $1, target_year = $2, status = $3, exam_id = $4 WHERE id = $5",
            [name, target_year, status, parseInt(exam_id), parseInt(id)]
          )
          return NextResponse.json({ id })
        } else {
          const res = await pool.query(
            "INSERT INTO batches (name, target_year, status, exam_id) VALUES ($1, $2, $3, $4) RETURNING id",
            [name, target_year, status, parseInt(exam_id)]
          )
          return NextResponse.json(res.rows[0])
        }
      }
      if (action === "DELETE") {
        await pool.query("DELETE FROM batches WHERE id = $1", [parseInt(payload.id)])
        return NextResponse.json({ success: true })
      }
    }

    // ── SCHOOL ──
    if (entity === "SCHOOL") {
      if (action === "ADD") {
        const res = await pool.query("INSERT INTO schools (name, address) VALUES ($1, $2) RETURNING id, name, address", [payload.name, payload.address || null])
        return NextResponse.json(res.rows[0])
      }
      if (action === "UPDATE") {
        await pool.query("UPDATE schools SET name = $1, address = $2 WHERE id = $3", [payload.name, payload.address || null, parseInt(payload.id)])
        return NextResponse.json({ success: true })
      }
      if (action === "DELETE") {
        await pool.query("DELETE FROM schools WHERE id = $1", [parseInt(payload.id)])
        return NextResponse.json({ success: true })
      }
    }

    // ── COURSE ──
    if (entity === "COURSE") {
      if (action === "ADD") {
        const res = await pool.query("INSERT INTO academic_courses (name) VALUES ($1) RETURNING id, name", [payload.name])
        return NextResponse.json(res.rows[0])
      }
      if (action === "RENAME") {
        await pool.query("UPDATE academic_courses SET name = $1 WHERE id = $2", [payload.name, parseInt(payload.id)])
        return NextResponse.json({ success: true })
      }
      if (action === "DELETE") {
        await pool.query("DELETE FROM academic_courses WHERE id = $1", [parseInt(payload.id)])
        return NextResponse.json({ success: true })
      }
    }

    // ── GRADEBOOK ──
    if (entity === "GRADEBOOK") {
      if (action === "ADD") {
        const { name, code, batch_id, targets } = payload
        const targetsJson = JSON.stringify(Array.isArray(targets) ? targets : [])
        const res = await pool.query(
          `INSERT INTO gradebooks (name, code, batch_id, exam_id, targets)
           SELECT $1, $2, $3, exam_id, $4::jsonb FROM batches WHERE id = $3
           RETURNING *`,
          [name, code, parseInt(batch_id), targetsJson]
        )
        if (res.rows.length === 0) {
          return NextResponse.json({ error: "Failed to create gradebook. Batch not found." }, { status: 400 })
        }
        return NextResponse.json(res.rows[0])
      }
      if (action === "UPDATE") {
        const { id, name, code, batch_id, status, targets } = payload
        const targetsJson = JSON.stringify(Array.isArray(targets) ? targets : [])
        const res = await pool.query(
          `UPDATE gradebooks 
           SET name = $1, code = $2, batch_id = $3, 
               exam_id = COALESCE((SELECT exam_id FROM batches WHERE id = $3), exam_id), 
               status = $4, targets = $5::jsonb, updated_at = NOW() 
           WHERE id = $6
           RETURNING id`,
          [name, code, parseInt(batch_id), status || 'ACTIVE', targetsJson, parseInt(id)]
        )
        if (res.rows.length === 0) {
          return NextResponse.json({ error: "Gradebook not found." }, { status: 404 })
        }
        return NextResponse.json({ success: true })
      }
      if (action === "DELETE") {
        await pool.query("DELETE FROM gradebooks WHERE id = $1", [parseInt(payload.id)])
        return NextResponse.json({ success: true })
      }
    }

    return NextResponse.json({ error: "Invalid action or entity." }, { status: 400 })
  } catch (err) {
    console.error("[POST /api/admin/master-data]", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
