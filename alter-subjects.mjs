import pg from "pg"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function run() {
    try {
        console.log("Altering subjects table...")
        await pool.query(`
            ALTER TABLE subjects 
            ADD COLUMN IF NOT EXISTS subcategory_id INT REFERENCES subcategories(id) ON DELETE CASCADE,
            ADD COLUMN IF NOT EXISTS image_url TEXT;
        `)
        console.log("✅ Database schema altered successfully!")
    } catch (err) {
        console.error("❌ Error altering schema:", err)
    } finally {
        await pool.end()
    }
}

run()
