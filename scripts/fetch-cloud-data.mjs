import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Cloud Prisma Postgres connection URL
const cloudUrl = process.env.CLOUD_DATABASE_URL ||
  'postgres://d1f728379b70c227e9665d0157a02039f9cdea920d3e48202a4ea36d40482e01:sk_dFxUy0xqZtKe-9RilpDcr@db.prisma.io:5432/postgres?sslmode=require';

const outputFile = path.resolve(process.cwd(), 'vercel_prisma_postgres_data.sql');

console.log('📡 Fetching SQL data from Vercel Prisma Postgres storage (READ-ONLY, NO SYNC)...');

// Find pg_dump executable
let pgDumpCmd = 'pg_dump';
const commonWindowsPaths = [
  'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe',
  'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe',
  'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
  'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe'
];

for (const p of commonWindowsPaths) {
  if (fs.existsSync(p)) {
    pgDumpCmd = `"${p}"`;
    break;
  }
}

try {
  const cmd = `${pgDumpCmd} --data-only --inserts --column-inserts --no-owner --no-privileges "${cloudUrl}" --file="${outputFile}"`;
  execSync(cmd, { stdio: 'inherit' });
  const stats = fs.statSync(outputFile);
  console.log(`\n✅ Successfully fetched SQL data to: ${outputFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log('ℹ️  No changes were made to the local database or cloud database.');
} catch (err) {
  console.error('❌ Failed to fetch SQL data with pg_dump:', err.message);
  process.exit(1);
}
