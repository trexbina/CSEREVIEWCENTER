---
name: graphify
description: Consult and update the graphify knowledge graph at graphify-out/ for codebase and architecture queries.
---

# Graphify

This skill provides access to and rules for maintaining the Graphify knowledge graph stored at `graphify-out/`.

## Purpose
Use Graphify to understand the project structure, query relationships between nodes/components, and explain codebase concepts with minimum token usage.

## Rules
- For codebase or architecture questions, when `graphify-out/graph.json` exists, first run `graphify query "<question>"` (CLI) or `query_graph` (MCP). Use `graphify path "<A>" "<B>"` / `shortest_path` for relationships and `graphify explain "<concept>"` / `get_node` for focused concepts. These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Workflows
To run the full pipeline:
- Follow the graphify skill installed at `~/.gemini/config/skills/graphify/SKILL.md`.
- If no path argument is given, use `.` (current directory).

## When to Use
- Codebase or architecture questions
- Finding relationships or paths between two files/modules
- Explaining specific workspace concepts or dependencies
