import pg from "pg"

const { Client } = pg

async function grantPermissions() {
  console.log("Connecting to Supabase via Postgres Pooler to grant table permissions...")
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
    console.log("Connected.")

    console.log("Granting permissions on public schema to anon, authenticated, and service_role...")
    await client.query(`
      GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
      GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
    `)
    console.log("✅ Successfully granted all permissions to Supabase roles (anon, authenticated, service_role).")
  } catch (err) {
    console.error("Grant error:", err)
  } finally {
    await client.end()
  }
}

grantPermissions()
