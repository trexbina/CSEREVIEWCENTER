import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/reviewapp' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS examinations (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL UNIQUE,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`DROP TABLE IF EXISTS batches CASCADE;`);
    
    await client.query(`
      CREATE TABLE batches (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        exam_id     INT          NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
        target_year INT          NOT NULL,
        status      VARCHAR(50)  NOT NULL DEFAULT 'upcoming' CHECK (status IN ('active', 'upcoming', 'completed')),
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS batch_id INT REFERENCES batches(id) ON DELETE SET NULL;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS exam_id INT REFERENCES examinations(id) ON DELETE SET NULL;`);
    
    await client.query(`INSERT INTO examinations (name) VALUES ('LEPT'), ('NCLEX') ON CONFLICT DO NOTHING;`);
    
    const examRes = await client.query(`SELECT id FROM examinations LIMIT 1;`);
    if(examRes.rows.length > 0) {
      const examId = examRes.rows[0].id;
      await client.query(`
        INSERT INTO batches (name, exam_id, target_year, status) VALUES 
        ('Batch 1', $1, 2025, 'active'),
        ('Batch 2', $1, 2026, 'upcoming');
      `, [examId]);
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
