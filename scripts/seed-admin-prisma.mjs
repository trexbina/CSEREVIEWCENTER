import pg from "pg"
import bcrypt from "bcryptjs"

const { Client } = pg

const prismaUrl = "postgres://d1f728379b70c227e9665d0157a02039f9cdea920d3e48202a4ea36d40482e01:sk_dFxUy0xqZtKe-9RilpDcr@db.prisma.io:5432/postgres?sslmode=require"

async function insertAdminUser() {
  const client = new Client({
    connectionString: prismaUrl,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log("Connected to Prisma Postgres.")

    const hash = await bcrypt.hash("password123", 10)
    
    // Check if user exists
    const existing = await client.query("SELECT id, email, role FROM users WHERE email = $1", ["admin@test.com"])
    
    let result
    if (existing.rows.length > 0) {
      console.log("Updating existing admin user...")
      result = await client.query(
        "UPDATE users SET password = $1, role = 'admin', name = 'Admin User' WHERE email = $2 RETURNING id, name, email, role",
        [hash, "admin@test.com"]
      )
    } else {
      console.log("Inserting new admin user...")
      result = await client.query(
        `INSERT INTO users (name, email, password, role, font_preference, created_at, login_count, targets) 
         VALUES ('Admin User', 'admin@test.com', $1, 'admin', 'geist', NOW(), 0, '[]'::jsonb) 
         RETURNING id, name, email, role`,
        [hash]
      )
    }

    console.log("✅ Admin User configured successfully:", result.rows[0])
    
    // Verify password check directly
    const verifyUser = await client.query("SELECT password FROM users WHERE email = $1", ["admin@test.com"])
    const match = await bcrypt.compare("password123", verifyUser.rows[0].password)
    console.log("✅ Password match test for 'password123':", match)

  } catch (err) {
    console.error("Error setting admin user:", err)
  } finally {
    await client.end()
  }
}

insertAdminUser()
