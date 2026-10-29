# Codex–Copilot workflow for Japanese Day in Považská Bystrica

## Canonical instruction hierarchy

1. Personal/global agent defaults, when present.
2. Repository-root `AGENTS.md` for project-wide architecture and engineering rules.
3. Applicable `.github/instructions/*.instructions.md` for narrow file classes.
4. Authoritative task under `docs/codex/tasks/`.
5. Latest relevant delivery note or handoff under `docs/notes/`.
6. `.github/copilot-instructions.md` as a concise Copilot bridge.
7. `.agents/skills/japanese-day-handoff` only when a handoff workflow is relevant.
8. Project-scoped Graphify skill only when graph navigation is useful.

Never copy the full repository architecture into every prompt or handoff.

## Context-expansion budget

Use this order for each session:

1. Instructions: root `AGENTS.md` and only applicable scoped instructions.
2. Current work: authoritative task and latest relevant handoff.
3. Repository state: branch, HEAD, status, changed-file names, targeted diff.
4. Graph navigation: for cross-file questions, query Graphify when a current graph exists.
5. Direct modules: files named by task/handoff/Graphify result.
6. One-hop dependencies: direct consumers, related JSON, CSS, tests, configuration.
7. Broader exploration only when a concrete unresolved question remains.

Search or query before opening large files. Do not reopen unchanged files without a reason.

## Session boundaries

- One unrelated task = one new session.
- Keep the task path stable for the session.
- Compact long sessions at coherent checkpoints.
- Use an external handoff when switching agent/product or when work will resume later.

## Codex -> Copilot

1. Stop at a coherent checkpoint.
2. Update the current task note/handoff with outcomes and real verification.
3. Run `npm run ai:state` or the detailed handoff state command.
4. Fill `docs/ai/HANDOFF_TEMPLATE.md` with only current high-value state.
5. Start a fresh Copilot session and provide only the task path and handoff path.
6. Copilot validates Git state and continues from the exact next action.

## Copilot -> Codex

1. Run focused verification and record unresolved failures accurately.
2. Update the existing task records; do not create a second competing plan.
3. Generate the concise Git snapshot.
4. Start a fresh Codex session at the repository root.
5. Provide the task path and handoff path.
6. Ask Codex to validate repository evidence before broad review.

## Graphify checkpoint

Use Graphify only when it reduces repository exploration.

Good uses:

- identifying all consumers of a changed JSON field;
- tracing a section to its data source;
- understanding a component relationship before refactoring;
- estimating blast radius of a shared component or schema change.

Bad uses:

- changing one known string in one known JSON file;
- reading the whole graph instead of asking a bounded query;
- rebuilding the graph repeatedly after cosmetic edits.

See `docs/ai/GRAPHIFY.md`.

## Test cadence

### During implementation

Run the narrowest relevant validation.

### Phase checkpoint

Run the task-defined checks for the affected area.

### Final checkpoint

Run broader gates required by the task, usually lint/build for code changes and `git diff --check`.

Do not automatically run every available check for a documentation-only or content-only change.

## Final report contract

Keep the final report concise:

- outcome;
- changed areas;
- important decisions;
- verification actually run;
- unresolved risk/blocker;
- exact next action or scope stop.
