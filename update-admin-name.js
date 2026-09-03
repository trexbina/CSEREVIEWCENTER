import pg from 'pg';
import bcrypt from 'bcryptjs';

const urls = [
  'postgresql://postgres:yosra@localhost:5432/reviewapp',
  'postgres://d1f728379b70c227e9665d0157a02039f9cdea920d3e48202a4ea36d40482e01:sk_dFxUy0xqZtKe-9RilpDcr@db.prisma.io:5432/postgres?sslmode=require'
];

async function updateAdminUser() {
  // ============================================
  // EDIT YOUR DESIRED ADMIN DETAILS HERE:
  // ============================================
  const newEmail = 'admin@peak.edu.ph';     // <-- Change email here
  const newFullName = 'Yosra Dianalan';    // <-- Change full name here
  const newFirstName = 'Yosra';           // <-- Change first name here
  const newLastName = 'Dianalan';          // <-- Change last name here
  const newPassword = '';                  // <-- Optional: enter new password here (leave '' to keep current)
  // ============================================

  for (const url of urls) {
    try {
      const isRemote = url.includes('prisma.io');
      const pool = new pg.Pool({
        connectionString: url.replace(/[?&]sslmode=[^&]*/gi, ''),
        ssl: isRemote ? { rejectUnauthorized: false } : false
      });

      let res;
      if (newPassword && newPassword.trim().length > 0) {
        const hash = await bcrypt.hash(newPassword.trim(), 10);
        res = await pool.query(`
          UPDATE users 
          SET email = $1,
              name = $2,
              first_name = $3,
              last_name = $4,
              password = $5,
              role = 'super_admin',
              job_role_description = 'Super Administrator'
          WHERE email = 'admin@peak.edu.ph' 
             OR email = $1 
             OR role IN ('admin', 'super_admin')
          RETURNING id, name, email, role, job_role_description;
        `, [newEmail, newFullName, newFirstName, newLastName, hash]);
      } else {
        res = await pool.query(`
          UPDATE users 
          SET email = $1,
              name = $2,
              first_name = $3,
              last_name = $4,
              role = 'super_admin',
              job_role_description = 'Super Administrator'
          WHERE email = 'admin@peak.edu.ph' 
             OR email = $1 
             OR role IN ('admin', 'super_admin')
          RETURNING id, name, email, role, job_role_description;
        `, [newEmail, newFullName, newFirstName, newLastName]);
      }

      console.log(`Updated at ${url.split('@')[1] || url}:`, res.rows);
      await pool.end();
    } catch (err) {
      console.error(`Failed at ${url}:`, err.message);
    }
  }
  process.exit(0);
}

updateAdminUser();
