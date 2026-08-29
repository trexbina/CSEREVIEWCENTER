import pg from "pg"
import bcrypt from "bcryptjs"

const { Client } = pg

const prismaUrl = "postgres://d1f728379b70c227e9665d0157a02039f9cdea920d3e48202a4ea36d40482e01:sk_dFxUy0xqZtKe-9RilpDcr@db.prisma.io:5432/postgres?sslmode=require"
const localUrl = "postgresql://postgres:yosra@localhost:5432/reviewapp"

async function updateAdminEmail(connectionString, label) {
  const client = new Client({
    connectionString,
    ssl: connectionString.includes("prisma.io") ? { rejectUnauthorized: false } : undefined
  })

  try {
    await client.connect()
    console.log(`Connected to ${label}.`)

    const hash = await bcrypt.hash("password123", 10)

    // Update existing admin or insert
    const res = await client.query(`
      UPDATE users 
      SET email = 'admin@peak.edu.ph', role = 'admin', name = 'Admin User', password = $1 
      WHERE email = 'admin@test.com' OR role = 'admin' OR email = 'admin@peak.edu.ph'
      RETURNING id, name, email, role
    `, [hash])

    if (res.rows.length === 0) {
      const insertRes = await client.query(`
        INSERT INTO users (name, email, password, role, font_preference, created_at, login_count, targets)
        VALUES ('Admin User', 'admin@peak.edu.ph', $1, 'admin', 'geist', NOW(), 0, '[]'::jsonb)
        RETURNING id, name, email, role
      `, [hash])
      console.log(`✅ [${label}] Inserted admin user:`, insertRes.rows[0])
    } else {
      console.log(`✅ [${label}] Updated admin user:`, res.rows)
    }
  } catch (err) {
    console.error(`❌ [${label}] Error:`, err.message)
  } finally {
    await client.end()
  }
}

async function main() {
  await updateAdminEmail(prismaUrl, "Prisma Postgres Remote")
  await updateAdminEmail(localUrl, "Local Postgres")
}

main()
