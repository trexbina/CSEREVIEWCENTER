import fs from 'fs';
import pg from 'pg';

const rawSql = fs.readFileSync('setup.sql', 'utf8');
const setupSql = rawSql.replace(/CREATE DATABASE reviewapp;/g, '').replace(/\\c reviewapp;/g, '');
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/reviewapp' });

async function run() {
  try {
    await pool.query(setupSql);
    console.log('setup.sql executed successfully');
  } catch (err) {
    console.error('Error executing setup.sql:', err);
  } finally {
    await pool.end();
  }
}

run();
