import pool from "@/lib/db"

/** Ensure the fixed examination catalog exists in either PostgreSQL or Cloudflare D1. */
export async function ensureExaminationCatalog(client = pool) {
  try {
    await client.query("ALTER TABLE examinations ADD COLUMN IF NOT EXISTS is_legacy BOOLEAN NOT NULL DEFAULT FALSE")
  } catch {
    // Cloudflare D1/SQLite does not support ADD COLUMN IF NOT EXISTS.
    try {
      await client.query("ALTER TABLE examinations ADD COLUMN is_legacy INTEGER NOT NULL DEFAULT 0")
    } catch {
      // The column already exists in D1.
    }
  }

  const catalog = [
    "Licensure Examination for Professional Teachers (LEPT)",
    "NCLEX-RN",
  ]
  for (const name of catalog) {
    const existing = await client.query("SELECT id FROM examinations WHERE LOWER(name) = LOWER($1) LIMIT 1", [name])
    if (!existing.rows.length) {
      await client.query("INSERT INTO examinations (name, is_legacy) VALUES ($1, FALSE)", [name])
    }
  }
}

