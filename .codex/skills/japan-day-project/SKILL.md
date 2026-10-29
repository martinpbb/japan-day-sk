---
name: japan-day-project
description: Project-specific guidance for the Japan Day Považská Bystrica / Japonský deň čaju a kultúry React/Vite website. Use for implementation, content, SEO, routing, data ownership, and handoff tasks in this repository.
---

# Japan Day project skill

Before editing, classify the task and load only the relevant reference:

- `references/architecture.md` — application structure and routing
- `references/content-model.md` — JSON ownership and relationships
- `references/seo.md` — static SEO, canonical, schema and sitemap
- `references/workflow.md` — task/handoff and context-cost discipline
- `references/validation.md` — required checks and reporting

Core rules:
1. Keep the site frontend-only/static unless a task explicitly changes that architecture.
2. Prefer `src/data/*.json` for event content rather than hard-coded React copy.
3. The official event name is **Japonský deň čaju a kultúry**. **Japan Day Považská Bystrica** is the short brand / subtitle.
4. Preserve static SEO generation and performer detail routes.
5. For cross-file impact questions, use the Graphify skill first when a current graph exists.
6. Make the smallest coherent change and report what was actually validated.
