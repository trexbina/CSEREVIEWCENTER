import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function inspectAll() {
  try {
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log("=== ALL TABLES & ROW COUNTS ===");
    for (const row of tablesRes.rows) {
      const countRes = await pool.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
      console.log(`- ${row.table_name}: ${countRes.rows[0].count} rows`);
    }

    console.log("\n=== ALL FOREIGN KEYS ===");
    const fkRes = await pool.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public'
      ORDER BY tc.table_name, kcu.column_name;
    `);
    for (const r of fkRes.rows) {
      console.log(`${r.table_name}.${r.column_name} -> ${r.foreign_table_name}.${r.foreign_column_name} (ON DELETE ${r.delete_rule})`);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

inspectAll();
