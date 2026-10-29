---
name: japanese-day-handoff
description: Create a concise repository handoff when pausing, resuming, or transferring a Japanese Day in Považská Bystrica development task between agent sessions.
---

# Japanese Day in Považská Bystrica handoff

Use this skill when work is paused, resumed, transferred between agents, or continued in a new session.

The objective is to preserve useful task state without forcing the next agent to rediscover the repository.

## Source hierarchy

Use, in this order:

1. current Git state;
2. authoritative task file;
3. latest relevant note or handoff;
4. directly relevant implementation files.

Current repository evidence takes precedence over stale prose.

## Collect Git state

From the repository root, use:

```powershell
npm run ai:state
```

For an explicit transfer with metadata:

```powershell
node .agents/skills/japanese-day-handoff/scripts/collect-state.mjs `
  --from Codex `
  --to Copilot `
  --task docs/codex/tasks/example.md `
  --handoff docs/notes/example-result.md
```

## Handoff content

Keep only high-value state:

- task path and task objective;
- branch and HEAD;
- meaningful changed files;
- completed work;
- key decisions that constrain continuation;
- verification actually run and its result;
- blockers or intentionally uncompleted work;
- one exact next action.

Do not include:

- full source files;
- full diffs;
- complete command logs;
- generated build output;
- Graphify graph JSON;
- chat transcripts;
- copied repository-wide architecture already present in `AGENTS.md`.

## Resuming work

The next agent should:

1. read root `AGENTS.md`;
2. read the authoritative task;
3. read the latest relevant handoff;
4. validate current Git state;
5. query Graphify only if cross-file relationships need clarification;
6. inspect the exact changed/relevant files;
7. continue with the single next action.
