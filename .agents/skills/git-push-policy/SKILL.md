---
name: git-push-policy
description: Automatic git commit and push policy whenever changes are made.
---

# Git Auto-Push Policy

## Core Principle
- Automatically stage code changes, commit, and push (`git push target main`) to GitHub whenever code modifications or requested updates are completed.
- Ensure the remote repository stays in sync with local work automatically.

## Database Exclusion
- **Do NOT push or sync database dumps automatically**: Do not dump or push `setup.sql`, `reviewapp.sql`, or trigger database cloud synchronization on regular code tasks.
- **One-Way Local-to-Cloud Only On Demand**: Database mining/syncing to cloud is strictly one-way (local to cloud) and only executed when the user explicitly requests it.

