import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function getFullSchemaDetails() {
  try {
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const schemaInfo = {};

    for (const row of tablesRes.rows) {
      const tbl = row.table_name;
      const cols = await pool.query(`
        SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tbl]);

      const fks = await pool.query(`
        SELECT
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public' AND tc.table_name = $1;
      `, [tbl]);

      const idxs = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = $1;
      `, [tbl]);

      schemaInfo[tbl] = {
        columns: cols.rows,
        foreignKeys: fks.rows,
        indexes: idxs.rows
      };
    }

    console.log(JSON.stringify(schemaInfo, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

getFullSchemaDetails();
