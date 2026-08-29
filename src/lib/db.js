import pg from "pg"

// PostgreSQL Connection Pool (Singleton)
// Reused across API routes & Server Components.
// Supports DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL (Vercel & Supabase integration).

const { Pool } = pg

function getConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.Database_URL1_DATABASE_URL ||
    process.env.Database_URL1_POSTGRES_URL ||
    process.env.Database_URL1_PRISMA_DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ""
  )
}

function createPool() {
  const connectionString = getConnectionString()
  const isRemoteDb =
    connectionString &&
    (connectionString.includes("supabase.co") ||
      connectionString.includes("supabase.com") ||
      connectionString.includes("pooler.supabase.com") ||
      connectionString.includes("prisma.io") ||
      connectionString.includes("sslmode=require") ||
      process.env.NODE_ENV === "production")

  const pool = new Pool({
    connectionString: connectionString || undefined,
    ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

  pool.on("error", (err) => {
    console.error("[pgPool error]:", err?.message || err)
  })

  return pool
}

if (!global._pgPool) {
  global._pgPool = createPool()
}

export default global._pgPool
