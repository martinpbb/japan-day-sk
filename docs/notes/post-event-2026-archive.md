# Phase 1: 2026 event archive

Task: implement the 2026 archive locally while preserving the existing homepage,
design, historical content and five supported languages. The approved V5 homepage
is outside this phase.

Branch: `feature/post-event-2026`. Starting HEAD:
`22d1669923ab6dc99c34b71b6d88ee35c409184b`. The existing branch was clean and
matched `origin/main` after fetching `main`. No commit, push, merge or deployment
was performed.

## Implemented

- The archive index reuses the original `HomePage` composition, `Hero` artwork,
  content components, images and locale JSON. Ten responsive section cards link
  to dedicated pages. The cream header, palette, typography and original
  production homepage composition remain in place. A footer link exposes the
  archive without replacing the homepage navigation.
- Archive pages explicitly identify the content as historical and the event as
  ended. Internal event links, catalogue/detail links, breadcrumbs and language
  switching stay within the archive. Contact and external exhibitor links retain
  their existing destinations.
- Workshops preserve stored descriptions, images, lecturers, prices, dates,
  locations, session times, capacities and drop-in information. Archive pages
  never mount registration/waiting-list forms or session-selection inputs, and
  never request live workshop availability. Historical registration settings in
  JSON remain intact. Backend registration closure is outside this frontend-only
  task; no API, Worker, D1 or registration records were changed.
- Static generation materializes directory HTML for all canonical archive pages.
  There are 160 archive documents (32 per locale) and 10 existing homepage/contact
  documents in the canonical sitemap: 170 total.
- Known historical routes have exact 301 rules in generated `dist/_redirects`
  for Cloudflare Static Assets. Generated legacy HTML documents provide
  JavaScript/meta-refresh/link fallbacks for GitHub Pages. JavaScript redirects
  retain query strings and fragments. The `japonstina` spelling remains an alias
  of `japoncina`, including inside the archive. There are 320 exact redirect rules.
- Unknown paths receive a real static-host HTTP 404 and localized missing-page UI,
  with `noindex` and no homepage canonical. No generic SPA fallback was added.
- New metadata lives in the existing five `seo.json` files. Canonical, Open Graph,
  hreflang, sitemap and breadcrumb URLs use localized archive paths. Archive pages
  omit Event/offers schema rather than creating new event facts or live ticket
  availability. Existing homepage Event metadata remains unchanged.

## URL structure

| Locale | Archive index |
| --- | --- |
| SK | `/archiv/2026/` |
| EN | `/en/archiv/2026/` |
| DE | `/de/archiv/2026/` |
| ES | `/es/archiv/2026/` |
| JA | `/ja/archiv/2026/` |

The same section slugs follow every index:

| Section | Suffix |
| --- | --- |
| Event overview | `o-podujati/` |
| Programme | `program/` |
| Performers and guests | `ucinkujuci/` |
| Workshops | `workshopy/` |
| Gastronomy | `gastronomia/` |
| Exhibitors | `vystavovatelia/` |
| Astronomy / From Amaterasu to the Sun | `astronomia/` |
| Children and families | `pre-deti/` |
| Historical practical information | `prakticke-informacie/` |
| Preserved gallery | `galeria/` |

Details retain their existing identifiers under `ucinkujuci/<id>/`,
`workshopy/<slug>/` and `vystavovatelia/<id>/`. For example,
`/en/workshopy/japonstina/` redirects to
`/en/archiv/2026/workshopy/japoncina/`.

## Verification

- PASSED: `npm.cmd run lint`.
- PASSED: `npm.cmd run build`, generating 170 canonical localized SEO documents,
  redirect documents/rules, sitemap, robots and a 404 document. Vite reports a
  nonfatal bundle-size warning (approximately 550 kB minified JS).
- PASSED: `git -c core.safecrlf=false diff --check`.
- PASSED: historical JSON preservation checks compare all 55 locale/content
  documents with HEAD while excluding only the newly added archive metadata/copy.
- PASSED: five-language generated canonical/hreflang/sitemap checks; alternate and
  breadcrumb targets all exist; legacy aliases are excluded from the sitemap.
- PASSED: exact HTTP 301 targets, retained queries/fragments, executed GitHub Pages
  redirect documents, actual HTTP 404 handling, and direct/refresh navigation on
  the local Cloudflare Static Assets runtime.
- PASSED: targeted practical-information and mobile follow-up, 10/10 tests. This
  includes Axe checks on archive cards in all five languages. SK/JA card
  screenshots were visually inspected after correcting inherited light text.
- PASSED: relevant regression follow-up, 95/95 Chromium tests. It covers existing
  workshop/localization/performer/programme tests, generated SEO, language
  switching, selected route refreshes, archive interaction and accessibility.
- PASSED: final complete archive suite, 201/201 Chromium tests, no retries, skips
  or failures (approximately 1.6 minutes). This run uses the final build and
  corrected shared test setup. Report: `playwright-report/archive-complete/`;
  machine-readable results: `test-results/archive-complete.json`.
- PASSED: `graphify update .` (AST-only), 917 nodes / 1535 edges / 100 communities.
  Graphify warns that saved community labels are stale. No semantic/LLM refresh
  was run. Graph outputs are ignored local artifacts.
- NOT RUN: the entire legacy suite, Firefox/WebKit, production/CDN checks,
  deployment, and `ai:validate` (no AI-support instruction files changed).

Initial failures were investigated rather than hidden: the first new interaction
tests incorrectly classified external exhibitor links and the existing contact
form as registration UI. The full archive run then exposed a test initialization
script writing localStorage inside a blocked map iframe; initialization is now
limited to the main frame. Existing regression failures expected pre-archive
localized URLs or live registration/occupancy. Those assertions were updated to
the requested archive behavior, including stronger checks that no API requests,
registration inputs or live occupancy occur. Historical content assertions and
registration validation unit tests remain in place.

## Changed files

Application and routing:

- `src/App.jsx`
- `src/lib/archiveRoutes.js` (new)
- `src/lib/eventArchiveContext.js` (new)
- `src/lib/useEventArchive.js` (new)
- `src/lib/workshopApi.js`
- `src/components/ArchiveNavigation.jsx` (new)
- `src/components/ArchiveNotice.jsx` (new)
- `src/components/Breadcrumbs.jsx`
- `src/components/Children.jsx`
- `src/components/ExhibitorDetail.jsx`
- `src/components/Exhibitors.jsx`
- `src/components/Footer.jsx`
- `src/components/Gastronomy.jsx`
- `src/components/Header.jsx`
- `src/components/Hero.jsx`
- `src/components/PerformerDetail.jsx`
- `src/components/Performers.jsx`
- `src/components/Program.jsx`
- `src/components/WorkshopDetail.jsx`
- `src/components/Workshops.jsx`
- `src/components/WorkshopsTeaser.jsx`
- `src/styles/global.css`

Localization and SEO:

- `src/data/locales/{sk,en,de,es,ja}/site.json` (five files, additive archive copy)
- `src/data/locales/{sk,en,de,es,ja}/seo.json` (five files, additive archive metadata)
- `src/seo/SEO.jsx`
- `src/seo/schema.js`
- `scripts/seo/generate-static-routes.mjs`

Tests and review documentation:

- `playwright.archive.config.ts` (new local-only Static Assets test configuration)
- `tests/helpers/archive.ts` (new)
- `tests/helpers/assertions.ts`
- `tests/data/archive-output.spec.ts` (new)
- `tests/data/sitemap.spec.ts`
- `tests/ui/archive.spec.ts` (new)
- `tests/ui/locales.spec.ts`
- `tests/ui/performers.spec.ts`
- `tests/ui/program.spec.ts`
- `tests/ui/registration.spec.ts`
- `tests/audit/content.ts`
- `tests/audit/integration.spec.ts`
- `tests/audit/interactions.spec.ts`
- `tests/audit/routing.spec.ts`
- `docs/notes/post-event-2026-archive.md` (this note)

No dependency, lockfile, asset, production hosting configuration, GitHub workflow,
workshop Worker/D1 or `tvoj-hlas` change was made.

## Local review

From the repository root, run:

```powershell
npm.cmd run build
npx.cmd wrangler dev --config wrangler.web-staging.jsonc --local --compatibility-date 2026-11-09 --ip 127.0.0.1 --port 8787
```

Open `http://127.0.0.1:8787/archiv/2026/` and its localized variants above. Review
the cards, open a workshop, switch language, refresh, and try a legacy detail URL
and an invalid URL. The installed workerd supports dates only through 2026-11-09;
the command overrides the date solely for this local process. The staging
configuration remains at its existing date. Initial sandbox restrictions prevented
Wrangler from reading installed templates, so browser checks ran with approved
local execution outside that restriction.

Run the complete archive checks with:

```powershell
npx.cmd playwright test --config playwright.archive.config.ts --project chromium
```

Generated reports and screenshots are ignored local artifacts under
`playwright-report/` and `test-results/`; commands and outcomes are recorded above.
The relevant regression command initially passed 79/89 tests; all ten failures
were obsolete URL or occupancy expectations. The subsequent 95/95 follow-up also
included the affected audit tests. Its reports are under
`playwright-report/archive-regression-followup/` and
`test-results/archive-regression-followup.json`.

## Remaining limitations

- Previously audited damaged historical translations and other unrelated content
  defects remain as supplied. New archive copy is validated separately. See
  `comprehensive-regression-audit-2026-11-02.md`; this phase preserves that content
  rather than inventing replacement text.
- The unchanged homepage still represents the original event; the V5 post-event
  thank-you homepage and future navigation remain a separate phase.
- GitHub Pages cannot emit HTTP 301 using static HTML alone. Its generated
  document fallback is tested locally; actual production hosting/CDN behavior was
  not tested or changed. Without JavaScript, the meta-refresh fallback uses the
  canonical destination; retaining arbitrary query parameters requires JavaScript.
- Public frontend closure does not alter backend registration policy. Any separate
  API closure is outside the explicitly protected Worker/database scope.

Next safe action: review the local archive and its generated report before
starting the separate V5 homepage phase.
