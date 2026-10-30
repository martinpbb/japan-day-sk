# Workshop content completion

Branch main, starting HEAD dfc613775ab9562f14803e7a8f2d8a264bbe8702.

Preserved pre-existing catalog edits (Shodo sessions, Tsumami, Ayatori and removal of Cajove rozdiely). Updated Slovak workshop data, Workshops.jsx, WorkshopDetail.jsx and lib/workshops.js. Seven workshops remain; removed paid placeholder. Kept tvorba-kombiku ID/URL for compatibility while correcting its visible name. Added Origami sessions at 10:40, 12:10 and 13:40 on 2026-11-07, each 90 minutes, with unknown capacity/location and closed registration.

Added lecturer arrays supporting performer references and inline confirmed name/affiliation, with lecturerId fallback. Both views share the resolver. Expanded Origami/Shodo descriptions and rendered detail paragraphs separately. All category badges reuse programMeta styling. No backend, D1, deployment or registration changes.

PASSED: JSON/data assertions; production build (138 SEO route documents); focused ESLint for three changed JS/JSX files; git diff --check; targeted Chromium checks of overview and all seven details at widths 1280 and 390, with HTTPS requests blocked. Verified lecturer names, seven badges, session counts, closed registration messages and no horizontal page overflow. Full Playwright suite intentionally not run. Graphify updated; it reported changed community labels on initial refresh, no topology changes on final refresh.

No remaining task work. Next action: owner review of the local changes; do not deploy as part of this task.
