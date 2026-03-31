# Intellectual Property Protection — Technical Documentation

## Overview

This document describes the **Intellectual Property (IP) Protection** system implemented in the Peak Excellence Online Review Center. The system is specifically designed to prevent unauthorized downloading, printing, or reproduction of proprietary educational content (PDF lessons and Module content) created by administrators.

---

## Protection Mechanism

The system uses a **multi-layered approach** to protect intellectual property:

| Layer | Protection | Description |
|-------|-----------|-------------|
| 1 | **Custom PDF Viewer** | Replaces the browser's native PDF viewer with a restricted custom component that removes all download/print controls |
| 2 | **Toolbar Suppression** | Uses `#toolbar=0&navpanes=0` URL parameters to instruct the browser's PDF engine to hide its built-in toolbar |
| 3 | **Transparent Overlay** | A transparent `<div>` overlay sits on top of the PDF iframe, intercepting all mouse events (including right-click) |
| 4 | **Context Menu Blocking** | `onContextMenu` event handler calls `preventDefault()` to block "Save As" and other browser context menu options |
| 5 | **Text Selection Disabled** | CSS `select-none` (user-select: none) prevents text/content selection |
| 6 | **Role-Based Access** | Backend API routes validate user roles — students can only read content, never modify or access raw file URLs through admin endpoints |

---

## Code Files Involved

### Core IP Protection Component

#### `src/components/custom-pdf-viewer.jsx`
- **Purpose**: The bespoke PDF viewer component that enforces all client-side protections
- **Key Features**:
  - Renders PDF inside an iframe with toolbar-hiding URL parameters
  - Places a transparent overlay `<div>` over the iframe to block right-click / "Save As"
  - Provides only **Zoom In**, **Zoom Out**, and **Fullscreen** controls
  - Blocks the browser context menu via `onContextMenu` event handler
  - Disables text selection with CSS `select-none`
- **Technology**: Pure React (no external PDF libraries), lightweight and compatible with Next.js 16

---

### Content Viewer (Admin + Student)

#### `src/components/subject-builder-client.jsx`
- **Purpose**: The main content viewer/builder for both admin and student roles
- **IP Protection Logic**:
  - Accepts an `isStudent` prop that permanently locks the viewer into read-only mode
  - When `isStudent=true`:
    - Hides all editing controls (drag-and-drop, delete buttons, save button, toolbox)
    - Hides the PDF upload area — students see "No PDF Available" message if no content exists
    - Hides the "Student View / Admin View" toggle button
    - Renders module content as static, non-interactive HTML
  - Dynamically imports `CustomPdfViewer` with `ssr: false` to avoid server-side rendering issues
  - Uses role-specific API endpoints for fetching content

---

### Student API Routes (Server-Side Protection)

#### `src/app/api/student/subjects/route.js`
- **Purpose**: Returns all active subjects available to students
- **Protection**: Validates `session.role === "student"` before returning data
- **Data**: Returns subject metadata only (title, code, description, image) — never raw file URLs

#### `src/app/api/student/subjects/[subjectId]/modules/route.js`
- **Purpose**: Returns modules and lessons for a specific subject
- **Protection**: Validates student session and confirms subject is active before returning module data

#### `src/app/api/student/subjects/[subjectId]/lessons/[lessonId]/route.js`
- **Purpose**: Returns individual lesson content (PDF URLs, module JSON)
- **Protection**: Validates student session before returning lesson data
- **Note**: PDF URLs are served through this controlled endpoint rather than being directly exposed

---

### Student Frontend Pages

#### `src/app/(dashboard)/student/subjects/[subjectId]/page.jsx`
- **Purpose**: Server component that validates the student's session and renders the content viewer
- **Protection**: Server-side redirect to `/login` if session is invalid or role is not `student`
- **Passes**: `isStudent={true}` to `SubjectBuilderClient` to enforce read-only mode

#### `src/app/(dashboard)/student/subjects/[subjectId]/layout.jsx`
- **Purpose**: Student-facing sidebar navigation for browsing modules and lessons
- **Protection**: All editing capabilities (add/edit/delete modules and lessons) are completely removed
- **Read-Only**: Students can only navigate between existing lessons — no content modification is possible

---

### Global Layout Protection

#### `src/components/dashboard-shell.jsx`
- **Purpose**: Controls the main app sidebar and header visibility
- **Protection**: Detects when user is on a course viewer page and hides the global navigation to provide a focused, distraction-free viewing experience
- **Route Detection**: Uses `usePathname()` to identify course viewer routes for both admin and student

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Student Browser                       │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │          CustomPdfViewer Component                │   │
│  │                                                  │   │
│  │  ┌──────────────────────────────────────────┐    │   │
│  │  │     Custom Toolbar (Zoom, Fullscreen)     │    │   │
│  │  └──────────────────────────────────────────┘    │   │
│  │  ┌──────────────────────────────────────────┐    │   │
│  │  │   Transparent Overlay (blocks clicks)     │    │   │
│  │  │   - Right-click blocked                   │    │   │
│  │  │   - Context menu blocked                  │    │   │
│  │  │   - Text selection blocked                │    │   │
│  │  ├──────────────────────────────────────────┤    │   │
│  │  │   PDF iframe (#toolbar=0&navpanes=0)      │    │   │
│  │  │   - No download button                    │    │   │
│  │  │   - No print button                       │    │   │
│  │  │   - No page navigation sidebar            │    │   │
│  │  └──────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                               │
│                         ▼                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Student API Routes (Protected)            │   │
│  │   /api/student/subjects/[id]/lessons/[id]         │   │
│  │   - Role validation (student only)                │   │
│  │   - Session authentication required               │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                               │
│                         ▼                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                   │   │
│  │   subjects, subject_modules, subject_contents     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Limitations & Notes

> **Important**: No client-side protection is 100% foolproof. A technically advanced user could potentially:
> - Use browser developer tools to inspect network requests and find the PDF URL
> - Take screenshots of the content
> - Use screen recording software
>
> However, this implementation provides **strong deterrence** against casual downloading and satisfies the standard requirements for intellectual property protection in educational platforms. The server-side role validation ensures that unauthorized API access is fully blocked.

---

## Date Created
**March 30, 2026**

## Author
Peak Excellence Development Team
