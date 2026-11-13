import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Exercise the existing Static Assets configuration locally, including real
// directory redirects, _redirects rules and HTTP 404 responses. No deployment.
export default defineConfig({
  ...base,
  testIgnore: ["**/registration-reopening/**"],
  testMatch: /archive.*\.spec\.ts/,
  workers: 2,
  use: { ...base.use, baseURL: "http://127.0.0.1:4175" },
  webServer: {
    // Installed workerd currently supports dates through 2026-11-09. Override
    // only this local test process; preserve the staging deployment config.
    command: "npx wrangler dev --config wrangler.web-staging.jsonc --local --compatibility-date 2026-11-09 --ip 127.0.0.1 --port 4175 --inspector-port 0",
    url: "http://127.0.0.1:4175",
    reuseExistingServer: false,
    env: { CLOUDFLARE_SEND_METRICS: "false" },
    timeout: 120_000
  }
});
