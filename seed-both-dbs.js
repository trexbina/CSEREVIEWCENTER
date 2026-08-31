import pg from 'pg';
import bcrypt from 'bcryptjs';

const urls = [
  'postgresql://postgres:yosra@localhost:5432/reviewapp',
  'postgres://d1f728379b70c227e9665d0157a02039f9cdea920d3e48202a4ea36d40482e01:sk_dFxUy0xqZtKe-9RilpDcr@db.prisma.io:5432/postgres?sslmode=require'
];

async function seedBoth() {
  const hash = await bcrypt.hash('Password123!', 10);
  
  for (const url of urls) {
    try {
      const isRemote = url.includes('prisma.io');
      const pool = new pg.Pool({
        connectionString: url.replace(/[?&]sslmode=[^&]*/gi, ''),
        ssl: isRemote ? { rejectUnauthorized: false } : false
      });
      
      await pool.query(`
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'teacher', 'admin', 'super_admin', 'academic_admin', 'registrar'));
      `);

      await pool.query(`
        INSERT INTO users (name, email, password, role, job_role_description, created_at)
        VALUES ('Academic Coordinator', 'academic@peak.edu', $1, 'academic_admin', 'Lead Academic Coordinator & Curriculum Head', NOW())
        ON CONFLICT (email) DO UPDATE 
        SET role = 'academic_admin', job_role_description = 'Lead Academic Coordinator & Curriculum Head', password = $1;
      `, [hash]);

      await pool.query(`
        INSERT INTO users (name, email, password, role, job_role_description, created_at)
        VALUES ('Registrar Officer', 'registrar@peak.edu', $1, 'registrar', 'Head Admissions Officer & Student Registrar', NOW())
        ON CONFLICT (email) DO UPDATE 
        SET role = 'registrar', job_role_description = 'Head Admissions Officer & Student Registrar', password = $1;
      `, [hash]);

      console.log(`Successfully seeded database at: ${url.split('@')[1] || url}`);
      await pool.end();
    } catch (e) {
      console.error(`Failed for ${url}:`, e.message);
    }
  }
  process.exit(0);
}

seedBoth();
