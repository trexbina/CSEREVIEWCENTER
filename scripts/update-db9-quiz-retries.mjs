import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/reviewapp' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      ALTER TABLE student_quiz_submissions 
      ADD COLUMN IF NOT EXISTS attempts_count INT NOT NULL DEFAULT 1;
    `);

    await client.query('COMMIT');
    console.log("student_quiz_submissions attempts_count column added successfully.");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Migration error:", e);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
