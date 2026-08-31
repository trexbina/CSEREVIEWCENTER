import bcrypt from 'bcryptjs';
import pool from './src/lib/db.js';

async function seedRoles() {
  try {
    const hash = await bcrypt.hash('Password123!', 10);
    
    // Update users_role_check constraint to permit new admin roles
    await pool.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'teacher', 'admin', 'super_admin', 'academic_admin', 'registrar'));
    `);
    const coord = await pool.query(`
      INSERT INTO users (name, email, password, role, job_role_description, created_at)
      VALUES ('Academic Coordinator', 'academic@peak.edu', $1, 'academic_admin', 'Lead Academic Coordinator & Curriculum Head', NOW())
      ON CONFLICT (email) DO UPDATE 
      SET role = 'academic_admin', job_role_description = 'Lead Academic Coordinator & Curriculum Head', password = $1
      RETURNING id, name, email, role, job_role_description;
    `, [hash]);

    // 2. Registrar
    const registrar = await pool.query(`
      INSERT INTO users (name, email, password, role, job_role_description, created_at)
      VALUES ('Registrar Officer', 'registrar@peak.edu', $1, 'registrar', 'Head Admissions Officer & Student Registrar', NOW())
      ON CONFLICT (email) DO UPDATE 
      SET role = 'registrar', job_role_description = 'Head Admissions Officer & Student Registrar', password = $1
      RETURNING id, name, email, role, job_role_description;
    `, [hash]);

    console.log('--- ACCOUNTS CREATED SUCCESSFULLY ---');
    console.log('1. Academic Coordinator:', coord.rows[0]);
    console.log('2. Registrar:', registrar.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding roles:', err);
    process.exit(1);
  }
}

seedRoles();
