import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/reviewapp' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Drop the old gradebooks table (JSONB-based, non-relational)
    await client.query(`DROP TABLE IF EXISTS gradebooks CASCADE;`);

    // ═══════════════════════════════════════════════════════════
    // 1. GRADEBOOKS — one per batch. Auto-created or manual.
    //    Each gradebook belongs to one batch (and therefore one exam).
    // ═══════════════════════════════════════════════════════════
    await client.query(`
      CREATE TABLE IF NOT EXISTS gradebooks (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        code        VARCHAR(100) NOT NULL UNIQUE,
        batch_id    INT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
        exam_id     INT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
        status      VARCHAR(50) DEFAULT 'ACTIVE',
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════
    // 2. MOCK_EXAM_SCORES — individual student scores per mock exam.
    //    Auto-populated when a student completes a mock exam.
    //    One row per (student, mock_exam) combination.
    // ═══════════════════════════════════════════════════════════
    await client.query(`
      CREATE TABLE IF NOT EXISTS mock_exam_scores (
        id            SERIAL PRIMARY KEY,
        student_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mock_exam_id  INT NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
        score         INT NOT NULL DEFAULT 0,
        max_score     INT NOT NULL DEFAULT 0,
        completed_at  TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(student_id, mock_exam_id)
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_mock_exam_scores_student ON mock_exam_scores (student_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_mock_exam_scores_exam ON mock_exam_scores (mock_exam_id);`);

    // ═══════════════════════════════════════════════════════════
    // 3. SEED — create one gradebook per existing batch, with
    //    demo students and mock exam scores for realistic display.
    // ═══════════════════════════════════════════════════════════

    // Get batches
    const batchesRes = await client.query("SELECT id, name, exam_id, target_year FROM batches ORDER BY id");
    const examsRes = await client.query("SELECT id, name FROM examinations ORDER BY id");

    // Create one gradebook per batch
    for (const batch of batchesRes.rows) {
      const exam = examsRes.rows.find(e => e.id === batch.exam_id);
      const examName = exam ? exam.name : 'EXAM';
      const code = `${examName}-${batch.target_year}-B${batch.id}`;

      await client.query(`
        INSERT INTO gradebooks (name, code, batch_id, exam_id, status)
        VALUES ($1, $2, $3, $4, 'ACTIVE')
        ON CONFLICT (code) DO NOTHING
      `, [
        `${examName} - ${batch.name}`,
        code,
        batch.id,
        batch.exam_id
      ]);
    }

    // Create demo student users assigned to the first batch if none exist
    const studentsRes = await client.query("SELECT id FROM users WHERE role = 'student' AND batch_id IS NOT NULL LIMIT 1");

    if (studentsRes.rows.length === 0) {
      // Get the first batch
      const firstBatch = batchesRes.rows[0];
      if (firstBatch) {
        const demoStudents = [
          { name: 'Maria Clara Santos', email: 'maria@demo.com' },
          { name: 'Juan dela Cruz', email: 'juan@demo.com' },
          { name: 'Jose Rizal Macaraig', email: 'jose@demo.com' },
          { name: 'Gabriela Silang', email: 'gabriela@demo.com' },
          { name: 'Andres Bonifacio', email: 'andres@demo.com' },
          { name: 'Emilio Aguinaldo', email: 'emilio@demo.com' },
          { name: 'Melchora Aquino', email: 'melchora@demo.com' },
        ];

        // Get schools for assigning
        const schoolsRes = await client.query("SELECT id, name FROM schools ORDER BY id LIMIT 3");
        const schoolIds = schoolsRes.rows.map(s => s.id);

        for (let i = 0; i < demoStudents.length; i++) {
          const student = demoStudents[i];
          const schoolId = schoolIds.length > 0 ? schoolIds[i % schoolIds.length] : null;

          // Use bcrypt placeholder hash for "password123"
          await client.query(`
            INSERT INTO users (name, email, password, role, batch_id, exam_id, school_id)
            VALUES ($1, $2, '$2a$10$rQEY0tJx5E6j5J0Z1z5Q5eWzFq5Q5eWzFq5Q5eWzFq5Q5eW', 'student', $3, $4, $5)
            ON CONFLICT (email) DO UPDATE SET batch_id = $3, exam_id = $4, school_id = $5
          `, [student.name, student.email, firstBatch.id, firstBatch.exam_id, schoolId]);
        }

        console.log("Seeded demo students assigned to batch:", firstBatch.name);
      }
    }

    // Seed mock exam scores: for each student in a batch, 
    // create scores for mock exams that target that batch
    const allStudents = await client.query(`
      SELECT u.id, u.name, u.batch_id 
      FROM users u 
      WHERE u.role = 'student' AND u.batch_id IS NOT NULL
    `);

    const allMockExams = await client.query("SELECT id, exam_code, title, questions, targets FROM mock_exams");

    for (const student of allStudents.rows) {
      for (const mockExam of allMockExams.rows) {
        // Check if this mock exam targets the student's batch
        const targets = typeof mockExam.targets === 'string' ? JSON.parse(mockExam.targets) : (mockExam.targets || []);
        const questions = typeof mockExam.questions === 'string' ? JSON.parse(mockExam.questions) : (mockExam.questions || {});
        const questionCount = questions.questions ? questions.questions.length : 0;

        if (questionCount === 0) continue;

        // Simple target match: check if any target references the student's batch
        const batchMatch = targets.some(t => t.batch_id === student.batch_id || t.batchId === student.batch_id);

        if (batchMatch || targets.length === 0) {
          // Generate a realistic score
          const maxScore = questionCount;
          const score = Math.floor(maxScore * (0.4 + Math.random() * 0.55));

          await client.query(`
            INSERT INTO mock_exam_scores (student_id, mock_exam_id, score, max_score)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (student_id, mock_exam_id) DO UPDATE SET score = $3, max_score = $4
          `, [student.id, mockExam.id, score, maxScore]);
        }
      }
    }

    await client.query('COMMIT');
    console.log("✅ Gradebook redesign migration completed successfully.");
    console.log("   - gradebooks table (relational, linked to batch_id + exam_id)");
    console.log("   - mock_exam_scores table (auto-populated per student per mock exam)");
    console.log("   - Demo students seeded with batch assignments");
    console.log("   - Mock exam scores seeded for demo data");
  } catch(e) {
    await client.query('ROLLBACK');
    console.error("❌ Migration failed:", e);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}
run();
