import pg from 'pg';
const { Pool } = pg;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const localUrl = 'postgresql://postgres:yosra@localhost:5432/reviewapp';
const cloudUrl = 'postgres://d1f728379b70c227e9665d0157a02039f9cdea920d3e48202a4ea36d40482e01:sk_dFxUy0xqZtKe-9RilpDcr@db.prisma.io:5432/postgres?sslmode=require';

const localPool = new Pool({ connectionString: localUrl });
const cloudPool = new Pool({
  connectionString: cloudUrl.replace(/[?&]sslmode=[^&]*/gi, ''),
  ssl: { rejectUnauthorized: false },
});

async function pushToCloud() {
  console.log('🚀 Starting sync: Local Database -> Cloud Database (Prisma Postgres)...');

  // 1. Get all public tables from local database
  const tablesRes = await localPool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'pg_%'
    ORDER BY table_name
  `);
  const allTables = tablesRes.rows.map(r => r.table_name);
  console.log(`Found ${allTables.length} public tables in local database.`);

  // 2. Clear existing data in cloud DB with CASCADE
  console.log('Clearing existing data in cloud database...');
  for (const table of allTables) {
    try {
      await cloudPool.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
    } catch (err) {
      try {
        await cloudPool.query(`DELETE FROM "${table}"`);
      } catch (delErr) {
        // Table might not exist in cloud
      }
    }
  }

  // 3. For each table, if local has rows, copy columns and rows
  console.log('Copying table rows from local to cloud...');
  let totalRowsCopied = 0;

  for (const table of allTables) {
    const localRowsRes = await localPool.query(`SELECT * FROM "${table}"`);
    const rows = localRowsRes.rows;

    if (rows.length === 0) continue;

    console.log(`Syncing "${table}" (${rows.length} rows)...`);

    // Get column names & data_types from cloud table
    const cloudColsRes = await cloudPool.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
    `, [table]);
    
    const cloudColTypes = {};
    cloudColsRes.rows.forEach(r => {
      cloudColTypes[r.column_name] = r.data_type.toLowerCase();
    });

    for (const row of rows) {
      const validCols = Object.keys(row).filter(c => cloudColTypes[c]);
      if (validCols.length === 0) continue;

      const colList = validCols.map(c => `"${c}"`).join(', ');
      const placeholders = validCols.map((_, i) => `$${i + 1}`).join(', ');
      
      const values = validCols.map(c => {
        const val = row[c];
        const targetType = cloudColTypes[c];

        if (val === null || val === undefined) return null;

        // If target column is JSON or JSONB and value is an object or array, stringify it
        if ((targetType === 'json' || targetType === 'jsonb') && typeof val === 'object') {
          return JSON.stringify(val);
        }

        // If target column is text[] or ARRAY and val is an array, let pg format it
        return val;
      });

      const insertQuery = `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`;
      await cloudPool.query(insertQuery, values);
      totalRowsCopied++;
    }

    // 4. Update sequence if table has 'id' column
    try {
      const seqRes = await cloudPool.query(`
        SELECT pg_get_serial_sequence($1, 'id') as seq_name
      `, [`public.${table}`]);
      const seqName = seqRes.rows[0]?.seq_name;
      if (seqName) {
        await cloudPool.query(`
          SELECT setval($1, COALESCE((SELECT MAX(id) FROM "${table}"), 1), (SELECT MAX(id) IS NOT NULL FROM "${table}"))
        `, [seqName]);
      }
    } catch (seqErr) {
      // Ignore if no standard serial sequence on id
    }
  }

  console.log(`\n✅ Success! Copied ${totalRowsCopied} rows to cloud database.`);

  // 5. Verification check
  console.log('\n--- Cloud Database Verification ---');
  for (const table of allTables) {
    try {
      const res = await cloudPool.query(`SELECT count(*) FROM "${table}"`);
      const count = parseInt(res.rows[0].count, 10);
      if (count > 0) {
        console.log(`  ✓ ${table}: ${count} rows`);
      }
    } catch (e) {
      // ignore
    }
  }

  await localPool.end();
  await cloudPool.end();
}

pushToCloud().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
