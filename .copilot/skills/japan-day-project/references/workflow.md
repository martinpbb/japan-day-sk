# Workflow and context cost

- Treat an explicit task file under `docs/codex/tasks/` as authoritative.
- Use Graphify for cross-file dependency/blast-radius questions when the graph exists.
- Avoid broad repo scans when targeted search or graph evidence identifies the files.
- Reuse existing components and patterns before adding dependencies.
- Store handoff/results under `docs/notes/` when work spans sessions/agents.
- Use `npm run ai:state` for a compact handoff snapshot.
