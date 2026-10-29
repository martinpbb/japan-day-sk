# Japanese Day in Považská Bystrica repository guidance

This is a frontend-only React/Vite event website for **Japonský deň čaju a kultúry** in Považská Bystrica. **Japan Day Považská Bystrica** is the shorter brand/subtitle used especially in concise web and social communication.

The site is intentionally JSON-driven so programme, performers, gastronomy, gallery, partners, practical information, and other event content can be maintained without embedding copy in React components.

The target deployment is static hosting. There is currently no application backend, database, authentication system, or server runtime.

This file contains durable repository-wide rules. Task-specific requirements belong in `docs/codex/tasks/`.

## Core workflow

1. Read the current task first.
2. Inspect Git status and only the files directly relevant to the task.
3. Use Graphify first when the question is cross-file and graph evidence is available.
4. Reuse existing components, JSON structures, hooks, styling patterns, and conventions.
5. Make the smallest coherent change that satisfies the task.
6. Run focused validation during implementation.
7. Run broader validation only when required before completion.
8. Record concise implementation state in `docs/notes/` when work will continue later or the task materially changes the repository.
9. Stop when the requested acceptance criteria are satisfied.

## Context and token discipline

- Do not perform repository-wide exploration by default.
- Search for components, data keys, CSS classes, symbols, or Graphify nodes before opening large files.
- Read only directly relevant files first.
- Expand into adjacent files only when concrete evidence requires it.
- Do not repeatedly reopen unchanged files already understood in the current session.
- Do not copy full task specifications into plans, notes, or handoffs.
- Do not paste full diffs, logs, generated files, lockfiles, or large JSON files into notes or chat.
- Prefer existing task and handoff documents as cached context instead of rediscovering completed work.
- Run the narrowest useful validation while iterating.
- Avoid repeated full builds or lint runs unless a change requires them.
- Stop at the current task boundary.

## Graphify policy

Graphify is an optional local code-knowledge graph used to reduce broad repository scanning.

When `graphify-out/graph.json` exists, prefer Graphify before broad grep/search for questions about:

- which components consume a JSON field;
- caller/callee relationships;
- routing and navigation flow;
- cross-file dependencies;
- blast radius of a schema or component change;
- connections between sections, data files, hooks, and shared components.

Preferred commands:

- `graphify query "<question>" --budget 1200`
- `graphify path "<source>" "<target>"`
- `graphify explain "<node>"`

Use Graphify output to identify candidate files, then open only those source files required to verify the change.

Do not:

- load `graphify-out/graph.json` directly into agent context;
- load the complete `graphify-out/GRAPH_REPORT.md` by default;
- use Graphify for a trivial edit where the exact single file is already known;
- treat inferred graph relations as stronger evidence than current source code;
- rebuild the full graph repeatedly during one small task.

If the graph is stale after meaningful structural changes, refresh it once with the supported Graphify update flow before relying on it again.

## Architecture

The application is currently a client-side React application built with Vite.

Preserve the existing project structure and npm package manager unless a task explicitly requires an architectural change.

Do not introduce a backend, database, server runtime, ORM, authentication system, CMS, API layer, or server-side framework merely as preparation for possible future functionality.

Prefer existing project dependencies before adding new packages.

Avoid speculative abstractions and infrastructure.

## Content ownership

Structured content belongs in `src/data/` unless a task explicitly changes the content architecture.

Current ownership:

- `src/data/site.json` — event identity, date, venue, navigation, high-level site copy, video configuration, practical information;
- `src/data/seo.json` — canonical routes, route metadata, social metadata configuration, and semantic topic guidance;
- `src/data/program.json` — chronological programme entries;
- `src/data/performers.json` — performer and speaker profiles;
- `src/data/gastronomy.json` — food and beverage content;
- `src/data/gallery.json` — gallery entries and captions;
- `src/data/partners.json` — organisers, patronage, sponsors, and partners;
- `src/data/exhibitors.json` — exhibitor and seller profiles.

Keep programme scheduling separate from performer biographies. Prefer references such as `performerId` rather than duplicating the same biography in programme data.

Before changing a JSON structure:

1. find its current consumers;
2. preserve backward compatibility where practical;
3. update every directly affected consumer;
4. validate the rendered result.

Do not create duplicate sources of truth.

Do not move editorial content into React components when an existing JSON file owns that content.

## Event-content accuracy

Do not invent missing event facts, programme times, partner statuses, performer biographies, prices, dates, or logistical details.

When source information is incomplete, preserve a clear placeholder or leave the field intentionally unset according to the current data convention.

Keep Japanese names and event terminology consistent with the content supplied by the project owner.


## SEO and public information architecture

The canonical public domain is `https://japanday.sk`. The official primary event name is `Japonský deň čaju a kultúry`. `Japan Day Považská Bystrica` is the shorter brand/subtitle and `japandaypb` is the social tag/handle form.

Do not replace the official event name with `Japan Day Považská Bystrica` as the primary H1, Schema.org `name`, or general editorial identity. Use the short brand as a secondary label, subtitle, social identifier, or `alternateName` where appropriate.

Route-level SEO metadata belongs in `src/data/seo.json`. Do not create duplicate title/description sources in React components.

Keep the site compatible with static route generation. When adding or removing an indexable public route, update the SEO route definition and verify generated sitemap/canonical/structured data output.

Do not invent unconfirmed event end times, transport claims, accessibility claims, contact details, exhibitor data, or other facts for SEO completeness. Missing facts should remain unset or clearly marked for later confirmation.

## Frontend

- Reuse existing components, hooks, utilities, and layout patterns before creating new abstractions.
- Keep components focused and composable.
- Preserve responsive behavior and mobile usability.
- Prefer semantic HTML.
- Preserve keyboard usability and visible focus states.
- Respect `prefers-reduced-motion` where motion is used.
- Images must have appropriate alternative text when meaningful.
- Avoid unnecessary client-side dependencies and expensive effects.

## Static deployment

Keep the application compatible with static hosting.

Pay particular attention to:

- asset paths;
- Vite base paths;
- client-side navigation;
- refresh/deep-link behavior if routing is introduced;
- build output;
- environment configuration.

Do not assume server-side runtime capabilities exist.

## Security and secrets

Never commit credentials, private API keys, access tokens, passwords, service secrets, private signing keys, or private configuration.

Client-side code must never contain secrets.

Any environment variable exposed to the Vite client bundle must be treated as public. In particular, `VITE_*` values are browser-accessible after build and are not suitable for secrets.

If a future feature requires a true server-side secret, do not emulate security in the frontend. Record that a trusted server-side or provider-hosted component is required.

## Scope discipline

Do not:

- perform unrelated refactoring;
- rename unrelated files;
- reformat unrelated code;
- upgrade dependencies without a task requirement;
- introduce architecture for hypothetical future features;
- fix unrelated defects automatically.

Record unrelated findings separately.

Every meaningful changed file should be explainable by the current task.

## Validation

During implementation, prefer focused checks for the changed area.

Before declaring completion, run the checks required by the task and relevant repository scripts, commonly:

- targeted tests where available;
- `npm run lint` when affected code warrants it;
- `npm run build` when build/deployment behavior could be affected;
- `git diff --check`;
- `npm run ai:validate` when AI-support files are changed.

Do not claim a command passed unless it actually ran successfully.

Clearly distinguish:

- IMPLEMENTED
- TESTED
- VERIFIED
- BLOCKED
- NOT RUN

## Handoff

For work continuing in another agent session, use the `japanese-day-handoff` skill.

Generate the repository snapshot with:

`npm run ai:state`

A handoff should contain only:

- current task;
- branch and HEAD;
- meaningful changed files;
- completed work;
- important decisions;
- verification actually run;
- blockers or remaining work;
- one exact next action.

Do not include complete logs, full diffs, source dumps, or chat transcripts.

## Platform-scoped skills

This repository commits assistant-specific project skills in addition to this root instruction file:

- Codex: `.codex/skills/graphify/` and `.codex/skills/japan-day-project/`
- GitHub Copilot: `.copilot/skills/graphify/` and `.copilot/skills/japan-day-project/`
- Generic Agent Skills: `.agents/skills/graphify/` and `.agents/skills/japanese-day-handoff/`

Load progressive references only when relevant; do not preload every reference file into context.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
