import pg from "pg"
import fs from "fs"
import path from "path"

const { Client } = pg

async function runMigration() {
  console.log("Connecting to Supabase Database...")
  const client = new Client({
    user: "postgres.xugmxyqwluhjcxropwfg",
    password: "Sh223PgzyJb3IDYz",
    host: "aws-0-ap-southeast-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log("Connected successfully to Supabase!")

    const sqlPath = path.join(process.cwd(), "setup.sql")
    if (!fs.existsSync(sqlPath)) {
      console.error("setup.sql not found.")
      return
    }

    let sqlContent = fs.readFileSync(sqlPath, "utf-8")

    // Filter out local psql meta commands and CREATE/CONNECT DATABASE commands
    sqlContent = sqlContent
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim()
        return (
          !trimmed.startsWith("\\c ") &&
          !trimmed.startsWith("\\connect ") &&
          !trimmed.toLowerCase().startsWith("create database ")
        )
      })
      .join("\n")

    console.log("Executing SQL statements on Supabase...")
    await client.query(sqlContent)
    console.log("All tables, schemas, and initial data successfully applied to Supabase!")
  } catch (err) {
    console.error("Migration error:", err)
  } finally {
    await client.end()
    console.log("Connection closed.")
  }
}

runMigration()
