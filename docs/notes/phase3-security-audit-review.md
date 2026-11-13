# Japan Day – Phase 3 independent code review

**Audit input:** user-supplied `phase3-security-audit.zip` (13 November 2026). **Scope:** new feedback/newsletter code, SQL migration 0007, existing Worker integration, supplied tests and configuration. **No deployment, remote API calls, production D1 changes or production credentials were used.** The uploaded archive is a code snapshot, not a deployed system. Full project dependencies and Cloudflare production configuration were not available, so previously reported 86/441/206 test counts were not independently rerun.

## Executive decision

**Do not activate production newsletter endpoints yet.** Two release-blocking functionality/security-availability defects were reproduced in an isolated local copy. No confirmed personal-data disclosure or SQL injection was found in the reviewed code. The migration uses only new `CREATE TABLE` and `CREATE INDEX` statements, without alterations to existing workshop tables. A Python SQLite independent smoke test successfully executed migrations 0001–0007 with `PRAGMA foreign_key_check` returning no violations; this does **not** substitute for a Cloudflare D1 staging migration/backup verification.

## Findings

### HIGH / release blocker — F01: Real same-origin newsletter POST gets 403

- **Evidence:** `worker.js:5,172` (the allowlist has `japanday.sk`, `www.japanday.sk`, and local dev, but not `api.japanday.sk`); `newsletter-page.js:18–22` (`fetch('/api/newsletter/${purpose}', ...)`), and the documentation's preferred email link host `api.japanday.sk`.
- **Reproduction:** copied source into an isolated test harness with stubbed payment functions; `POST https://api.japanday.sk/api/newsletter/unsubscribe` with `Origin: https://api.japanday.sk` returned HTTP 403, `CORS_ORIGIN_DENIED`. The otherwise identical request with `Origin: https://japanday.sk` continued to the disabled feature flag and returned 503. Real browser `fetch` POST requests send an Origin header even when same-origin (MDN: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin).
- **Impact:** Confirmation and unsubscribe links served by the API Worker cannot complete the POST in ordinary browsers.
- **Required correction:** allow the exact API hostname for **its own** confirmation/unsubscribe POST routes (or implement a verified same-origin exception scoped to those routes), without broad wildcard CORS; retain rejection of unapproved external origins. Verify tests with browser POST headers and a real local Worker handler, not only intercepted mock API responses.

### HIGH / release blocker — F02: Unsubscribe incorrectly coupled to newsletter signup and mailer

- **Evidence:** `community.js:173–180` requires `NEWSLETTER_ENABLED === 'true'` and a configured `NEWSLETTER_MAILER` for subscribe, confirm **and unsubscribe**. `newsletter-page.js:17` disables the confirmation/unsubscribe button when the same newsletter flag is off.
- **Reproduction:** calling the actual `community()` route with a valid-shape unsubscribe token and no mailer binding returned 503 `NEWSLETTER_UNAVAILABLE` before any DB lookup; with newsletter disabled it returned 503 `FEATURE_DISABLED`.
- **Impact:** Pausing newsletter signups or removing/failing to configure the mailer can make existing customers unable to unsubscribe. Confirmation and withdrawal themselves do not require a mailer.
- **Required correction:** separate `NEWSLETTER_SIGNUP_ENABLED` from ongoing **token management** availability. Only subscribe requires Turnstile and mail delivery; confirmation/withdrawal should depend on relevant DB security and token ownership, not the sending provider. Keep token operations available after signup pause. Give the unsubscribe landing page independent enablement. Do not weaken token verification, atomic transitions or replay prevention. Revisit behavior for a full service shutdown with outstanding subscriptions.

### MEDIUM — F03: Auth-free attempts cause repeated D1 writes and can starve shared-IP users

- **Evidence:** `community.js:44–63,169–185`. The handler calls `abuse()` (per-IP D1 counters + two cleanup DELETE statements) **before** JSON validation and before ownership token verification; it applies the same `newsletter` action bucket to subscribe, confirm and unsubscribe. 60 attempts from a shared source can block real confirmation/withdrawal. Every permitted invalid attempt still consumes D1 work.
- **Impact:** Cost/availability degradation and a potential local denial-of-service for users behind a shared network. Cloudflare's Workers limiter is per-location and approximate (https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).
- **Required correction:** ensure cheap size/method/token-shape screening happens before nontrivial D1 work; separate strict anti-abuse rules for signup from token-confirmation and unsubscribe; rate limit invalid tokens without making valid withdrawal impossible under ordinary shared IP conditions. Replace per-request global cleanup DELETEs with bounded/infrequent maintenance. Add stress tests and an account-level WAF/budget alert plan.

### MEDIUM — F04: Most new API integration tests do not exercise the actual browser→Worker→D1 newsletter flow

- **Evidence:** `tests/community/forms.spec.ts:11–16,47–63` intercepts the API and fabricates success. `worker/src/community.d1.integration.mjs:9–26` tests only **feedback insertion** against real workerd/D1. The remaining multi-step newsletter tests use a custom synchronous SQLite adapter (`test-d1.js`).
- **Impact:** F01 was invisible to green test suites, and D1-specific subscription concurrency/confirmation and withdrawal behavior lacks equivalent end-to-end coverage.
- **Required correction:** add a real local workerd/D1 test performing subscribe→mock-mailer→click email link in Chromium→confirm→unsubscribe, including Origin, stale/reused tokens, disabled-signup-but-active-unsubscribe, missing mailer on unsubscribe, and concurrent token transitions. Mock external email delivery and Siteverify only, not the Worker routes or D1 itself.

### MEDIUM — F05: Link origin validation does not guarantee route ownership

- **Evidence:** `community.js:83–87` accepts any well-formed HTTPS origin as `NEWSLETTER_LINK_ORIGIN`. Test fixture `community.test.js:27` uses `https://japanday.sk`, but the confirmation/unsubscribe documents are implemented in the API Worker and documentation expects `https://api.japanday.sk`.
- **Impact:** Environment misconfiguration may produce broken email links even when all unit tests pass.
- **Required correction:** validate the approved configured origin against actual Worker routing at activation; exercise both landing pages and subsequent POST in the staging environment. Do not infer route ownership from HTTPS alone.

### POLICY / prelaunch — F06: Consent notice, retention and erasure are not implemented

- **Evidence:** `phase-3-feedback-newsletter.md` § Retention; tables have no implemented lifecycle cleanup; the free-text feedback fields might contain personal information entered by users despite the absence of identity columns.
- **Required correction:** owner/legal review of controller identity, consent wording/version, data retention, deletion/suppression handling and backup handling. Label feedback as *without required identifying fields*, not guaranteed anonymous under all user-input scenarios. Set enforceable policies before live submissions.

### Pre-existing separate issue — F07: Admin workshop CSV allows spreadsheet formula values

- **Evidence:** `worker.js:213–217` quotes cells but does not neutralize leading `=`, `+`, `-`, `@` or tab/CRLF formula triggers.
- **Impact:** If an attacker stores a formula-prefixed registration field and an authorized admin opens the exported CSV in spreadsheet software, formula interpretation may occur. Not introduced by Phase 3, but worth a focused security fix and tests.

## Positive controls observed

- Additive migration 0007, database constraints and foreign keys; independently smoke-tested SQL sequence 0001–0007 with no foreign key violations.
- Strict JSON parsing and 20 KB streaming request size cap in `community.js:16–35`.
- Bound D1 parameters; robust email uniqueness and no public feedback/subscriber listing endpoints.
- Server-side Turnstile Siteverify checks hostname/action/time, plus unique D1 challenge receipts.
- Cryptographically random bearer tokens stored as SHA-256 hashes, transaction-scoped token transitions and no state change on link GET.
- `newsletter-page.js` removes URL fragment before confirmation and uses a nonce CSP, `no-referrer` and `no-store`.
- Explicit `false` feature flags; no real e-mail provider configured, so no accidental submission activation.

## Required gates after corrections

1. Regression reproductions F01 and F02 must pass in local browser/Worker tests.
2. A realistic workerd/D1 newsletter path must succeed, not just mocked-API tests.
3. New abuse protections and existing workshop API tests must pass; check that legitimate unsubscribe remains available after pausing signups.
4. Email provider and actual `NEWSLETTER_LINK_ORIGIN` must work end to end in **nonproduction**, with real Turnstile keys configured for the correct hostname and actions.
5. Keep staging D1 completely isolated from production D1 and never reuse production secrets in tests.
6. Approve GDPR notices, versions and retention rules; document safe recovery and preserve unsubscribe capability.
7. Production migrations/deployment only after specific owner approval and verified backup/restore.

**Scope limitation:** This is a code review and targeted local reproduction, not a live penetration test or independently repeated full CI suite. Security properties of the future third-party mailer and Cloudflare account configuration are still unverified.
