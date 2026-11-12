import pg from "pg"

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!connectionString) throw new Error("DATABASE_URL or POSTGRES_URL must be configured.")
const pool = new pg.Pool({ connectionString })

try {
  await pool.query("ALTER TABLE categories ADD COLUMN IF NOT EXISTS exam_id INTEGER REFERENCES examinations(id) ON DELETE RESTRICT")
  await pool.query("ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key")
  await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS categories_exam_name_unique ON categories(exam_id, LOWER(name))")
  const lept = await pool.query("SELECT id FROM examinations WHERE name ILIKE '%LEPT%' ORDER BY id LIMIT 1")
  if (!lept.rows[0]) throw new Error("LEPT examination is required before migrating curriculum.")
  await pool.query("UPDATE categories SET exam_id = $1 WHERE exam_id IS NULL", [lept.rows[0].id])
  const { rows } = await pool.query(`SELECT e.name, COUNT(c.id)::int AS category_count FROM examinations e LEFT JOIN categories c ON c.exam_id = e.id GROUP BY e.id, e.name ORDER BY e.id`)
  console.log(JSON.stringify({ curriculumByExamination: rows }, null, 2))
} finally { await pool.end() }

