# japanday.sk Cloudflare Workers Static Assets migration

This is a local preparation for a possible hosting migration. It does not deploy
anything automatically. The React/Vite application, content, routes, and public
SEO identity remain unchanged. The site supports Slovak, English, German,
Spanish, and Japanese.

## Hosting model

`npm run build` runs Vite and `scripts/seo/generate-static-routes.mjs`. The
generator writes separate `index.html` files for each published route and
locale, plus `sitemap.xml`, `robots.txt`, canonical URLs, and hreflang links.
Cloudflare Static Assets must serve these files directly. The staging
configuration therefore uses `html_handling: "auto-trailing-slash"` and
`not_found_handling: "404-page"`; it does not enable SPA fallback. This keeps
unknown paths as 404 responses while preserving directory-style URLs.

## Staging isolation

`wrangler.web-staging.jsonc` defines the separate Worker
`japanday-sk-web-staging`, served only from `workers.dev`. It has no custom
domains, routes, entry-point script, D1/KV/R2 bindings, or service bindings.
The existing `japanday-workshops-api` Worker and `japanday-workshops` D1
database remain unchanged. The unrelated `tvoj-hlas` Worker is out of scope.

The staging GitHub Actions workflow is triggered only by `workflow_dispatch`
and uses the `cloudflare-staging` GitHub Environment. Configure required
reviewers for that Environment before any staging deployment. The workflow
does not run on pushes or pull requests. The separate pull request workflow
only installs, builds, validates, and runs Chromium smoke/static-route checks.

The staging output preparation writes `dist/_headers` with `X-Robots-Tag:
noindex` and a `dist/404.html`. It runs only after a normal build in the staging
workflow; the production GitHub Pages workflow does not call it.

## Local validation

```sh
npm ci
node scripts/cloudflare/check-worker-config.mjs
npm run build
node scripts/cloudflare/check-static-assets.mjs
node scripts/cloudflare/prepare-staging-output.mjs
node scripts/cloudflare/check-staging-output.mjs
npx wrangler types .wrangler/staging-validation/worker-configuration.d.ts --config wrangler.web-staging.jsonc
```

Run the browser suite with `npm run test:e2e`. It targets the local Vite
preview. To target an already deployed staging URL, set `BASE_URL` to that URL;
Playwright then skips starting its local preview server.

## Staging deployment plan

1. Review and merge this preparation through the repository's normal process;
   this does not itself deploy staging.
2. In GitHub, configure the `cloudflare-staging` Environment with required
   reviewers. Add `CLOUDFLARE_ACCOUNT_ID` and a narrowly scoped
   `CLOUDFLARE_API_TOKEN` as Environment secrets. Never put credentials in the
   repository or client bundle.
3. Manually run **Deploy japanday.sk staging to Cloudflare Workers** using
   `workflow_dispatch`, then complete the Environment approval.
4. On the resulting `*.workers.dev` URL, verify direct loads and refreshes for
   `/`, `/en/`, `/de/`, `/es/`, `/ja/`, representative detail pages, `/admin/`,
   `/sitemap.xml`, assets, and a nonexistent path. Confirm status codes,
   `X-Robots-Tag`, canonical/hreflang output, and all five languages.
5. Keep staging API flows read-only or mock-backed until an API/CORS strategy
   is separately approved and verified. Record the staging URL and results.

No Cloudflare deployment, DNS change, production GitHub Pages change, GitHub
write, or production Worker/D1 operation is part of this local preparation.

## API, CORS, and security

The frontend calls `https://api.japanday.sk` directly. The existing API Worker
allows browser origins `https://japanday.sk`, `https://www.japanday.sk`, and
`http://localhost:5173`; it does not allow the staging `workers.dev` origin.
Consequently, browser API requests from staging are denied by CORS. This
preparation does not add an API proxy or modify the allowlist, API Worker, or
D1 database. A proxy would add a server-side request path and security/runtime
responsibilities; changing CORS would expand the API's browser trust boundary.
Either option needs a separate architecture and security review before approval.

## Rollback

For staging, stop invoking the manual workflow and keep production traffic on
GitHub Pages. If a staging deployment itself must be reverted, use Cloudflare's
deployment history for the staging Worker after owner approval; do not touch
production routes, DNS, the API Worker, or D1.

For any future, separately approved production cutover, first record the
current DNS/origin values and the last known good GitHub Pages deployment. If
the cutover fails, restore the recorded origin routing for both
`japanday.sk` and `www.japanday.sk`, restore or reactivate GitHub Pages as
needed, then verify representative localized routes and the independent API.
Keep staging available without production routes. Production cutover and its
rollback require explicit owner approval; this migration does not prepare or
activate a production Worker.

## Current verification

See [TEST_RESULTS.md](TEST_RESULTS.md) for commands run, results, limitations,
and actions that still require owner approval.
