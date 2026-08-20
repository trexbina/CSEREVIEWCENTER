# Graph Report - my-app  (2026-07-12)

## Corpus Check
- 211 files · ~810,363 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1315 nodes · 1273 edges · 187 communities (138 shown, 49 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `92e4f703`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- react
- devDependencies
- components.json
- user-management.jsx
- page.jsx
- index.js
- route.js
- dashboard-sidebar.jsx
- route.js
- route.js
- page.jsx
- auth.js
- proxy.js
- route.js
- route.js
- subject-builder-client.jsx
- subject-manager.jsx
- route.js
- route.js
- route.js
- student-dashboard-charts.jsx
- tabs.jsx
- compilerOptions
- run-setup.mjs
- route.js
- route.js
- layout.jsx
- layout.jsx
- button-group.jsx
- next.config.mjs
- route.js
- route.js
- page.jsx
- page.jsx
- activity.jsx
- bell.jsx
- clipboard-list.jsx
- layout-dashboard.jsx
- settings.jsx
- user.jsx
- users.jsx
- dashboard-header.jsx
- dashboard-shell.jsx
- login-dialog.jsx
- test-api.js
- alter-subjects.mjs
- alter-subjects-unlock.mjs
- check-admin.mjs
- research.mjs
- seed.mjs
- test-db-query.mjs
- update-db.mjs
- update-db2.mjs
- update-db3.mjs
- update-db4.mjs
- update-db5.mjs
- layout.jsx
- page.jsx
- page.jsx
- page.jsx
- page.jsx
- page.jsx
- dashboard-carousel.jsx
- let-countdown-inline.jsx
- quiz-builder.jsx
- theme-switcher.jsx
- badge.jsx
- button.jsx
- eslint.config.mjs
- postcss.config.mjs
- refactor.mjs
- refactor2.mjs
- refactor3.mjs
- Obsidian Bases Skill
- Obsidian Bases Skill
- Obsidian Bases Skill
- Obsidian Flavored Markdown Skill
- Obsidian Flavored Markdown Skill
- Obsidian Flavored Markdown Skill
- JSON Canvas Skill
- JSON Canvas Skill
- JSON Canvas Skill
- shadcn/ui
- SKILL.md
- Validation Checks
- 🚀 Step-by-Step Deployment
- README.md
- 📄 PDF Viewer Strategy and Tuning Guide
- 🛠️ Summarized Skill: Agent Tool Builder
- Validation Checks
- Obsidian CLI
- Subject_Builder_Architecture.md
- 🔒 Implementations
- Obsidian CLI
- Obsidian CLI
- Default Active Skill: Agent Tool Builder
- Agent Tool Builder
- 🏗️ Subject Builder Architecture Documentation
- Installation
- Data Analyst
- TOOL SCHEMA BEST PRACTICES:
- ERROR HANDLING BEST PRACTICES:
- add-avatar-column.mjs
- 🗺️ Documentation Directory
- 🔄 Skills Library & Obsidian Integration
- MCP TOOL IMPLEMENTATION:
- create-demo-user.mjs
- Defuddle
- ⚙️ Adaptive Quality Logic (Q1 / Q2)
- Defuddle
- Defuddle
- AI Skills Library & Documentation Config
- Or just get final result
- inspect-master-data.mjs
- - Focus on ambiguous cases
- PARALLEL TOOL EXECUTION:
- TOOL RUNNER (Anthropic SDK Beta):
- graphify.md
- graphify.md

## God Nodes (most connected - your core abstractions)
1. `react` - 14 edges
2. `Obsidian Bases Skill` - 14 edges
3. `Obsidian Flavored Markdown Skill` - 14 edges
4. `Obsidian Bases Skill` - 14 edges
5. `Obsidian Flavored Markdown Skill` - 14 edges
6. `shadcn/ui` - 14 edges
7. `Obsidian Bases Skill` - 14 edges
8. `Obsidian Flavored Markdown Skill` - 14 edges
9. `Functions Reference` - 13 edges
10. `Functions Reference` - 13 edges

## Surprising Connections (you probably didn't know these)
- `IconWrapper()` --references--> `react`  [EXTRACTED]
  src/components/animate-ui/icons/icon.jsx → package.json
- `CountdownChar()` --references--> `react`  [EXTRACTED]
  src/components/exam-countdown-timer.jsx → package.json
- `ExamCountdownTimer()` --references--> `react`  [EXTRACTED]
  src/components/exam-countdown-timer.jsx → package.json
- `AnimatedTimer()` --references--> `react`  [EXTRACTED]
  src/components/ui/animated-timer.jsx → package.json
- `TimerChar()` --references--> `react`  [EXTRACTED]
  src/components/ui/animated-timer.jsx → package.json

## Import Cycles
- None detected.

## Communities (187 total, 49 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.05
Nodes (41): @1771technologies/lytenyte-core, @base-ui/react, bcryptjs, class-variance-authority, clsx, jose, lucide-react, @material/data-table (+33 more)

### Community 1 - "react"
Cohesion: 0.09
Nodes (24): react, react, AnimateIcon(), AnimateIconContext, composeEventHandlers(), getVariants(), IconWrapper(), staticAnimations (+16 more)

### Community 2 - "devDependencies"
Cohesion: 0.07
Nodes (29): babel-plugin-react-compiler, daisyui, eslint, eslint-config-next, browserslist, devDependencies, babel-plugin-react-compiler, daisyui (+21 more)

### Community 3 - "components.json"
Cohesion: 0.08
Nodes (23): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+15 more)

### Community 4 - "user-management.jsx"
Cohesion: 0.16
Nodes (7): roleBadgeColor, UserSearchTable(), UserTable(), AllUsersPage(), getAllUsers(), getAllUsers(), UserManagementPage()

### Community 6 - "page.jsx"
Cohesion: 0.28
Nodes (11): allIds(), allLeafIds(), buildSummary(), checkState(), COURSE_TREE, CourseMultiSelect(), MockExamsPage(), parseTargets() (+3 more)

### Community 8 - "index.js"
Cohesion: 0.27
Nodes (5): AboutSystemSection(), AboutUsSection(), HeroSection(), LandingFooter(), ProgramsSection()

### Community 11 - "route.js"
Cohesion: 0.53
Nodes (8): adminGuard(), DELETE(), ensureSubcategorySchema(), GET(), POST(), PUT(), readPayload(), saveImage()

### Community 12 - "dashboard-sidebar.jsx"
Cohesion: 0.22
Nodes (6): adminNav, iconMap, navByRole, roleBadgeMap, studentNav, teacherNav

### Community 14 - "route.js"
Cohesion: 0.61
Nodes (7): adminGuard(), DELETE(), ensureContentTable(), GET(), PATCH(), POST(), PUT()

### Community 15 - "route.js"
Cohesion: 0.61
Nodes (7): adminGuard(), DELETE(), ensureTable(), GET(), POST(), PUT(), saveImage()

### Community 16 - "page.jsx"
Cohesion: 0.32
Nodes (7): DashboardCarousel, getStudentData(), GRADE_ENTRIES, GRADE_MAP, LearningPerformanceChart, StudentDashboard(), SubjectFocusChart

### Community 18 - "auth.js"
Cohesion: 0.32
Nodes (5): ROLE_HOME, SECRET, SESSION_COOKIE_OPTIONS, getSession(), verifyToken()

### Community 19 - "proxy.js"
Cohesion: 0.36
Nodes (7): AUTH_ROUTES, clearSessionCookie(), config, getSession(), proxy(), ROLE_HOME, ROUTE_PERMISSIONS

### Community 20 - "route.js"
Cohesion: 0.57
Nodes (6): adminGuard(), DELETE(), ensureTables(), GET(), POST(), PUT()

### Community 21 - "route.js"
Cohesion: 0.48
Nodes (6): adminGuard(), createUploadsTable(), insertUploadedFile(), MAX_UPLOAD_BYTES, POST(), uploadToBlob()

### Community 23 - "subject-builder-client.jsx"
Cohesion: 0.38
Nodes (5): BLOCK_CATEGORIES, CustomPdfViewer, normalizeLessonType(), QuizBuilder, SubjectBuilderClient()

### Community 25 - "route.js"
Cohesion: 0.60
Nodes (5): adminGuard(), DELETE(), GET(), POST(), PUT()

### Community 26 - "route.js"
Cohesion: 0.73
Nodes (5): adminGuard(), DELETE(), ensureTable(), GET(), POST()

### Community 27 - "route.js"
Cohesion: 0.47
Nodes (3): POST(), PUT(), VALID_ROLES

### Community 28 - "student-dashboard-charts.jsx"
Cohesion: 0.33
Nodes (3): DONUT_COLORS, performanceData, subjectData

### Community 30 - "compilerOptions"
Cohesion: 0.40
Nodes (4): compilerOptions, paths, @/*, ./src/*

### Community 31 - "run-setup.mjs"
Cohesion: 0.40
Nodes (3): pool, rawSql, setupSql

### Community 32 - "route.js"
Cohesion: 0.70
Nodes (4): adminGuard(), DELETE(), GET(), PUT()

### Community 33 - "route.js"
Cohesion: 0.70
Nodes (4): clearSessionCookie(), DELETE(), GET(), POST()

### Community 34 - "layout.jsx"
Cohesion: 0.90
Nodes (4): normalizeLessonType(), pickFirstLesson(), shouldShowLessonInTab(), StudentSubjectLayout()

### Community 35 - "layout.jsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 41 - "next.config.mjs"
Cohesion: 0.50
Nodes (3): __dirname, __filename, nextConfig

### Community 42 - "route.js"
Cohesion: 0.83
Nodes (3): adminGuard(), GET(), POST()

### Community 43 - "route.js"
Cohesion: 0.83
Nodes (3): adminGuard(), GET(), PUT()

### Community 44 - "page.jsx"
Cohesion: 0.67
Nodes (3): DashboardCarousel, getTeacherData(), TeacherDashboard()

### Community 53 - "dashboard-header.jsx"
Cohesion: 0.67
Nodes (3): DashboardHeader(), getInitials(), ROLE_LABELS

### Community 57 - "test-api.js"
Cohesion: 0.50
Nodes (3): data, http, req

### Community 139 - "Obsidian Bases Skill"
Cohesion: 0.04
Nodes (43): Any Type Functions, Date Arithmetic, Date Functions & Fields, Duration Type, File Functions, Functions Reference, Global Functions, Link Functions (+35 more)

### Community 140 - "Obsidian Bases Skill"
Cohesion: 0.04
Nodes (43): Any Type Functions, Date Arithmetic, Date Functions & Fields, Duration Type, File Functions, Functions Reference, Global Functions, Link Functions (+35 more)

### Community 141 - "Obsidian Bases Skill"
Cohesion: 0.04
Nodes (43): Any Type Functions, Date Arithmetic, Date Functions & Fields, Duration Type, File Functions, Functions Reference, Global Functions, Link Functions (+35 more)

### Community 142 - "Obsidian Flavored Markdown Skill"
Cohesion: 0.05
Nodes (33): Basic Callout, Callouts Reference, Custom Callouts (CSS), Foldable Callouts, Nested Callouts, Supported Callout Types, Embed Audio, Embed Bases (+25 more)

### Community 143 - "Obsidian Flavored Markdown Skill"
Cohesion: 0.05
Nodes (33): Basic Callout, Callouts Reference, Custom Callouts (CSS), Foldable Callouts, Nested Callouts, Supported Callout Types, Embed Audio, Embed Bases (+25 more)

### Community 144 - "Obsidian Flavored Markdown Skill"
Cohesion: 0.05
Nodes (33): Basic Callout, Callouts Reference, Custom Callouts (CSS), Foldable Callouts, Nested Callouts, Supported Callout Types, Embed Audio, Embed Bases (+25 more)

### Community 145 - "JSON Canvas Skill"
Cohesion: 0.07
Nodes (25): Flowchart, JSON Canvas Complete Examples, Project Board with Groups, Research Canvas with Files and Links, Simple Canvas with Text and Connections, 1. Create a New Canvas, 2. Add a Node to an Existing Canvas, 3. Connect Two Nodes (+17 more)

### Community 146 - "JSON Canvas Skill"
Cohesion: 0.07
Nodes (25): Flowchart, JSON Canvas Complete Examples, Project Board with Groups, Research Canvas with Files and Links, Simple Canvas with Text and Connections, 1. Create a New Canvas, 2. Add a Node to an Existing Canvas, 3. Connect Two Nodes (+17 more)

### Community 147 - "JSON Canvas Skill"
Cohesion: 0.07
Nodes (25): Flowchart, JSON Canvas Complete Examples, Project Board with Groups, Research Canvas with Files and Links, Simple Canvas with Text and Connections, 1. Create a New Canvas, 2. Add a Node to an Existing Canvas, 3. Connect Two Nodes (+17 more)

### Community 148 - "shadcn/ui"
Cohesion: 0.10
Nodes (20): CLI, Component Docs, Examples, and Usage, Component Selection, Component Structure → [composition.md](./rules/composition.md), Critical Rules, Current Project Context, Detailed References, Forms & Inputs → [forms.md](./rules/forms.md) (+12 more)

### Community 149 - "SKILL.md"
Cohesion: 0.04
Nodes (47): 1. Detailed Descriptions (Most Important), 2. Parameter Descriptions, 3. Use Enums When Possible, 4. Required vs Optional, Agent Tool Builder, Anthropic Tool Result with Error, Basic MCP Server (TypeScript), Capabilities (+39 more)

### Community 150 - "Validation Checks"
Cohesion: 0.11
Nodes (19): Collaboration, Delegation Triggers, Disabling Parallel (When Needed), Encouraging Parallel Tool Use, Error Results Need is_error Flag, External Calls Need Timeouts, Limitations, MCP Tools Must Have Input Schema (+11 more)

### Community 151 - "🚀 Step-by-Step Deployment"
Cohesion: 0.12
Nodes (16): 🗄️ Database Deployment Guide, 📐 Database Schema Reference, 📋 Prerequisites, 📚 Related Documentation, 🔑 Sample Login Credentials, Step 1: Install Dependencies, Step 2: Create the Database in pgAdmin, Step 3: Configure Environment Variables (+8 more)

### Community 152 - "README.md"
Cohesion: 0.14
Nodes (13): Claude returns multiple tool_use blocks:, CORRECT: All results in one message, EXAMPLE DESIGN PRINCIPLES:, Execute in parallel, - Keep concise: 1-5 examples per tool, messages.append({"role": "user", "content": [tool_results[0]]}), Process each message, Return ALL results in SINGLE user message (critical!) (+5 more)

### Community 153 - "📄 PDF Viewer Strategy and Tuning Guide"
Cohesion: 0.14
Nodes (14): A. Server-rendered image pages (student mode), 🏛️ Alternative Architectures for Stronger Protection, B. Hybrid model (recommended if scaling), C. Commercial SDK path, 🛠️ Current Recommended Approach (Implemented), 🏁 Decision Summary, 🚀 High-Impact Performance Tuning (Future), 📄 PDF Viewer Strategy and Tuning Guide (+6 more)

### Community 154 - "🛠️ Summarized Skill: Agent Tool Builder"
Cohesion: 0.17
Nodes (12): 1. Default Behavior, 2. Scenario-Specific Overrides, 🤖 AI Skills Library & System Prompt Configurations, 🔑 Core Principles, 🚨 Error Handling Architecture, ⚙️ Execution Rules, 📋 JSON Schema Guidelines, 📝 Overview (+4 more)

### Community 155 - "Validation Checks"
Cohesion: 0.11
Nodes (19): Collaboration, Delegation Triggers, Disabling Parallel (When Needed), Encouraging Parallel Tool Use, Error Results Need is_error Flag, External Calls Need Timeouts, Limitations, MCP Tools Must Have Input Schema (+11 more)

### Community 156 - "Obsidian CLI"
Cohesion: 0.20
Nodes (9): Additional developer commands, Command reference, Common patterns, Develop/test cycle, File targeting, Obsidian CLI, Plugin development, Syntax (+1 more)

### Community 157 - "Subject_Builder_Architecture.md"
Cohesion: 0.29
Nodes (3): 🛠️ Getting Started, 🚀 Project Readme, 📚 Related Documentation

### Community 158 - "🔒 Implementations"
Cohesion: 0.20
Nodes (10): 1. Context Menu Disable (Right-Click Prevention), 2. Highlighting & Text Selection Block, 3. DOM Drag-and-Drop Disable, 4. Keyboard Shortcut Interception, 5. PDF-Specific Protections, 🔒 Implementations, 🛡️ Intellectual Property Protection & Content Security, ⚠️ Limitation Note (+2 more)

### Community 159 - "Obsidian CLI"
Cohesion: 0.20
Nodes (9): Additional developer commands, Command reference, Common patterns, Develop/test cycle, File targeting, Obsidian CLI, Plugin development, Syntax (+1 more)

### Community 160 - "Obsidian CLI"
Cohesion: 0.20
Nodes (9): Additional developer commands, Command reference, Common patterns, Develop/test cycle, File targeting, Obsidian CLI, Plugin development, Syntax (+1 more)

### Community 161 - "Default Active Skill: Agent Tool Builder"
Cohesion: 0.22
Nodes (9): Capabilities, Default Active Skill: Agent Tool Builder, Frameworks, Patterns, Principles, Scope, Standards, Tool Schema Design (+1 more)

### Community 162 - "Agent Tool Builder"
Cohesion: 0.67
Nodes (3): getUserDetail(), metadata, UserProfilePage()

### Community 163 - "🏗️ Subject Builder Architecture Documentation"
Cohesion: 0.22
Nodes (9): 1. `subject_modules` Table, 2. `subject_contents` Table (The Lessons), 🔌 API Endpoints, 🗄️ Database Schema Highlights, 📝 Future Implementation Notes, Overview, 📚 Related Documentation, 🗺️ Routing & UI Structure (+1 more)

### Community 164 - "Installation"
Cohesion: 0.22
Nodes (8): Claude Code, Codex, Installation, Manually, Marketplace, npx skills, OpenCode, Skills

### Community 166 - "Data Analyst"
Cohesion: 0.29
Nodes (6): Core Methodology, Data Analyst, Overview, Reference Files, When to Use This Skill, Workflow

### Community 167 - "TOOL SCHEMA BEST PRACTICES:"
Cohesion: 0.33
Nodes (6): 1. Detailed Descriptions (Most Important), 2. Parameter Descriptions, 3. Use Enums When Possible, 4. Required vs Optional, TOOL SCHEMA BEST PRACTICES:, Tool with Input Examples

### Community 168 - "ERROR HANDLING BEST PRACTICES:"
Cohesion: 0.33
Nodes (6): Anthropic Tool Result with Error, Error Categories to Handle, ERROR HANDLING BEST PRACTICES:, Implementation Pattern, MCP Tool Pattern, Return Informative Errors

### Community 171 - "🗺️ Documentation Directory"
Cohesion: 0.33
Nodes (5): 🏗️ Architecture & Security, 🗺️ Documentation Directory, 🚀 Getting Started, 🎓 Peak Excellence Knowledge Base, 🔄 Platform Context Overview

### Community 172 - "🔄 Skills Library & Obsidian Integration"
Cohesion: 0.40
Nodes (5): Alignment Flow, 🔒 Coexistence & Safety (No Conflicts), 🗺️ Integration Architecture, 📚 Related Documentation, 🔄 Skills Library & Obsidian Integration

### Community 173 - "MCP TOOL IMPLEMENTATION:"
Cohesion: 0.50
Nodes (4): Basic MCP Server (TypeScript), MCP Benefits, MCP TOOL IMPLEMENTATION:, Tool Runner Pattern

### Community 175 - "Defuddle"
Cohesion: 0.50
Nodes (3): Defuddle, Output formats, Usage

### Community 176 - "⚙️ Adaptive Quality Logic (Q1 / Q2)"
Cohesion: 0.50
Nodes (4): ⚙️ Adaptive Quality Logic (Q1 / Q2), Inputs used for tiering:, Q1 (Higher Quality), Q2 (Balanced Quality)

### Community 177 - "Defuddle"
Cohesion: 0.50
Nodes (3): Defuddle, Output formats, Usage

### Community 178 - "Defuddle"
Cohesion: 0.50
Nodes (3): Defuddle, Output formats, Usage

### Community 179 - "AI Skills Library & Documentation Config"
Cohesion: 0.67
Nodes (3): AI Skills Library & Documentation Config, Documentation Rules, Prompt Skill Execution Rules

### Community 180 - "Or just get final result"
Cohesion: 0.67
Nodes (3): Or just get final result, Parallel Tool Execution, TypeScript with Zod

## Knowledge Gaps
- **612 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+607 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `react`, `devDependencies`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `dependencies`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `messages.append({"role": "user", "content": [tool_results[1]]})` connect `Validation Checks` to `README.md`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _614 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.08712121212121213 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._