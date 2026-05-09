-- ═══════════════════════════════════════════════════════════
-- ReviewApp — PostgreSQL Database Setup
-- ═══════════════════════════════════════════════════════════
-- Run this file against your PostgreSQL server:
--   psql -U postgres -f setup.sql
-- Or paste sections into pgAdmin / any SQL client.
-- ═══════════════════════════════════════════════════════════

-- 1. Create the database
CREATE DATABASE reviewapp;

-- Connect to it (psql command — skip if using pgAdmin)
\c reviewapp;

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100)        NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255)        NOT NULL,      -- bcrypt hash
  role        VARCHAR(20)         NOT NULL DEFAULT 'student'
                CHECK (role IN ('student', 'teacher', 'admin')),
  -- Personal information
  first_name        VARCHAR(100),
  middle_name       VARCHAR(100),
  last_name         VARCHAR(100),
  suffix            VARCHAR(20),
  birthday          DATE,
  gender            VARCHAR(30),
  phone             VARCHAR(30),
  address           VARCHAR(255),
  city              VARCHAR(100),
  province          VARCHAR(100),
  zip_code          VARCHAR(20),
  -- Education background
  school            VARCHAR(255),
  course            VARCHAR(255),
  year_graduated    VARCHAR(10),
  highest_education VARCHAR(50),
  created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- Index for fast email lookup during login
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- 3. Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  teacher_id  INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments (teacher_id);

-- 4. Submissions table (student submits to an assignment)
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

-- 5. Subjects table (curriculum)
CREATE TABLE IF NOT EXISTS subjects (
  id             SERIAL PRIMARY KEY,
  title          VARCHAR(255)  NOT NULL,
  code           VARCHAR(50)   UNIQUE NOT NULL,
  description    TEXT,
  image_url      TEXT,
  category       VARCHAR(100),
  subcategory_id INT REFERENCES subcategories(id) ON DELETE CASCADE,
  status         VARCHAR(20)   NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'inactive')),
  unlock_date    TIMESTAMPTZ,
  topics         JSONB         NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_code     ON subjects (code);
-- 5b. Categories table
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 5c. Subcategories table (belongs to a category)
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

CREATE INDEX IF NOT EXISTS idx_subcategories_category 
  ON subcategories (category_id);

-- 6. Subject Content table (content blocks for each subject)
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

CREATE INDEX IF NOT EXISTS idx_subject_content_subject
  ON subject_content (subject_id, sort_order);

-- ═══════════════════════════════════════════════════════════
-- 7.  STUDENT_SUBJECTS  (junction — which students are enrolled in which subjects)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS student_subjects (
  id          SERIAL PRIMARY KEY,
  student_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id  INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_student_subjects_student
  ON student_subjects (student_id);

-- ═══════════════════════════════════════════════════════════
-- SAMPLE DATA
-- ═══════════════════════════════════════════════════════════
-- Passwords are bcrypt hashes of "password123"
-- $2a$10$rQEY0tJx5E6j5J0Z1z5Q5eWzFq5Q5eWzFq5Q5eWzFq5Q5eW
-- In practice, the /api/auth/register endpoint hashes for you.

-- Sample users (password = "password123" for all)
-- NOTE: These hashes are placeholders. Use the /api/auth/register
-- endpoint to create real users, or generate hashes with:
--   node -e "const b=require('bcryptjs');b.hash('password123',10).then(console.log)"
INSERT INTO users (name, email, password, role) VALUES
  ('Admin User',   'admin@test.com',   '$2a$10$placeholder_hash_replace_me', 'admin'),
  ('Jane Teacher', 'teacher@test.com', '$2a$10$placeholder_hash_replace_me', 'teacher'),
  ('Alice Student','alice@test.com',   '$2a$10$placeholder_hash_replace_me', 'student'),
  ('Bob Student',  'bob@test.com',     '$2a$10$placeholder_hash_replace_me', 'student')
ON CONFLICT (email) DO NOTHING;

-- Sample assignments
INSERT INTO assignments (title, description, teacher_id) VALUES
  ('Math Quiz #5',      'Complete problems 1-20 from Chapter 5.',          2),
  ('Science Lab Report', 'Write up the results of the pendulum experiment.', 2),
  ('English Essay',      'Write a 500-word essay on "To Kill a Mockingbird".', 2);

-- Sample submissions
INSERT INTO submissions (assignment_id, student_id, content, status, grade, feedback, reviewed_at) VALUES
  (1, 3, 'My answers to the math quiz.',    'reviewed', 'A-', 'Great work on problem 15!', NOW()),
  (2, 3, 'Pendulum lab observations...',    'pending',  NULL, NULL, NULL),
  (3, 3, 'Essay about social justice...',    'reviewed', 'B+', 'Strong thesis, work on transitions.', NOW()),
  (1, 4, 'Bob''s math quiz answers.',       'pending',  NULL, NULL, NULL),
  (3, 4, 'Bob''s essay on the novel...',     'reviewed', 'A',  'Excellent analysis.', NOW());

-- ═══════════════════════════════════════════════════════════
-- 8. MASTER DATA TREES & BATCHES
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

CREATE INDEX IF NOT EXISTS idx_programs_exam ON programs (exam_id);
CREATE INDEX IF NOT EXISTS idx_majors_program ON majors (program_id);
CREATE INDEX IF NOT EXISTS idx_batches_exam ON batches (exam_id);

