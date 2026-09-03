import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

const ADMIN_ROLES = ["admin", "super_admin", "academic_admin", "registrar"]

export async function ensureTrashTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trash_items (
      id SERIAL PRIMARY KEY,
      entity_type VARCHAR(50) NOT NULL,
      original_id VARCHAR(100),
      item_name VARCHAR(255) NOT NULL,
      description TEXT,
      original_location VARCHAR(100),
      payload JSONB NOT NULL,
      deleted_by INTEGER,
      deleted_by_name VARCHAR(255),
      deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_trash_entity ON trash_items(entity_type);
    CREATE INDEX IF NOT EXISTS idx_trash_deleted_at ON trash_items(deleted_at DESC);
  `)
}

export async function moveToTrash({
  entity_type,
  original_id,
  item_name,
  description = null,
  original_location = null,
  payload,
  deleted_by = null,
  deleted_by_name = null
}) {
  try {
    await ensureTrashTable()
    const { rows } = await pool.query(
      `INSERT INTO trash_items (
        entity_type, original_id, item_name, description,
        original_location, payload, deleted_by, deleted_by_name, deleted_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *`,
      [
        entity_type,
        original_id ? String(original_id) : null,
        item_name || "Untitled Item",
        description,
        original_location,
        JSON.stringify(payload || {}),
        deleted_by,
        deleted_by_name
      ]
    )
    return rows[0]
  } catch (err) {
    console.error("[moveToTrash error]:", err)
    return null
  }
}
