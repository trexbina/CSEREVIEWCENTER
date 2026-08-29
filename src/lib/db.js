import pg from "pg"

// PostgreSQL Connection Pool (Singleton)
// Reused across API routes & Server Components.
// Supports DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL (Vercel, Prisma Postgres, Supabase).

const { Pool } = pg

// CRITICAL: Disable Node.js strict TLS certificate validation for cloud-hosted databases
// (Prisma Postgres, Supabase, Neon, etc. use internal/self-signed certificates)
if (process.env.NODE_ENV === "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
}

function getConnectionString() {
  let raw =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.Database_URL1_DATABASE_URL ||
    process.env.Database_URL1_POSTGRES_URL ||
    process.env.Database_URL1_PRISMA_DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ""

  // Strip sslmode parameter — pg v8+ treats sslmode=require as verify-full
  // which rejects self-signed certificates from cloud database providers.
  // We handle SSL ourselves via the Pool `ssl` option below.
  if (raw) {
    raw = raw
      .replace(/[?&]sslmode=[^&]*/gi, "")
      .replace(/[?&]sslrejectunauthorized=[^&]*/gi, "")
      .replace(/\?$/, "") // clean trailing ? if it was the only param
  }

  return raw
}

function createPool() {
  const connectionString = getConnectionString()

  const pool = new Pool({
    connectionString: connectionString || undefined,
    ssl: process.env.NODE_ENV === "production" || connectionString.includes("prisma.io") || connectionString.includes("supabase")
      ? { rejectUnauthorized: false }
      : undefined,
    max: 2, // Serverless-friendly: keep connections low per lambda
    idleTimeoutMillis: 10000, // Close idle connections quickly
    connectionTimeoutMillis: 5000,
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

