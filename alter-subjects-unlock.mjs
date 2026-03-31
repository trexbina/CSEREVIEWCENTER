import pg from "pg"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function run() {
    try {
        console.log("Altering subjects table to add unlock_date...")
        await pool.query(`
            ALTER TABLE subjects 
            ADD COLUMN IF NOT EXISTS unlock_date TIMESTAMPTZ;
        `)
        console.log("✅ Database schema altered successfully with unlock_date!")
    } catch (err) {
        console.error("❌ Error altering schema:", err)
    } finally {
        await pool.end()
    }
}

run()
