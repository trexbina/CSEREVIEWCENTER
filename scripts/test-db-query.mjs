import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/reviewapp' });

async function run() {
  try {
    const res = await pool.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('examinations', 'programs', 'majors');");
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
