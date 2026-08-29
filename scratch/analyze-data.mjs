import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function analyzeData() {
  try {
    console.log("=== USERS SAMPLE ===");
    const users = await pool.query(`SELECT id, name, email, role, school, school_id, course, academic_course_id, batch_id, exam_id, program_id, major_id, targets FROM users LIMIT 10`);
    console.log(JSON.stringify(users.rows, null, 2));

    console.log("\n=== SUBJECTS SAMPLE ===");
    const subjects = await pool.query(`SELECT id, title, code, category, subcategory_id, status FROM subjects LIMIT 10`);
    console.log(JSON.stringify(subjects.rows, null, 2));

    console.log("\n=== CATEGORIES & SUBCATEGORIES ===");
    const cats = await pool.query(`SELECT * FROM categories`);
    console.log("Categories:", cats.rows);
    const subcats = await pool.query(`SELECT * FROM subcategories`);
    console.log("Subcategories:", subcats.rows);

    console.log("\n=== EXAMINATIONS, PROGRAMS, MAJORS, BATCHES ===");
    const exams = await pool.query(`SELECT * FROM examinations`);
    console.log("Exams:", exams.rows);
    const progs = await pool.query(`SELECT * FROM programs`);
    console.log("Programs:", progs.rows);
    const majors = await pool.query(`SELECT * FROM majors`);
    console.log("Majors:", majors.rows);
    const batches = await pool.query(`SELECT * FROM batches`);
    console.log("Batches:", batches.rows);

    console.log("\n=== SCHOOLS & ACADEMIC COURSES ===");
    const schools = await pool.query(`SELECT * FROM schools`);
    console.log("Schools:", schools.rows);
    const courses = await pool.query(`SELECT * FROM academic_courses`);
    console.log("Academic Courses:", courses.rows);

    console.log("\n=== SUBJECT MODULES & CONTENTS ===");
    const modules = await pool.query(`SELECT id, subject_id, title, order_index FROM subject_modules`);
    console.log("Subject Modules:", modules.rows);
    const contents = await pool.query(`SELECT id, module_id, subject_code, title, lesson_type, order_index FROM subject_contents`);
    console.log("Subject Contents:", contents.rows);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

analyzeData();
