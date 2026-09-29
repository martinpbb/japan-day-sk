# SEO foundation for japanday.sk

## Goal

Implement the durable SEO and information architecture for the Japonský deň čaju a kultúry event website while preserving the frontend-only React/Vite and static-hosting architecture.

## Required outcomes

- Official primary event name is `Japonský deň čaju a kultúry`.
- `Japan Day Považská Bystrica` is the short brand/subtitle and may be used as Schema.org `alternateName` and in concise/social communication.
- `japandaypb` is the social tag/handle form.
- Canonical public routes exist for programme, performers, gastronomy, exhibitors, practical information, gallery, about and contact.
- Route metadata is JSON-driven.
- Build output contains route-specific static HTML metadata.
- Canonical, Open Graph and JSON-LD are generated per route.
- Homepage uses `Festival` and organiser structured data.
- Subpages use `BreadcrumbList`.
- Sitemap and robots files are generated at build time.
- YouTube is click-to-load.
- No unconfirmed event facts are invented.

## Validation

- `npm run lint`
- `npm run build`
- verify `dist/program/index.html` contains programme metadata and canonical;
- verify homepage contains Festival JSON-LD;
- verify `dist/sitemap.xml` and `dist/robots.txt` exist;
- `git diff --check` where Git is available.
