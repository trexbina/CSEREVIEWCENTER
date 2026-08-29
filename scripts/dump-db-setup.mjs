import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:yosra@localhost:5432/reviewapp',
});

async function generateCompleteSetupSql() {
  try {
    console.log('Connecting to PostgreSQL database for complete dump...');

    const ddl = `-- ═══════════════════════════════════════════════════════════
-- ReviewApp — PostgreSQL Database Setup (Normalized)
-- ═══════════════════════════════════════════════════════════
-- Run this file against your PostgreSQL server:
--   psql -U postgres -f setup.sql
-- Or paste sections into pgAdmin / any SQL client.
-- ═══════════════════════════════════════════════════════════

-- 1. Create the database
CREATE DATABASE reviewapp;

-- Connect to it (psql command — skip if using pgAdmin)
\\c reviewapp;

-- ═══════════════════════════════════════════════════════════
-- 2. MASTER DATA (Examinations, Programs, Majors, Batches, Schools, Academic Courses)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS examinations (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programs (
  id          SERIAL PRIMARY KEY,
  exam_id     INT          NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS majors (
  id          SERIAL PRIMARY KEY,
  program_id  INT          NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS batches (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  exam_id     INT          NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  target_year INT          NOT NULL,
  status      VARCHAR(50)  NOT NULL DEFAULT 'upcoming'
                CHECK (status IN ('active', 'upcoming', 'completed')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schools (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  address     TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_courses (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programs_exam ON programs (exam_id);
CREATE INDEX IF NOT EXISTS idx_majors_program ON majors (program_id);
CREATE INDEX IF NOT EXISTS idx_batches_exam ON batches (exam_id);

-- ═══════════════════════════════════════════════════════════
-- 3. USERS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(100)        NOT NULL,
  email               VARCHAR(255) UNIQUE NOT NULL,
  password            VARCHAR(255)        NOT NULL,      -- bcrypt hash
  role                VARCHAR(20)         NOT NULL DEFAULT 'student'
                        CHECK (role IN ('student', 'teacher', 'admin')),
  -- Personal information
  first_name          VARCHAR(100),
  middle_name         VARCHAR(100),
  last_name           VARCHAR(100),
  suffix              VARCHAR(20),
  birthday            DATE,
  gender              VARCHAR(30),
  phone               VARCHAR(30),
  address             VARCHAR(255),
  city                VARCHAR(100),
  province            VARCHAR(100),
  zip_code            VARCHAR(20),
  -- Education & Institution background
  school              VARCHAR(255),
  course              VARCHAR(255),
  year_graduated      VARCHAR(10),
  highest_education   VARCHAR(50),
  avatar              TEXT,
  avatar_url          TEXT,
  -- Relational foreign keys
  batch_id            INT REFERENCES batches(id) ON DELETE SET NULL,
  exam_id             INT REFERENCES examinations(id) ON DELETE SET NULL,
  program_id          INT REFERENCES programs(id) ON DELETE SET NULL,
  major_id            INT REFERENCES majors(id) ON DELETE SET NULL,
  school_id           INT REFERENCES schools(id) ON DELETE SET NULL,
  academic_course_id  INT REFERENCES academic_courses(id) ON DELETE SET NULL,
  job_role_description TEXT,
  lept_major_id       INT,
  examinee_status     VARCHAR(50),
  diagnostic_score    INT,
  personal_target_score INT,
  font_preference     VARCHAR(50) DEFAULT 'geist',
  created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  last_login_at       TIMESTAMPTZ,
  login_count         INT DEFAULT 0,
  targets             JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users (school_id);
CREATE INDEX IF NOT EXISTS idx_users_academic_course_id ON users (academic_course_id);
CREATE INDEX IF NOT EXISTS idx_users_exam_id ON users (exam_id);
CREATE INDEX IF NOT EXISTS idx_users_program_id ON users (program_id);
CREATE INDEX IF NOT EXISTS idx_users_major_id ON users (major_id);
CREATE INDEX IF NOT EXISTS idx_users_batch_id ON users (batch_id);

-- ═══════════════════════════════════════════════════════════
-- 4. ASSIGNMENTS & SUBMISSIONS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS assignments (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  teacher_id  INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments (teacher_id);

CREATE TABLE IF NOT EXISTS submissions (
  id            SERIAL PRIMARY KEY,
  assignment_id INT          NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content       TEXT,
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'reviewed')),
  grade         VARCHAR(10),
  feedback      TEXT,
  submitted_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_submissions_student    ON submissions (student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions (assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status     ON submissions (status);

-- ═══════════════════════════════════════════════════════════
-- 5. CATEGORIES, SUBCATEGORIES & SUBJECTS (Curriculum & Content)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS categories (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(255) NOT NULL UNIQUE,
  description       TEXT,
  has_subcategories BOOLEAN NOT NULL DEFAULT TRUE,
  target_course     VARCHAR(255) DEFAULT 'all',
  target_program    VARCHAR(255) DEFAULT 'all',
  target_major      VARCHAR(255) DEFAULT 'all',
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subcategories (
  id          SERIAL PRIMARY KEY,
  category_id INT          NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  image_url   TEXT,
  status      VARCHAR(20)  NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories (category_id);

CREATE TABLE IF NOT EXISTS subjects (
  id             SERIAL PRIMARY KEY,
  title          VARCHAR(255)  NOT NULL,
  code           VARCHAR(50)   UNIQUE NOT NULL,
  description    TEXT,
  image_url      TEXT,
  category       VARCHAR(100),
  category_id    INT REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id INT REFERENCES subcategories(id) ON DELETE CASCADE,
  status         VARCHAR(20)   NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'inactive')),
  unlock_date    TIMESTAMPTZ,
  topics         JSONB         NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects (code);
CREATE INDEX IF NOT EXISTS idx_subjects_category_id ON subjects (category_id);
CREATE INDEX IF NOT EXISTS idx_subjects_subcategory_id ON subjects (subcategory_id);

CREATE TABLE IF NOT EXISTS subject_content (
  id          SERIAL PRIMARY KEY,
  subject_id  INT          NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  type        VARCHAR(20)  NOT NULL CHECK (type IN ('text', 'image')),
  title       VARCHAR(255),
  body        TEXT,
  image_url   TEXT,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subject_content_subject ON subject_content (subject_id, sort_order);

CREATE TABLE IF NOT EXISTS subject_modules (
  id          SERIAL PRIMARY KEY,
  subject_id  INT REFERENCES subjects(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  order_index INT DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subject_contents (
  id                SERIAL PRIMARY KEY,
  module_id         INT REFERENCES subject_modules(id) ON DELETE CASCADE,
  subject_code      VARCHAR(50),
  title             VARCHAR(255) NOT NULL,
  lesson_type       VARCHAR(50) DEFAULT 'module',
  contentbuilder_id VARCHAR(100),
  pdf_files         JSONB DEFAULT '[]',
  quiz_content      TEXT,
  order_index       INT DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subject_modules_subject ON subject_modules (subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_contents_module ON subject_contents (module_id);

CREATE TABLE IF NOT EXISTS student_subjects (
  id          SERIAL PRIMARY KEY,
  student_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id  INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_student_subjects_student ON student_subjects (student_id);

-- ═══════════════════════════════════════════════════════════
-- 6. MOCK EXAMS & TARGETS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mock_exams (
  id            SERIAL PRIMARY KEY,
  exam_code     VARCHAR(50)   NOT NULL UNIQUE,
  title         VARCHAR(255)  NOT NULL,
  description   TEXT,
  questions     JSONB         NOT NULL DEFAULT '[]',
  targets       JSONB         NOT NULL DEFAULT '[]',
  unlock_date   TIMESTAMPTZ,
  status        VARCHAR(20)   NOT NULL DEFAULT 'locked'
                  CHECK (status IN ('active', 'locked')),
  created_by    INT           REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mock_exam_targets (
  id            SERIAL PRIMARY KEY,
  mock_exam_id  INT NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
  batch_id      INT REFERENCES batches(id)   ON DELETE CASCADE,
  program_id    INT REFERENCES programs(id)  ON DELETE CASCADE,
  major_id      INT REFERENCES majors(id)    ON DELETE CASCADE,
  UNIQUE (mock_exam_id, batch_id, program_id, major_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mock_exams_code ON mock_exams (exam_code);
CREATE INDEX IF NOT EXISTS idx_mock_exam_targets_exam ON mock_exam_targets (mock_exam_id);

-- ═══════════════════════════════════════════════════════════
-- 7. GRADEBOOKS & MOCK EXAM SCORES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS gradebooks (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  code        VARCHAR(100) NOT NULL UNIQUE,
  batch_id    INT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  exam_id     INT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  status      VARCHAR(50) DEFAULT 'ACTIVE',
  targets     JSONB DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gradebooks_batch_id ON gradebooks(batch_id);
CREATE INDEX IF NOT EXISTS idx_gradebooks_exam_id ON gradebooks(exam_id);

CREATE TABLE IF NOT EXISTS mock_exam_scores (
  id            SERIAL PRIMARY KEY,
  student_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mock_exam_id  INT NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
  score         INT NOT NULL DEFAULT 0,
  max_score     INT NOT NULL DEFAULT 0,
  student_answers JSONB DEFAULT '{}'::jsonb,
  completed_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, mock_exam_id)
);

CREATE INDEX IF NOT EXISTS idx_mock_exam_scores_student ON mock_exam_scores (student_id);
CREATE INDEX IF NOT EXISTS idx_mock_exam_scores_exam ON mock_exam_scores (mock_exam_id);

-- ═══════════════════════════════════════════════════════════
-- 7b. CAROUSEL SLIDES & UPLOADED FILES
-- ═══════════════════════════════════════════════════════════
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

CREATE TABLE IF NOT EXISTS uploaded_files (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    content_type TEXT,
    size BIGINT NOT NULL DEFAULT 0,
    data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 7c. STUDENT ACTIVITIES, CALENDAR NOTES, QUIZ SUBMISSIONS & NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS student_activities (
  id            SERIAL PRIMARY KEY,
  student_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  details       TEXT,
  status        VARCHAR(50) DEFAULT 'completed',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_activities_student ON student_activities(student_id);

CREATE TABLE IF NOT EXISTS student_calendar_notes (
  id          SERIAL PRIMARY KEY,
  student_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_date  DATE NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  time        VARCHAR(50),
  tag         VARCHAR(50),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_calendar_notes_student ON student_calendar_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_calendar_notes_date ON student_calendar_notes(event_date);

CREATE TABLE IF NOT EXISTS student_quiz_submissions (
  id                  SERIAL PRIMARY KEY,
  student_id          INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id          INT NOT NULL REFERENCES subject_contents(id) ON DELETE CASCADE,
  earned_points       INT NOT NULL DEFAULT 0,
  total_points        INT NOT NULL DEFAULT 0,
  time_taken_seconds  INT NOT NULL DEFAULT 0,
  answers             JSONB NOT NULL DEFAULT '[]',
  attempts_count      INT NOT NULL DEFAULT 1,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_student_quiz_submissions_student ON student_quiz_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_quiz_submissions_content ON student_quiz_submissions(content_id);

CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  student_id  INT REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  link        VARCHAR(255),
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_id);
`;

    // ── Generate live seed data ──
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const tables = tablesRes.rows.map(r => r.table_name);

    const preferredOrder = [
      'examinations',
      'programs',
      'majors',
      'batches',
      'schools',
      'academic_courses',
      'categories',
      'subcategories',
      'subjects',
      'subject_content',
      'subject_modules',
      'subject_contents',
      'users',
      'student_subjects',
      'assignments',
      'submissions',
      'mock_exams',
      'mock_exam_targets',
      'gradebooks',
      'mock_exam_scores',
      'carousel_slides',
      'uploaded_files',
      'student_activities',
      'student_calendar_notes',
      'student_quiz_submissions',
      'notifications'
    ];

    const orderedTables = preferredOrder.filter(t => tables.includes(t));
    for (const t of tables) {
      if (!orderedTables.includes(t)) {
        orderedTables.push(t);
      }
    }

    let seedSql = `\n-- ═══════════════════════════════════════════════════════════\n`;
    seedSql += `-- 8. FULL DATABASE SEED DATA (Generated from active DB)\n`;
    seedSql += `-- ═══════════════════════════════════════════════════════════\n`;

    for (const table of orderedTables) {
      const rowsRes = await pool.query(`SELECT * FROM "${table}" ORDER BY id ASC`);
      const rows = rowsRes.rows;

      if (rows.length === 0) continue;

      seedSql += `\n-- Seed table: ${table}\n`;

      const columns = Object.keys(rows[0]);
      const colNamesStr = columns.map(c => `"${c}"`).join(', ');

      for (const row of rows) {
        const valuesStr = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (typeof val === 'number') return val;
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          const escapedStr = String(val).replace(/'/g, "''");
          return `'${escapedStr}'`;
        }).join(', ');

        if (columns.includes('id')) {
          seedSql += `INSERT INTO "${table}" (${colNamesStr}) VALUES (${valuesStr}) ON CONFLICT (id) DO NOTHING;\n`;
        } else if (columns.includes('code')) {
          seedSql += `INSERT INTO "${table}" (${colNamesStr}) VALUES (${valuesStr}) ON CONFLICT (code) DO NOTHING;\n`;
        } else if (columns.includes('name')) {
          seedSql += `INSERT INTO "${table}" (${colNamesStr}) VALUES (${valuesStr}) ON CONFLICT (name) DO NOTHING;\n`;
        } else {
          seedSql += `INSERT INTO "${table}" (${colNamesStr}) VALUES (${valuesStr}) ON CONFLICT DO NOTHING;\n`;
        }
      }

      if (columns.includes('id')) {
        seedSql += `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), true);\n`;
      }
    }

    const fullSql = ddl + '\n' + seedSql.trim() + '\n';
    const setupSqlPath = path.resolve('setup.sql');
    fs.writeFileSync(setupSqlPath, fullSql, 'utf8');
    console.log(`✅ Fully normalized setup.sql written successfully to ${setupSqlPath}`);

  } catch (error) {
    console.error('Error generating complete setup SQL:', error);
  } finally {
    await pool.end();
  }
}

generateCompleteSetupSql();
