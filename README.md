# CSE Review System

A comprehensive online review and examination management platform tailored for Civil Service Examination (CSE) reviewees, educators, and administrators.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Deployment & Edge Runtime**: Cloudflare Workers via OpenNext (`@opennextjs/cloudflare` + `wrangler`)
- **Database**: PostgreSQL (Prisma-compatible / Supabase / Hyperdrive / Neon)
- **Styling**: Tailwind CSS & Base UI
- **Authentication**: Stateless JWT session tokens (`jose`) with bcrypt password hashing

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` to configure your PostgreSQL database connection:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/csereview"
JWT_SECRET="generate-a-secure-random-32-character-secret-key"
```

### 3. Initialize Database Schema

Run `setup.sql` on your PostgreSQL database (via `psql` or pgAdmin Query Tool):

```bash
psql -U postgres -d csereview -f setup.sql
```

Default Super Administrator login credentials:
- **Login ID**: `admin00001` (or `admin@csereview.local`)
- **Password**: `password123`
- **Role**: `super_admin`

---

## Development & Deployment

### Local Development

Run the local Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Cloudflare Worker Preview

Build with OpenNext and preview locally in the Cloudflare Workers runtime (`workerd`):

```bash
npm run preview
```

### Deploy to Cloudflare Workers

Deploy the application directly to Cloudflare:

```bash
npm run deploy
```

---

## Database Schema

All database tables, constraints, indexes, and initial roles are consolidated in [`setup.sql`](file:///e:/CSE%20website/CSE%20Review%20System/setup.sql).
See [`database deployment guide.txt`](file:///e:/CSE%20website/CSE%20Review%20System/database%20deployment%20guide.txt) for step-by-step setup instructions.
