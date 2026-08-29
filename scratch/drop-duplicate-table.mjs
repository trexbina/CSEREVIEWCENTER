import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAndRemoveDuplicate() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    console.log("Checking subject_content (singular) rows...");
    const countRes = await client.query("SELECT COUNT(*) FROM subject_content");
    console.log(`subject_content has ${countRes.rows[0].count} rows.`);

    console.log("Dropping obsolete duplicate table subject_content...");
    await client.query("DROP TABLE IF EXISTS subject_content CASCADE;");

    await client.query("COMMIT;");
    console.log("✅ Duplicate table 'subject_content' successfully dropped!");

  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAndRemoveDuplicate();
