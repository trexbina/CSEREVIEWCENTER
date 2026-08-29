import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/reviewapp' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_activities (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        details TEXT,
        status VARCHAR(20) DEFAULT 'success',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log("student_activities table created successfully.");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Migration error:", e);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
