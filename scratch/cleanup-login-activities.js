import pg from 'pg'
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/reviewapp' })

async function cleanup() {
  const res = await pool.query("DELETE FROM student_activities WHERE activity_type = 'login' OR title LIKE 'Logged into%'")
  console.log(`Cleaned up ${res.rowCount} login activity entries.`)
  await pool.end()
}

cleanup().catch(console.error)
