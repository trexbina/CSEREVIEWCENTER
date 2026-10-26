-- ==============================================================================
-- CSE Review System — Database Initialization & Schema Setup
-- Rebranded & Cleaned for Civil Service Examination (CSE) Review Platform
-- Compatible with PostgreSQL 14+, Neon, Supabase, and Cloudflare Hyperdrive
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CORE MASTER DATA TABLES
-- ==============================================================================

-- Examinations (e.g., Civil Service Professional, Sub-Professional)
CREATE TABLE IF NOT EXISTS examinations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Programs / Courses under Examinations
CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER REFERENCES examinations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Majors / Specializations under Programs
CREATE TABLE IF NOT EXISTS majors (
  id SERIAL PRIMARY KEY,
  program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Batches / Cohorts
CREATE TABLE IF NOT EXISTS batches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  target_year VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  exam_id INTEGER REFERENCES examinations(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schools & Academic Institutions
CREATE TABLE IF NOT EXISTS schools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- College / Academic Courses
CREATE TABLE IF NOT EXISTS academic_courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom Roles & Dynamic Permissions
CREATE TABLE IF NOT EXISTS custom_roles (
  id SERIAL PRIMARY KEY,
  role_key VARCHAR(60) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. USER MANAGEMENT & AUTHENTICATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active',
  phone VARCHAR(50),
  avatar_url TEXT,
  school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  academic_course_id INTEGER REFERENCES academic_courses(id) ON DELETE SET NULL,
  exam_id INTEGER REFERENCES examinations(id) ON DELETE SET NULL,
  program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
  major_id INTEGER REFERENCES majors(id) ON DELETE SET NULL,
  batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
  subscription_end_date TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  targets JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_batch_id ON users(batch_id);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);

-- Security Settings
CREATE TABLE IF NOT EXISTS system_security_settings (
  id INT PRIMARY KEY DEFAULT 1,
  single_session_enabled BOOLEAN DEFAULT TRUE,
  audit_logging_enabled BOOLEAN DEFAULT TRUE,
  watermark_enabled BOOLEAN DEFAULT TRUE,
  watermark_text VARCHAR(100) DEFAULT '{name} - {email}',
  watermark_opacity INT DEFAULT 15,
  watermark_size VARCHAR(20) DEFAULT '100',
  watermark_count INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Security Audit Logs
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  user_name VARCHAR(150),
  user_role VARCHAR(50),
  event_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  ip_address VARCHAR(45) DEFAULT '127.0.0.1',
  status VARCHAR(20) DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user ON security_audit_logs(user_id);

-- User Active Sessions
CREATE TABLE IF NOT EXISTS user_active_sessions (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER,
  user_name VARCHAR(150),
  email VARCHAR(150),
  role VARCHAR(50) DEFAULT 'student',
  device VARCHAR(150) NOT NULL,
  device_type VARCHAR(50) DEFAULT 'desktop',
  ip_address VARCHAR(50) NOT NULL,
  location VARCHAR(100) DEFAULT 'Manila, Philippines',
  login_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  is_current BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_user_active_sessions_user ON user_active_sessions(user_id);

-- ==============================================================================
-- 4. CURRICULUM, SUBJECTS & LESSONS
-- ==============================================================================

-- Categories (e.g., Numerical Ability, Verbal Ability, General Information)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  has_subcategories BOOLEAN DEFAULT TRUE,
  target_course TEXT DEFAULT 'all',
  target_program TEXT DEFAULT 'all',
  target_major TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subcategories
CREATE TABLE IF NOT EXISTS subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);

-- Subjects / Courses
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  category VARCHAR(100),
  subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  unlock_date TIMESTAMPTZ,
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_subcat ON subjects(subcategory_id);

-- Subject Modules (Units / Chapters)
CREATE TABLE IF NOT EXISTS subject_modules (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subject_modules_subject ON subject_modules(subject_id);

-- Subject Contents (Lessons, Quizzes, Reading Materials)
CREATE TABLE IF NOT EXISTS subject_contents (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES subject_modules(id) ON DELETE CASCADE,
  subject_code VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  lesson_type VARCHAR(50) DEFAULT 'module',
  contentbuilder_id VARCHAR(100),
  pdf_files JSONB DEFAULT '[]'::jsonb,
  quiz_content TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subject_contents_module ON subject_contents(module_id);
CREATE INDEX IF NOT EXISTS idx_subject_contents_type ON subject_contents(lesson_type);

-- Student Subject Enrollment
CREATE TABLE IF NOT EXISTS student_subjects (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_student_subjects_student ON student_subjects(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_subject ON student_subjects(subject_id);

-- ==============================================================================
-- 5. MOCK EXAMS & GRADEBOOKS
-- ==============================================================================

-- Mock Examinations
CREATE TABLE IF NOT EXISTS mock_exams (
  id SERIAL PRIMARY KEY,
  exam_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  targets JSONB DEFAULT '[]'::jsonb,
  unlock_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active',
  questions JSONB DEFAULT '{}'::jsonb,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mock_exams_code ON mock_exams(exam_code);

-- Mock Exam Targets (Filtering by exam, program, major, batch)
CREATE TABLE IF NOT EXISTS mock_exam_targets (
  id SERIAL PRIMARY KEY,
  mock_exam_id INTEGER REFERENCES mock_exams(id) ON DELETE CASCADE,
  exam_id INTEGER REFERENCES examinations(id) ON DELETE CASCADE,
  program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
  major_id INTEGER REFERENCES majors(id) ON DELETE CASCADE,
  batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE
);

-- Mock Exam Scores
CREATE TABLE IF NOT EXISTS mock_exam_scores (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mock_exam_id INTEGER NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
  score NUMERIC(5,2) DEFAULT 0,
  max_score NUMERIC(5,2) DEFAULT 0,
  student_answers JSONB DEFAULT '{}'::jsonb,
  attempts_count INTEGER DEFAULT 1,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS mock_exam_scores_student_mock_exam_unique
  ON mock_exam_scores (student_id, mock_exam_id);

-- Gradebooks
CREATE TABLE IF NOT EXISTS gradebooks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  code VARCHAR(50),
  batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
  exam_id INTEGER REFERENCES examinations(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  targets JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gradebooks_batch ON gradebooks(batch_id);

-- ==============================================================================
-- 6. STUDENT ACTIVITIES, PROGRESS & SUBMISSIONS
-- ==============================================================================

-- Student Quiz Submissions
CREATE TABLE IF NOT EXISTS student_quiz_submissions (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id INTEGER NOT NULL REFERENCES subject_contents(id) ON DELETE CASCADE,
  earned_points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}'::jsonb,
  attempts_count INTEGER DEFAULT 1,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_student_quiz_submission UNIQUE (student_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_sqs_student ON student_quiz_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_sqs_content ON student_quiz_submissions(content_id);

-- Student Subject Progress Rollup
CREATE TABLE IF NOT EXISTS student_subject_progress (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  completed_items INTEGER NOT NULL DEFAULT 0,
  total_items INTEGER NOT NULL DEFAULT 0,
  progress_pct INTEGER NOT NULL DEFAULT 0,
  active_days INTEGER NOT NULL DEFAULT 0,
  study_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_student_subject UNIQUE (student_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_student_subject_progress_student ON student_subject_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subject_progress_subject ON student_subject_progress(subject_id);

-- Student Activity Log
CREATE TABLE IF NOT EXISTS student_activities (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  details TEXT,
  status VARCHAR(50) DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_activities_student ON student_activities(student_id);

-- Study Heartbeat & Duration Sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) DEFAULT 'lecture',
  session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_end TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER NOT NULL DEFAULT 60,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_start ON study_sessions(user_id, session_start);
CREATE INDEX IF NOT EXISTS idx_study_sessions_subject ON study_sessions(subject_id);

-- Daily Student Aggregates
CREATE TABLE IF NOT EXISTS daily_student_stats (
  id SERIAL PRIMARY KEY,
  stat_date DATE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  total_seconds INTEGER NOT NULL DEFAULT 0,
  lecture_seconds INTEGER NOT NULL DEFAULT 0,
  test_seconds INTEGER NOT NULL DEFAULT 0,
  quiz_attempts INTEGER NOT NULL DEFAULT 0,
  resource_hits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_student_stats_unique 
  ON daily_student_stats(stat_date, user_id, COALESCE(subject_id, 0));
CREATE INDEX IF NOT EXISTS idx_daily_student_stats_date 
  ON daily_student_stats(stat_date);

-- Student Calendar Notes
CREATE TABLE IF NOT EXISTS student_calendar_notes (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  time VARCHAR(10),
  tag VARCHAR(50) DEFAULT 'personal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_calendar_notes_student ON student_calendar_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_calendar_notes_date ON student_calendar_notes(event_date);

-- Assignments & Open Submissions
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  grade VARCHAR(10),
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- ==============================================================================
-- 7. REGISTRATION, NOTIFICATIONS & STORAGE
-- ==============================================================================

-- Public Pre-Registrations
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pre_reg_status ON pre_registrations(status);
CREATE INDEX IF NOT EXISTS idx_pre_reg_email ON pre_registrations(email);

-- Daily Registration Statistics
CREATE TABLE IF NOT EXISTS daily_registration_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  exam_type VARCHAR(100) NOT NULL,
  batch_id INTEGER,
  new_registrations_count INTEGER DEFAULT 0,
  active_users_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_reg_stats_unique
  ON daily_registration_stats(date, exam_type, COALESCE(batch_id, 0));

-- System Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_id);

-- Admin Notification States
CREATE TABLE IF NOT EXISTS admin_notification_states (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  notification_id VARCHAR(150) NOT NULL,
  is_read BOOLEAN DEFAULT TRUE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(admin_id, notification_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_notif_states ON admin_notification_states(admin_id, notification_id);

-- Binary/Blob Uploaded Files Fallback
CREATE TABLE IF NOT EXISTS uploaded_files (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  content_type TEXT,
  size BIGINT NOT NULL DEFAULT 0,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Landing Page Carousel Slides
CREATE TABLE IF NOT EXISTS carousel_slides (
  id SERIAL PRIMARY KEY,
  src TEXT NOT NULL,
  alt VARCHAR(255),
  badge VARCHAR(255) DEFAULT '',
  title VARCHAR(255) DEFAULT '',
  description TEXT DEFAULT '',
  slide_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trash & Recovery Bin
CREATE TABLE IF NOT EXISTS trash_items (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  original_id VARCHAR(100),
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  original_location VARCHAR(100),
  payload JSONB NOT NULL,
  deleted_by INTEGER,
  deleted_by_name VARCHAR(255),
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trash_entity ON trash_items(entity_type);
CREATE INDEX IF NOT EXISTS idx_trash_deleted_at ON trash_items(deleted_at DESC);

-- ==============================================================================
-- 8. INITIAL SEED / DEFAULT DATA
-- ==============================================================================

-- Default System Roles
INSERT INTO custom_roles (role_key, name, description, permissions, is_system)
VALUES 
  ('super_admin', 'Super Administrator', 'Full system access and master controls across all features', '["/admin/dashboard", "/admin/users", "/admin/pre-registrations", "/admin/subscriptions", "/admin/curriculum", "/admin/subjects", "/admin/categories", "/admin/mock-exams", "/admin/master-data", "/admin/master-data/tree", "/admin/master-data/batches", "/admin/master-data/education", "/admin/master-data/gradebook", "/admin/settings/security", "/admin/trash", "/admin/analytics", "/admin/roles"]'::jsonb, true),
  ('admin', 'Administrator', 'Administrative management and student oversight', '["/admin/dashboard", "/admin/users", "/admin/pre-registrations", "/admin/subscriptions", "/admin/curriculum", "/admin/subjects", "/admin/categories", "/admin/mock-exams", "/admin/master-data", "/admin/analytics"]'::jsonb, true),
  ('teacher', 'Instructor / Reviewer', 'Content authoring, quiz builder, and subject management', '["/teacher", "/teacher/subjects", "/teacher/modules", "/teacher/quiz-builder"]'::jsonb, true),
  ('student', 'Student Examinee', 'Student learning portal, lessons, mock exams, and review tools', '["/student"]'::jsonb, true)
ON CONFLICT (role_key) DO NOTHING;

-- Default System Security Settings
INSERT INTO system_security_settings (id, single_session_enabled, audit_logging_enabled, watermark_enabled, watermark_text, watermark_opacity, watermark_size, watermark_count)
VALUES (1, true, true, true, '{name} - {email}', 15, '100', 1)
ON CONFLICT (id) DO NOTHING;

-- Default Super Administrator Account (Password: password123 for all)
INSERT INTO users (id, name, email, password, role, is_active, status, targets)
VALUES 
  (1, 'System Administrator', 'admin@csereview.local', '$2b$10$euk/FLO/KMBI3JN/ctdFNuhYQokIwFCzE0uOpjOHil7TP/KP8Ngri', 'super_admin', true, 'active', '[]'::jsonb),
  (2, 'CSE Administrator', 'staff@csereview.local', '$2b$10$euk/FLO/KMBI3JN/ctdFNuhYQokIwFCzE0uOpjOHil7TP/KP8Ngri', 'admin', true, 'active', '[]'::jsonb),
  (3, 'Lead Instructor', 'instructor@csereview.local', '$2b$10$euk/FLO/KMBI3JN/ctdFNuhYQokIwFCzE0uOpjOHil7TP/KP8Ngri', 'teacher', true, 'active', '[]'::jsonb),
  (4, 'CSE Examinee Student', 'student@csereview.local', '$2b$10$euk/FLO/KMBI3JN/ctdFNuhYQokIwFCzE0uOpjOHil7TP/KP8Ngri', 'student', true, 'active', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Reset users sequence to allow subsequent user additions safely
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
