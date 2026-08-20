---
title: Scripts Directory Overview
tags:
  - developer
  - database
  - scripts
  - db-management
---

# 🛠️ Scripts Directory Overview

This document provides a comprehensive reference for the scripts located in the `scripts/` directory of the application. These command-line utilities allow developers to manage the database schema, seed test data, query database states, and execute code migrations without going through the web interface.

---

## ⚙️ Configuration & Execution

All scripts in this directory leverage the **PostgreSQL Connection Pool** and look for database configurations defined in the environment.

### Loading Environment Variables
The scripts automatically search for and load settings in the following order:
1. `.env.local` (Local developer configuration - overrides defaults)
2. `.env` (Default environment settings)

If no environment variables are defined, they fall back to the default development string:
`postgresql://postgres:123@localhost:5432/reviewapp`

### Running a Script
Run any script from the project root using Node.js:
```bash
node scripts/<script-name>.mjs
```

---

## 📂 Catalog of Scripts

The scripts in `scripts/` are grouped into four main operational categories:

### 1. Database Schema Migrations & Alterations
These scripts apply incremental changes to table structures:
*   **`add-avatar-column.mjs`**: Adds an optional `avatar_url TEXT` column to the `users` table to accommodate user profile images.
*   **`update-db.mjs`**, **`update-db2.mjs`**, **`update-db3.mjs`**, **`update-db4.mjs`**, **`update-db5.mjs`**: Incremental updates that set up tables like `schools` and `academic_courses`, insert default choices, and establish relationship references on the `users` table.
*   **`alter-subjects.mjs`** & **`alter-subjects-unlock.mjs`**: Specific structural modifications applied to the subjects metadata schema.

### 2. Seeding & Initialization
Used to configure a database from scratch or insert mock data:
*   **`run-setup.mjs`**: Connects to the database and runs the root `setup.sql` script to create all initial core tables.
*   **`seed.mjs`**: Populates the database with default metadata, mock examinations, questions, options, and sample content.
*   **`create-demo-user.mjs`**: Generates and hashes credentials using `bcryptjs` and inserts a complete student profile user (`maria.santos@student.edu`) mapped to schools, courses, target exams, and a demonstration profile picture (`/uploads/demo-avatar.png`).

### 3. Inspection & Diagnostics
Quick utilities to read or verify database status:
*   **`inspect-master-data.mjs`**: Connects and queries current reference IDs in the `examinations`, `batches`, `schools`, and `academic_courses` tables. Helpful for matching foreign keys before seeding.
*   **`check-admin.mjs`**: Checks the configuration and role flags of admin accounts.
*   **`test-db-query.mjs`**: Performs a quick connectivity test query (`SELECT NOW()`) to ensure credentials match.

### 4. Development Helpers
*   **`refactor.mjs`**, **`refactor2.mjs`**, **`refactor3.mjs`**: Batch tools used during file migrations.
*   **`research.mjs`**: Scratch script for testing modular code imports.

---

## 📝 Best Practices for New Scripts

When writing new scripts under `scripts/`, follow these patterns:

1. **Use ES Modules (`.mjs`)**: Always write with `import` syntax.
2. **Idempotency**: Check if columns/tables/records exist before writing or run `DELETE` operations before inserting to avoid primary key/unique constraint failures.
3. **Release Connections**: Always wrap queries in a `try...catch...finally` block and run `client.release()` and `pool.end()` in the `finally` block to prevent hanging database pools:

```javascript
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW()');
    console.log("Connection success:", res.rows[0]);
  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    client.release();
    pool.end();
  }
}
run();
```
