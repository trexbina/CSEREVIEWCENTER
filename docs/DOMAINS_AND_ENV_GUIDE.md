# CSE Review System — Domain, Environment & Deployment Guide

This document details the project's production URLs, local development workflows, database bindings, and deployment procedures.

---

## 1. Production URLs Explained

When you deploy the application, Cloudflare generates and manages three access points:

| URL | Type | When to Use | Description |
| :--- | :--- | :--- | :--- |
| **`https://reviewerexam.com`** | **Primary Apex Domain** | **Production & Marketing** | The official public URL. Share this with students, instructors, and on social media/business materials. |
| **`https://www.reviewerexam.com`** | **WWW Subdomain** | **User Convenience** | Automatically redirects or serves the app for visitors who type `www` in their browser. |
| **`https://cse-review-system.trexbina3.workers.dev`** | **Cloudflare Workers Direct URL** | **Testing & Fallback** | The raw Cloudflare Worker edge URL. Useful for diagnostics or testing when custom domain DNS is being altered. |

---

## 2. Local Development Workflows

When working on your local machine, **never test on production URLs**. Choose the appropriate local environment below:

### Workflow A: Daily Development & UI Coding (Fast Refresh)
Use this mode for general coding, component creation, and styling.

- **Command**:
  ```powershell
  npm run dev
  ```
- **Access URL**: `http://localhost:3000`
- **Features**:
  - Instant hot reload / Fast Refresh upon saving code.
  - Quickest feedback loop for frontend development.

---

### Workflow B: Cloudflare Runtime Simulation (Pre-deployment)
Use this mode before deploying to verify that edge runtime APIs and Cloudflare bindings function properly.

- **Command**:
  ```powershell
  npm run preview
  ```
- **Access URL**: `http://localhost:8787`
- **Features**:
  - Compiles OpenNext output (`.open-next/worker.js`).
  - Simulates Cloudflare edge runtime and local D1 SQLite bindings.

---

## 3. Quick Reference Table

| Target | Command | Access URL | Purpose |
| :--- | :--- | :--- | :--- |
| **Local Dev** | `npm run dev` | `http://localhost:3000` | UI design, component building, rapid feature work |
| **Local Cloudflare** | `npm run preview` | `http://localhost:8787` | OpenNext edge runtime & binding testing |
| **Production Deploy**| `npm run deploy` | `https://reviewerexam.com` | Live deployment to Cloudflare edge network |

---

## 4. Cloudflare Infrastructure Details

- **Cloudflare Account ID**: `3210a808df867f2f92d6a5fcf332ad7b` (`trexbina3@gmail.com`)
- **D1 Database Name**: `csdatabase`
- **D1 Database UUID**: `2f325295-c5cc-4b63-8418-bb09c14c0018`
- **Binding Name**: `env.DB`
- **Configuration File**: [`wrangler.jsonc`](./wrangler.jsonc)

---

## 5. Seeded Test Accounts (Cloudflare D1)

| Role | Email | Default Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@csereview.local` | `password123` |
| **Admin** | `staff@csereview.local` | `password123` |
| **Teacher / Instructor** | `instructor@csereview.local` | `password123` |
| **Student** | `student@csereview.local` | `password123` |

---

## 6. How to Deploy Updates to Production

Whenever you make code changes:

1. **Test locally**:
   ```powershell
   npm run build
   ```
2. **Deploy to Cloudflare**:
   ```powershell
   npm run deploy
   ```
3. **Save changes to GitHub**:
   ```powershell
   git add .
   git commit -m "your descriptive commit message"
   git push origin main
   ```
