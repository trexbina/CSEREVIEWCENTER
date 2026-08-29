import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/reviewapp',
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Migrating users table columns for login tracking...');
    await client.query('BEGIN');

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INT DEFAULT 0;`);

    await client.query('COMMIT');
    console.log('Migration successful: Added last_login_at and login_count columns to table "users".');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
