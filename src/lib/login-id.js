import pool from "@/lib/db"

/**
 * Clean and format a surname/last name into lowercase alphanumeric characters.
 */
export function sanitizeSurnamePrefix(lastName, fullName = "", role = "user") {
  let raw = (lastName || "").trim()
  if (!raw && fullName) {
    const parts = fullName.trim().split(/\s+/)
    raw = parts[parts.length - 1] || ""
  }
  let clean = raw.toLowerCase().replace(/[^a-z0-9]/g, "")
  if (!clean) {
    clean = (role || "user").toLowerCase().replace(/[^a-z0-9]/g, "")
  }
  return clean || "user"
}

/**
 * Atomic calculation of the next 5-digit sequence number.
 * Returns { login_prefix, login_number, login_id }
 */
export async function generateNextLoginId(clientOrPool, lastName, fullName = "", role = "user") {
  const db = clientOrPool || pool
  const prefix = sanitizeSurnamePrefix(lastName, fullName, role)

  // Query highest sequence number in users table
  const seqRes = await db.query(`
    SELECT COALESCE(MAX(login_number::bigint), 0) + 1 AS next_seq
    FROM users
    WHERE login_number ~ '^[0-9]+$'
  `)

  const nextSeq = Number(seqRes.rows[0]?.next_seq || 1)
  const login_number = String(nextSeq).padStart(5, "0")
  let login_id = `${prefix}${login_number}`

  // Guard against any collision
  let counter = nextSeq
  let exists = await db.query("SELECT id FROM users WHERE LOWER(login_id) = $1", [login_id.toLowerCase()])
  while (exists.rows.length > 0) {
    counter++
    const altNumber = String(counter).padStart(5, "0")
    login_id = `${prefix}${altNumber}`
    exists = await db.query("SELECT id FROM users WHERE LOWER(login_id) = $1", [login_id.toLowerCase()])
  }

  return {
    login_prefix: prefix,
    login_number: login_id.slice(prefix.length),
    login_id,
  }
}
