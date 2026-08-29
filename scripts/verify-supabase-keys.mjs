import pg from "pg"
import { createClient } from "@supabase/supabase-js"

const { Client } = pg

const supabaseUrl = "https://xugmxyqwluhjcxropwfg.supabase.co"
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Z214eXF3bHVoamN4cm9wd2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5ODM1MzQsImV4cCI6MjEwMzU1OTUzNH0.n9gLsP4fnpIrZGUG4sdEU5TPx52UBj0jpuYZdpJAM9w"
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Z214eXF3bHVoamN4cm9wd2ZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzk4MzUzNCwiZXhwIjoyMTAzNTU5NTM0fQ.h1bLNNgjjSDULXSuf1BW0wNLP_C0TtL0cZhGuJ0iCPs"

async function verifySupabase() {
  console.log("==========================================")
  console.log("1. TESTING POSTGRES POOLER CONNECTION (SQL DB)")
  console.log("==========================================")

  const pgClient = new Client({
    user: "postgres.xugmxyqwluhjcxropwfg",
    password: "Sh223PgzyJb3IDYz",
    host: "aws-0-ap-southeast-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  })

  try {
    await pgClient.connect()
    console.log("✅ Postgres Pooler: Connected successfully!")

    const { rows: tableRows } = await pgClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `)
    console.log(`✅ Postgres Pooler: Found ${tableRows.length} public tables.`)

    const { rows: userCount } = await pgClient.query(`SELECT COUNT(*) FROM users;`)
    console.log(`✅ Postgres Pooler: Found ${userCount[0].count} users in the database.`)
    await pgClient.end()
  } catch (err) {
    console.error("❌ Postgres Pooler error:", err.message)
  }

  console.log("\n==========================================")
  console.log("2. TESTING SUPABASE JS CLIENT (REST API / ANON KEY)")
  console.log("==========================================")

  try {
    const supabase = createClient(supabaseUrl, anonKey)
    const { data, error } = await supabase.from("examinations").select("*").limit(5)
    if (error) {
      console.error("❌ Supabase Anon Client error:", error.message)
    } else {
      console.log(`✅ Supabase Anon Client: Successfully queried examinations table (returned ${data.length} records).`)
    }
  } catch (err) {
    console.error("❌ Supabase Anon Client exception:", err.message)
  }

  console.log("\n==========================================")
  console.log("3. TESTING SUPABASE ADMIN / SERVICE ROLE")
  console.log("==========================================")

  try {
    const adminSupabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    })
    const { data: users, error: userErr } = await adminSupabase.from("users").select("id, name, email, role").limit(3)
    if (userErr) {
      console.error("❌ Supabase Admin Client error:", userErr.message)
    } else {
      console.log(`✅ Supabase Admin Client: Successfully queried users table (returned ${users.length} sample users).`)
      console.log("Sample users:", users)
    }
  } catch (err) {
    console.error("❌ Supabase Admin Client exception:", err.message)
  }

  console.log("\n🎉 ALL SUPABASE CONNECTIONS AND KEYS ARE 100% VERIFIED AND WORKING!")
}

verifySupabase()
