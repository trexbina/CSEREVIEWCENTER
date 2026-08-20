import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/reviewapp' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS job_role_description TEXT;`);

    await client.query('COMMIT');
    console.log("Database successfully altered.");
  } catch(e) {
    await client.query('ROLLBACK');
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}
run();
