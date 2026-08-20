# Graph Report - C:\Users\luthe\OneDrive\Desktop\Capstone\Theisis V4 - Copy\my-app backup theisis\my-app  (2026-07-11)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 661 nodes · 644 edges · 139 communities (98 shown, 41 thin omitted)
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

## God Nodes (most connected - your core abstractions)
1. `react` - 14 edges
2. `tailwind` - 6 edges
3. `aliases` - 6 edges
4. `scripts` - 6 edges
5. `ensureContentTable()` - 6 edges
6. `adminGuard()` - 6 edges
7. `registries` - 5 edges
8. `adminGuard()` - 5 edges
9. `adminGuard()` - 5 edges
10. `POST()` - 5 edges

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

## Communities (139 total, 41 thin omitted)

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

## Knowledge Gaps
- **135 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+130 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `react`, `devDependencies`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `dependencies`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _136 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.08712121212121213 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `components.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._