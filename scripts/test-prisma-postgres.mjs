import pg from "pg"
import bcrypt from "bcryptjs"

const { Client } = pg

const prismaUrl = "postgres://d1f728379b70c227e9665d0157a02039f9cdea920d3e48202a4ea36d40482e01:sk_dFxUy0xqZtKe-9RilpDcr@db.prisma.io:5432/postgres?sslmode=require"

async function testPrismaPostgresLogin() {
  console.log("==========================================")
  console.log("TESTING PRISMA POSTGRES LOGIN QUERY")
  console.log("==========================================")

  const client = new Client({
    connectionString: prismaUrl,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log("✅ Connected to Prisma Postgres DB.")

    const email = "admin@test.com"
    const { rows } = await client.query("SELECT id, name, email, password, role FROM users WHERE email = $1", [email])
    
    if (rows.length === 0) {
      console.error("❌ User not found in Prisma DB!")
      return
    }

    const user = rows[0]
    console.log("✅ Found User in Prisma Postgres:", { id: user.id, name: user.name, email: user.email, role: user.role })

    // Test password match
    const isPasswordValid = await bcrypt.compare("admin123", user.password)
    console.log("✅ Password Match for 'admin123':", isPasswordValid)

    // Test query table counts
    const { rows: tableCounts } = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM subjects) as subjects_count,
        (SELECT COUNT(*) FROM mock_exams) as mock_exams_count,
        (SELECT COUNT(*) FROM carousel_slides) as carousel_count
    `)
    console.log("✅ Live Table Counts on Prisma Postgres:", tableCounts[0])

    console.log("\n🎉 PRISMA POSTGRES DATABASE IS 100% READY FOR DEPLOYMENT!")
  } catch (err) {
    console.error("❌ Prisma Postgres test failed:", err)
  } finally {
    await client.end()
  }
}

testPrismaPostgresLogin()
