import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function inspect() {
  try {
    // 1. Get all public tables
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log("=== TABLES ===");
    for (const row of tablesRes.rows) {
      const countRes = await pool.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
      console.log(`${row.table_name}: ${countRes.rows[0].count} rows`);
    }

    // 2. Get foreign keys
    console.log("\n=== FOREIGN KEYS ===");
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
    console.table(fkRes.rows);

    // 3. Get all columns for all tables
    console.log("\n=== TABLE COLUMNS ===");
    const colsRes = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `);
    
    const byTable = {};
    for (const c of colsRes.rows) {
      if (!byTable[c.table_name]) byTable[c.table_name] = [];
      byTable[c.table_name].push(`${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`);
    }
    for (const [tbl, cols] of Object.entries(byTable)) {
      console.log(`\nTable: ${tbl}`);
      console.log(`  ` + cols.join('\n  '));
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

inspect();
