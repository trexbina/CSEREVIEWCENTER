# Subject Builder Architecture Documentation

## Overview
The Subject Builder allows administrators to manage complex subject contents inside a specific application route: `/admin/curriculum/[subjectId]/content`.
Rather than just having flat subjects, this architecture allows subjects to be composed of **Modules** which contain **Lessons** (Contents), matching the layout design required for a modern Learning Management System (LMS).

## Routing & UI Structure
- **Button Hook**: Under the `admin/curriculum` page, clicking **"Edit content"** on a Subject Card navigates the user to: `/admin/curriculum/${subjectId}/content`.
- **Layout Wrapper (`content/layout.jsx`)**: This file maintains the persistent left sidebar. It fetches modules and lessons, and provides UI to "Add New Module" and "Add Lesson".
- **Client Component (`subject-builder-client.jsx`)**: Renders on the right side of the screen. When a user clicks a lesson in the sidebar, the query param `?lessonId=XYZ&type=TYPE` determines what builder is active. 
    - **PDF Builder**: Shows a drag-and-drop area for PDFs. Once an active PDF is set, it replaces the padded content area with a full-cover, borderless `iframe` to maximize reading space, alongside an overlay toggle to navigate or close the PDFs.
    - **Module Builder**: Provides an interactive blank canvas structure with a sticky, floating bottom toolbox. Admins can drag and drop block chips (Text, Image, Quote, Video, Divider) from the toolbox onto the canvas to construct rich media lessons dynamically.

## Database Schema Highlights

The project connects to a raw PostgreSQL database (via `pg`). We've added two new tables connected via cascading foreign keys to `subjects`.

### 1. `subject_modules` Table
Handles the high-level sections.
- `id`: Primary Key
- `subject_id`: Foreign Key pointing to the parent subject (Deletes if subject is deleted).
- `title`: e.g. "Module 1: Introduction to Study Skills"
- `order_index`: For sorting.

### 2. `subject_contents` Table (The Lessons)
Handles the individual documents, PDFs, and Interactive builders.
- `id`: Primary Key
- `module_id`: Foreign Key pointing to `subject_modules`.
- `subject_code`: Stored directly as originally requested.
- `title`: e.g. "Lesson 01: Importance of Effective Study Habits".
- `contentbuilder_id`: A placeholder string reference pointing to whatever external/internal builder payload is used for rich text interactive components.
- `pdf_files`: A `JSONB` array meant to store multiple PDF file paths or objects.
- `quiz_content`: A `TEXT` column (can be JSON if needed) meant to store quiz payload data.

## API Endpoints (`/api/admin/subjects/[subjectId]/modules/route.js`)

**GET:**
Retrieves all modules. Includes an inner join mechanism (via multiple `pg` queries) to attach `lessons` to each module. Returns a nested object structure easier for the sidebar to map through.

**POST:**
Handles two action `types` via JSON body.
- `type: "module"` - Creates a new parent module under the subject.
- `type: "lesson"` - Creates a new empty lesson entry connected to a `module_id`.

## Future Implementation Notes
- **File System**: Expand the `POST` / `PUT` methods to handle `multipart/form-data` when the administrator needs to upload the physical PDFs to save into `pdf_files`.
- **Content Builder**: Hook the UI "Module Builder" tools to update the `contentbuilder_id` or rich text JSON columns.