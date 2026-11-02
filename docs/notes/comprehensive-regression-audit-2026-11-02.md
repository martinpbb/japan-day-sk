# Comprehensive website regression audit — 2 November 2026

Branch: `main`. Starting HEAD: `6fb686efddca1ede60dee6345bc71bbef10a775e`. Starting worktree: clean.

Scope: built static site on Vite preview, Chromium, SK/EN/DE/ES/JA only. No deployment, Worker edits, production D1 writes, live registration submissions, or real contact messages. Existing contact tests intercept Formspree. API reads are distinguished from mocked fallback checks. Firefox/WebKit and production hosting rewrite behavior are not verified by local Chromium tests.

## A. Executive summary

**382 unique tests: 334 passed, 46 failed, 2 skipped; 1 blocked live-API check is included in the skipped count.** The 46 failures comprise 17 application audit cases and 29 stale/ambiguous legacy test cases. Audit verdict: application defects exist; passing routing does not imply complete content/localization acceptance.

| Execution | Total | Passed | Failed | Skipped |
|---|---:|---:|---:|---:|
| Full Chromium suite, 2 workers, no retries | 377 | 337 | 39 | 1 |
| Loaded-image screenshots and new integration checks | 37 | 32 | 4 | 1 |
| Corrected/expanded homepage localization assertions | 5 | 0 | 5 | 0 |
| Screenshot-discovered mobile hero overlap checks | 2 | 0 | 2 | 0 |

Unique totals use the latest result for each test, so focused reruns are not counted as additional tests. The original full suite report is preserved. The API skip is caused by local-origin CORS; the other skip is the production-only test. There were no flaky/retried cases.

## B. Critical issues

No confirmed BLOCKER. Findings are recorded without application fixes.

| ID / Severity | Route / locale | Expected | Actual / likely cause | Evidence |
|---|---|---|---|---|
| AUD-01 HIGH | `/ucinkujuci/japonske-kvety/`, `/vystavovatelia/`, `/workshopy/tsumami-zaiku/` and their localized equivalents; SK/DE/ES/JA | Readable translated copy | 42 JSON string fields contain literal `?` replacing letters; Japanese fields are almost entirely question marks. Source text was already destroyed before JSON parsing; UTF-8 decoding itself succeeds. EN has no match. | `tests/audit/data.spec.ts` encoding checks; `test-results/source-audit.json`; Jana and JA workshops screenshots |
| AUD-02 MEDIUM | `/en/`, `/de/`, `/es/`, `/ja/` | CTA describes the published programme | “Programme coming soon”, “Programm in Vorbereitung”, “Programa en preparación”, “プログラム準備中”. Locale site content was not updated alongside SK. | Homepage/programme localization tests; JA homepage screenshot |
| AUD-03 MEDIUM | All locale homepages and SEO metadata | No third-edition copy or previous-years placeholder section | Third-edition claims remain in About text and translated hero subtitles; SK SEO description still says `3. ročník`. The previous-years gallery placeholder is rendered on the homepage. Content/data and homepage composition still include them. | SK/JA homepage screenshots; `src/data/locales/*/site.json`, `seo.json`; Gallery component |
| AUD-04 MEDIUM | `/en/program/`, `/de/program/`, `/es/program/`, `/ja/program/`; localized home programme | Programme UI translated | `Veľký sál`, `Hlavný program`, `Bábkové divadlo`, `Prednášky`, `Kapacita: 100 osôb`, and `min` are hard-coded in `Program.jsx`. Disclaimer is translated correctly. Workshop teaser heading/intro are also hard-coded Slovak in `WorkshopsTeaser.jsx`. | Programme localization tests; JA homepage screenshot |
| AUD-05 MEDIUM | `/workshopy/` and locale equivalents | Valid definition-list semantics | Drop-in availability note is a text-only `<div>` inside `<dl>`, without a `dt/dd` group. Axe reports serious `definition-list`. | SK/JA workshop axe tests and attached axe results; `Workshops.jsx` |
| AUD-06 MEDIUM | Workshop detail routes in EN/DE/ES/JA | Translated registration fields and messages | Field labels `Meno`, `Priezvisko`, `Telefón` remain Slovak. `WorkshopRegistrationForm.jsx` imports the single Slovak `registration.json` for fields, validation and result copy. | Registration localization checks; detail screenshot/source |
| AUD-07 LOW | Homepage workshop teaser, all locales | Drop-in button-making is described as a continuous window | Teaser counts its single availability-window record as one session (`1 Termíny` in SK), though overview/detail correctly show drop-in wording. | SK homepage screenshot; `WorkshopsTeaser.jsx` sessionCount rendering |
| AUD-08 MEDIUM | `/`, `/ja/` at 390×844 | Vertical Japanese text and date/city remain separate | Vertical text intersects the card facts/title area despite remaining inside the card. Absolute positions and reduced mobile card height do not reserve enough space. | `test-results/mobile-home-top.png`; SK/JA mobile hero failure screenshots and traces; `tests/audit/responsive.spec.ts` |

## C. Routing

All 170 generated public routes (34 per locale) were opened directly and refreshed. Coverage includes every configured SEO route, all performer profiles, all eight workshop details, and configured exhibitor details. Every required detail in the request is included. Local preview returns 200 and renders nonempty pages with the expected document language.

Six language-switch flows cover homepage, programme, Hisayo detail, workshop overview/detail and exhibitors; each switches EN → DE → ES → JA → SK and checks equivalent path plus active label.

Production server redirects, refresh rules and CDN caching are outside local preview verification. Canonical targets are checked against generated files and local browser routes, not production HTTP responses.

## D. Localization

All 50 expected locale JSON files exist and parse. Strict UTF-8 decoding succeeds. Corruption scan: SK 12, EN 0, DE 9, ES 9, JA 12 fields. No repair or guessed translation was applied. Programme/workshop/performer references resolve; performer ID order and image paths match SK.

Japanese workshop fact labels and `30分` / `45分` formatting pass. The localized closed-registration message passes under explicit unavailable-API fallback. Remaining Slovak leakage is detailed in AUD-04/AUD-06. Japanese promo title is English (`Japanese Speech Contest & Prize Draw`); this may be an event title, so translation intent needs editorial confirmation.

## E. Workshops

Local structured data matches the requested workshop rules across all five locales:

| Workshop | Sessions/window | Duration | Capacity per session | Lecturer |
|---|---|---|---|---|
| Japončina | 11:00, 13:00, 15:00 | 30 min | 15 | Hisayo Yasuda |
| Tsumami zaiku | 11:40, 13:40 | 30 min | 2 | Hisayo Yasuda |
| Ayatori | 12:20, 14:20 | 30 min | 10 | Hisayo Yasuda |
| Tvorba gombíkov | continuous 11:00–14:30 | approx. 15 min | unset | Aiko Bosák; from €2/piece |
| Kumihimo | 11:00, 12:15, 13:30, 14:45 | 45 min | 10 | Mgr. Ivana Mičkalová |
| Čajová degustácia | 13:30 | 45 min | 15 | Martin Labudík |
| Shodō | 11:00, 13:30, 15:30 | 90 min | 20 unchanged | Akiko Komura / František Paulovič |
| Origami | 11:00, 11:45, 12:30, 13:15, 14:00 | 30 min | 15 | Asuka Emura; Hisayo optional support |

Hisayo mandatory timeline (Europe/Bratislava): 11:00–11:30 Japončina; 11:40–12:10 Tsumami; 12:20–12:50 Ayatori; 13:00–13:30 Japončina; 13:40–14:10 Tsumami; 14:20–14:50 Ayatori; 15:00–15:30 Japončina; 15:40–16:20 lecture. No mandatory overlaps in any locale.

Optional Origami support overlaps mandatory activities at 11:00–11:30, 11:45–12:10, 12:30–12:50, 13:15–13:30, 13:40–13:45, 14:00–14:10 and 14:20–14:30. This is an operational limitation of optional support, not a mandatory schedule conflict. Exact machine-readable timeline is attached to Hisayo tests and saved in `source-audit.json`. Akiko and Martin's local schedules were also checked without mandatory overlaps.

## F. Performers / exhibitors

Nao remains first in the shared performer order. All profiles, including the requested nine, are covered in every locale. Image path parity is verified; missing intentional image sources render existing placeholders. Jana/Hemerocallis Slovensko appears exactly once among six exhibitors in every locale; biography content exists but is corrupted in four locales (AUD-01).

Hisayo promo is between biography and programme; seven fact rows and the `https://www.j-pad.eu/` CTA render. The CTA has `_blank` and `noopener noreferrer`. Poster file is absent; text fallback works. The absent poster is handled by the intended image-error fallback; Vite may return SPA HTML for a missing asset, so HTTP status alone would not verify image decoding. The missing-poster test explicitly exercises a 404 response.

## G. Responsive / UI

32 route/viewport cases cover 1600×900, 1366×768, 768×1024 and 390×844. Screenshots cover SK/JA homepage, SK programme, SK/JA workshops, Hisayo, Jana and workshop detail. Additional existing tests include 320 px.

Hero mountain and vertical Japanese text bounding boxes stay inside the card. No document horizontal overflow was detected in these cases. However, a close mobile screenshot inspection identified AUD-08; dedicated SK/JA geometric overlap assertions both fail. Containment within a card alone does not prove its text regions do not overlap. Actual screenshots are visually reviewed; content and accessibility defects are still reported. Screenshots are diagnostics, not comparisons to an approved visual baseline. Missing promo poster means poster cropping cannot be verified.

## H. Consent / analytics

Clean-storage dialog, necessary-only, analytics opt-in, localStorage persistence, reload, reopening in footer and changing the preference are covered. Translated cookie headings pass in all locales; keyboard Enter and mobile fit are covered.

Generated HTML includes one GTM container `GTM-MGF62FC3`, one direct GA4 config `G-80MZ8NGTCN` and Consent Mode defaults before both. `analytics_storage`, `ad_storage`, `ad_user_data` and `ad_personalization` start denied. Analytics choice grants only analytics storage. Tests inspect dataLayer and do not require actual Google requests to succeed.

External GTM configuration was not inspected or modified. If GTM also configures the same GA4 stream, the direct gtag integration presents a duplicate-measurement risk; this remains conditional, not a confirmed duplicate.

## I. Accessibility

Existing axe and keyboard tests plus added SK/JA workshop, detail, promo and exhibitor audits were run. Serious definition-list failure is AUD-05. The cookie UI has dialog role and labelled heading; necessary consent is keyboard-operable. Forms have associated labels and inspected images have alt attributes. Native navigation and mobile menu interactions are exercised. Source contains focus-visible styling and reduced-motion handling. No claim of full WCAG certification or exhaustive screen-reader testing is made.

## J. SEO / broken links / runtime

All 170 static HTML documents have the expected canonical and six hreflang entries (five supported locales plus x-default); all alternate targets exist. Sitemap covers generated localized performer and workshop routes. No zh/vi alternate is present. Stale editorial SEO copy remains AUD-03.

All five rendered-link crawls pass: 33 distinct internal paths per locale, seven distinct external hrefs per locale, zero internal 404/unmapped routes and zero missing same-page anchor targets. All configured routes are separately tested, including routes without inbound links.

Across the 170 instrumented direct-route tests: zero uncaught exceptions, zero first-party HTTP/resource failures and zero failed first-party JS chunks. External failures are not silently omitted: there are 325 distinct failed URLs after deduplication: 314 GA collection requests aborted during navigation/reload, four Google requests aborted during navigation/reload, and seven workshop API URLs failing with CORS/ERR_FAILED. The browser reports missing Access-Control-Allow-Origin for the local preview origin. GA aborts are navigation lifecycle observations, not evidence of an ad blocker.

**BLOCKED (local integration):** live workshop availability and registration schedule parity cannot be verified from http://127.0.0.1:4173 because the production API rejects that origin. All seven session-backed workshop detail slugs are affected in all locales; drop-in button-making does not request the API. Fallback renders correctly and explicit mocked-unavailable tests pass. This is not proof that production-origin CORS is broken. No Worker/config workaround was applied.

Raw runtime/error URLs and console messages are retained in `test-results/audit-summary.json` and per-test runtime attachments; live-response evidence is in the focused integration test report. No external availability assertion is used for external hyperlinks; their URL protocols are validated.

## K. Commands and verification

- `git status --short`, `git branch --show-current`, `git rev-parse HEAD`: clean starting main at the HEAD above.
- `npm run lint` / `npm run build`: initial PowerShell shim execution blocked by ExecutionPolicy. Equivalent `npm.cmd` commands succeeded; no policy change was made.
- `npm.cmd run lint`: PASSED.
- `npm.cmd run build`: PASSED, 170 route documents plus sitemap/robots.
- `git diff --check`: PASSED.
- `graphify query "routing localization workshops consent Playwright tests" --budget 1200`: scoped candidates found; budget truncation acknowledged and source verified directly.
- Initial smoke: 8 passed / 7 failed because `header` matched the banner and venue headers. After small infrastructure fixes, quoted `--grep '@smoke'`: 15 passed. An earlier unquoted PowerShell `@smoke` invocation selected no tests; it is not counted as an application failure.
- Strict UTF-8 / JSON source audit: 50 parsed; content corruption reported in 42 fields.
- Full suite and focused follow-up counts are appended below; all failures are retained.
- `graphify update .`: PASSED, AST-only; final refresh: 772 nodes / 1203 edges. Community-label refresh warning is unrelated to application acceptance; no paid semantic refresh was run.
- `npm run ai:validate`: NOT RUN; no AI-support file was changed.

### Legacy test failures (29; separate from application defects)

| Cases | Test file | Root cause / current evidence |
|---:|---|---|
| 20 | tests/ui/seo.spec.ts route metadata | Expects seven alternates; current supported output correctly has six. New generated-route checks pass for all 170 documents. |
| 1 | tests/ui/seo.spec.ts JA Event | expectedLanguage has no JA entry; actual JSON-LD language is correctly ja. |
| 2 | tests/data/program-integrity.spec.ts | Expects old theatre times, 45-minute Japanese classes and old instructors. Current requested data checks pass. |
| 1 | tests/data/sitemap.spec.ts | Expected-route builder omits workshop detail paths; current sitemap includes them correctly. |
| 1 | tests/ui/header.spec.ts | Broad header selector matches banner plus two venue headers. Actual banner and navigation pass dedicated route checks. |
| 1 | tests/ui/locales.spec.ts JA workshop UI | Searches the old bilingual Ayatori title rather than the localized Japanese title. New Japanese workshop UI check passes. |
| 1 | tests/ui/navigation.spec.ts | Header route fixture omits /workshopy. New route/switch/click tests pass. |
| 2 | tests/ui/program.spec.ts | Assumes Hisayo is first theatre speaker and checks obsolete workshop times/instructors. Current source differs and new requirements pass. |

The existing conflict test also passes while asserting that historical time overlaps are true; it is not evidence that current schedules conflict. The new independent interval checks use current data.

### Actual browser execution commands

All use the existing playwright.config.ts and Chromium project, two workers, no retries. Reporter output paths were selected with PLAYWRIGHT_JSON_OUTPUT_NAME and PLAYWRIGHT_HTML_OUTPUT_DIR; logs are ignored *.log files.

- npx.cmd playwright test --project=chromium --workers=2 --output=test-results/full --reporter=list,html,json — FAILED, 337/39/1.
- npx.cmd playwright test tests/audit/responsive.spec.ts tests/audit/integration.spec.ts --project=chromium --workers=2 --output=test-results/follow-up --reporter=list,html,json — FAILED, 32/4/1. Screenshot follow-up waits for lazy images and captures consent plus clean layouts.
- npx.cmd playwright test tests/audit/interactions.spec.ts --grep 'published homepage and programme' --project=chromium --workers=2 --output=test-results/localization --reporter=list,html,json — FAILED, 0/5/0. Corrected a newly added multi-header assertion and broadened stale-copy detection; failures now reflect real copy/UI issues.
- npx.cmd playwright test tests/audit/responsive.spec.ts --grep 'home-(sk|ja) 390' --project=chromium --workers=2 --output=test-results/mobile-hero --reporter=list,html,json — FAILED, 0/2/0; proves screenshot-discovered text intersection.
- Final npm.cmd run lint and git diff --check — PASSED. Build was not repeated because application/build inputs were not changed after the successful build.

### Artifacts and visual review

- [Full HTML report](../../playwright-report/index.html), [screenshot/registration follow-up](../../playwright-report/follow-up/index.html), [localization follow-up](../../playwright-report/localization/index.html), [mobile hero evidence](../../playwright-report/mobile-hero/index.html).
- [Latest deduplicated results](../../test-results/final-audit-results.json); [full-suite runtime and links](../../test-results/audit-summary.json); [source content and schedules](../../test-results/source-audit.json).
- [Screenshot index](../../test-results/audit-screenshots.md), including all ten requested views. The review inspected loaded-image SK/JA homepage desktop, programme, SK/JA workshops, Hisayo and Jana profiles, workshop detail, mobile homepage and mobile workshops. [Native-width mobile hero crop](../../test-results/mobile-home-top.png) makes AUD-08 readable.
- Failure screenshots, videos and traces remain under the corresponding test-results run directories. Generated files are ignored and were not staged or committed.

Next safe action: review AUD-01 through AUD-08 and authorize a separate frontend/content repair task. Live API parity needs a permitted test origin or an isolated API mock/staging environment; do not alter production D1/Worker as part of this audit.

## L. Files modified

**No application files modified.** No dependency, Worker, deployment or database change.

Test infrastructure fixes: `tests/ui/locales.spec.ts` (banner selector), `tests/helpers/network.ts` (origin classification after navigation and banner selector), `tests/data/image-integrity.spec.ts` and `tests/data/performer-integrity.spec.ts` (five supported locales; removed zh/vi test attempts and included JA).

Added scoped audit coverage under `tests/audit/`: shared content helper, static/data checks, routing/link crawl, interactions/localization/axe, responsive screenshot cases and registration/API integration checks. This report is the only documentation change. Generated browser artifacts and logs remain ignored; no commit was created.

