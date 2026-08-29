import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/reviewapp' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_quiz_submissions (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content_id INT NOT NULL REFERENCES subject_contents(id) ON DELETE CASCADE,
        earned_points INT NOT NULL DEFAULT 0,
        total_points INT NOT NULL DEFAULT 0,
        time_taken_seconds INT NOT NULL DEFAULT 0,
        answers JSONB NOT NULL DEFAULT '{}'::jsonb,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (student_id, content_id)
      );
    `);

    await client.query('COMMIT');
    console.log("student_quiz_submissions table created successfully.");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Migration error:", e);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
