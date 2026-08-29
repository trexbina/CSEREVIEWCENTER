import fs from 'fs';
import pg from 'pg';

const rootConnectionString = 'postgresql://postgres:123@localhost:5432/postgres';
const targetConnectionString = 'postgresql://postgres:123@localhost:5432/reviewapp';

async function main() {
  // Step 1: Connect to postgres database and create reviewapp database
  const rootClient = new pg.Client({ connectionString: rootConnectionString });
  try {
    await rootClient.connect();
    console.log('Connected to default postgres database.');
    
    // Drop database reviewapp if exists to start fresh
    console.log("Dropping database 'reviewapp' if exists...");
    try {
      await rootClient.query('DROP DATABASE IF EXISTS reviewapp WITH (FORCE)');
    } catch (e) {
      await rootClient.query('DROP DATABASE IF EXISTS reviewapp');
    }
    console.log("Creating database 'reviewapp'...");
    await rootClient.query('CREATE DATABASE reviewapp');
    console.log("Database 'reviewapp' created successfully.");
  } catch (err) {
    console.error('Error checking/creating database:', err);
    process.exit(1);
  } finally {
    await rootClient.end();
  }

  // Step 2: Connect to reviewapp database and execute setup.sql
  console.log("Reading setup.sql...");
  const rawSql = fs.readFileSync('setup.sql', 'utf8');
  // Remove CREATE DATABASE and \c lines
  const setupSql = rawSql
    .replace(/CREATE DATABASE reviewapp;/gi, '')
    .replace(/\\c reviewapp;?/gi, '');

  console.log("Connecting to 'reviewapp' database...");
  const targetClient = new pg.Client({ connectionString: targetConnectionString });
  try {
    await targetClient.connect();
    console.log("Executing setup.sql on 'reviewapp'...");
    await targetClient.query(setupSql);
    console.log("setup.sql executed successfully!");
  } catch (err) {
    console.error("Error executing setup.sql on 'reviewapp':", err);
    process.exit(1);
  } finally {
    await targetClient.end();
  }
}

main();
