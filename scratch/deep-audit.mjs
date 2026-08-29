import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function deepAudit() {
  try {
    console.log("=== 1. USERS STRING CLEANUP AUDIT ===");
    const usersWithLiteralNull = await pool.query(`
      SELECT id, name, email, school, course, avatar, avatar_url
      FROM users
      WHERE school = 'null' OR course = 'null' OR avatar = 'undefined' OR avatar_url = 'undefined'
         OR school = 'undefined' OR course = 'undefined' OR avatar = 'null' OR avatar_url = 'null';
    `);
    console.log(`Users with literal 'null' / 'undefined' strings: ${usersWithLiteralNull.rows.length}`);

    console.log("\n=== 2. USERS FOREIGN KEYS SYNC AUDIT ===");
    // Users where school_id is set vs school name
    const usersSchoolSync = await pool.query(`
      SELECT u.id, u.name, u.school, u.school_id, s.name as real_school_name
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.school_id IS NOT NULL;
    `);
    console.log(`Users with school_id: ${usersSchoolSync.rows.length}`);

    // Users where academic_course_id is set vs course name
    const usersCourseSync = await pool.query(`
      SELECT u.id, u.name, u.course, u.academic_course_id, ac.name as real_course_name
      FROM users u
      LEFT JOIN academic_courses ac ON u.academic_course_id = ac.id
      WHERE u.academic_course_id IS NOT NULL;
    `);
    console.log(`Users with academic_course_id: ${usersCourseSync.rows.length}`);

    console.log("\n=== 3. SUBJECTS TO CATEGORIES AUDIT ===");
    const subjects = await pool.query(`
      SELECT s.id, s.title, s.category, s.subcategory_id, sub.category_id as subcat_parent_cat_id, c.id as matched_cat_id, c.name as matched_cat_name
      FROM subjects s
      LEFT JOIN subcategories sub ON s.subcategory_id = sub.id
      LEFT JOIN categories c ON UPPER(TRIM(s.category)) = UPPER(TRIM(c.name))
    `);
    console.table(subjects.rows);

    console.log("\n=== 4. SUBJECT MODULES & CONTENTS AUDIT ===");
    const nullModules = await pool.query(`
      SELECT sm.id, sm.title, sm.subject_id, COUNT(sc.id) as content_count
      FROM subject_modules sm
      LEFT JOIN subject_contents sc ON sc.module_id = sm.id
      GROUP BY sm.id, sm.title, sm.subject_id;
    `);
    console.table(nullModules.rows);

    console.log("\n=== 5. MOCK EXAMS & GRADEBOOKS AUDIT ===");
    const mockExams = await pool.query(`SELECT id, exam_code, title, targets, created_by FROM mock_exams`);
    console.log("Mock exams:", mockExams.rows);
    const mockTargets = await pool.query(`SELECT * FROM mock_exam_targets`);
    console.log("Mock exam targets table rows:", mockTargets.rows);
    const gradebooks = await pool.query(`SELECT * FROM gradebooks`);
    console.log("Gradebooks:", gradebooks.rows);

    console.log("\n=== 6. NOTIFICATIONS AUDIT ===");
    const notifications = await pool.query(`SELECT id, student_id, type, title, is_read, created_at FROM notifications ORDER BY id DESC LIMIT 10`);
    console.log("Notifications:", notifications.rows);

    console.log("\n=== 7. ACTIVITIES & QUIZ SUBMISSIONS AUDIT ===");
    const act = await pool.query(`SELECT id, student_id, activity_type, title, status FROM student_activities`);
    console.log("Activities:", act.rows);
    const quizSub = await pool.query(`SELECT id, student_id, content_id, earned_points, total_points FROM student_quiz_submissions`);
    console.log("Quiz submissions:", quizSub.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

deepAudit();
