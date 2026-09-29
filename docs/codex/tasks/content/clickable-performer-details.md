# Clickable performer detail pages

## Goal
Make performer cards and programme performer links open a dedicated, shareable performer detail page.

## Requirements
- The entire performer card is keyboard- and pointer-clickable.
- Performer detail URLs use `/ucinkujuci/<performer-id>`.
- Detail content remains sourced from `src/data/performers.json` and linked programme entries from `src/data/program.json`.
- Programme links point directly to performer detail pages.
- Static SEO generation includes every performer detail route in generated HTML and `sitemap.xml`.
- Performer detail breadcrumbs include `Účinkující` as the parent route.
- Do not introduce a routing dependency or backend.
