import pg from "pg"

// PostgreSQL Connection Pool (Singleton)
// Reused across API routes & Server Components.
// Supports DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL (Vercel & Supabase integration).
// ⚠️ NEVER import in proxy.js — DB calls there destroy performance.

const { Pool } = pg

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING

const isRemoteDb =
  connectionString &&
  (connectionString.includes("supabase.co") ||
    connectionString.includes("supabase.com") ||
    connectionString.includes("pooler.supabase.com") ||
    connectionString.includes("sslmode=require"))

if (!global._pgPool) {
  global._pgPool = new Pool({
    connectionString: connectionString || undefined,
    ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

  // Prevent uncaught errors from crashing the Node.js process
  global._pgPool.on("error", (err) => {
    console.error("[pgPool error]:", err.message)
  })
}

export default global._pgPool
