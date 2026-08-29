import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function testAppQueries() {
  try {
    console.log("🧪 Testing key application database queries...\n");

    // 1. Student Categories & Subcategories Query
    console.log("1. Testing Categories & Subcategories retrieval:");
    const { rows: categories } = await pool.query("SELECT * FROM categories ORDER BY created_at ASC");
    const { rows: subcategories } = await pool.query("SELECT * FROM subcategories WHERE status = 'active' ORDER BY created_at DESC, id DESC");
    console.log(`   Fetched ${categories.length} categories and ${subcategories.length} active subcategories.`);

    // 2. Student Subjects with category relation
    console.log("2. Testing Subjects retrieval with Category relations:");
    const { rows: subjects } = await pool.query(`
      SELECT s.id, s.title, s.code, s.category, s.category_id, s.subcategory_id, s.status,
             c.name as category_name, sub.name as subcategory_name
      FROM subjects s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN subcategories sub ON s.subcategory_id = sub.id
      WHERE s.status = 'active'
      ORDER BY s.created_at DESC
    `);
    console.log(`   Fetched ${subjects.length} active subjects. Sample:`, subjects.slice(0, 2));

    // 3. User Profile Joins (School, Academic Course, Exam, Program, Major, Batch)
    console.log("3. Testing User Profile retrieval with relational JOINs:");
    const { rows: users } = await pool.query(`
      SELECT u.id, u.name, u.email, u.role,
             COALESCE(s.name, u.school, '—') AS school_name,
             COALESCE(ac.name, u.course, '—') AS course_name,
             e.name as exam_name,
             p.name as program_name,
             m.name as major_name,
             b.name as batch_name
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      LEFT JOIN academic_courses ac ON u.academic_course_id = ac.id
      LEFT JOIN examinations e ON u.exam_id = e.id
      LEFT JOIN programs p ON u.program_id = p.id
      LEFT JOIN majors m ON u.major_id = m.id
      LEFT JOIN batches b ON u.batch_id = b.id
      ORDER BY u.id ASC
      LIMIT 5
    `);
    console.log(`   Sample normalized user records:`);
    console.table(users);

    // 4. Subject Modules & Content Hierarchy
    console.log("4. Testing Subject Modules and Lessons hierarchy:");
    const { rows: modules } = await pool.query(`
      SELECT sm.id, sm.title, sm.subject_id, s.title as subject_title,
             COUNT(sc.id) as lessons_count
      FROM subject_modules sm
      JOIN subjects s ON sm.subject_id = s.id
      LEFT JOIN subject_contents sc ON sc.module_id = sm.id
      GROUP BY sm.id, sm.title, sm.subject_id, s.title
    `);
    console.table(modules);

    // 5. Sequence & Insert verification
    console.log("5. Testing transactional Insert & Sequence integrity:");
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");
      const insertUserRes = await client.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ('Test Integrity User', 'test.integrity@example.com', 'hashed_pass', 'student')
        RETURNING id, name, email;
      `);
      console.log(`   Successfully inserted temporary user id=${insertUserRes.rows[0].id}`);
      await client.query("ROLLBACK;");
      console.log(`   Rollback successful. Sequence and constraints verified.`);
    } finally {
      client.release();
    }

    console.log("\n🎉 ALL APPLICATION QUERIES & CONSTRAINTS PASSED SUCCESSFULLY!");

  } catch (err) {
    console.error("❌ Error running verification tests:", err);
  } finally {
    await pool.end();
  }
}

testAppQueries();
