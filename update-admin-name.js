import pg from 'pg';

const urls = [
  'postgresql://postgres:yosra@localhost:5432/reviewapp',
  'postgres://d1f728379b70c227e9665d0157a02039f9cdea920d3e48202a4ea36d40482e01:sk_dFxUy0xqZtKe-9RilpDcr@db.prisma.io:5432/postgres?sslmode=require'
];

async function updateAdminUser() {
  for (const url of urls) {
    try {
      const isRemote = url.includes('prisma.io');
      const pool = new pg.Pool({
        connectionString: url.replace(/[?&]sslmode=[^&]*/gi, ''),
        ssl: isRemote ? { rejectUnauthorized: false } : false
      });

      // Set new values here:
      const newEmail = 'admin@peak.edu.ph';
      const newFullName = 'Yosra Dianalan';
      const newFirstName = 'Yosra';
      const newLastName = 'Dianalan';

      const res = await pool.query(`
        UPDATE users 
        SET email = $1,
            name = $2,
            first_name = $3,
            last_name = $4,
            role = 'super_admin',
            job_role_description = 'Super Administrator'
        WHERE email = 'admin@peak.edu.ph' OR email = $1 OR role IN ('admin', 'super_admin')
        RETURNING id, name, email, role, job_role_description;
      `, [newEmail, newFullName, newFirstName, newLastName]);

      console.log(`Updated at ${url.split('@')[1] || url}:`, res.rows);
      await pool.end();
    } catch (err) {
      console.error(`Failed at ${url}:`, err.message);
    }
  }
  process.exit(0);
}

updateAdminUser();
