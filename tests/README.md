# Playwright regression tests

The suite targets the static Vite preview at `http://127.0.0.1:4173` by default. Build first, then run a focused group:

```sh
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e:smoke
npm run test:e2e:seo
npm run test:e2e:a11y
```

Use `BASE_URL=https://japanday.sk npx playwright test --grep @production` for production checks. Windows PowerShell equivalent: `$env:BASE_URL='https://japanday.sk'; npx playwright test --grep @production`.

Tests are grouped with `@smoke`, `@ui`, `@seo`, `@a11y`, `@responsive`, `@data`, `@production`, and `@visual`. The HTML report is written to `playwright-report`; open it with `npm run test:e2e:report`.

Visual tests currently save explicit diagnostic screenshots under `test-results`. Formspree is intercepted in contact tests; no real message is sent. Smartsupp, YouTube, Google Maps, and GTM network failures are treated as third-party noise while first-party failures remain actionable. Production tests are skipped unless `BASE_URL` points at the production origin.

The data/static tests inspect source JSON and existing `dist` output. Run `npm run build` before those tests when checking the 84-route sitemap and generated documents. Browser binaries are installed separately with Playwright's install command.
