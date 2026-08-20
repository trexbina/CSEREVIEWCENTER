import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/reviewapp',
});

async function generateSetupSql() {
  try {
    console.log('Connecting to PostgreSQL database...');
    
    // Get list of all public user tables
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('Found tables:', tables);

    // Preferred seed table order to satisfy foreign key dependencies
    const preferredOrder = [
      'examinations',
      'programs',
      'majors',
      'batches',
      'schools',
      'academic_courses',
      'categories',
      'subcategories',
      'subjects',
      'subject_content',
      'users',
      'student_subjects',
      'assignments',
      'submissions',
      'mock_exams',
      'mock_exam_targets',
      'gradebooks',
      'mock_exam_scores'
    ];

    const orderedTables = preferredOrder.filter(t => tables.includes(t));
    for (const t of tables) {
      if (!orderedTables.includes(t)) {
        orderedTables.push(t);
      }
    }

    let seedSql = `\n-- ═══════════════════════════════════════════════════════════\n`;
    seedSql += `-- 8. FULL DATABASE SEED DATA (Generated from active DB)\n`;
    seedSql += `-- ═══════════════════════════════════════════════════════════\n`;

    for (const table of orderedTables) {
      const rowsRes = await pool.query(`SELECT * FROM "${table}"`);
      const rows = rowsRes.rows;

      if (rows.length === 0) continue;

      seedSql += `\n-- Seed table: ${table}\n`;

      const columns = Object.keys(rows[0]);
      const colNamesStr = columns.map(c => `"${c}"`).join(', ');

      for (const row of rows) {
        const valuesStr = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (typeof val === 'number') return val;
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          // string replacement for SQL escaping
          const escapedStr = String(val).replace(/'/g, "''");
          return `'${escapedStr}'`;
        }).join(', ');

        // Using ON CONFLICT DO NOTHING where applicable
        if (columns.includes('id')) {
          seedSql += `INSERT INTO "${table}" (${colNamesStr}) VALUES (${valuesStr}) ON CONFLICT (id) DO NOTHING;\n`;
        } else if (columns.includes('code')) {
          seedSql += `INSERT INTO "${table}" (${colNamesStr}) VALUES (${valuesStr}) ON CONFLICT (code) DO NOTHING;\n`;
        } else if (columns.includes('name')) {
          seedSql += `INSERT INTO "${table}" (${colNamesStr}) VALUES (${valuesStr}) ON CONFLICT (name) DO NOTHING;\n`;
        } else {
          seedSql += `INSERT INTO "${table}" (${colNamesStr}) VALUES (${valuesStr}) ON CONFLICT DO NOTHING;\n`;
        }
      }

      // Reset sequences if id column exists
      if (columns.includes('id')) {
        seedSql += `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), true);\n`;
      }
    }

    console.log('Seed SQL generated successfully.');

    // Now read current setup.sql schema part (sections 1-7) and append seedSql
    const setupSqlPath = path.resolve('setup.sql');
    let currentSetupSql = fs.readFileSync(setupSqlPath, 'utf8');

    // Strip existing section 8 if present
    const seedIndex = currentSetupSql.indexOf('-- 8. INITIAL SEED DATA');
    if (seedIndex !== -1) {
      currentSetupSql = currentSetupSql.substring(0, seedIndex).trimEnd();
    }
    const seedIndexFull = currentSetupSql.indexOf('-- 8. FULL DATABASE SEED DATA');
    if (seedIndexFull !== -1) {
      currentSetupSql = currentSetupSql.substring(0, seedIndexFull).trimEnd();
    }

    const updatedSetupSql = currentSetupSql + '\n\n' + seedSql.trim() + '\n';
    fs.writeFileSync(setupSqlPath, updatedSetupSql, 'utf8');
    console.log(`Updated ${setupSqlPath} with complete DB schema and live seed data.`);

  } catch (error) {
    console.error('Error generating setup SQL:', error);
  } finally {
    await pool.end();
  }
}

generateSetupSql();
