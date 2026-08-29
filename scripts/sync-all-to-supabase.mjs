import pg from "pg"
import pool from "../src/lib/db.js"

const { Client } = pg

async function migrateData() {
  console.log("Connecting to Local DB & Remote Supabase...")
  const localClient = new Client({
    connectionString: "postgresql://postgres:yosra@localhost:5432/reviewapp"
  })

  const supabaseClient = new Client({
    user: "postgres.xugmxyqwluhjcxropwfg",
    password: "Sh223PgzyJb3IDYz",
    host: "aws-0-ap-southeast-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  })

  try {
    await localClient.connect()
    console.log("Connected to Local DB.")

    await supabaseClient.connect()
    console.log("Connected to Supabase DB.")

    console.log("Creating tables on Supabase...")
    await supabaseClient.query(`
      CREATE TABLE IF NOT EXISTS examinations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS programs (
        id SERIAL PRIMARY KEY,
        exam_id INT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS majors (
        id SERIAL PRIMARY KEY,
        program_id INT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS batches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        exam_id INT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
        target_year INT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS schools (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        address TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS academic_courses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
        first_name VARCHAR(100),
        middle_name VARCHAR(100),
        last_name VARCHAR(100),
        suffix VARCHAR(50),
        birthday TIMESTAMPTZ,
        gender VARCHAR(20),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        province VARCHAR(100),
        zip_code VARCHAR(20),
        school VARCHAR(255),
        course VARCHAR(255),
        year_graduated VARCHAR(50),
        highest_education VARCHAR(50),
        avatar VARCHAR(255),
        avatar_url VARCHAR(255),
        batch_id INT REFERENCES batches(id) ON DELETE SET NULL,
        exam_id INT REFERENCES examinations(id) ON DELETE SET NULL,
        program_id INT REFERENCES programs(id) ON DELETE SET NULL,
        major_id INT REFERENCES majors(id) ON DELETE SET NULL,
        school_id INT REFERENCES schools(id) ON DELETE SET NULL,
        academic_course_id INT REFERENCES academic_courses(id) ON DELETE SET NULL,
        job_role_description TEXT,
        lept_major_id INT,
        examinee_status VARCHAR(50),
        diagnostic_score INT,
        personal_target_score INT,
        font_preference VARCHAR(50) DEFAULT 'geist',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMPTZ,
        login_count INT DEFAULT 0,
        targets JSONB DEFAULT '[]'::jsonb
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        subject_code VARCHAR(50) NOT NULL,
        icon VARCHAR(50) DEFAULT 'book',
        category_id INT,
        major_id INT REFERENCES majors(id) ON DELETE CASCADE,
        image_url VARCHAR(500),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_published BOOLEAN DEFAULT true,
        category VARCHAR(100) DEFAULT 'general',
        course VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS subject_modules (
        id SERIAL PRIMARY KEY,
        subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        order_index INT DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS subject_contents (
        id SERIAL PRIMARY KEY,
        module_id INT REFERENCES subject_modules(id) ON DELETE CASCADE,
        subject_code VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        lesson_type VARCHAR(50) DEFAULT 'module',
        contentbuilder_id VARCHAR(100),
        pdf_files JSONB DEFAULT '[]',
        quiz_content TEXT,
        order_index INT DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS student_subjects (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(student_id, subject_id)
      );

      CREATE TABLE IF NOT EXISTS mock_exams (
        id SERIAL PRIMARY KEY,
        exam_code VARCHAR(50) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        questions JSONB NOT NULL DEFAULT '[]',
        targets JSONB NOT NULL DEFAULT '[]',
        unlock_date TIMESTAMPTZ,
        status VARCHAR(20) NOT NULL DEFAULT 'locked' CHECK (status IN ('active', 'locked')),
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS mock_exam_targets (
        id SERIAL PRIMARY KEY,
        mock_exam_id INT NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
        batch_id INT REFERENCES batches(id) ON DELETE CASCADE,
        program_id INT REFERENCES programs(id) ON DELETE CASCADE,
        major_id INT REFERENCES majors(id) ON DELETE CASCADE,
        UNIQUE (mock_exam_id, batch_id, program_id, major_id)
      );

      CREATE TABLE IF NOT EXISTS mock_exam_scores (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mock_exam_id INT NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
        score INT NOT NULL DEFAULT 0,
        max_score INT NOT NULL DEFAULT 0,
        student_answers JSONB DEFAULT '{}'::jsonb,
        attempts_count INT DEFAULT 1,
        completed_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(student_id, mock_exam_id)
      );

      CREATE TABLE IF NOT EXISTS gradebooks (
        id SERIAL PRIMARY KEY,
        batch_id INT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
        exam_id INT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS gradebook_subjects (
        id SERIAL PRIMARY KEY,
        gradebook_id INT NOT NULL REFERENCES gradebooks(id) ON DELETE CASCADE,
        subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        name VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(gradebook_id, subject_id)
      );

      CREATE TABLE IF NOT EXISTS grades (
        id SERIAL PRIMARY KEY,
        gradebook_subject_id INT NOT NULL REFERENCES gradebook_subjects(id) ON DELETE CASCADE,
        student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pre_test NUMERIC(5,2),
        post_test NUMERIC(5,2),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(gradebook_subject_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        teacher_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        assignment_id INT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
        grade VARCHAR(10),
        feedback TEXT,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reviewed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS carousel_slides (
        id SERIAL PRIMARY KEY,
        src TEXT NOT NULL,
        alt VARCHAR(255),
        badge VARCHAR(255) DEFAULT 'New Course Available',
        title VARCHAR(255) DEFAULT 'Advancing Through Neural Networks',
        description TEXT DEFAULT 'Explore the foundations of modern AI with our comprehensive advanced study module.',
        slide_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS student_activities (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        details TEXT,
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS student_calendar_notes (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_date DATE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        time VARCHAR(50),
        tag VARCHAR(50),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS student_quiz_submissions (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content_id INT NOT NULL REFERENCES subject_contents(id) ON DELETE CASCADE,
        earned_points INT NOT NULL DEFAULT 0,
        total_points INT NOT NULL DEFAULT 0,
        time_taken_seconds INT NOT NULL DEFAULT 0,
        answers JSONB NOT NULL DEFAULT '[]',
        attempts_count INT NOT NULL DEFAULT 1,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(student_id, content_id)
      );

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

      CREATE TABLE IF NOT EXISTS pre_registrations (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        last_name VARCHAR(100) NOT NULL,
        suffix VARCHAR(20),
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        birthday DATE,
        gender VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        province VARCHAR(100),
        zip_code VARCHAR(20),
        school VARCHAR(255),
        school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
        course VARCHAR(255),
        academic_course_id INTEGER REFERENCES academic_courses(id) ON DELETE SET NULL,
        year_graduated VARCHAR(20),
        highest_education VARCHAR(100),
        exam_id INTEGER REFERENCES examinations(id) ON DELETE SET NULL,
        program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
        major_id INTEGER REFERENCES majors(id) ON DELETE SET NULL,
        batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      );
    `)
    console.log("All tables successfully created in Supabase.")

    // List of tables to sync in foreign-key safe order
    const tables = [
      "examinations",
      "programs",
      "majors",
      "batches",
      "schools",
      "academic_courses",
      "users",
      "subjects",
      "subject_modules",
      "subject_contents",
      "student_subjects",
      "mock_exams",
      "mock_exam_targets",
      "mock_exam_scores",
      "gradebooks",
      "gradebook_subjects",
      "grades",
      "assignments",
      "submissions",
      "carousel_slides",
      "student_activities",
      "student_calendar_notes",
      "student_quiz_submissions",
      "notifications",
      "pre_registrations"
    ]

    for (const table of tables) {
      console.log(`Syncing data for table: ${table}...`)
      const { rows } = await localClient.query(`SELECT * FROM "${table}"`)
      if (rows.length === 0) continue

      const cols = Object.keys(rows[0])
      const colNames = cols.map(c => `"${c}"`).join(", ")
      
      for (const row of rows) {
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ")
        const values = cols.map(c => {
          const val = row[c]
          if (val && typeof val === 'object' && !(val instanceof Date)) {
            return JSON.stringify(val)
          }
          return val
        })

        const query = `
          INSERT INTO "${table}" (${colNames})
          VALUES (${placeholders})
          ON CONFLICT (id) DO UPDATE SET
          ${cols.filter(c => c !== "id").map(c => `"${c}" = EXCLUDED."${c}"`).join(", ")}
        `
        await supabaseClient.query(query, values)
      }

      // Update sequence
      await supabaseClient.query(`
        SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), true);
      `).catch(() => {})
      console.log(`Successfully synced ${rows.length} rows for ${table}.`)
    }

    console.log("\nALL DATABASE TABLES & DATA SUCCESSFULLY MIGRATED TO SUPABASE!")
  } catch (err) {
    console.error("Migration Error:", err)
  } finally {
    await localClient.end()
    await supabaseClient.end()
  }
}

migrateData()
