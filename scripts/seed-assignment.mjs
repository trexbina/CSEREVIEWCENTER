import pg from 'pg';

async function seedAssignment() {
  const pool = new pg.Pool({ connectionString: 'postgresql://postgres:yosra@localhost:5432/reviewapp' });
  
  const assignmentQuiz = {
    settings: {
      isAssignment: true,
      startDate: '2026-08-01',
      startTime: '08:00',
      endDate: '2026-09-30',
      endTime: '23:59',
      timeLimitMinutes: 30,
      maxRetries: 2,
      fontFamily: "'Open Sans', sans-serif",
      fontSize: 16
    },
    questions: [
      {
        id: '1786512579201',
        type: 'question',
        questionType: 'Multiple Choice',
        text: "Which Bloom's taxonomy level involves judging the value of material for a given purpose?",
        points: 5,
        options: [
          { id: '1', text: 'Evaluation', isCorrect: true },
          { id: '2', text: 'Knowledge', isCorrect: false },
          { id: '3', text: 'Comprehension', isCorrect: false }
        ]
      },
      {
        id: '1786512579202',
        type: 'question',
        questionType: 'True or False',
        text: 'Formative assessment is used primarily to assign final course grades.',
        points: 5,
        options: [
          { id: '1', text: 'True', isCorrect: false },
          { id: '2', text: 'False', isCorrect: true }
        ]
      }
    ]
  };

  const moduleRes = await pool.query('SELECT id FROM subject_modules WHERE title LIKE $1 LIMIT 1', ['%Study%']);
  const modId = moduleRes.rows.length > 0 ? moduleRes.rows[0].id : 48;

  await pool.query(`
    INSERT INTO subject_contents (module_id, title, lesson_type, quiz_content, order_index)
    VALUES ($1, 'Assignment 1: Foundations of Assessment', 'quiz', $2, 2)
    ON CONFLICT DO NOTHING;
  `, [modId, JSON.stringify(assignmentQuiz)]);

  console.log('Assignment seeded successfully.');
  await pool.end();
}

seedAssignment().catch(console.error);
