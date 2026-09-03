import pg from 'pg';
import bcrypt from 'bcryptjs';

const urls = [
  'postgresql://postgres:yosra@localhost:5432/reviewapp',
  'postgres://d1f728379b70c227e9665d0157a02039f9cdea920d3e48202a4ea36d40482e01:sk_dFxUy0xqZtKe-9RilpDcr@db.prisma.io:5432/postgres?sslmode=require'
];

async function resetAdmins() {
  const defaultPassword = 'Password123!';
  const hash = await bcrypt.hash(defaultPassword, 10);

  // New admin roles with clean, random short names:
  const newStaff = [
    {
      name: 'Kai Vance',
      first_name: 'Kai',
      last_name: 'Vance',
      email: 'admin@peak.edu.ph',
      role: 'super_admin',
      job_role_description: 'Super Administrator',
    },
    {
      name: 'Elena Cruz',
      first_name: 'Elena',
      last_name: 'Cruz',
      email: 'academic@peak.edu.ph',
      role: 'academic_admin',
      job_role_description: 'Academic Coordinator',
    },
    {
      name: 'Leo Morales',
      first_name: 'Leo',
      last_name: 'Morales',
      email: 'registrar@peak.edu.ph',
      role: 'registrar',
      job_role_description: 'Admissions Registrar',
    }
  ];

  for (const url of urls) {
    try {
      const isRemote = url.includes('prisma.io');
      const pool = new pg.Pool({
        connectionString: url.replace(/[?&]sslmode=[^&]*/gi, ''),
        ssl: isRemote ? { rejectUnauthorized: false } : false
      });

      console.log(`\n--- Resetting on: ${url.split('@')[1] || url} ---`);

      // 1. Delete all existing admin accounts
      const del = await pool.query(`
        DELETE FROM users 
        WHERE role IN ('admin', 'super_admin', 'academic_admin', 'registrar')
           OR email IN ('admin@peak.edu.ph', 'academic@peak.edu', 'academic@peak.edu.ph', 'registrar@peak.edu', 'registrar@peak.edu.ph')
      `);
      console.log(`Deleted ${del.rowCount} old admin account(s).`);

      // 2. Ensure constraint allows the 3 admin roles
      await pool.query(`
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'teacher', 'admin', 'super_admin', 'academic_admin', 'registrar'));
      `);

      // 3. Insert fresh new accounts
      for (const staff of newStaff) {
        const res = await pool.query(`
          INSERT INTO users (
            name, first_name, last_name, email, password, role, job_role_description, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING id, name, email, role, job_role_description;
        `, [
          staff.name,
          staff.first_name,
          staff.last_name,
          staff.email,
          hash,
          staff.role,
          staff.job_role_description,
        ]);
        console.log(`Created: ${res.rows[0].name} (${res.rows[0].role}) -> ${res.rows[0].email}`);
      }

      await pool.end();
    } catch (err) {
      console.error(`Error on ${url}:`, err.message);
    }
  }

  console.log('\nAll 3 admin roles have been reset and recreated successfully!');
  process.exit(0);
}

resetAdmins();
