import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/reviewapp';
const pool = new pg.Pool({ connectionString });

async function run() {
  const client = await pool.connect();
  try {
    // Delete existing demo user if present to ensure clean idempotency
    await client.query("DELETE FROM users WHERE email = 'maria.santos@student.edu';");

    const hash = await bcrypt.hash('password123', 10);

    const query = `
      INSERT INTO users (
        name, email, password, role,
        first_name, middle_name, last_name,
        birthday, gender, phone, address, city, province, zip_code,
        school_id, academic_course_id, year_graduated, highest_education,
        exam_id, batch_id, avatar_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING id, name, email;
    `;

    const values = [
      'Maria Santos Dela Cruz',
      'maria.santos@student.edu',
      hash,
      'student',
      'Maria',
      'Santos',
      'Dela Cruz',
      '2002-05-15',
      'female',
      '+63 917 123 4567',
      '456 Katipunan Ave, Loyola Heights',
      'Quezon City',
      'Metro Manila',
      '1108',
      2, // Ateneo de Manila University
      3, // BS Nursing
      '2024',
      'bachelor',
      1, // LEPT
      1, // Batch 1
      '/uploads/demo-avatar.png'
    ];

    const res = await client.query(query, values);
    console.log("Successfully created demonstration student user:", res.rows[0]);
  } catch(e) {
    console.error("Error creating demo user:", e);
  } finally {
    client.release();
    pool.end();
  }
}
run();
