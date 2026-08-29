import pg from 'pg'
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/reviewapp' })

async function seed() {
  console.log('Seeding sample student notifications...')

  await pool.query(`
    INSERT INTO notifications (student_id, type, title, message, link, is_read, created_at)
    VALUES 
    (NULL, 'quiz', 'New Practice Quiz Published', 'New Practice Quiz added: "Professional Education Mock Quiz 1" in General Education', '/student/subjects', FALSE, NOW() - INTERVAL '2 hours'),
    (NULL, 'mock_exam', 'New Mock Exam Posted', 'New Mock Exam available: "Comprehensive LEPT Pre-Board Exam 2026". Test your knowledge now!', '/student/mock-exams', FALSE, NOW() - INTERVAL '5 hours'),
    (NULL, 'study_module', 'New Study Material Published', 'New lesson module added: "Module 4 - Assessment & Evaluation Strategies"', '/student/subjects', TRUE, NOW() - INTERVAL '1 day')
  `)

  console.log('Successfully seeded sample notifications!')
  await pool.end()
}

seed().catch(console.error)
