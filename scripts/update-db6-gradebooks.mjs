import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/reviewapp' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create gradebooks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gradebooks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) NOT NULL UNIQUE,
        targets JSONB NOT NULL DEFAULT '[]',
        mock_exams JSONB NOT NULL DEFAULT '[]',
        student_scores JSONB NOT NULL DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Check if table is empty and seed one record
    const checkRes = await client.query("SELECT COUNT(*) FROM gradebooks");
    if (parseInt(checkRes.rows[0].count) === 0) {
      // Find batches or exams to default to
      const batchesRes = await client.query("SELECT id, name, target_year, exam_id FROM batches LIMIT 2");
      const targets = [];
      const batchNames = [];
      
      for (const batch of batchesRes.rows) {
        targets.push({ batchId: batch.id, examId: batch.exam_id });
        batchNames.push(`${batch.name} / ${batch.target_year}`);
      }

      const defaultName = "LEPT EXAM";
      const defaultCode = "LEPT-2026-233";
      
      const defaultMockExams = [
        { id: "mock_101", title: "Mock 101", maxScore: 200 },
        { id: "mock_add_1", title: "ADD +", maxScore: 200 },
        { id: "mock_add_2", title: "ADD +", maxScore: 200 },
        { id: "mock_add_3", title: "ADD +", maxScore: 200 }
      ];

      // Sample student scores matching third image
      const defaultStudentScores = [
        { id: 1, name: "Maria Clara Santos", school: "Springfield", scores: { "mock_101": 100, "mock_add_1": 120, "mock_add_2": 110, "mock_add_3": 130 } },
        { id: 2, name: "Juan dela Cruz", school: "Springfield", scores: { "mock_101": 80, "mock_add_1": 90, "mock_add_2": 85, "mock_add_3": 100 } },
        { id: 3, name: "Jose Rizal Macaraig", school: "Riverdale", scores: { "mock_101": 100, "mock_add_1": 100, "mock_add_2": 100, "mock_add_3": 100 } },
        { id: 4, name: "Gabriela Silang", school: "Riverdale", scores: { "mock_101": 70, "mock_add_1": 80, "mock_add_2": 90, "mock_add_3": 80 } },
        { id: 5, name: "Andres Bonifacio", school: "Lincoln High", scores: { "mock_101": 100, "mock_add_1": 100, "mock_add_2": 100, "mock_add_3": 100 } },
        { id: 6, name: "Emilio Aguinaldo", school: "Lincoln High", scores: { "mock_101": 90, "mock_add_1": 90, "mock_add_2": 100, "mock_add_3": 90 } },
        { id: 7, name: "Melchora Aquino", school: "Springfield", scores: { "mock_101": 90, "mock_add_1": 90, "mock_add_2": 90, "mock_add_3": 90 } }
      ];

      await client.query(`
        INSERT INTO gradebooks (name, code, targets, mock_exams, student_scores, status)
        VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
      `, [
        defaultName,
        defaultCode,
        JSON.stringify(targets),
        JSON.stringify(defaultMockExams),
        JSON.stringify(defaultStudentScores)
      ]);
      console.log("Seeded default gradebook record.");
    }

    await client.query('COMMIT');
    console.log("Gradebooks table successfully created and checked.");
  } catch(e) {
    await client.query('ROLLBACK');
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}
run();
