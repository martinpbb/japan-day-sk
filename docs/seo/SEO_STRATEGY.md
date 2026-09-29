# SEO strategy — japanday.sk

## Brand

- Domain: `japanday.sk`
- Official event name / primary identity: **Japonský deň čaju a kultúry**
- Short brand / subtitle: **Japan Day Považská Bystrica**
- Social tag / handle form: **japandaypb**
- Descriptor: **Festival japonské kultury, gastronomie a tradic**
- Use `Chyne` without diacritics only where technically useful, such as filenames or identifiers.

## Information architecture

Public canonical routes:

- `/`
- `/program`
- `/ucinkujuci`
- `/gastronomia`
- `/vystavovatelia`
- `/prakticke-informacie`
- `/galeria`
- `/o-podujati`
- `/kontakt`

The current year remains primarily on `/`. Historic editions may later use `/2025`, `/2026`, etc., but should not be introduced until archival content exists.

## Metadata and structured data

Route-level SEO data lives in `src/data/seo.json`.

The runtime SEO component updates metadata during client navigation/rendering, while the post-build generator creates static route HTML documents containing:

- title;
- meta description;
- canonical URL;
- Open Graph metadata;
- social preview image;
- JSON-LD;
- route-level breadcrumbs where applicable.

Homepage and programme use Schema.org `Festival`. The structured event `name` uses **Japonský deň čaju a kultúry 2026** and `alternateName` uses **Japan Day Považská Bystrica 2026**. Homepage also includes the organiser `Organization`. Subpages include `BreadcrumbList`.

The detailed programme and exact opening/closing time are not yet confirmed. Do not invent them in JSON-LD or visible copy.

## Local SEO

Use the complete venue address where appropriate:

`Dom kultúry, Považská Bystrica`

Natural copy should also mention:

- Považská Bystrica;
- Trenčiansky kraj;
- Slovensko.

## Semantic topics

The topic set is stored in `src/data/seo.json` as editorial guidance. Do not emit a legacy `meta keywords` tag and do not keyword-stuff copy.

Important natural-language topics include Japan Day Považská Bystrica, Japonský deň v Považskej Bystrici, Japonský deň čaju a kultúry, festival japonskej kultúry, japonská gastronómia, sushi, sashimi, japonský čaj, saké, japonská whisky, samurajská show, tameshigiri, aikido, kendó and ikebana.

## Images

- Use descriptive filenames.
- Give meaningful images accurate alt text.
- Avoid keyword stuffing in alt text.
- Non-hero content images should lazy-load.
- Prefer WebP/AVIF for final photography when practical.
- Social preview target: 1200 × 630 px.

The current `public/images/social/japan-day-povazska-bystrica-2026-og.png` is a project placeholder and should be replaced by the final event key visual before launch without changing its public path.

## Video

YouTube is intentionally click-to-load. Until a visitor clicks the thumbnail, the iframe is not created. This reduces third-party work during initial page load.

## Static route generation

`npm run build` runs Vite and then `scripts/seo/generate-static-routes.mjs`.

The generator creates route directories such as:

`dist/program/index.html`

and also generates:

- `dist/sitemap.xml`
- `dist/robots.txt`

This preserves static hosting and provides indexable route-specific metadata without adding a server runtime.
