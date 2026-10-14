---
trigger: always_on
description: Consult the graphify knowledge graph at .graphify/ for codebase and architecture questions.
---

## graphify

This project has a graphify knowledge graph at `.graphify/`.

Optimization & Token Reduction Rules:
- **Low-Token Querying**: Always use strict token budgets when querying the graph to save tokens and speed up responses:
  - `graphify query --budget 500 "<question>"` (default budget is 2000; reducing to 400-600 provides high-density context without bloat).
  - Use `graphify minimal-context` for compact first-call changed-file context and routing instead of inspecting whole trees.
  - For specific single nodes or relationships, use `graphify explain "<concept>"` or `graphify path "<A>" "<B>"`.
  - For quick branch or node structure without token overhead, use `graphify tree "<node>" --depth 1`.
- **Avoid Heavy Raw Dumps**:
  - NEVER dump or read `.graphify/graph.json` directly (it is 16MB+).
  - Do NOT read `.graphify/GRAPH_REPORT.md` unless explicitly asked; use `graphify query` with a tight budget instead.
  - If `.graphify/wiki/index.md` exists, navigate specific short wiki pages instead of reading entire source directories.
- **Fast Code Updates**:
  - Run `graphify update .` only when explicitly needed or after major refactoring (AST-only, fast, zero API token cost). Do not run on every small prompt.
