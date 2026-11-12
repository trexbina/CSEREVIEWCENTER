import pool from "@/lib/db"

let ready = false
let pending = null

/** Adds the category visibility tier to databases created before tiered curriculum. */
export async function ensureCurriculumTierSchema(client = pool) {
  if (ready) return
  if (!pending) {
    pending = (async () => {
      try {
        await client.query("ALTER TABLE categories ADD COLUMN access_tier VARCHAR(10) NOT NULL DEFAULT 'free'")
      } catch (error) {
        const message = String(error?.message || "").toLowerCase()
        if (!message.includes("already exists") && !message.includes("duplicate") && !message.includes("exists")) throw error
      }
      await client.query("UPDATE categories SET access_tier = 'free' WHERE access_tier IS NULL OR access_tier NOT IN ('free', 'paid')")
      ready = true
    })()
  }
  await pending
}

export function normalizeAccessTier(value) {
  return value === "paid" ? "paid" : "free"
}
