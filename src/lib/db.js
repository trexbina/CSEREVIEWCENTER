import pg from "pg"

// PostgreSQL Connection Pool (Singleton)
// Reused across API routes & Server Components.
// ⚠️ NEVER import in proxy.js — DB calls there destroy performance.

const { Pool } = pg

if (!global._pgPool) {
  global._pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
}

export default global._pgPool
