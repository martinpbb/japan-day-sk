---
applyTo:
  - "src/**"
  - "docs/**"
  - "vite.config.*"
---

# Graphify usage instructions

Graphify is a navigation and dependency-analysis aid, not a replacement for source verification.

When `graphify-out/graph.json` exists, use Graphify before broad repository search for:

- cross-file dependency questions;
- consumers/callers;
- data flow between JSON and React;
- routing/navigation relationships;
- blast-radius analysis.

Prefer `graphify query`, `graphify path`, and `graphify explain` with a small output budget.

After Graphify returns candidate paths, open only those source files required to verify the task.

Do not load raw `graphify-out/graph.json` into context and do not read the full generated report by default.

Skip Graphify for an obvious single-file edit.
