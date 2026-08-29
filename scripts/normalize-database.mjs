import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:yosra@localhost:5432/reviewapp';
const pool = new pg.Pool({ connectionString });

async function normalizeDatabase() {
  const client = await pool.connect();
  try {
    console.log("🚀 Starting database normalization migration...\n");

    await client.query("BEGIN;");

    // ── 1. USERS DATA CLEANUP & NORMALIZATION ────────────────────────────
    console.log("1️⃣ Cleaning and normalizing users table...");

    // Convert literal string anomalies to clean values or NULL
    await client.query(`
      UPDATE users
      SET 
        school = NULL WHERE school IN ('null', 'undefined', '');
    `);
    await client.query(`
      UPDATE users
      SET 
        course = NULL WHERE course IN ('null', 'undefined', '');
    `);
    await client.query(`
      UPDATE users
      SET 
        avatar = NULL WHERE avatar IN ('null', 'undefined', '');
    `);
    await client.query(`
      UPDATE users
      SET 
        avatar_url = NULL WHERE avatar_url IN ('null', 'undefined', '');
    `);

    // Synchronize denormalized text with master tables
    await client.query(`
      UPDATE users u
      SET school = s.name
      FROM schools s
      WHERE u.school_id = s.id AND (u.school IS NULL OR u.school != s.name);
    `);

    await client.query(`
      UPDATE users u
      SET course = ac.name
      FROM academic_courses ac
      WHERE u.academic_course_id = ac.id AND (u.course IS NULL OR u.course != ac.name);
    `);

    // ── 2. SUBJECTS NORMALIZATION & CATEGORY RELATION ───────────────────
    console.log("2️⃣ Normalizing subjects table and adding direct category relation...");

    // Add category_id column if it does not exist
    await client.query(`
      ALTER TABLE subjects 
      ADD COLUMN IF NOT EXISTS category_id INT REFERENCES categories(id) ON DELETE CASCADE;
    `);

    // Populate category_id from subcategories (when subcategory_id exists)
    await client.query(`
      UPDATE subjects s
      SET category_id = sub.category_id
      FROM subcategories sub
      WHERE s.subcategory_id = sub.id AND (s.category_id IS NULL OR s.category_id != sub.category_id);
    `);

    // Populate category_id from categories matching category title (for direct categories without subcategories)
    await client.query(`
      UPDATE subjects s
      SET category_id = c.id
      FROM categories c
      WHERE s.category_id IS NULL AND UPPER(TRIM(s.category)) = UPPER(TRIM(c.name));
    `);

    // Synchronize category string to match actual category name
    await client.query(`
      UPDATE subjects s
      SET category = c.name
      FROM categories c
      WHERE s.category_id = c.id AND (s.category IS NULL OR s.category != c.name);
    `);

    // ── 3. CLEAN ORPHAN TEST DATA ────────────────────────────────────────
    console.log("3️⃣ Cleaning orphaned test records (modules without subject)...");

    // Delete subject_contents associated with orphan modules (where subject_id is null)
    await client.query(`
      DELETE FROM subject_contents 
      WHERE module_id IN (SELECT id FROM subject_modules WHERE subject_id IS NULL);
    `);

    // Delete orphan modules
    await client.query(`
      DELETE FROM subject_modules 
      WHERE subject_id IS NULL;
    `);

    // ── 4. CREATE MISSING PERFORMANCE & FK INDEXES ───────────────────────
    console.log("4️⃣ Adding foreign key & performance indexes...");

    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);",
      "CREATE INDEX IF NOT EXISTS idx_users_academic_course_id ON users(academic_course_id);",
      "CREATE INDEX IF NOT EXISTS idx_users_exam_id ON users(exam_id);",
      "CREATE INDEX IF NOT EXISTS idx_users_program_id ON users(program_id);",
      "CREATE INDEX IF NOT EXISTS idx_users_major_id ON users(major_id);",
      "CREATE INDEX IF NOT EXISTS idx_users_batch_id ON users(batch_id);",
      "CREATE INDEX IF NOT EXISTS idx_subjects_subcategory_id ON subjects(subcategory_id);",
      "CREATE INDEX IF NOT EXISTS idx_subjects_category_id ON subjects(category_id);",
      "CREATE INDEX IF NOT EXISTS idx_gradebooks_batch_id ON gradebooks(batch_id);",
      "CREATE INDEX IF NOT EXISTS idx_gradebooks_exam_id ON gradebooks(exam_id);",
      "CREATE INDEX IF NOT EXISTS idx_student_quiz_submissions_content ON student_quiz_submissions(content_id);",
      "CREATE INDEX IF NOT EXISTS idx_student_quiz_submissions_student ON student_quiz_submissions(student_id);",
      "CREATE INDEX IF NOT EXISTS idx_student_activities_student ON student_activities(student_id);",
      "CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_id);"
    ];

    for (const sql of indexes) {
      await client.query(sql);
    }

    // ── 5. SYNCHRONIZE ALL TABLE SEQUENCES ──────────────────────────────
    console.log("5️⃣ Synchronizing all table primary key sequences...");

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    for (const row of tablesRes.rows) {
      const tbl = row.table_name;
      try {
        await client.query(`
          SELECT setval(
            pg_get_serial_sequence('"${tbl}"', 'id'), 
            COALESCE((SELECT MAX(id) FROM "${tbl}"), 1), 
            true
          );
        `);
      } catch {
        // Table might not have standard serial id column; ignore safely
      }
    }

    await client.query("COMMIT;");
    console.log("\n✅ Database normalization successfully committed!");

  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("\n❌ Database normalization failed. Rolled back.", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

normalizeDatabase();
