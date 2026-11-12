# Cloudflare Static Assets migration validation — 12 November 2026

## Repository state

- Branch: `migration/cloudflare-static-assets`
- HEAD at review start: `cb8f19fef82d28ee9f5bffc2c3a848311016d75a`
- Existing uncommitted migration files were preserved.
- No Cloudflare deployment, DNS change, production Worker/D1 operation, push, PR, or merge was performed.

## Validation results

- `npm.cmd run build` — passed. Vite generated the production bundle; SEO generation wrote 165 localized route documents, `sitemap.xml`, and `robots.txt`. The existing bundle-size advisory remains (>500 kB).
- `npm.cmd run lint` — passed.
- `node --test src/lib/workshopAvailability.test.js worker/src/worker.test.js` — passed, 18 tests (from the initial migration audit).
- `node scripts/cloudflare/check-worker-config.mjs` — passed. The staging config is an assets-only Worker named `japanday-sk-web-staging`, with no routes or data bindings.
- `node scripts/cloudflare/check-static-assets.mjs` — passed; all 165 sitemap URLs map to generated HTML with canonical metadata, language alternates, and descriptions.
- `node scripts/cloudflare/prepare-staging-output.mjs` and `node scripts/cloudflare/check-staging-output.mjs` — passed; staging-only noindex headers and `404.html` exist in ignored `dist/`.
- `npx.cmd wrangler types ... --config wrangler.web-staging.jsonc` — passed during the initial audit.
- Event JSON-LD targeted Playwright run — 5 passed (SK, EN, DE, ES, JA). The runner reported a separate plugin teardown timeout after the tests; the full suite below completed normally.
- Full Chromium Playwright suite — 394 passed, 2 skipped, 0 failed (396 total). The read-only live API test and the production-only checks were skipped (not configured for this local run). Direct route and refresh checks passed against Vite preview.
- `git diff --check` — passed.

## JSON-LD finding and fix

The test expected Marek Hora in `Event.performer`, but the current Slovak content has no Marek performer profile or programme entry. It credits him in the gastronomy description for preparing sushi. Current `src/seo/schema.js` explicitly lists the three event performers Noriko Komiyama, Gorin, and Martin Labudík. The stale test assumption was corrected to assert those three; event source data and schema were not expanded with unsupported information.

## Dependency audit

The current online `npm audit --json` report contained 32 vulnerable package records: 21 high, 7 moderate, and 4 low. The affected packages trace through development tooling (Vite, ESLint, React tooling, and their transitive dependencies); the vulnerable direct packages are all `devDependencies`. No production runtime dependency was identified in the report.

`npm audit fix` could not complete: the default npm cache path was denied by the Windows filesystem sandbox. Retrying with a workspace-local cache failed with `ECONNRESET`; `package.json` and `package-lock.json` were unchanged. An offline audit returned no advisory data and is not treated as a clean audit. No `--force` operation was used. Safe remediation remains outstanding, including updating the vulnerable direct tooling and re-running the online audit plus build/lint/tests.

## Wrangler and HTTP limitations

- Wrangler 4.156.2 config parsing/types succeeded. Both `wrangler deploy --dry-run` and `wrangler dev --local` failed on Windows while bundling Wrangler's generated no-op Worker: `Cannot read directory "../../..": Access is denied` and failure to resolve `node_modules/wrangler/templates/no-op-worker.js`.
- Added an Ubuntu GitHub Actions validation step that runs the same deploy dry-run with an output directory. This step does not upload. Linux package generation is **not yet verified**; the workflow must run successfully before staging approval. WSL is blocked by access denied and Docker has no available daemon in this environment.
- A local Vite preview returned 200 for `/`, `/en/`, `/de/`, a performer detail page, `/sitemap.xml`, and a JS asset. It also returned 200 for an unknown path, demonstrating that Vite preview does not validate Cloudflare's 404 handling. It did not emit the staging `_headers` response headers. No Cloudflare-compatible HTTP preview was available locally.
- The staging config selects `auto-trailing-slash` and `404-page`; generated directory index pages, trailing-slash canonical URLs, sitemap, and hreflang were statically verified. The Worker HTTP redirects, 404 status, and response headers remain unverified until the Linux dry-run and a staging deployment.

## API and CORS

The production API Worker and D1 configuration were not changed. The API allowlist in `worker/src/worker.js` includes `https://japanday.sk`, `https://www.japanday.sk`, and `http://localhost:5173`, but not a `workers.dev` origin. Browser reads/preflights from staging therefore fail CORS; credentialed admin calls and registration POSTs cannot be end-to-end tested there. Do not point staging at production write flows.

For frontend coverage, use Playwright route mocks or a disposable mock API. For integrated API validation, use a separately approved staging API Worker with isolated D1 and synthetic data, and allow only that exact staging frontend origin. This review made no proxy, API permission, or production infrastructure changes.

## Staging readiness

**NOT READY.** The JSON-LD test mismatch is fixed and all local Chromium tests pass, but dependency advisories remain unresolved, Wrangler packaging/preview has not been verified on Linux, and Worker response behavior has not been exercised.

## Next steps requiring owner approval

1. Allow a trusted Ubuntu CI run to execute the new non-deploying Wrangler dry-run step; inspect its output before staging is considered.
2. Approve a dependency-remediation change after registry access is available; update within compatible major versions where possible, then run the full audit and project checks.
3. Before any staging deploy, configure required reviewers and least-privilege secrets in the `cloudflare-staging` GitHub Environment, then explicitly approve invoking the manual staging workflow.
4. Approve a separate design if real API integration must be exercised: preferably an isolated staging API/D1 with synthetic data and a narrow origin allowlist. Otherwise keep API-dependent staging flows mocked/read-only.

No staging deployment, production cutover, DNS change, API/D1 change, push, PR, or merge is authorized by this validation.

