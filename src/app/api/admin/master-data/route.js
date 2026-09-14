import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES, isAdminRole } from "@/lib/auth"
import { moveToTrash } from "@/lib/trash"

export async function POST(req) {
  try {
    const session = await getSession()
    if (!session || !isAdminRole(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const { action, entity, payload } = await req.json()

    // ── ROLE ──
    if (entity === "ROLE") {
      if (action === "ADD") {
        let key = (payload.role_key || payload.name)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")
        if (!key) key = `role_${Date.now()}`

        const permsJson = JSON.stringify(Array.isArray(payload.permissions) ? payload.permissions : [])
        const res = await pool.query(
          `INSERT INTO custom_roles (role_key, name, description, permissions, is_system)
           VALUES ($1, $2, $3, $4::jsonb, false)
           RETURNING *`,
          [key, payload.name.trim(), payload.description?.trim() || null, permsJson]
        )
        return NextResponse.json(res.rows[0])
      }
      if (action === "UPDATE") {
        const permsJson = JSON.stringify(Array.isArray(payload.permissions) ? payload.permissions : [])
        const res = await pool.query(
          `UPDATE custom_roles
           SET name = COALESCE($1, name),
               description = $2,
               permissions = $3::jsonb,
               updated_at = NOW()
           WHERE id = $4
           RETURNING *`,
          [payload.name?.trim() || null, payload.description?.trim() || null, permsJson, parseInt(payload.id)]
        )
        return NextResponse.json(res.rows[0] || { success: true })
      }
      if (action === "DELETE") {
        const roleId = parseInt(payload.id)
        const roleRes = await pool.query("SELECT * FROM custom_roles WHERE id = $1", [roleId])
        if (roleRes.rows.length > 0 && !roleRes.rows[0].is_system) {
          await pool.query("DELETE FROM custom_roles WHERE id = $1", [roleId])
        }
        return NextResponse.json({ success: true })
      }
    }

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
        const examId = parseInt(payload.id)
        const examRes = await pool.query("SELECT * FROM examinations WHERE id = $1", [examId])
        if (examRes.rows.length > 0) {
          const exam = examRes.rows[0]

          // 1. Move exam to trash
          await moveToTrash({
            entity_type: "MASTER_DATA_EXAM",
            original_id: exam.id,
            item_name: exam.name,
            description: "Examination Board / Branch",
            original_location: "/admin/master-data",
            payload: exam,
            deleted_by: session.userId,
            deleted_by_name: session.name || session.email || null,
          })

          // 2. Find and move all child programs (courses)
          const progRes = await pool.query("SELECT * FROM programs WHERE exam_id = $1", [examId])
          const progIds = progRes.rows.map(p => p.id)

          for (const prog of progRes.rows) {
            await moveToTrash({
              entity_type: "MASTER_DATA_PROGRAM",
              original_id: prog.id,
              item_name: prog.name,
              description: `Course • Exam: ${exam.name}`,
              original_location: "/admin/master-data",
              payload: {
                ...prog,
                _parent_exam_id: exam.id,
                _parent_exam_name: exam.name,
              },
              deleted_by: session.userId,
              deleted_by_name: session.name || session.email || null,
            })
          }

          // 3. Find and move all child majors (specializations) under these programs
          if (progIds.length > 0) {
            const majorRes = await pool.query(
              "SELECT * FROM majors WHERE program_id = ANY($1::int[])",
              [progIds]
            )
            for (const maj of majorRes.rows) {
              const parentProg = progRes.rows.find(p => p.id === maj.program_id)
              await moveToTrash({
                entity_type: "MASTER_DATA_MAJOR",
                original_id: maj.id,
                item_name: maj.name,
                description: `Specialization • Course: ${parentProg?.name || maj.program_id}`,
                original_location: "/admin/master-data",
                payload: {
                  ...maj,
                  _parent_program_id: maj.program_id,
                  _parent_program_name: parentProg?.name || null,
                  _parent_exam_id: exam.id,
                  _parent_exam_name: exam.name,
                },
                deleted_by: session.userId,
                deleted_by_name: session.name || session.email || null,
              })
            }
          }

          // 4. Find and move all child batches under this exam
          const batchRes = await pool.query("SELECT * FROM batches WHERE exam_id = $1", [examId])
          const batchIds = batchRes.rows.map(b => b.id)

          for (const b of batchRes.rows) {
            await moveToTrash({
              entity_type: "MASTER_DATA_BATCH",
              original_id: b.id,
              item_name: b.name,
              description: `Target Year: ${b.target_year || "—"} • Exam: ${exam.name}`,
              original_location: "/admin/master-data",
              payload: {
                ...b,
                _parent_exam_id: exam.id,
                _parent_exam_name: exam.name,
              },
              deleted_by: session.userId,
              deleted_by_name: session.name || session.email || null,
            })
          }

          // 5. Find and move all gradebooks linked to this exam or its batches
          let gbQuery = "SELECT * FROM gradebooks WHERE exam_id = $1"
          let gbParams = [examId]
          if (batchIds.length > 0) {
            gbQuery += " OR batch_id = ANY($2::int[])"
            gbParams.push(batchIds)
          }
          const gbRes = await pool.query(gbQuery, gbParams)
          for (const g of gbRes.rows) {
            await moveToTrash({
              entity_type: "MASTER_DATA_GRADEBOOK",
              original_id: g.id,
              item_name: g.name || g.code,
              description: `Code: ${g.code || "—"} • Exam: ${exam.name}`,
              original_location: "/admin/master-data",
              payload: {
                ...g,
                _parent_exam_id: exam.id,
                _parent_exam_name: exam.name,
                _parent_batch_id: g.batch_id,
              },
              deleted_by: session.userId,
              deleted_by_name: session.name || session.email || null,
            })
          }

          // Clean up child tables explicitly before deleting exam
          if (batchIds.length > 0) {
            await pool.query("DELETE FROM gradebooks WHERE exam_id = $1 OR batch_id = ANY($2::int[])", [examId, batchIds])
            await pool.query("DELETE FROM mock_exam_targets WHERE batch_id = ANY($1::int[])", [batchIds])
            await pool.query("DELETE FROM batches WHERE id = ANY($1::int[])", [batchIds])
          } else {
            await pool.query("DELETE FROM gradebooks WHERE exam_id = $1", [examId])
          }

          if (progIds.length > 0) {
            await pool.query("DELETE FROM majors WHERE program_id = ANY($1::int[])", [progIds])
            await pool.query("DELETE FROM mock_exam_targets WHERE program_id = ANY($1::int[])", [progIds])
            await pool.query("DELETE FROM programs WHERE id = ANY($1::int[])", [progIds])
          }
        }

        await pool.query("DELETE FROM examinations WHERE id = $1", [examId])
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
        const programId = parseInt(payload.id)
        const progRes = await pool.query("SELECT * FROM programs WHERE id = $1", [programId])
        if (progRes.rows.length > 0) {
          const prog = progRes.rows[0]

          // Fetch parent exam name for reference if available
          let examName = null
          if (prog.exam_id) {
            const eRes = await pool.query("SELECT name FROM examinations WHERE id = $1", [prog.exam_id])
            if (eRes.rows.length > 0) examName = eRes.rows[0].name
          }

          // 1. Move program to trash
          await moveToTrash({
            entity_type: "MASTER_DATA_PROGRAM",
            original_id: prog.id,
            item_name: prog.name,
            description: examName ? `Course • Exam: ${examName}` : "Course",
            original_location: "/admin/master-data",
            payload: {
              ...prog,
              _parent_exam_id: prog.exam_id,
              _parent_exam_name: examName,
            },
            deleted_by: session.userId,
            deleted_by_name: session.name || session.email || null,
          })

          // 2. Move child majors to trash
          const majorRes = await pool.query("SELECT * FROM majors WHERE program_id = $1", [programId])
          for (const maj of majorRes.rows) {
            await moveToTrash({
              entity_type: "MASTER_DATA_MAJOR",
              original_id: maj.id,
              item_name: maj.name,
              description: `Specialization • Course: ${prog.name}`,
              original_location: "/admin/master-data",
              payload: {
                ...maj,
                _parent_program_id: prog.id,
                _parent_program_name: prog.name,
                _parent_exam_id: prog.exam_id,
                _parent_exam_name: examName,
              },
              deleted_by: session.userId,
              deleted_by_name: session.name || session.email || null,
            })
          }
          // Clean up child majors before deleting program
          await pool.query("DELETE FROM majors WHERE program_id = $1", [programId])
          await pool.query("DELETE FROM mock_exam_targets WHERE program_id = $1", [programId])
        }

        await pool.query("DELETE FROM programs WHERE id = $1", [programId])
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
        const majorId = parseInt(payload.id)
        const majorRes = await pool.query("SELECT * FROM majors WHERE id = $1", [majorId])
        if (majorRes.rows.length > 0) {
          const maj = majorRes.rows[0]
          let progName = null
          if (maj.program_id) {
            const pRes = await pool.query("SELECT name FROM programs WHERE id = $1", [maj.program_id])
            if (pRes.rows.length > 0) progName = pRes.rows[0].name
          }
          await moveToTrash({
            entity_type: "MASTER_DATA_MAJOR",
            original_id: maj.id,
            item_name: maj.name,
            description: progName ? `Specialization • Course: ${progName}` : "Specialization",
            original_location: "/admin/master-data",
            payload: {
              ...maj,
              _parent_program_id: maj.program_id,
              _parent_program_name: progName,
            },
            deleted_by: session.userId,
            deleted_by_name: session.name || session.email || null,
          })
        }
        await pool.query("DELETE FROM majors WHERE id = $1", [majorId])
        return NextResponse.json({ success: true })
      }
    }

    // ── BATCH ──
    if (entity === "BATCH") {
      if (action === "ADD" || action === "UPDATE") {
        const { id, name, target_year, status, exam_id, start_date, end_date } = payload
        const cleanStartDate = start_date ? start_date : null
        const cleanEndDate = end_date ? end_date : null
        if (id) {
          await pool.query(
            "UPDATE batches SET name = $1, target_year = $2, status = $3, exam_id = $4, start_date = $5, end_date = $6 WHERE id = $7",
            [name, target_year, status, parseInt(exam_id), cleanStartDate, cleanEndDate, parseInt(id)]
          )
          return NextResponse.json({ id })
        } else {
          const res = await pool.query(
            "INSERT INTO batches (name, target_year, status, exam_id, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
            [name, target_year, status, parseInt(exam_id), cleanStartDate, cleanEndDate]
          )
          return NextResponse.json(res.rows[0])
        }
      }
      if (action === "DELETE") {
        const batchId = parseInt(payload.id)
        const batchRes = await pool.query("SELECT * FROM batches WHERE id = $1", [batchId])
        if (batchRes.rows.length > 0) {
          const b = batchRes.rows[0]

          // 1. Move batch to trash
          await moveToTrash({
            entity_type: "MASTER_DATA_BATCH",
            original_id: b.id,
            item_name: b.name,
            description: `Target Year: ${b.target_year || "—"} • Status: ${b.status || "active"}`,
            original_location: "/admin/master-data",
            payload: b,
            deleted_by: session.userId,
            deleted_by_name: session.name || session.email || null,
          })

          // 2. Cascade child gradebooks to trash
          const gbRes = await pool.query("SELECT * FROM gradebooks WHERE batch_id = $1", [batchId])
          for (const g of gbRes.rows) {
            await moveToTrash({
              entity_type: "MASTER_DATA_GRADEBOOK",
              original_id: g.id,
              item_name: g.name || g.code,
              description: `Code: ${g.code || "—"} • Batch: ${b.name}`,
              original_location: "/admin/master-data",
              payload: {
                ...g,
                _parent_batch_id: b.id,
                _parent_batch_name: b.name,
              },
              deleted_by: session.userId,
              deleted_by_name: session.name || session.email || null,
            })
          }
          // Clean up child gradebooks and mock exam targets before deleting batch
          await pool.query("DELETE FROM gradebooks WHERE batch_id = $1", [batchId])
          await pool.query("DELETE FROM mock_exam_targets WHERE batch_id = $1", [batchId])
        }
        await pool.query("DELETE FROM batches WHERE id = $1", [batchId])
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
        const schoolRes = await pool.query("SELECT * FROM schools WHERE id = $1", [parseInt(payload.id)])
        if (schoolRes.rows.length > 0) {
          const s = schoolRes.rows[0]
          await moveToTrash({
            entity_type: "MASTER_DATA_SCHOOL",
            original_id: s.id,
            item_name: s.name,
            description: s.address || "Institution",
            original_location: "/admin/master-data",
            payload: s,
            deleted_by: session.userId,
            deleted_by_name: session.name || session.email || null,
          })
        }
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
        const courseRes = await pool.query("SELECT * FROM academic_courses WHERE id = $1", [parseInt(payload.id)])
        if (courseRes.rows.length > 0) {
          const c = courseRes.rows[0]
          await moveToTrash({
            entity_type: "MASTER_DATA_COURSE",
            original_id: c.id,
            item_name: c.name,
            description: "Academic Course",
            original_location: "/admin/master-data",
            payload: c,
            deleted_by: session.userId,
            deleted_by_name: session.name || session.email || null,
          })
        }
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
        const gbRes = await pool.query("SELECT * FROM gradebooks WHERE id = $1", [parseInt(payload.id)])
        if (gbRes.rows.length > 0) {
          const g = gbRes.rows[0]
          await moveToTrash({
            entity_type: "MASTER_DATA_GRADEBOOK",
            original_id: g.id,
            item_name: g.name || g.code,
            description: `Code: ${g.code || "—"} • Status: ${g.status || "ACTIVE"}`,
            original_location: "/admin/master-data",
            payload: g,
            deleted_by: session.userId,
            deleted_by_name: session.name || session.email || null,
          })
        }
        await pool.query("DELETE FROM gradebooks WHERE id = $1", [parseInt(payload.id)])
        return NextResponse.json({ success: true })
      }
    }

    // ── ROLE ──
    if (entity === "ROLE") {
      if (action === "ADD") {
        const { name, role_key, description, permissions } = payload
        let key = (role_key || name)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")
        if (!key) key = `role_${Date.now()}`

        const existing = await pool.query("SELECT id FROM custom_roles WHERE role_key = $1", [key])
        if (existing.rows.length > 0) {
          return NextResponse.json({ error: `A role with key "${key}" already exists.` }, { status: 400 })
        }

        const permsJson = JSON.stringify(Array.isArray(permissions) ? permissions : [])
        const res = await pool.query(
          `INSERT INTO custom_roles (role_key, name, description, permissions, is_system)
           VALUES ($1, $2, $3, $4::jsonb, false)
           RETURNING *`,
          [key, name.trim(), description?.trim() || null, permsJson]
        )
        return NextResponse.json(res.rows[0])
      }
      if (action === "UPDATE") {
        const { id, name, description, permissions } = payload
        const permsJson = JSON.stringify(Array.isArray(permissions) ? permissions : [])
        const res = await pool.query(
          `UPDATE custom_roles
           SET name = COALESCE($1, name),
               description = $2,
               permissions = $3::jsonb,
               updated_at = NOW()
           WHERE id = $4
           RETURNING *`,
          [name?.trim() || null, description?.trim() || null, permsJson, parseInt(id)]
        )
        if (res.rows.length === 0) {
          return NextResponse.json({ error: "Role not found." }, { status: 404 })
        }
        return NextResponse.json({ success: true, role: res.rows[0] })
      }
      if (action === "DELETE") {
        const roleRes = await pool.query("SELECT * FROM custom_roles WHERE id = $1", [parseInt(payload.id)])
        if (roleRes.rows.length === 0) {
          return NextResponse.json({ error: "Role not found." }, { status: 404 })
        }
        const r = roleRes.rows[0]
        if (r.is_system) {
          return NextResponse.json({ error: "System default roles cannot be deleted." }, { status: 400 })
        }
        const countRes = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = $1", [r.role_key])
        const count = parseInt(countRes.rows[0]?.count || "0", 10)
        if (count > 0) {
          return NextResponse.json({
            error: `Cannot delete role "${r.name}" because ${count} user(s) are currently assigned to it.`
          }, { status: 400 })
        }

        await moveToTrash({
          entity_type: "MASTER_DATA_ROLE",
          original_id: r.id,
          item_name: r.name,
          description: `Custom Role • Key: ${r.role_key}`,
          original_location: "/admin/master-data",
          payload: r,
          deleted_by: session.userId,
          deleted_by_name: session.name || session.email || null,
        })

        await pool.query("DELETE FROM custom_roles WHERE id = $1", [parseInt(payload.id)])
        return NextResponse.json({ success: true })
      }
    }

    return NextResponse.json({ error: "Invalid action or entity." }, { status: 400 })
  } catch (err) {
    console.error("[POST /api/admin/master-data]", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
