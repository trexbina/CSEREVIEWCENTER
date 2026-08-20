---
title: Intellectual Property Protection & Content Security
tags:
  - security
  - compliance
  - intellectual-property
  - student-dashboard
---

# 🛡️ Intellectual Property Protection & Content Security

| System Module | Affected Roles |
| :--- | :--- |
| **Content Viewer (Dashboard)** | **Student** (and Admin when in 'Student View') |

---

## 📝 Overview
To protect proprietary educational material (modules, lessons, exams, and PDFs) from being easily copied, downloaded, or stolen by users, a suite of strict frontend browser restrictions has been implemented on the Peak Excellence platform.

These protections ensure that content remains secure and is strictly consumed within the context of the platform.

---

## 🔒 Implementations

### 1. Context Menu Disable (Right-Click Prevention)
* **Action:** Native right-click context menus have been blocked.
* **Implementation:** We mapped the `onContextMenu={(e) => e.preventDefault()}` listener onto all high-level wrapper elements of the reading container.
* **Benefit:** Prevents users from right-clicking to access "Save As", "Inspect Element", or "Save Image As".

### 2. Highlighting & Text Selection Block
* **Action:** Text highlighting across modules has been entirely removed.
* **Implementation:** The reading area is assigned the global CSS utility `select-none` (`user-select: none`).
* **Benefit:** Prevents users from dragging their mouse to copy entire paragraphs of curriculum text to store off-platform.

### 3. DOM Drag-and-Drop Disable
* **Action:** Mouse drag events are halted.
* **Implementation:** The `onDragStart={(e) => e.preventDefault()}` listener was added.
* **Benefit:** Stops users from clicking and dragging an image or text block straight to their local desktop folder.

### 4. Keyboard Shortcut Interception
* **Action:** Standard keyboard commands for extraction are blocked.
* **Implementation:** The `onKeyDown` listener intercepts key codes and neutralizes them when a user is in Student mode:
  - `Ctrl/Cmd + C` (Copy)
  - `Ctrl/Cmd + S` (Save Form/Page)
  - `Ctrl/Cmd + P` (Print Page)
  - `Ctrl/Cmd + A` (Select All)
* **Benefit:** Prevents technically savvy users from bypassing visual protections via rapid keyboard commands.

### 5. PDF-Specific Protections
In addition to the global module restrictions above, the native PDF implementation (`CustomPdfViewer`) provides specific security upgrades:
* **Dynamic Watermarking:** A faint, repeating background text containing `"Property of Peak-Execellence-Review-Center-Inc-[StudentName]"` overlays the PDF at all times. This discourages screen-recording or screenshots by associating any leaked images directly to the user's account.
* **Native Toolbar Removal:** The Native PDF `<iframe>` utilizes the hash `#toolbar=0` to hide standard browser controls (Download, Print, Save).
* **Clipboard Block:** The `onCopy` event is blocked outright to prevent copy-to-clipboard functionality.

---

## ⚠️ Limitation Note

> [!warning] Sandboxing Limitations
> Due to standard browser security sandboxing, native PDF rendering (via `<iframe>`) processes internal events natively. While global platform shortcuts, copy events, and outer overlays rigorously obstruct extraction, advanced browsers may still offer built-in PDF sub-menus over the exact PDF frame which cannot be removed without fully rendering the PDF as an HTML5 Canvas using a 3rd party parser (e.g. `pdf.js`). 
> 
> The current setup represents the **maximum viable security** achievable using native browser frame technologies.

---

## 📚 Related Documentation
- [[PDF_Viewer_Strategy_And_Tuning]] — Long-term architecture and performance/security tuning decisions.
- [[Subject_Builder_Architecture]] — Structural context for where these protections are integrated.
- [[Home]] — Go back to the Knowledge Base Dashboard.
