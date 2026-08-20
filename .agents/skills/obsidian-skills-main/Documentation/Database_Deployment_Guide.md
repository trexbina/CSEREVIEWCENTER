---
title: Database Deployment Guide
tags:
  - setup
  - postgres
  - database
  - troubleshooting
---

# 🗄️ Database Deployment Guide

This guide describes how to deploy the **ReviewApp** database on any new device using **PostgreSQL** and **pgAdmin**.

---

## 📋 Prerequisites

- [ ] ==Node.js== (v18+) $\rightarrow$ [nodejs.org](https://nodejs.org)
- [ ] ==PostgreSQL== (v14+) $\rightarrow$ [postgresql.org](https://www.postgresql.org/download)
- [ ] ==pgAdmin 4== $\rightarrow$ Included with PostgreSQL installer on Windows
- [ ] ==Project Folder== $\rightarrow$ Access to this workspace

---

## 🚀 Step-by-Step Deployment

### Step 1: Install Dependencies
Open a terminal in the project root folder and run:
```bash
npm install
```

### Step 2: Create the Database in pgAdmin
1. Open **pgAdmin 4**.
2. In the left panel, expand `Servers` $\rightarrow$ `PostgreSQL` (enter master password if prompted).
3. Right-click **Databases** $\rightarrow$ **Create** $\rightarrow$ **Database...**
4. In the dialog, enter:
   - **Database name:** `reviewapp`
   - **Owner:** `postgres` (default)
5. Click **Save**.

### Step 3: Configure Environment Variables
Open the `.env.local` file in the project root folder and edit it to match your PostgreSQL credentials:

```ini
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/reviewapp
JWT_SECRET=change-me-to-a-random-32-char-string!!
```

> [!important]
> Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.
> 
> The default port is `5432`. If your server uses a different port, update it in the connection string. You can check the port by right-clicking your server in pgAdmin $\rightarrow$ **Properties** $\rightarrow$ **Connection** tab $\rightarrow$ **Port**.

### Step 4: Seed the Database
Run the seed script in the project terminal:
```bash
node --env-file=.env.local seed.mjs
```

This will perform the following actions:
- Create all database tables (`users`, `assignments`, `submissions`).
- Create indexes for fast lookups.
- Insert sample users with hashed passwords.
- Insert sample assignments and submissions.

> [!success] Expected Output
> ```text
> 🌱 Seeding database…
> 
> ✅ Tables created
> ✅ Users seeded  (password = password123 for all)
> ✅ Assignments seeded
> ✅ Submissions seeded
> ```

#### 🔑 Sample Login Credentials
All accounts use the password `password123`:
* **Admin:** `admin@test.com`
* **Teacher:** `teacher@test.com`
* **Student Alice:** `alice@test.com`
* **Student Bob:** `bob@test.com`

### Step 5: Verify in pgAdmin (Optional)
1. In pgAdmin, expand `reviewapp` $\rightarrow$ `Schemas` $\rightarrow$ `public` $\rightarrow$ `Tables`.
2. You should see three tables: `users`, `assignments`, and `submissions`.
3. Right-click any table $\rightarrow$ **View/Edit Data** $\rightarrow$ **All Rows** to verify the seeded records.

### Step 6: Start the Application
Run the Next.js development server:
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) and sign in.

---

## 📐 Database Schema Reference

### Table: `users`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `SERIAL PK` | Auto-increment |
| `name` | `VARCHAR(100)` | `NOT NULL` |
| `email` | `VARCHAR(255)` | `UNIQUE`, `NOT NULL` |
| `password` | `VARCHAR(255)` | bcrypt hash |
| `role` | `VARCHAR(20)` | `student` / `teacher` / `admin` |
| `created_at` | `TIMESTAMPTZ` | Default: `NOW()` |

### Table: `assignments`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `SERIAL PK` | Auto-increment |
| `title` | `VARCHAR(255)` | `NOT NULL` |
| `description` | `TEXT` | Optional |
| `teacher_id` | `INT FK → users` | `ON DELETE CASCADE` |
| `created_at` | `TIMESTAMPTZ` | Default: `NOW()` |

### Table: `submissions`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `SERIAL PK` | Auto-increment |
| `assignment_id` | `INT FK → assignments` | `ON DELETE CASCADE` |
| `student_id` | `INT FK → users` | `ON DELETE CASCADE` |
| `content` | `TEXT` | Submission text |
| `status` | `VARCHAR(20)` | `pending` / `reviewed` |
| `grade` | `VARCHAR(10)` | e.g. `A-`, `B+` |
| `feedback` | `TEXT` | Teacher's feedback |
| `submitted_at` | `TIMESTAMPTZ` | Default: `NOW()` |
| `reviewed_at` | `TIMESTAMPTZ` | `NULL` until reviewed |

---

## 🛠️ Troubleshooting

> [!faq]- Error: "password authentication failed"
> **Fix:** The password in `.env.local` does not match your PostgreSQL password. Verify your credentials and update `DATABASE_URL`.

> [!faq]- Error: "connection refused" or "could not connect"
> **Fix:** PostgreSQL is not running. On Windows:
> 1. Open Services (`Win+R` $\rightarrow$ type `services.msc`).
> 2. Scroll to find `postgresql-x64-*`.
> 3. Right-click and choose **Start**.

> [!faq]- Error: "database reviewapp does not exist"
> **Fix:** You skipped Step 2. Create the database first in pgAdmin before running the seed script.

> [!faq]- Error: "ECONNREFUSED 127.0.0.1:5432"
> **Fix:** Verify PostgreSQL is running and check if it uses a non-default port.

> [!faq]- Error: "relation users already exists" (running seed twice)
> **Fix:** This is safe. The seed script uses `IF NOT EXISTS` for tables, and duplicate users are skipped. To start fresh, right-click `reviewapp` in pgAdmin $\rightarrow$ **Delete/Drop**, then repeat from Step 2.

> [!faq]- Error: "--env-file is not recognized"
> **Fix:** Your Node.js version is below `v20.6`. Either upgrade Node.js or run:
> ```powershell
> $env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/reviewapp"
> $env:JWT_SECRET="change-me-to-a-random-32-char-string!!"
> node seed.mjs
> ```

---

## 📚 Related Documentation
- [[Project_Readme]] — Project dev environment start.
- [[Subject_Builder_Architecture]] — Core routing and curriculum features.
- [[Home]] — Go back to the Knowledge Base Dashboard.
