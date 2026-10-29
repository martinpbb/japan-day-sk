# Japanese Day in Považská Bystrica Copilot instructions

Follow the repository-root `AGENTS.md` as the authoritative project guidance.

## Start of task

1. Run:
   - `git status --short --branch`
   - `git rev-parse --short HEAD`
2. Read the current task under `docs/codex/tasks/` when one is provided.
3. Read the latest relevant `docs/notes/` handoff only when continuing existing work.
4. If `graphify-out/graph.json` exists and the task involves cross-file dependencies, routing, data consumers, or blast radius, query Graphify before broad repository search.
5. Search for the relevant component, data key, CSS class, or symbol.
6. Open only directly relevant files first.

Do not perform a broad repository scan by default.

## Project architecture

This is a frontend-only React/Vite event website driven primarily by JSON files under `src/data/`.

Do not assume the existence of:

- a backend;
- a database;
- server-side sessions;
- server-side secrets;
- an API layer;
- migrations;
- workers.

Do not introduce these unless explicitly required by the task.

Reuse existing React, CSS, data, image-fallback, and section patterns before creating new abstractions.

## Content architecture

Prefer editing the owning JSON file instead of embedding event copy into React components.

Keep programme entries and performer profiles as separate sources of truth. Programme items may reference performers by ID.

Never invent missing event facts, schedule times, biographies, prices, or partner statuses.

## Graphify

Use Graphify for cross-file questions when a current graph exists. Prefer narrow queries such as:

- `graphify query "which components consume program.json?" --budget 1200`
- `graphify explain "Program"`
- `graphify path "program.json" "Program"`

Do not open `graphify-out/graph.json` or load the full graph report into context. After Graphify identifies candidates, inspect only the relevant source files.

Skip Graphify when the task is an obvious single-file edit.

## Context efficiency

- Do not repeatedly reopen unchanged files.
- Do not inspect unrelated files because the working tree is dirty.
- Prefer targeted diffs instead of full repository diffs.
- Keep terminal output concise.
- Do not repeat project architecture in every response.
- Do not reproduce task specifications in notes.
- Run focused checks while iterating.
- Run broad validation only at the appropriate completion checkpoint.
- Stop when the task is complete.

## Static hosting and security

Preserve static-hosting compatibility.

Never expose secrets to client-side JavaScript.

Treat every value available through `VITE_*` as public.

Do not implement functionality requiring private credentials entirely in browser code.

## Package management

Use npm and the scripts already defined by the repository.

Prefer repository scripts over direct tool invocation.

Do not introduce another package manager.

## Completion

Report:

- what changed;
- important decisions;
- verification actually run;
- anything blocked or not run.

For continued work, generate a concise handoff snapshot with:

`npm run ai:state`

## Repository skills

For project-aware work, use `.copilot/skills/japan-day-project/SKILL.md` and load only the matching reference file. For cross-file architecture/dependency questions, use `.copilot/skills/graphify/SKILL.md` when Graphify is available/current.
