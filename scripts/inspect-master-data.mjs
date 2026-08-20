import pg from 'pg';
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
    const exams = await client.query('SELECT id, name FROM examinations LIMIT 5;');
    const batches = await client.query('SELECT id, name FROM batches LIMIT 5;');
    const schools = await client.query('SELECT id, name FROM schools LIMIT 5;');
    const courses = await client.query('SELECT id, name FROM academic_courses LIMIT 5;');
    
    console.log("EXAMS:", exams.rows);
    console.log("BATCHES:", batches.rows);
    console.log("SCHOOLS:", schools.rows);
    console.log("COURSES:", courses.rows);
  } catch(e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}
run();
