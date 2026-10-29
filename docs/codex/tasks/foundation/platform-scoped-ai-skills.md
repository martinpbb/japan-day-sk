# Platform-scoped AI skills

Ensure the repository contains discoverable project-scoped skills for both GitHub Copilot and Codex, not only generic `.agents` guidance.

Acceptance criteria:
- `.copilot/skills/graphify/` contains `SKILL.md`, `.graphify_version`, and progressive `references/`.
- `.codex/skills/graphify/` contains the equivalent Codex skill tree.
- both platforms have a `japan-day-project` skill with project-specific progressive references.
- `.agents/skills/graphify/` is available as a generic fallback.
- Graphify setup refreshes Copilot, Codex and generic Agent Skills.
- code-only build uses `graphify extract . --code-only`.
- AI validator fails when required platform-scoped skill files are missing.
