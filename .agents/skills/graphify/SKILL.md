---
name: graphify
description: Consult and update the graphify knowledge graph at .graphify/ for codebase and architecture queries.
---

# Graphify

This skill provides access to and rules for maintaining the Graphify knowledge graph stored at `.graphify/`.

## Purpose
Use Graphify to understand the project structure, query relationships between nodes/components, and explain codebase concepts with minimum token usage and fastest analysis turnaround.

## Rules & Token Optimization
- **Low-Token Querying**:
  - Use `graphify query --budget 500 "<question>"` (caps output at 500 tokens instead of the default 2000, saving ~75% token consumption per query).
  - Use `graphify minimal-context` for changed files analysis for rapid routing without full tree traversal.
  - Use `graphify explain "<concept>"` for focused concept explanation.
  - Use `graphify path "<A>" "<B>"` for shortest dependency path between components.
  - Use `graphify tree "<node>" --depth 1` to inspect local hierarchy without large subgraphs.
- **Strictly Avoid High-Token Operations**:
  - NEVER read `.graphify/graph.json` directly (it is ~16MB and will cause context overflows/heavy costs).
  - Do NOT read `.graphify/GRAPH_REPORT.md` unless explicitly requested.
  - If `.graphify/wiki/index.md` exists, consult specific topic files rather than reading large source code files.
- **Fast Updates**:
  - Run `graphify update .` only when explicitly requested or after significant multi-file refactoring (AST-only, zero API cost). Avoid running updates on minor prompt edits.

## Workflows
To run the full pipeline:
- Follow the graphify skill installed at `~/.gemini/config/skills/graphify/SKILL.md`.
- If no path argument is given, use `.` (current directory).

## When to Use
- Codebase or architecture questions
- Finding relationships or paths between two files/modules
- Explaining specific workspace concepts or dependencies
