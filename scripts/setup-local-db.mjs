import fs from 'fs';
import pg from 'pg';

const rootConnectionString = 'postgresql://postgres:yosra@localhost:5432/postgres';
const targetConnectionString = 'postgresql://postgres:yosra@localhost:5432/reviewapp';

async function main() {
  console.log('--- Step 1: Initialize Database reviewapp ---');
  const rootClient = new pg.Client({ connectionString: rootConnectionString });
  try {
    await rootClient.connect();
    console.log('Connected to root postgres db.');

    try {
      await rootClient.query('DROP DATABASE IF EXISTS reviewapp WITH (FORCE)');
    } catch (e) {
      await rootClient.query('DROP DATABASE IF EXISTS reviewapp');
    }
    await rootClient.query('CREATE DATABASE reviewapp');
    console.log("Database 'reviewapp' created successfully.");
  } catch (err) {
    console.error('Error creating database:', err);
    process.exit(1);
  } finally {
    await rootClient.end();
  }

  console.log('--- Step 2: Executing setup.sql ---');
  const rawSql = fs.readFileSync('setup.sql', 'utf8');
  const setupSql = rawSql
    .replace(/CREATE DATABASE reviewapp;/gi, '')
    .replace(/\\c reviewapp;?/gi, '');

  const client = new pg.Client({ connectionString: targetConnectionString });
  try {
    await client.connect();
    console.log("Executing setup.sql on 'reviewapp'...");
    await client.query(setupSql);
    console.log("setup.sql executed successfully!");

    console.log('--- Step 3: Running Additional Schema Enhancements ---');
    // Ensure all tables and columns needed for notifications, assignments, recent activity, logins, profile, etc. exist

    // 1. notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        link VARCHAR(255),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_id, created_at DESC);
    `);
    console.log('✓ notifications table verified.');

    // 2. student_activities table (for recent activity)
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_activities (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        details TEXT,
        status VARCHAR(20) DEFAULT 'success',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_student_activities_student ON student_activities(student_id, created_at DESC);
    `);
    console.log('✓ student_activities table verified.');

    // 3. student_quiz_submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_quiz_submissions (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content_id INT NOT NULL REFERENCES subject_contents(id) ON DELETE CASCADE,
        earned_points INT NOT NULL DEFAULT 0,
        total_points INT NOT NULL DEFAULT 0,
        time_taken_seconds INT NOT NULL DEFAULT 0,
        answers JSONB NOT NULL DEFAULT '{}'::jsonb,
        attempts_count INT NOT NULL DEFAULT 1,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (student_id, content_id)
      );
    `);
    console.log('✓ student_quiz_submissions table verified.');

    // 4. Extra user profile and login tracking columns
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INT DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS suffix VARCHAR(20);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(30);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS province VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS school VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS course VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS year_graduated VARCHAR(10);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS highest_education VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS job_role_description TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS font_preference VARCHAR(50) DEFAULT 'geist';
    `);
    console.log('✓ user profile & login tracking columns verified.');

    // 5. Seed sample notifications & recent activity for demonstration & testing
    const usersRes = await client.query('SELECT id, name, role FROM users');
    console.log(`Found ${usersRes.rows.length} users:`, usersRes.rows.map(u => `${u.name} (${u.role}, ID: ${u.id})`));

    const studentIds = usersRes.rows.filter(u => u.role === 'student').map(u => u.id);
    for (const studentId of studentIds) {
      // Sample notification
      await client.query(`
        INSERT INTO notifications (student_id, type, title, message, link, is_read, created_at)
        VALUES 
          ($1, 'assignment', 'New Assignment Available', 'A new review assignment has been published.', '/student/assignments', false, NOW() - INTERVAL '1 hour'),
          ($1, 'mock_exam', 'Mock Exam Scheduled', 'AUGUST: MOCK EXAM I is now available for review.', '/student/mock-exams', false, NOW() - INTERVAL '2 hours'),
          ($1, 'system', 'Welcome to Peak Excellence', 'Your account has been successfully initialized on your local environment.', '/student/dashboard', true, NOW() - INTERVAL '1 day')
        ON CONFLICT DO NOTHING;
      `, [studentId]);

      // Sample student activity
      await client.query(`
        INSERT INTO student_activities (student_id, activity_type, title, details, status, created_at)
        VALUES 
          ($1, 'login', 'Logged in to Portal', 'Logged in from desktop browser', 'success', NOW() - INTERVAL '10 minutes'),
          ($1, 'quiz', 'Completed Study Skills Quiz', 'Score: 10/10 in Quiz 1: Quiz about Study Skills', 'success', NOW() - INTERVAL '3 hours'),
          ($1, 'exam', 'Completed Mock Exam', 'Score: 90/100 on AUGUST: MOCK EXAM I', 'success', NOW() - INTERVAL '1 day')
        ON CONFLICT DO NOTHING;
      `, [studentId]);
    }
    console.log('✓ Initial activity and notifications seeded.');

    // List all tables
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.log('\n--- Final Public Database Tables ---');
    console.log(tableRes.rows.map(r => r.table_name).join(', '));

  } catch (err) {
    console.error('Database setup error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
