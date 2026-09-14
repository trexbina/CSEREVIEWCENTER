# PEAK System Features Documentation

This document serves as the central registry and reference guide for system features implemented across the PEAK Review System. Whenever a new feature or enhancement is introduced, add it to this file to keep documentation organized, transparent, and easy to maintain.

---

## Table of Contents
1. [Batch Subscriptions & Review Term Management](#1-batch-subscriptions--review-term-management)
2. [Login ID Authentication & Sequential Generation](#2-login-id-authentication--sequential-generation)
3. [Feature Documentation Template (For New Features)](#feature-documentation-template)

---

## 1. Batch Subscriptions & Review Term Management

### Overview
The **Batch Subscriptions & Review Term Management** feature introduces scheduled review deadlines for student batches and automated account expiration. When a batch reaches its scheduled end date, all student accounts enrolled in that batch are automatically restricted from logging in. Administrators have centralized visibility and full flexibility to transfer reviewees into upcoming batches or adjust batch schedules.

### Why This Feature Was Added
- **Automated Term Expiration:** Prevents students whose review term has ended from accessing ongoing review materials without administrative approval.
- **Flexible Examination Schedules:** Different examination programs and batches often have different term lengths; admins need the ability to define distinct dates per batch.
- **Controlled Re-enrollment:** Rather than dealing with complex individual date math, administrators can simply transfer reviewees from an old batch into a new batch when they renew their subscription.

---

### Core Components & Workflow

#### 1. Master Data: Batch Start & End Dates
- **Location:** Admin Dashboard → **Master Data** (`/admin/master-data`)
- **What it does:** 
  - The **Batch Modal** (`BatchDialog`) includes optional **Start Date** and **End Date** calendar fields.
  - The Master Data table displays an **End Date** column to quickly audit batch schedules.
- **Files Modified:**
  - `src/app/(dashboard)/admin/master-data/page.jsx`
  - `src/app/api/admin/master-data/route.js`
  - `src/app/api/admin/master-data/dropdowns/route.js`

#### 2. Automated Login Access Control
- **Location:** Auth Endpoint (`/api/auth/login`)
- **How it works:**
  - During login, after password verification, the system inspects `user.is_active` and the effective subscription date (`user.subscription_end_date || batch.end_date`).
  - **Account Deactivated (`is_active = false`):** Login blocked with `HTTP 403`:  
    > *"Your account has been deactivated. Please contact your administrator for assistance."*
  - **Term Completed (Past Batch End Date):** Login blocked with `HTTP 403`:  
    > *"Your review term completed on [Date]. Please contact your administrator for renewal or extension."*
  - **Exempt Roles:** Super Admins, Academic Admins, Registrars, and Instructors are never blocked by batch term dates.
- **Files Modified:**
  - `src/app/api/auth/login/route.js`

#### 3. Subscriptions Monitoring Hub (Option 3: Dual Access)
- **Locations:**
  - **Standalone Page:** Dashboard Sidebar → **Subscriptions** (`/admin/subscriptions`)
  - **User Management Tab:** Admin Dashboard → **User Management** → **Subscriptions** tab (`/admin/users?tab=subscriptions`)
- **Key Features:**
  - **Summary Metrics:** Neutral metric cards for Total Reviewees, Active Subscriptions, Expiring Soon (≤ 7 days), and Expired/Inactive accounts.
  - **Reviewees & Batches Views:** Separate views for student-level monitoring and batch-level scheduling.
  - **Move Batch Action:** Allows admins to transfer a student into another batch directly from the table.
  - **Reactivate Action:** Quick one-click button to re-enable deactivated accounts.
- **Files Created/Modified:**
  - `src/components/subscriptions-view.jsx`
  - `src/app/(dashboard)/admin/subscriptions/page.jsx`
  - `src/app/(dashboard)/admin/users/user-management-tabs.jsx`
  - `src/components/dashboard-sidebar.jsx`

#### 4. Moving Students Between Batches
- Instead of calculating manual day extensions, admins can transfer reviewees into active or upcoming batches via the **"Move Batch"** modal.
- **What happens upon transfer:**
  - The student's `batch_id` is updated to the selected target batch.
  - The student's `exam_id` automatically synchronizes with the new batch's exam.
  - Any one-off override date is cleared (`subscription_end_date = NULL`), allowing the student to cleanly inherit the target batch's schedule.
  - The student's account is verified active (`is_active = true`).

#### 5. User Profile & Search Indicators
- **User Management Table:** Students display neutral, low-contrast status tags (`Expired`, `[n]d left`, or `Disabled`).
- **User Profile Card:** The Student Academic Profile displays the subscription end date and days remaining.
- **User Edit Form:** Administrators can manually set a custom extension date or toggle active status if needed.

---

### Database Changes

```sql
-- 1. Batches table: Add scheduled dates
ALTER TABLE batches 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- 2. Users table: Add account status and optional individual extension
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS subscription_end_date DATE;

-- 3. Custom roles: Automatically grant /admin/subscriptions to all admin roles
-- Handled programmatically for custom_roles where permissions JSON contains module routes.
```

---

### API Endpoints Reference

| Endpoint | Method | Action / Purpose |
| :--- | :--- | :--- |
| `/api/admin/subscriptions` | `GET` | Fetches subscription metrics, batches with student counts, and reviewees list. |
| `/api/admin/subscriptions` | `POST` | `MOVE_STUDENT_BATCH`: Transfers a student to a target batch. |
| `/api/admin/subscriptions` | `POST` | `BULK_MOVE_STUDENTS`: Bulk transfers multiple students to a batch. |
| `/api/admin/subscriptions` | `POST` | `EXTEND_BATCH`: Updates end date for an entire batch. |
| `/api/admin/subscriptions` | `POST` | `REACTIVATE_STUDENT`: Re-enables a deactivated student account. |
| `/api/auth/login` | `POST` | Enforces `is_active` and subscription end date checks upon login. |

---

## 2. Login ID Authentication & Sequential Generation

### Overview
The **Login ID Authentication & Sequential Generation** feature replaces traditional email login credentials (`yosra@peak.edu.ph`) with formatted, sequential **Login IDs** (`dianalan00002`) across all user roles (Students, Instructors, and Administrators). 

Login IDs are automatically generated in strict sequential order based on the user's surname (lowercase alphanumeric) and a zero-padded 5-digit number corresponding to their chronological registration sequence (`00001`, `00002`, `00003`, etc.). Administrators cannot manually edit or tamper with Login IDs; generation is strictly automated to maintain database integrity and sequence consistency.

### Why This Feature Was Added
- **Simplified Credentials:** Students and staff no longer need synthetic or assigned institutional email addresses to log into the PEAK portal.
- **Ordered Identity:** Provides clean, recognizable, and predictable usernames based on the user's family name and arrival order.
- **Backward Compatibility:** Users and legacy accounts can still log in using either their new Login ID or their existing email address.

---

### Core Components & Workflow

#### 1. Format & Storage (Option A: Separate Columns)
- **Database Schema:**
  - `login_prefix VARCHAR(100)`: The cleaned surname in lowercase letters and digits only (e.g., `dianalan`, `delacruz`, `user`).
  - `login_number VARCHAR(20)`: The zero-padded 5-digit sequence string (e.g., `00001`, `00002`, `00008`).
  - `login_id VARCHAR(120) UNIQUE`: The combined string indexed uniquely (e.g., `dianalan00002`).
- **Sequential Generator Helper (`src/lib/login-id.js`):**
  - Sanitizes the surname (`sanitizeSurnamePrefix`).
  - Atomically calculates `MAX(login_number::bigint) + 1` from the `users` table.
  - Formats the 5-digit zero-padded number and guarantees collision-free IDs.

#### 2. Authentication Flow
- **Login Modal (`src/components/login-dialog.jsx`):**
  - Updated input field label to **Login ID** with placeholder `e.g. dianalan00002`.
  - Submits payload `{ loginId, password }`.
- **Auth Endpoint (`src/app/api/auth/login/route.js`):**
  - Accepts `loginId` (or fallback `email`).
  - Queries `WHERE LOWER(u.login_id) = $1 OR LOWER(u.email) = $1`.
  - Encodes the user's `loginId` into the signed session JWT.

#### 3. User Creation & Pre-Registration Flows
- **Add User Page (`/admin/users/add`):**
  - Replaced the manual login email input with a read-only **Login ID (System Generated)** field.
  - Live preview dynamically calculates and shows the next assigned ID as the admin types the user's name.
- **Pre-Registration Approval (`/admin/users?tab=pre-registrations`):**
  - When reviewing a student applicant, displays the auto-generated Login ID preview.
  - Upon clicking **Approve**, the backend generates the sequential Login ID, registers the account, and returns credentials to the administrator.
- **User Detail & Edit Forms:**
  - `src/components/user-profile-detail.jsx` and `src/app/(dashboard)/admin/users/[id]/edit/edit-user-form.jsx` display the user's permanent Login ID as read-only.

#### 4. User Tables & Search
- Both the Quick Search table (`/admin/users`) and All Users table (`/admin/users/all`) display a **Login ID** column instead of Email.
- Admins can search users by their name, login ID, or role.

---

### Database Changes

```sql
-- 1. Add Login ID columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_prefix VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_id VARCHAR(120);

-- 2. Unique index on login_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_id_unique ON users(LOWER(login_id));

-- 3. Migration of existing records executed chronologically:
-- ID 1 (Admin User)         -> user00001
-- ID 2 (Yosra B. Dianalan)  -> dianalan00002
-- ID 3 (Patrick Jake Bina)  -> bina00003
-- ID 4 (John Patrick Rivera)-> rivera00004
-- ID 5 (Ronie Econar)       -> econar00005
-- ID 6 (Julius Macarimban)  -> macarimban00006
-- ID 7 (Ariel Dela Cruz)    -> delacruz00007
```

---

### API Endpoints Reference

| Endpoint | Method | Action / Purpose |
| :--- | :--- | :--- |
| `/api/admin/users/next-sequence` | `GET` | Returns live preview of `{ prefix, nextNumber, loginId }` for given name/role. |
| `/api/admin/users` | `POST` | Automatically generates and saves `login_prefix`, `login_number`, and `login_id`. |
| `/api/admin/users` | `PUT` | Updates user details while safeguarding the permanent `login_id`. |
| `/api/admin/pre-registrations` | `PATCH` | `APPROVE`: Generates atomic Login ID upon approving student applicant. |
| `/api/auth/login` | `POST` | Authenticates users using `login_id` or legacy `email`. |

---

## Feature Documentation Template

> *Use this template whenever you implement a new feature. Simply copy the block below, increment the numbering, and fill in the details.*

```markdown
## [Number]. [Feature Name]

### Overview
Brief summary of the feature, what problem it solves, and how users or administrators interact with it.

### Core Components & Workflow
- **Component / Screen 1:** Description and workflow.
- **Component / Screen 2:** Description and workflow.

### Files Created or Modified
- `src/...`: Description of changes.
- `src/...`: Description of changes.

### Database Changes (if any)
```sql
-- SQL migrations or table schema changes
```

### API Endpoints Reference
| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/...` | `GET/POST` | Description |
```
