# Graphify policy and setup

Graphify is used as a local knowledge graph for repository navigation and dependency analysis.

The project does not require Graphify to run the website. It is development tooling for AI-assisted work.

## Why it is used

The objective is not to replace source inspection. The objective is to identify the smallest relevant set of files before opening them.

Use it mainly for:

- JSON consumer discovery;
- component/data relationships;
- callers and dependencies;
- route/navigation relationships if routing is added;
- blast-radius analysis before schema or shared-component changes.

## Install on Windows/PowerShell

Run from the repository root:

```powershell
uv tool install graphifyy
```

Then install the skill project-locally for the assistants used on this repository:

```powershell
graphify copilot install --project
graphify codex install --project
```

A convenience script is available:

```powershell
./scripts/ai/setup-graphify.ps1
```

To install the skills and immediately build the first code-only graph:

```powershell
./scripts/ai/setup-graphify.ps1 -BuildGraph
```

The CLI package is named `graphifyy`; the command is `graphify`.

## Build the graph

Inside the supported assistant, use its Graphify command. In a regular PowerShell terminal, use the CLI without a leading slash.

For the initial graph use:

```powershell
graphify . --code-only
```

For later structural changes, prefer the update flow instead of rebuilding unnecessarily:

```powershell
graphify . --update
```

Generated data lives under `graphify-out/`.

## Query policy

Prefer small queries:

```powershell
graphify query "which components consume performers.json?" --budget 1200
graphify explain "Performers"
graphify path "performers.json" "Performers"
```

Then open only the files returned by the graph that are required for source verification.

## Do not do this

- Do not read `graphify-out/graph.json` directly into an LLM context.
- Do not dump the complete graph report into the session as orientation.
- Do not use Graphify for a trivial known-file content edit.
- Do not accept an INFERRED or AMBIGUOUS graph edge as proof when source code can verify it.
- Do not regenerate the graph after every CSS/text edit.

## Git policy

This repository ignores `graphify-out/` by default to keep generated graph data local and avoid churn.

The project-scoped Graphify skill itself may be committed after installation so Codex/Copilot can discover the integration consistently across machines.

## Verification

After setup:

```powershell
graphify --version
npm run ai:validate
```

## Project-scoped assistant skills

The repository commits Graphify skill trees for all development surfaces used by this project:

- `.copilot/skills/graphify/` — GitHub Copilot
- `.codex/skills/graphify/` — Codex (`$graphify` invocation)
- `.agents/skills/graphify/` — generic Agent-Skills-compatible fallback

The committed skill is a bootstrap/compatibility copy so a fresh clone already has discoverable instructions and references. Run `./scripts/ai/setup-graphify.ps1` on a development machine to refresh those trees from the locally installed Graphify version.

Project-specific guidance is also available in:

- `.copilot/skills/japan-day-project/`
- `.codex/skills/japan-day-project/`

These skills use progressive references for architecture, content ownership, SEO, workflow and validation so an agent does not need to load all project documentation for every task.
