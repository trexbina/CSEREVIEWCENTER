// Universal Database Bridge (Cloudflare D1 + PostgreSQL fallback)
// Provides a standard pg-like interface `db.query(text, params)` across the application
// - When running inside Cloudflare Workers: executes against Cloudflare D1 (SQLite binding `DB`)
// - When running in standard Node.js (local dev without Cloudflare / scripts): falls back to pg pool

let pgPool = null

function getCloudflareDb() {
  // If local PostgreSQL is configured via DATABASE_URL and USE_D1 is not explicitly forced,
  // prioritize PostgreSQL (for local development / pgAdmin / direct database connections)
  if (process.env.USE_D1 !== "true" && (process.env.DATABASE_URL || process.env.POSTGRES_URL)) {
    return null
  }

  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare")
    const ctx = getCloudflareContext()
    if (ctx?.env?.DB) {
      return ctx.env.DB
    }
  } catch (_) {
    // Not running inside OpenNext / Cloudflare edge runtime
  }

  // Check globalThis (in case injected by edge worker entry)
  if (globalThis?.DB) {
    return globalThis.DB
  }
  return null
}

function getPgPool() {
  if (pgPool) return pgPool

  const pg = require("pg")
  const { Pool } = pg

  let raw =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ""

  if (raw) {
    raw = raw
      .replace(/[?&]sslmode=[^&]*/gi, "")
      .replace(/[?&]sslrejectunauthorized=[^&]*/gi, "")
      .replace(/\?$/, "")
  }

  pgPool = new Pool({
    connectionString: raw || undefined,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 15000,
  })

  pgPool.on("error", (err) => {
    console.error("[pgPool error]:", err?.message || err)
  })

  return pgPool
}

/**
 * Convert PostgreSQL syntax ($1, $2, NOW(), RETURNING) to SQLite/D1 syntax
 */
function translatePgToD1(text, params = []) {
  let sql = text

  // Replace NOW() with datetime('now')
  sql = sql.replace(/\bNOW\(\)/gi, "datetime('now')")

  // Replace CURRENT_TIMESTAMP with datetime('now')
  sql = sql.replace(/\bCURRENT_TIMESTAMP\b/gi, "datetime('now')")

  // Replace boolean true/false keywords in SQL comparisons
  sql = sql.replace(/=\s*true\b/gi, "= 1")
  sql = sql.replace(/=\s*false\b/gi, "= 0")
  sql = sql.replace(/\bIS\s+true\b/gi, "= 1")
  sql = sql.replace(/\bIS\s+false\b/gi, "= 0")

  // Replace PostgreSQL positional placeholders ($1, $2, etc.) with ?
  // and map the provided params array to match each occurrence in order
  const orderedParams = []
  sql = sql.replace(/\$(\d+)/g, (_, num) => {
    const idx = parseInt(num, 10) - 1
    orderedParams.push(params[idx])
    return "?"
  })

  return { sql, params: orderedParams }
}

export async function query(text, params = []) {
  const d1 = getCloudflareDb()

  if (d1) {
    // ── Execute on Cloudflare D1 ──────────────────────────────────
    const hasReturning = /\bRETURNING\b/i.test(text)
    const isReturningMatch = text.match(/\bRETURNING\s+([a-zA-Z0-9_,\s]+)/i)
    const returningFields = isReturningMatch ? isReturningMatch[1].split(",").map(f => f.trim()) : []

    // Strip RETURNING for standard D1 statement if it's an UPDATE/DELETE
    let cleanSql = text
    if (hasReturning && !/^\s*INSERT\b/i.test(text)) {
      cleanSql = cleanSql.replace(/\s+RETURNING\s+.*$/i, "")
    }

    const { sql: translatedSql, params: translatedParams } = translatePgToD1(cleanSql, params)

    const stmt = d1.prepare(translatedSql)
    const boundStmt = translatedParams.length > 0 ? stmt.bind(...translatedParams) : stmt

    const isSelect = /^\s*(SELECT|PRAGMA)\b/i.test(translatedSql)

    if (isSelect || hasReturning) {
      const { results } = await boundStmt.all()
      return {
        rows: results || [],
        rowCount: results?.length || 0,
      }
    } else {
      const res = await boundStmt.run()
      return {
        rows: [],
        rowCount: res?.meta?.changes || 0,
      }
    }
  }

  // ── Fallback to pg Pool ──────────────────────────────────────────
  const pool = getPgPool()
  return await pool.query(text, params)
}

const db = {
  query,
  on: (event, handler) => {
    try {
      getPgPool().on(event, handler)
    } catch (_) {}
  }
}

export default db
