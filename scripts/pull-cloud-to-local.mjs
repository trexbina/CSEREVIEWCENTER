import pg from 'pg';
const { Pool } = pg;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const localUrl = process.env.DATABASE_URL;
const cloudUrl = process.env.CLOUD_DATABASE_URL;

if (!localUrl || !cloudUrl) {
  console.error("Please provide DATABASE_URL and CLOUD_DATABASE_URL environment variables.");
  process.exit(1);
}

const localPool = new Pool({ connectionString: localUrl });
const cloudPool = new Pool({
  connectionString: cloudUrl.replace(/[?&]sslmode=[^&]*/gi, ''),
  ssl: { rejectUnauthorized: false },
});

async function pullCloudToLocal() {
  console.log('🚀 Starting migration: Cloud Database (Prisma Postgres) -> Local Database...');

  const localClient = await localPool.connect();

  try {
    // Ensure password_reset_tokens table exists locally
    await localClient.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
    `);

    // 1. Get all public tables from cloud database
    const cloudTablesRes = await cloudPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'pg_%'
      ORDER BY table_name
    `);
    const allTables = cloudTablesRes.rows.map(r => r.table_name);
    console.log(`Found ${allTables.length} public tables in cloud database.`);

    // 2. Temporarily disable foreign key constraints and triggers on local database
    await localClient.query(`SET session_replication_role = 'replica';`);

    // 3. Clear existing data in local DB
    console.log('Clearing existing data in local database...');
    for (const table of allTables) {
      try {
        await localClient.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
      } catch (err) {
        try {
          await localClient.query(`DELETE FROM "${table}"`);
        } catch (delErr) {
          // Table might not exist locally
          console.warn(`Note: Table "${table}" could not be truncated locally: ${delErr.message}`);
        }
      }
    }

    // 4. For each table, copy rows from cloud to local
    console.log('Copying table rows from cloud to local...');
    let totalRowsCopied = 0;

    for (const table of allTables) {
      // Check if table exists in local DB
      const localTableCheck = await localClient.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      `, [table]);

      if (localTableCheck.rows.length === 0) {
        console.warn(`⚠️ Skipping "${table}" — not found in local database schema.`);
        continue;
      }

      const cloudRowsRes = await cloudPool.query(`SELECT * FROM "${table}"`);
      const rows = cloudRowsRes.rows;

      if (rows.length === 0) continue;

      console.log(`Migrating "${table}" (${rows.length} rows)...`);

      // Get local column details (type, nullable, default)
      const localColsRes = await localClient.query(`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
      `, [table]);

      const localCols = {};
      localColsRes.rows.forEach(r => {
        localCols[r.column_name] = {
          type: r.data_type.toLowerCase(),
          udt: r.udt_name.toLowerCase(),
          isNullable: r.is_nullable === 'YES',
          hasDefault: r.column_default !== null && r.column_default !== undefined,
        };
      });

      for (const row of rows) {
        const colList = [];
        const placeholders = [];
        const values = [];

        for (const [colName, val] of Object.entries(row)) {
          const colInfo = localCols[colName];
          if (!colInfo) continue; // column doesn't exist locally

          if (val === null || val === undefined) {
            if (!colInfo.isNullable) {
              if (colInfo.hasDefault) {
                // Let database default handle it
                continue;
              }
              // NOT NULL with no default: provide appropriate fallback
              if (colInfo.type.includes('timestamp') || colInfo.type.includes('date')) {
                values.push(new Date().toISOString());
              } else if (colInfo.type.includes('bool')) {
                values.push(false);
              } else if (colInfo.type.includes('int') || colInfo.type.includes('numeric')) {
                values.push(0);
              } else {
                values.push('');
              }
            } else {
              values.push(null);
            }
          } else {
            // Handle JSON/JSONB
            if ((colInfo.type === 'json' || colInfo.type === 'jsonb') && typeof val === 'object') {
              values.push(JSON.stringify(val));
            } else {
              values.push(val);
            }
          }

          colList.push(`"${colName}"`);
          placeholders.push(`$${values.length}`);
        }

        if (colList.length === 0) continue;

        const insertQuery = `INSERT INTO "${table}" (${colList.join(', ')}) VALUES (${placeholders.join(', ')})`;
        await localClient.query(insertQuery, values);
        totalRowsCopied++;
      }

      // 5. Update sequence if table has serial sequence
      try {
        const seqRes = await localClient.query(`
          SELECT pg_get_serial_sequence($1, 'id') as seq_name
        `, [`public.${table}`]);
        const seqName = seqRes.rows[0]?.seq_name;
        if (seqName) {
          await localClient.query(`
            SELECT setval($1, COALESCE((SELECT MAX(id) FROM "${table}"), 1), (SELECT MAX(id) IS NOT NULL FROM "${table}"))
          `, [seqName]);
        }
      } catch (seqErr) {
        // Ignore if no standard serial sequence
      }
    }

    // 6. Restore foreign key constraints
    await localClient.query(`SET session_replication_role = 'origin';`);

    console.log(`\n✅ Migration successful! Copied ${totalRowsCopied} rows to local database.`);

    // 7. Verification check
    console.log('\n--- Local Database Verification ---');
    for (const table of allTables) {
      try {
        const res = await localClient.query(`SELECT count(*) FROM "${table}"`);
        const count = parseInt(res.rows[0].count, 10);
        if (count > 0) {
          console.log(`  ✓ ${table}: ${count} rows`);
        }
      } catch (e) {
        // ignore
      }
    }
  } finally {
    try {
      await localClient.query(`SET session_replication_role = 'origin';`);
    } catch (e) {
      // ignore
    }
    localClient.release();
    await localPool.end();
    await cloudPool.end();
  }
}

pullCloudToLocal().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
