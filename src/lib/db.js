import pg from "pg"

// PostgreSQL Connection Pool (Singleton)
// Reused across API routes & Server Components.
// Supports DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL (Vercel & Supabase integration).

const { Pool } = pg

function getCleanConnectionString() {
  const raw =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.Database_URL1_DATABASE_URL ||
    process.env.Database_URL1_POSTGRES_URL ||
    process.env.Database_URL1_PRISMA_DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ""

  // Remove sslmode query parameter to prevent pg connection string parser from overriding ssl options
  try {
    if (raw && (raw.includes("prisma.io") || raw.includes("supabase") || raw.includes("sslmode="))) {
      const url = new URL(raw)
      url.searchParams.delete("sslmode")
      url.searchParams.delete("uselibpqcompat")
      return url.toString()
    }
  } catch (e) {}

  return raw
}

function createPool() {
  const connectionString = getCleanConnectionString()
  const isRemoteDb =
    connectionString &&
    (connectionString.includes("supabase") ||
      connectionString.includes("prisma.io") ||
      process.env.NODE_ENV === "production")

  const pool = new Pool({
    connectionString: connectionString || undefined,
    ssl: isRemoteDb
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
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
