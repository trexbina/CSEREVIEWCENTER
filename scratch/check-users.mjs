import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkUsers() {
  try {
    const res = await pool.query(`
      SELECT id, name, email, school, school_id, course, academic_course_id, avatar, avatar_url, batch_id, exam_id, program_id, major_id, targets
      FROM users
      ORDER BY id;
    `);
    
    console.log("=== USERS COUNT:", res.rows.length);
    for (const u of res.rows) {
      console.log(`[User ${u.id}] ${u.name} (${u.email}):`);
      console.log(`  school: "${u.school}", school_id: ${u.school_id}`);
      console.log(`  course: "${u.course}", academic_course_id: ${u.academic_course_id}`);
      console.log(`  avatar: "${u.avatar?.slice(0, 30)}", avatar_url: "${u.avatar_url?.slice(0, 30)}"`);
      console.log(`  exam_id: ${u.exam_id}, program_id: ${u.program_id}, major_id: ${u.major_id}, batch_id: ${u.batch_id}`);
      console.log(`  targets:`, u.targets);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkUsers();
