# Phase 2: V5 post-event homepage

Task: implement the approved V5 post-event homepage locally while preserving
Phase 1's 2026 archive. Visual source: `docs/design/post-event-v5/README.md` and
`reference.html`, with the original React/CSS artwork from `Hero.jsx`.

Branch: `feature/post-event-2026`. Starting HEAD:
`d88cd2e57d95eab9bcf6fab9f05a45c49e8d6fc9`.

## Implemented

- The public homepage uses a separate `PostEventHome` composition. The archive
  index retains the historical homepage and all its original content sections.
- Seven sections follow the requested order: thank-you hero, anonymous feedback,
  children's competition, memories, future plans, acknowledgements and archive.
  The newsletter is a separate card below the feedback form in the same section.
- The V5 layout uses the existing palette, typography, header, language selector,
  spacing tokens, rounded cards and original POVAŽSKÁ BYSTRICA artwork. The hero
  artwork is React/CSS, never a screenshot or generated image. The feedback
  section has an introduction beside the forms; the competition has an artwork
  placeholder collage; memories use a dark mosaic; acknowledgements use verified
  logos; the archive includes a banner and ten working section links.
- Main navigation and all new copy are localized in SK, EN, DE, ES and JA. New
  structured copy is additive under `site.postEvent` in each locale's existing
  `site.json`. Historical navigation, hero and other event data remain intact.
- The seven feedback questions comprise one optional 1–5 radio group, with the
  complete scale explained, and six optional textareas, limited to 2,000
  characters each. No identity or subscription consent is requested for feedback.
- The separate newsletter card has an optional name, required email, and required
  consent checkbox that starts unchecked. Native validation can be checked locally.
  Both submit buttons are disabled, and both submit handlers prevent default
  navigation. There is no endpoint, persistence, reset or success message. Clear
  notices explain that submission is unavailable and that drafts disappear on
  leaving the page. No production API was connected.
- Competition results, artwork, event photos and videos have explicit pending
  labels. No winners or media were fabricated. The complete-gallery control is
  disabled until real assets arrive; a separate link reaches the preserved
  archive gallery. Planned activities and the next edition remain unconfirmed;
  the involvement CTA opens the existing localized contact page.
- Acknowledgements reuse the existing `PartnerList` and verified partner data.
  Volunteers and supporters receive collective thanks without invented names;
  guests link to the archived performer directory.
- Only root route metadata changes in each `seo.json`. Homepage Event/offers
  schema is omitted to avoid advertising a scheduled event and available tickets.
  Existing static generation, canonicals, hreflang, sitemap, archive metadata and
  legacy redirects remain in place. There are still 170 canonical documents.

## Verification

- PASSED: `npm.cmd run lint`.
- PASSED: `npm.cmd run build`, including 170 generated localized SEO documents.
  Vite retains its nonfatal bundle-size warning: approximately 596 kB minified JS.
- PASSED: final complete default Chromium suite, 436 passed, one skipped, no
  failures or retries (2.7 minutes). The existing production-origin test is
  intentionally skipped on localhost; production was not contacted for that check.
  The PowerShell log-capture wrapper reported exit 1 after treating Node's
  `NO_COLOR`/`FORCE_COLOR` stderr warning as a `NativeCommandError`. The complete
  Playwright JSON and HTML reports independently confirm zero unexpected results,
  zero flaky tests and an empty top-level runner-error list. Test results above
  refer to those reports, not a claimed zero exit from that capture wrapper.
- PASSED: complete archive Chromium suite, 206 passed, no failures or skips.
  This includes generated metadata, preserved historical data, actual local HTTP
  redirects/404s, direct navigation/refresh, locale switching and closed
  registration without live API requests.
- All 31 new homepage tests passed in the first complete default run, covering
  section order, translated copy, local forms, consent, no data submission or
  storage, keyboard rating, reduced motion, Axe, SEO and responsive navigation.
  Axe reports no violations on the homepage in any supported language.
- PASSED: `git -c core.safecrlf=false diff --check`.
- PASSED: direct JSON comparison with HEAD: all historical site/SEO data remains
  identical after excluding only new `postEvent` copy and root metadata. The
  archive suite also compares all 55 historical content documents with HEAD.
- PASSED: new-copy encoding check for all five locales.
- PASSED: `graphify update .`, AST only. Local graph has 945 nodes / 1,594 edges /
  105 communities. Graphify warns that saved community names are stale; no paid
  semantic refresh was performed. The final update found no topology changes.
- VERIFIED visually: Slovak desktop at 1440px, Slovak mobile at 390px, and German
  tablet at 1024px. Additional Japanese mobile capture is available. All four
  captures loaded their actual organizer/partner logos and had no horizontal
  overflow. Automated responsive coverage includes every locale at 360/768/1440px,
  plus the existing 320px regression coverage.
- NOT RUN: Firefox/WebKit, production/CDN validation and `ai:validate` (no
  AI-support instruction files changed).

Initial failures were resolved: the first focused run found insufficient contrast
on the decorative archive year; the next found stylesheet precedence overriding
reduced-motion scrolling. Both were corrected and passed in the complete default
run. That run ended with 435 passed, one skipped and one failed: a historical
children's-poster test still expected future-facing invitation copy after being
moved to the archive. Its assertions now use the exact preserved archive JSON;
the complete default suite was rerun. An earlier partial exploratory run was
interrupted before completion and is not counted as verification.

The first archive command could not start Wrangler because the sandbox denied
reading its installed templates. Repeating the same localhost-only suite with
approved execution outside that restriction passed. No hosting configuration,
Worker code, D1, DNS, dependency, lockfile or GitHub workflow was changed. No
commit, push, PR, merge or deployment was performed.

## Modified files

Application:

- `src/App.jsx`
- `src/components/Footer.jsx`
- `src/components/Header.jsx`
- `src/components/Hero.jsx`
- `src/components/Partners.jsx`
- `src/components/PostEventHome.jsx` (new)
- `src/styles/post-event.css` (new)

Localized data:

- `src/data/locales/sk/site.json`
- `src/data/locales/sk/seo.json`
- `src/data/locales/en/site.json`
- `src/data/locales/en/seo.json`
- `src/data/locales/de/site.json`
- `src/data/locales/de/seo.json`
- `src/data/locales/es/site.json`
- `src/data/locales/es/seo.json`
- `src/data/locales/ja/site.json`
- `src/data/locales/ja/seo.json`

Tests and documentation:

- `tests/audit/interactions.spec.ts`
- `tests/data/archive-output.spec.ts`
- `tests/helpers/routes.ts`
- `tests/ui/archive.spec.ts`
- `tests/ui/children.spec.ts`
- `tests/ui/gastronomy.spec.ts`
- `tests/ui/seo.spec.ts`
- `tests/ui/video.spec.ts`
- `tests/ui/post-event.spec.ts` (new)
- `docs/notes/post-event-2026-homepage.md` (this note)

The owner supplied `docs/design/post-event-v5/` during this session. These
reference files remain unmodified and untracked; they are not generated homepage
assets. Reports, logs, screenshots and graph outputs are ignored local artifacts.

## Local review

```powershell
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/`, `/en/`, `/de/`, `/es/` and `/ja/`. Check the hero
CTA, anonymous inputs, unchecked newsletter consent, mobile navigation, language
switching, contact CTA and archive links. The archive remains at
`/archiv/2026/` with the same locale prefixes. Preview is sufficient for visual
review; the archive suite uses the existing local Static Assets runtime to test
real redirects and HTTP 404s.

```powershell
npm.cmd run test:e2e -- --workers=4
npx.cmd playwright test --config playwright.archive.config.ts --project chromium
```

Registration-reopening tests remain excluded from both normal configurations.
No test configuration changed in this phase.

Review artifacts:

- `test-results/post-event-review/desktop.png` and `mobile.png` (full page).
- `test-results/post-event-review/desktop-hero.png` and `mobile-hero.png` (viewport).
- `test-results/post-event-review/tablet-de.png` and `mobile-ja.png`.
- `playwright-report/post-event-default-final/index.html`.
- `playwright-report/post-event-archive/index.html`.
- `test-results/post-event-default-final-results.json`.
- `test-results/post-event-archive-results.json`.

Remaining content dependencies: confirmed competition results and publication
permissions, actual post-event media, confirmed plans and a separately approved
form/newsletter service. Local visual review is the next safe action.
