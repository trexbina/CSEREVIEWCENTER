import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/reviewapp' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS programs (
        id          SERIAL PRIMARY KEY,
        exam_id     INT          NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
        name        VARCHAR(255) NOT NULL,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS majors (
        id          SERIAL PRIMARY KEY,
        program_id  INT          NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
        name        VARCHAR(255) NOT NULL,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS program_id INT REFERENCES programs(id) ON DELETE SET NULL;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS major_id INT REFERENCES majors(id) ON DELETE SET NULL;`);
    
    const examRes = await client.query(`SELECT id FROM examinations WHERE name = 'LEPT' LIMIT 1;`);
    if(examRes.rows.length > 0) {
      const examId = examRes.rows[0].id;
      
      await client.query(`INSERT INTO programs (exam_id, name) VALUES ($1, 'BSEd'), ($1, 'BEEd') ON CONFLICT DO NOTHING;`, [examId]);
      
      const progRes = await client.query(`SELECT id FROM programs WHERE name = 'BSEd' AND exam_id = $1 LIMIT 1;`, [examId]);
      if(progRes.rows.length > 0) {
        const progId = progRes.rows[0].id;
        await client.query(`INSERT INTO majors (program_id, name) VALUES ($1, 'Mathematics'), ($1, 'English') ON CONFLICT DO NOTHING;`, [progId]);
      }
    }

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
