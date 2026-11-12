import pg from "pg"

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!connectionString) throw new Error("DATABASE_URL or POSTGRES_URL must be configured.")

const pool = new pg.Pool({ connectionString })

try {
  await pool.query(`ALTER TABLE examinations ADD COLUMN IF NOT EXISTS is_legacy BOOLEAN NOT NULL DEFAULT FALSE`)
  for (const name of ["Licensure Examination for Professional Teachers (LEPT)", "NCLEX-RN"]) {
    await pool.query(`INSERT INTO examinations (name, is_legacy)
      SELECT $1, FALSE
      WHERE NOT EXISTS (SELECT 1 FROM examinations WHERE LOWER(name) = LOWER($1))`, [name])
  }
  const { rows } = await pool.query("SELECT id, name, is_legacy FROM examinations ORDER BY id")
  console.log(JSON.stringify({ examinations: rows }, null, 2))
} finally {
  await pool.end()
}

