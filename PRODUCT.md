# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Reviewees preparing for professional and civil-service board examinations, including NCLEX, PNLE, BLEPT, CSE, and future supported exams.
- Instructors who create, organize, and deliver learning materials, quizzes, and assessments.
- Administrators and review-center staff who manage programs, users, schedules, subscriptions, and access.

## Product Purpose

PEAK Review System is a multi-exam online review and examination management platform. It gives review centers a common system for organizing exam-specific learning programs and gives reviewees one place to study materials, complete quizzes and mock exams, and monitor progress toward readiness.

Success means each supported exam can have an appropriately structured program, while administrators and instructors can operate it without separate systems or workarounds.

## Positioning

One configurable review-center platform for multiple distinct board and civil-service examinations—not a single-exam reviewer—combining program structure, learning content, assessments, access management, and readiness tracking.

## Operating Context

- Review programs are organized around examinations, programs, majors, batches, subjects, lessons, and scheduled assessment windows.
- Reviewees access study materials, PDFs, quizzes, assignments, mock exams, results, and progress views.
- Staff manage admissions, user roles, batches, subscription terms, curriculum, mock exams, and gradebook/readiness data.
- Login IDs are system-generated and can coexist with legacy email sign-in.

## Capabilities and Constraints

- Supports role-based student, instructor, administrator, and super-administrator workflows.
- Supports multiple examination types and must be able to expand beyond NCLEX, PNLE, BLEPT, and CSE.
- Provides curriculum/material management, quiz and mock-exam creation, automated scoring, progress tracking, subscription/batch access controls, and administrative reporting.
- Existing technical stack: Next.js App Router, React, Tailwind CSS/Base UI, PostgreSQL-compatible data layer, JWT authentication, and Cloudflare Workers deployment via OpenNext.
- Exam-specific requirements, accreditation/content-governance rules, and accessibility standard are open decisions.

## Brand Commitments

- Product names found in the existing project: PEAK Review System and CSE Review System. The definitive public product name is an open decision.
- Existing branded assets and product terminology must be preserved unless intentionally revised in a future brand decision.

## Evidence on Hand

- Existing implementation and documentation in this repository, including curriculum management, quizzes, mock exams, subscriptions, student dashboards, and administrative workflows.
- Existing assets under `public/landingpageassets/`, `public/peakassestsimage/`, and `public/icons/`.
- No independent testimonials, outcome benchmarks, accreditation evidence, or approved public claims were confirmed during initialization; future surfaces must not fabricate them.

## Product Principles

1. Make each exam program feel purpose-built while operating on shared, reliable platform foundations.
2. Keep the reviewee's path from study material to demonstrated readiness clear and measurable.
3. Give review centers practical control over content, access, batches, and assessment schedules.
4. Scale to additional examinations without duplicating the product or fragmenting user data.
5. Treat exam content, results, and account access as operationally important information.

## Accessibility & Inclusion

Accessibility requirements are an open decision. Future work should establish an applicable standard before making accessibility claims.
