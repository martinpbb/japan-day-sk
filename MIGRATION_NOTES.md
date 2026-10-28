# japan-day-sk merged upgrade

This project is based on the Slovak `japan-day-sk` event content and configuration, upgraded with newer functionality from the Czech `japan-day` codebase.

## Preserved from Slovak version
- default locale `sk`
- locales: `sk`, `en`, `de`, `es`, `zh`, `vi`
- Slovak public routes (`/ucinkujuci`, `/vystavovatelia`, `/prakticke-informacie`, `/pre-deti`, `/galeria`, `/o-podujati`, `/gastronomia`)
- `japanday.sk` CNAME/canonical/production configuration
- Slovak event metadata, organizers, partners, performers and translations
- Slovak visual theme colors
- Slovak social/OG assets where present

## Upgraded functionality
- latest cookie-consent behavior
- newer children section with optional competition support
- newer programme layout and optional hall-plan support
- programme empty-state retained for unfinished SK schedule
- performer detail improvements
- exhibitor cards supporting external URLs
- internal exhibitor detail pages
- generic exhibitor detail SEO route generation
- expanded gastronomy rendering support
- newer global responsive/detail-page styling
- BOM-tolerant static SEO route generation
- dynamic sitemap test instead of a brittle hardcoded URL count

## Content migration behavior
Existing Slovak locale JSON files were preserved. New features are optional until the corresponding data is added:
- `program.plan`
- `children.competition`
- exhibitor `detail` / `gallery`
- performer `represents` / `website` / `leader`

No Czech event programme, performers, exhibitors or event-specific copy was copied into Slovak locale data.

## Validation performed
- all locale JSON files parse successfully
- all expected Slovak route keys exist in every locale
- all first-party image paths currently referenced by Slovak locale data exist
- no Czech domain or Czech public-route slugs remain in `src` / `scripts`

A full npm build could not be executed in the merge environment because dependency installation timed out. Run locally:

```bash
npm ci
npm run build
npm run test:e2e
```
