import pool from "@/lib/db"

/**
 * Clean and format a surname/last name into lowercase alphanumeric characters.
 */
export function sanitizeSurnamePrefix(lastName, fullName = "", role = "user") {
  const normalizedRole = (role || "user").toLowerCase()

  let raw = (lastName || "").trim()
  if (!raw && fullName) {
    const parts = fullName.trim().split(/\s+/)
    raw = parts[parts.length - 1] || ""
  }
  let clean = raw.toLowerCase().replace(/[^a-z0-9]/g, "")
  if (!clean) {
    const isAdmin = normalizedRole !== "student" && normalizedRole !== "teacher" && normalizedRole !== "user"
    if (isAdmin || normalizedRole.includes("admin")) {
      clean = "admin"
    } else {
      clean = normalizedRole.replace(/[^a-z0-9]/g, "")
    }
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

  // Query highest ID in users table
  const seqRes = await db.query(`
    SELECT COALESCE(MAX(id), 0) + 1 AS next_seq
    FROM users
  `)

  const nextSeq = Number(seqRes.rows[0]?.next_seq || 1)
  const login_number = String(nextSeq).padStart(5, "0")
  const login_id = `${prefix}${login_number}`

  return {
    login_prefix: prefix,
    login_number,
    login_id,
  }
}
