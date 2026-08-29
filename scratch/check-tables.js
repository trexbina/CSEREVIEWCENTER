import pg from 'pg'
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/reviewapp' })

async function check() {
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
  console.log("TABLES:", res.rows.map(r => r.table_name))
  await pool.end()
}
check().catch(console.error)
