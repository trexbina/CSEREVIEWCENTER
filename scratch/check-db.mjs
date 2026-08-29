import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkDatabase() {
  try {
    console.log("=== 1. CHECK ORPHAN RECORDS ===");
    
    // Check subject_modules without valid subject
    const orphanModules = await pool.query(`
      SELECT m.id, m.title, m.subject_id 
      FROM subject_modules m 
      LEFT JOIN subjects s ON m.subject_id = s.id 
      WHERE m.subject_id IS NOT NULL AND s.id IS NULL
    `);
    console.log("Orphan subject_modules (pointing to non-existent subject):", orphanModules.rows);

    const nullSubjectModules = await pool.query(`
      SELECT m.id, m.title, m.subject_id 
      FROM subject_modules m 
      WHERE m.subject_id IS NULL
    `);
    console.log("Null subject_id subject_modules:", nullSubjectModules.rows);

    // Check subject_contents without valid module
    const orphanContents = await pool.query(`
      SELECT c.id, c.title, c.module_id 
      FROM subject_contents c 
      LEFT JOIN subject_modules m ON c.module_id = m.id 
      WHERE c.module_id IS NOT NULL AND m.id IS NULL
    `);
    console.log("Orphan subject_contents (pointing to non-existent module):", orphanContents.rows);

    // Check users FK consistency (school_id vs school name, academic_course_id vs course name)
    const userMismatches = await pool.query(`
      SELECT u.id, u.name, u.email, u.school, u.school_id, s.name as matched_school_name,
             u.course, u.academic_course_id, ac.name as matched_course_name,
             u.exam_id, e.name as matched_exam_name,
             u.program_id, p.name as matched_program_name,
             u.major_id, m.name as matched_major_name,
             u.batch_id, b.name as matched_batch_name
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      LEFT JOIN academic_courses ac ON u.academic_course_id = ac.id
      LEFT JOIN examinations e ON u.exam_id = e.id
      LEFT JOIN programs p ON u.program_id = p.id
      LEFT JOIN majors m ON u.major_id = m.id
      LEFT JOIN batches b ON u.batch_id = b.id
    `);
    console.log(`\n=== 2. USERS RELATION INTEGRITY (${userMismatches.rows.length} users) ===`);
    let hasMismatches = false;
    for (const u of userMismatches.rows) {
      const issues = [];
      if (u.school_id && !u.matched_school_name) issues.push(`school_id ${u.school_id} not found in schools`);
      if (u.academic_course_id && !u.matched_course_name) issues.push(`academic_course_id ${u.academic_course_id} not found in academic_courses`);
      if (u.exam_id && !u.matched_exam_name) issues.push(`exam_id ${u.exam_id} not found in examinations`);
      if (u.program_id && !u.matched_program_name) issues.push(`program_id ${u.program_id} not found in programs`);
      if (u.major_id && !u.matched_major_name) issues.push(`major_id ${u.major_id} not found in majors`);
      if (u.batch_id && !u.matched_batch_name) issues.push(`batch_id ${u.batch_id} not found in batches`);
      
      if (issues.length > 0) {
        hasMismatches = true;
        console.log(`User ${u.id} (${u.name} / ${u.email}):`, issues.join(', '));
      }
    }
    if (!hasMismatches) console.log("All user foreign key references are valid!");

    // Check subjects subcategory_id consistency
    const subjectMismatches = await pool.query(`
      SELECT s.id, s.title, s.category, s.subcategory_id, sub.name as subcategory_name, cat.name as category_name
      FROM subjects s
      LEFT JOIN subcategories sub ON s.subcategory_id = sub.id
      LEFT JOIN categories cat ON sub.category_id = cat.id
    `);
    console.log("\n=== 3. SUBJECTS RELATION INTEGRITY ===");
    console.table(subjectMismatches.rows);

    // Check sequences vs max(id)
    console.log("\n=== 4. SEQUENCES CHECK ===");
    const seqs = await pool.query(`
      SELECT c.relname as seq_name, t.relname as table_name, a.attname as column_name
      FROM pg_class c
      JOIN pg_depend d ON d.objid = c.oid
      JOIN pg_class t ON d.refobjid = t.oid
      JOIN pg_attribute a ON d.refobjid = a.attrelid AND d.refobjsubid = a.attnum
      WHERE c.relkind = 'S' AND d.deptype = 'a'
      ORDER BY table_name;
    `);
    
    for (const seq of seqs.rows) {
      const currValRes = await pool.query(`SELECT last_value FROM "${seq.seq_name}"`);
      const maxValRes = await pool.query(`SELECT MAX("${seq.column_name}") as max_id FROM "${seq.table_name}"`);
      const curr = currValRes.rows[0]?.last_value;
      const max = maxValRes.rows[0]?.max_id || 0;
      const status = curr >= max ? "OK" : "⚠️ OUT OF SYNC (curr < max)";
      console.log(`Sequence ${seq.seq_name} on ${seq.table_name}.${seq.column_name}: current=${curr}, max=${max} -> ${status}`);
    }

    // Check all indexes
    console.log("\n=== 5. EXISTING INDEXES ===");
    const indexesRes = await pool.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);
    for (const idx of indexesRes.rows) {
      console.log(`${idx.tablename}: ${idx.indexname}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkDatabase();
