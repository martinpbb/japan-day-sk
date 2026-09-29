---
applyTo:
  - "src/data/seo.json"
  - "src/seo/**/*"
  - "scripts/seo/**/*"
  - "index.html"
  - "src/components/**/*.jsx"
  - "public/images/**/*"
---

# SEO instructions

The canonical public domain is `https://japanday.sk`. The official event name is `Japonský deň čaju a kultúry`; `Japan Day Považská Bystrica` is the short brand/subtitle used as secondary communication.

## Durable rules

- Preserve one H1 per rendered route.
- Homepage H1 uses the official name `Japonský deň čaju a kultúry`; the current year may be communicated next to it or in surrounding copy.
- Use `Japan Day Považská Bystrica` as a short brand/subtitle, social label, or Schema.org `alternateName`, not as a replacement for the official event name.
- Social tag/handle form is `japandaypb`.
- Route metadata belongs in `src/data/seo.json`; do not duplicate title/description definitions across components.
- Every indexable route must have a canonical URL.
- Preserve route-level Open Graph metadata and JSON-LD.
- Use Schema.org `Festival` for the event while the site remains a festival/event website.
- Do not invent event end times, accessibility claims, transport details, performer biographies, exhibitor information or contact data.
- Do not add `meta keywords`; semantic topics are editorial guidance, not a keyword-stuffing mechanism.
- Keep static route generation compatible with static hosting.
- When adding a public route, add its SEO definition and ensure it appears in the generated sitemap.
- Meaningful images need accurate alt text; non-hero images should lazy-load.
- Preserve click-to-load YouTube behavior unless a task explicitly changes the performance strategy.
