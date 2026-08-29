import pg from 'pg';

async function checkSubjectFks() {
  const pool = new pg.Pool({ connectionString: 'postgresql://postgres:yosra@localhost:5432/reviewapp' });
  
  // Find all foreign key constraints referencing table subjects
  const fkQuery = `
    SELECT
      tc.table_schema, 
      tc.constraint_name, 
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE ccu.table_name = 'subjects' OR ccu.table_name = 'subject_modules' OR ccu.table_name = 'subject_contents';
  `;

  const fks = await pool.query(fkQuery);
  console.log('--- Foreign Keys referencing subjects / modules / contents ---');
  console.table(fks.rows);

  // Try testing deleting subject 10 in a transaction to see exact error
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Attempting dry-run DELETE FROM subjects WHERE id = 10...');
    await client.query('DELETE FROM subjects WHERE id = 10');
    console.log('Dry run deletion SUCCESSFUL (rolling back now)!');
    await client.query('ROLLBACK');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Dry run deletion FAILED with error:', err.message);
    console.error('Error detail:', err.detail);
    console.error('Error constraint:', err.constraint);
    console.error('Error table:', err.table);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSubjectFks().catch(console.error);
