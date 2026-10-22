import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: '.env' });
}

const { Pool } = pg;
const targetUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!targetUrl) {
  console.error("Please configure DATABASE_URL in your .env or .env.local file.");
  process.exit(1);
}

const isCloud = targetUrl.includes('prisma.io') || targetUrl.includes('supabase');

const pool = new Pool({
  connectionString: targetUrl,
  ssl: isCloud ? { rejectUnauthorized: false } : undefined,
});

async function main() {
  console.log(`Connecting to: ${isCloud ? 'CLOUD DB (db.prisma.io)' : 'LOCAL DB'}`);
  const res = await pool.query(`
    SELECT 
      pr.id, 
      pr.first_name || ' ' || pr.last_name AS full_name,
      pr.email,
      pr.city,
      s.name AS school_name,
      p.name AS program_name,
      COALESCE(m.name, 'N/A') AS major_name,
      TO_CHAR(pr.birthday, 'YYYY-MM-DD') AS birthdate,
      pr.status
    FROM pre_registrations pr
    LEFT JOIN schools s ON pr.school_id = s.id
    LEFT JOIN programs p ON pr.program_id = p.id
    LEFT JOIN majors m ON pr.major_id = m.id
    ORDER BY pr.program_id ASC, pr.id ASC
  `);

  console.table(res.rows);
  console.log(`Total pre-registrations: ${res.rows.length}`);
  await pool.end();
}

main().catch(console.error);
