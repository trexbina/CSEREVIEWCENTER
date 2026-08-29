import pg from "pg"
import bcrypt from "bcryptjs"

const { Client } = pg

const prismaUrl = "postgres://d1f728379b70c227e9665d0157a02039f9cdea920d3e48202a4ea36d40482e01:sk_dFxUy0xqZtKe-9RilpDcr@db.prisma.io:5432/postgres?sslmode=require"

async function setKnownPasswords() {
  const client = new Client({
    connectionString: prismaUrl,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log("Connected to Prisma Postgres.")

    const adminHash = await bcrypt.hash("admin123", 10)
    await client.query("UPDATE users SET password = $1 WHERE email = $2", [adminHash, "admin@test.com"])
    console.log("✅ Reset 'admin@test.com' password to 'admin123'.")

    const userHash = await bcrypt.hash("password123", 10)
    await client.query("UPDATE users SET password = $1 WHERE email != $2", [userHash, "admin@test.com"])
    console.log("✅ Reset all student/teacher demo accounts password to 'password123'.")
  } catch (err) {
    console.error("Error setting passwords:", err)
  } finally {
    await client.end()
  }
}

setKnownPasswords()
