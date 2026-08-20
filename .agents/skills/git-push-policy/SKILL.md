---
name: git-push-policy
description: Guidelines and procedure for git commits and pushes. Prohibits automatic git pushes unless the user explicitly commands "push git".
---

# Git Push & Version Control Policy

## Core Principle
- **DO NOT** automatically push local commits or code changes to any remote repository (e.g. GitHub) after prompts or file updates.
- Keep all local code changes, staging, and commits local by default.
- **ONLY** perform a git push (`git push`, `gh repo push`, etc.) when the user explicitly requests or commands `"push git"` (or equivalent explicit push instruction).

## Workflow Instructions
1. **Local Editing & Staging**:
   - Feel free to create files, modify code, and run tests locally.
   - Stage or commit changes locally when appropriate or requested.
2. **Explicit Push Trigger**:
   - When the user says `"push git"`, `"push to git"`, or `"git push"`, run the required git push command to send local commits to the target remote repository (e.g., `git push origin-new main` or `git push origin main`).
3. **Status Reporting**:
   - Inform the user when local commits are created and remind them that changes are kept local until they instruct to push.
