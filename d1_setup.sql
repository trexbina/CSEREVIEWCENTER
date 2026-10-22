-- ==============================================================================
-- CSE Review System — Cloudflare D1 Database Schema Setup (SQLite Dialect)
-- Target Database ID: 2f325295-c5cc-4b63-8418-bb09c14c0018
-- Execute via: npx wrangler d1 execute csereview-d1 --file=d1_setup.sql --remote
-- ==============================================================================

-- 1. CORE MASTER DATA TABLES
CREATE TABLE IF NOT EXISTS examinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER REFERENCES examinations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS majors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  target_year TEXT,
  status TEXT DEFAULT 'active',
  exam_id INTEGER REFERENCES examinations(id) ON DELETE SET NULL,
  start_date TEXT,
  end_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS academic_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS custom_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  permissions TEXT NOT NULL DEFAULT '[]',
  is_system INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. USER MANAGEMENT & AUTHENTICATION
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  login_id TEXT UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  is_active INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'active',
  phone TEXT,
  avatar_url TEXT,
  school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  academic_course_id INTEGER REFERENCES academic_courses(id) ON DELETE SET NULL,
  exam_id INTEGER REFERENCES examinations(id) ON DELETE SET NULL,
  program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
  major_id INTEGER REFERENCES majors(id) ON DELETE SET NULL,
  batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
  subscription_end_date TEXT,
  login_count INTEGER DEFAULT 0,
  last_login_at TEXT,
  targets TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_login_id ON users(login_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_batch_id ON users(batch_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

CREATE TABLE IF NOT EXISTS system_security_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  single_session_enabled INTEGER DEFAULT 1,
  audit_logging_enabled INTEGER DEFAULT 1,
  watermark_enabled INTEGER DEFAULT 1,
  watermark_text TEXT DEFAULT '{name} - {email}',
  watermark_opacity INTEGER DEFAULT 15,
  watermark_size TEXT DEFAULT '100',
  watermark_count INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS security_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_name TEXT,
  user_role TEXT,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  ip_address TEXT DEFAULT '127.0.0.1',
  status TEXT DEFAULT 'success',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_active_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  user_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student',
  device TEXT NOT NULL,
  device_type TEXT DEFAULT 'desktop',
  ip_address TEXT NOT NULL,
  location TEXT DEFAULT 'Manila, Philippines',
  login_time TEXT DEFAULT (datetime('now')),
  last_active TEXT DEFAULT (datetime('now')),
  is_current INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active'
);

-- 3. CURRICULUM, SUBJECTS & MODULES
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  has_subcategories INTEGER DEFAULT 1,
  target_course TEXT DEFAULT 'all',
  target_program TEXT DEFAULT 'all',
  target_major TEXT DEFAULT 'all',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subcategories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT,
  subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  unlock_date TEXT,
  topics TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subject_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subject_contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER REFERENCES subject_modules(id) ON DELETE CASCADE,
  subject_code TEXT,
  title TEXT NOT NULL,
  lesson_type TEXT DEFAULT 'module',
  contentbuilder_id TEXT,
  pdf_files TEXT DEFAULT '[]',
  quiz_content TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS student_subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, subject_id)
);

-- 4. MOCK EXAMS & GRADEBOOKS
CREATE TABLE IF NOT EXISTS mock_exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  targets TEXT DEFAULT '[]',
  unlock_date TEXT,
  status TEXT DEFAULT 'active',
  questions TEXT DEFAULT '{}',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mock_exam_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mock_exam_id INTEGER REFERENCES mock_exams(id) ON DELETE CASCADE,
  exam_id INTEGER REFERENCES examinations(id) ON DELETE CASCADE,
  program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
  major_id INTEGER REFERENCES majors(id) ON DELETE CASCADE,
  batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mock_exam_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mock_exam_id INTEGER NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
  score REAL DEFAULT 0,
  max_score REAL DEFAULT 0,
  student_answers TEXT DEFAULT '{}',
  attempts_count INTEGER DEFAULT 1,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS mock_exam_scores_student_mock_exam_unique
  ON mock_exam_scores (student_id, mock_exam_id);

CREATE TABLE IF NOT EXISTS gradebooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  code TEXT,
  batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
  exam_id INTEGER REFERENCES examinations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'ACTIVE',
  targets TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. STUDENT ACTIVITIES & PROGRESS
CREATE TABLE IF NOT EXISTS student_quiz_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id INTEGER NOT NULL REFERENCES subject_contents(id) ON DELETE CASCADE,
  earned_points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  answers TEXT DEFAULT '{}',
  attempts_count INTEGER DEFAULT 1,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, content_id)
);

CREATE TABLE IF NOT EXISTS student_subject_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  completed_items INTEGER NOT NULL DEFAULT 0,
  total_items INTEGER NOT NULL DEFAULT 0,
  progress_pct INTEGER NOT NULL DEFAULT 0,
  active_days INTEGER NOT NULL DEFAULT 0,
  study_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, subject_id)
);

CREATE TABLE IF NOT EXISTS student_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT,
  title TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'success',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  activity_type TEXT DEFAULT 'lecture',
  session_start TEXT NOT NULL DEFAULT (datetime('now')),
  session_end TEXT NOT NULL DEFAULT (datetime('now')),
  duration_seconds INTEGER NOT NULL DEFAULT 60,
  metadata TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_student_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_date TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  total_seconds INTEGER NOT NULL DEFAULT 0,
  lecture_seconds INTEGER NOT NULL DEFAULT 0,
  test_seconds INTEGER NOT NULL DEFAULT 0,
  quiz_attempts INTEGER NOT NULL DEFAULT 0,
  resource_hits INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS student_calendar_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_date TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time TEXT,
  tag TEXT DEFAULT 'personal',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  status TEXT DEFAULT 'pending',
  grade TEXT,
  feedback TEXT,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);

-- 6. REGISTRATIONS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS pre_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  suffix TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  birthday TEXT,
  gender TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  zip_code TEXT,
  school TEXT,
  school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  course TEXT,
  academic_course_id INTEGER REFERENCES academic_courses(id) ON DELETE SET NULL,
  year_graduated TEXT,
  highest_education TEXT,
  exam_id INTEGER REFERENCES examinations(id) ON DELETE SET NULL,
  program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
  major_id INTEGER REFERENCES majors(id) ON DELETE SET NULL,
  batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'PENDING',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  reviewed_at TEXT,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS daily_registration_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  batch_id INTEGER,
  new_registrations_count INTEGER DEFAULT 0,
  active_users_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  message TEXT,
  link TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_notification_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL,
  notification_id TEXT NOT NULL,
  is_read INTEGER DEFAULT 1,
  is_dismissed INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(admin_id, notification_id)
);

CREATE TABLE IF NOT EXISTS uploaded_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  content_type TEXT,
  size INTEGER NOT NULL DEFAULT 0,
  data BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS carousel_slides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  src TEXT NOT NULL,
  alt TEXT,
  badge TEXT DEFAULT '',
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  slide_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trash_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  original_id TEXT,
  item_name TEXT NOT NULL,
  description TEXT,
  original_location TEXT,
  payload TEXT NOT NULL,
  deleted_by INTEGER,
  deleted_by_name TEXT,
  deleted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. INITIAL DEFAULT DATA
INSERT OR IGNORE INTO custom_roles (id, role_key, name, description, permissions, is_system)
VALUES 
  (1, 'super_admin', 'Super Administrator', 'Full system access and master controls across all features', '["/admin/dashboard", "/admin/users", "/admin/pre-registrations", "/admin/subscriptions", "/admin/curriculum", "/admin/subjects", "/admin/categories", "/admin/mock-exams", "/admin/master-data", "/admin/master-data/tree", "/admin/master-data/batches", "/admin/master-data/education", "/admin/master-data/gradebook", "/admin/settings/security", "/admin/trash", "/admin/analytics", "/admin/roles"]', 1),
  (2, 'admin', 'Administrator', 'Administrative management and student oversight', '["/admin/dashboard", "/admin/users", "/admin/pre-registrations", "/admin/subscriptions", "/admin/curriculum", "/admin/subjects", "/admin/categories", "/admin/mock-exams", "/admin/master-data", "/admin/analytics"]', 1),
  (3, 'teacher', 'Instructor / Reviewer', 'Content authoring, quiz builder, and subject management', '["/teacher", "/teacher/subjects", "/teacher/modules", "/teacher/quiz-builder"]', 1),
  (4, 'student', 'Student Examinee', 'Student learning portal, lessons, mock exams, and review tools', '["/student"]', 1);

INSERT OR IGNORE INTO system_security_settings (id, single_session_enabled, audit_logging_enabled, watermark_enabled, watermark_text, watermark_opacity, watermark_size, watermark_count)
VALUES (1, 1, 1, 1, '{name} - {email}', 15, '100', 1);

-- Default Super Administrator (Password: password123)
INSERT OR IGNORE INTO users (id, name, email, login_id, password, role, is_active, status, targets)
VALUES (
  1,
  'System Administrator',
  'admin@csereview.local',
  'admin00001',
  '$2b$10$fJtH3r6w0D78WlH94c7z6OBjZ7N4VspT21bT1eSjPzXl6oN/aT8kS',
  'super_admin',
  1,
  'active',
  '[]'
);
