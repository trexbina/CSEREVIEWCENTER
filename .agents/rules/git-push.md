# Git Auto-Push Rules

## AUTOMATIC COMMIT & PUSH POLICY
- Automatically stage code changes, commit with a descriptive message, and push (`git push target main`) to the remote repository whenever code modifications are made.
- Always ensure code changes are pushed to `target` (or the configured upstream remote) upon completing tasks or updates.

## DATABASE POLICY
- **Do NOT push, dump, or synchronize the database automatically**: Never run database dumps (`setup.sql`, `reviewapp.sql`) or database cloud synchronization scripts as part of standard code updates.
- **One-Way Database Mining to Cloud ONLY**: Database data is only pushed one-way (from local to cloud) and **strictly only when explicitly requested by the user**.

