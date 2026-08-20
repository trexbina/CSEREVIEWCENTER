import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/reviewapp' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL UNIQUE,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS academic_courses (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL UNIQUE,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS school_id INT REFERENCES schools(id) ON DELETE SET NULL;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS academic_course_id INT REFERENCES academic_courses(id) ON DELETE SET NULL;`);
    
    await client.query(`INSERT INTO schools (name) VALUES ('University of the Philippines'), ('Ateneo de Manila University'), ('De La Salle University') ON CONFLICT DO NOTHING;`);
    await client.query(`INSERT INTO academic_courses (name) VALUES ('BS Computer Science'), ('BS Information Technology'), ('BS Nursing') ON CONFLICT DO NOTHING;`);

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
