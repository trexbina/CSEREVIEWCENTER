import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkUsersFirstPart() {
  try {
    const res = await pool.query(`
      SELECT id, name, email, role, school, school_id, course, academic_course_id, avatar, avatar_url, batch_id, exam_id, program_id, major_id, targets
      FROM users
      ORDER BY id
      LIMIT 20;
    `);
    for (const u of res.rows) {
      console.log(`[User ${u.id}] ${u.name} (${u.email}) [${u.role}]:`);
      console.log(`  school: "${u.school}", school_id: ${u.school_id}`);
      console.log(`  course: "${u.course}", academic_course_id: ${u.academic_course_id}`);
      console.log(`  avatar: "${u.avatar?.slice(0, 30)}", avatar_url: "${u.avatar_url?.slice(0, 30)}"`);
      console.log(`  exam_id: ${u.exam_id}, program_id: ${u.program_id}, major_id: ${u.major_id}, batch_id: ${u.batch_id}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkUsersFirstPart();
