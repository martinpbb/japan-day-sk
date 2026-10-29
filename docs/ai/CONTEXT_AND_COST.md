# Context and AI-cost policy

This policy is designed to reduce unnecessary repository reading, repeated model context, and redundant validation.

## Stable-context rule

During one focused task, keep these stable when practical:

- model/reasoning level;
- instruction hierarchy;
- repository root;
- task and handoff paths;
- enabled tool set.

Do not restate the complete architecture in every prompt or attach the same large files repeatedly.

## Reading budget

Use progressive disclosure:

1. root and applicable scoped instructions;
2. task and latest handoff;
3. branch, HEAD, status, changed-file names, targeted diff;
4. Graphify query for cross-file relationships when available;
5. directly relevant files;
6. one-hop consumers/dependencies;
7. broader repository exploration only when unresolved evidence requires it.

Do not use repository-wide scans as a default orientation step.

## Graph budget

- Keep Graphify queries narrow.
- Prefer a bounded output budget such as `--budget 1200`.
- Query for a concrete relationship rather than asking for a complete architecture dump.
- Never paste the raw graph JSON into agent context.
- Open source files returned by the graph and verify there.

## Output budget

- Keep plans and progress reports decision-oriented.
- Summarize command failures by command, failing target, and first actionable cause.
- Do not paste complete diffs, generated files, logs, lockfiles, or large JSON payloads into chat or handoffs.
- Persist durable state in task notes/handoffs rather than replaying it every session.

## Verification budget

- During implementation: narrowest affected validation.
- At a coherent checkpoint: affected-area lint/test/build only when relevant.
- At final review: broad gates required by repository policy or task.
- Do not rerun an unchanged expensive check without a code/config/environment change that could affect it.

## Session discipline

- New unrelated task: new session.
- Continue an existing task from its task file and handoff instead of rediscovering the repository.
- Stop when acceptance criteria are satisfied.
