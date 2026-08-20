import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/reviewapp',
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Migrating users table columns...');
    await client.query('BEGIN');

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS suffix VARCHAR(20);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(30);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS province VARCHAR(100);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS school VARCHAR(255);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS course VARCHAR(255);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS year_graduated VARCHAR(10);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS highest_education VARCHAR(50);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS job_role_description TEXT;`);

    await client.query('COMMIT');
    console.log('Migration successful: All missing user profile columns added to table "users".');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
