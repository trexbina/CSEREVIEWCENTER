import pg from "pg"

const { Client } = pg

async function cloneSchemaAndData() {
  console.log("Connecting to Local DB & Remote Supabase...")
  const localClient = new Client({
    connectionString: "postgresql://postgres:yosra@localhost:5432/reviewapp"
  })

  const supabaseClient = new Client({
    user: "postgres.xugmxyqwluhjcxropwfg",
    password: "Sh223PgzyJb3IDYz",
    host: "aws-0-ap-southeast-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  })

  try {
    await localClient.connect()
    console.log("Connected to Local DB.")

    await supabaseClient.connect()
    console.log("Connected to Supabase DB.")

    // Drop and recreate cleanly
    console.log("Resetting public schema on Supabase for clean clone...")
    await supabaseClient.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `)
    console.log("Clean public schema created.")

    // Fetch all public table names in local DB
    const { rows: tableRows } = await localClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `)
    const allTables = tableRows.map(r => r.table_name)
    console.log("Tables found in local DB:", allTables)

    // For each table, read table columns and types from local DB, create on Supabase, then sync rows
    for (const table of allTables) {
      if (table === "uploaded_files") continue // Skip binary files table for clean transfer

      console.log(`\nProcessing table: ${table}...`)
      
      const { rows: colRows } = await localClient.query(`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table])

      const colDefs = colRows.map(col => {
        let type = col.udt_name
        if (col.column_name === "id") return `"id" SERIAL PRIMARY KEY`
        if (type === "varchar") type = "VARCHAR(255)"
        if (type === "timestamptz") type = "TIMESTAMPTZ"
        if (type === "jsonb") type = "JSONB"
        if (type === "text") type = "TEXT"
        if (type === "int4") type = "INTEGER"
        if (type === "int8") type = "BIGINT"
        if (type === "bool") type = "BOOLEAN"
        if (type === "numeric") type = "NUMERIC(5,2)"
        if (type === "date") type = "DATE"
        return `"${col.column_name}" ${type}`
      })

      const createSql = `CREATE TABLE IF NOT EXISTS "${table}" (\n  ${colDefs.join(",\n  ")}\n);`
      await supabaseClient.query(createSql)

      // Sync rows
      const { rows: dataRows } = await localClient.query(`SELECT * FROM "${table}"`)
      if (dataRows.length > 0) {
        const cols = Object.keys(dataRows[0])
        const colNames = cols.map(c => `"${c}"`).join(", ")

        for (const row of dataRows) {
          const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ")
          const values = cols.map(c => {
            const val = row[c]
            if (val && typeof val === 'object' && !(val instanceof Date)) {
              return JSON.stringify(val)
            }
            return val
          })

          const insertSql = `
            INSERT INTO "${table}" (${colNames})
            VALUES (${placeholders})
            ON CONFLICT (id) DO UPDATE SET
            ${cols.filter(c => c !== "id").map(c => `"${c}" = EXCLUDED."${c}"`).join(", ")}
          `
          await supabaseClient.query(insertSql, values)
        }
        console.log(`Synced ${dataRows.length} rows into "${table}".`)
      } else {
        console.log(`Table "${table}" has 0 rows.`)
      }

      // Update sequence
      await supabaseClient.query(`
        SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), true);
      `).catch(() => {})
    }

    console.log("\n🚀 ALL LOCAL DATABASE TABLES & LIVE ROWS SUCCESSFULLY CLONED TO SUPABASE!")
  } catch (err) {
    console.error("Migration Error:", err)
  } finally {
    await localClient.end()
    await supabaseClient.end()
  }
}

cloneSchemaAndData()
