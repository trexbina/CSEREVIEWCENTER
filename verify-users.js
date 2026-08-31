import pool from './src/lib/db.js';
import bcrypt from 'bcryptjs';

async function resetAndVerify() {
  try {
    const hash = await bcrypt.hash('Password123!', 10);
    
    await pool.query(`
      UPDATE users SET password = $1 WHERE email IN ('academic@peak.edu', 'registrar@peak.edu');
    `, [hash]);

    const res = await pool.query(`
      SELECT id, name, email, role, password FROM users WHERE email IN ('academic@peak.edu', 'registrar@peak.edu');
    `);

    for (const u of res.rows) {
      const match = await bcrypt.compare('Password123!', u.password);
      console.log(`User: ${u.email} | Role: ${u.role} | Password verified: ${match}`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetAndVerify();
