import pg from "pg";
import fs from "fs";

let envContent = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : fs.readFileSync(".env", "utf8");
let dbUrl = "";
for (const line of envContent.split("\n")) {
  if (line.startsWith("DATABASE_URL=")) {
    dbUrl = line.substring("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
    break;
  }
}

if (!dbUrl) {
  console.error("DATABASE_URL not found in .env / .env.local");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: dbUrl });

async function wipeDatabase() {
  console.log("🚀 Starting clean database wipe...");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Wipe Student Activities & Progress
    console.log("Clearing student activity and progress tables...");
    await client.query("TRUNCATE TABLE student_activities CASCADE");
    await client.query("TRUNCATE TABLE student_calendar_notes CASCADE");
    await client.query("TRUNCATE TABLE student_quiz_submissions CASCADE");
    await client.query("TRUNCATE TABLE student_subject_progress CASCADE");
    await client.query("TRUNCATE TABLE student_subjects CASCADE");
    await client.query("TRUNCATE TABLE study_sessions CASCADE");

    // 2. Wipe Mock Exams & Scores
    console.log("Clearing mock exams, scores, and gradebooks...");
    await client.query("TRUNCATE TABLE mock_exam_scores CASCADE");
    await client.query("TRUNCATE TABLE mock_exam_targets CASCADE");
    await client.query("TRUNCATE TABLE mock_exams CASCADE");
    await client.query("TRUNCATE TABLE gradebooks CASCADE");

    // 3. Wipe Assignments & Submissions
    console.log("Clearing assignments and submissions...");
    await client.query("TRUNCATE TABLE submissions CASCADE");
    await client.query("TRUNCATE TABLE assignments CASCADE");

    // 4. Wipe Pre-Registrations & Daily Stats
    console.log("Clearing pre-registrations and analytics stats...");
    await client.query("TRUNCATE TABLE pre_registrations CASCADE");
    await client.query("TRUNCATE TABLE daily_registration_stats CASCADE");
    await client.query("TRUNCATE TABLE daily_student_stats CASCADE");

    // 5. Wipe Logs, Trash, and Notifications
    console.log("Clearing audit logs, notifications, and trash...");
    await client.query("TRUNCATE TABLE security_audit_logs CASCADE");
    await client.query("TRUNCATE TABLE trash_items CASCADE");
    await client.query("TRUNCATE TABLE notifications CASCADE");

    // 6. Delete all users except the protected Super Admin (id: 1 / admin00001)
    console.log("Cleaning user accounts (preserving default Super Admin)...");
    const deleteUsersResult = await client.query(
      "DELETE FROM users WHERE id != 1 AND login_id != 'admin00001'"
    );
    console.log(`Deleted ${deleteUsersResult.rowCount} user accounts.`);

    // 7. Reset Super Admin record state
    await client.query(
      `UPDATE users 
       SET login_count = 0, 
           last_login_at = NULL,
           targets = '[]'::jsonb
       WHERE id = 1 OR login_id = 'admin00001'`
    );

    // 8. Reset users ID sequence to current max
    await client.query(`
      SELECT setval(
        pg_get_serial_sequence('users', 'id'),
        COALESCE((SELECT MAX(id) FROM users), 1)
      )
    `);

    await client.query("COMMIT");
    console.log("✅ Database wipe completed successfully! Clean and fresh state ready.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error wiping database:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

wipeDatabase().catch(() => process.exit(1));
