# Phase 4A — External service integration preparation

Status: preparation only. No Cloudflare resources, secrets, remote migrations,
DNS changes, deployments, or real email were created or used. Production
feedback and newsletter signup remain disabled.

## Architecture

- The API Worker continues to own subscriber records, consent history, token
  hashes and lifecycle transitions in its existing D1 database. Its existing
  `NEWSLETTER_MAILER` service contract is implemented by a dedicated mailer
  Worker at `worker/mailer/`.
- The mailer accepts only the internal `/confirmation` POST contract, validates
  the service-binding-only internal hostname, API-owned link origin and
  token-hash idempotency key, renders SK/EN/DE/ES/JA
  text and HTML, and calls Brevo `POST /v3/smtp/email`. It stores a delivery
  ledger in a separate D1 database. It never logs message bodies, recipient,
  links, token, provider errors or credentials.
- Brevo does not provide a documented send idempotency guarantee. The ledger
  claims each message before network I/O. Sent/in-flight keys are acknowledged
  without another provider call; failed/ambiguous keys are never automatically
  resent. One retry (up to two seconds) is permitted only for an explicit 429
  with bounded `Retry-After`. Timeouts and 5xx responses are treated as
  ambiguous to prevent duplicate sends. A failed delivery therefore needs
  reviewed operator reconciliation; there is no automatic resend path.
- The React integration loads Cloudflare Turnstile with explicit rendering and
  distinct `feedback` / `newsletter` actions. It obtains a fresh widget token per
  submission, resets on expiration and after success/failure, and reports the
  existing translated loading/error states in all five locales. Server-side
  Siteverify remains mandatory. Production passes no submission config, so the
  forms remain disabled and no widget loads.
- Worker rate limiting uses the official `[[ratelimits]]` format. The production
  and staging namespace values are placeholders (`1001`, `1002`) only; the owner
  must assign distinct account-unique positive integer namespaces. D1
  per-action, per-email, and challenge controls remain in place.
- `worker/wrangler.staging.toml` defines a separately named API Worker and a
  `japanday-workshops-staging` D1 binding placeholder; it does not reference the
  production database ID. The staging API uses the dedicated staging mailer and
  a wrapper that permits CORS only for one exact `STAGING_ALLOWED_ORIGIN` value.
  `worker/mailer/wrangler.toml` is staging-only and defines its separate delivery
  ledger D1 placeholder. The existing static staging website config is intact.

## Files changed

- `worker/src/worker.js`, `worker/src/staging.js`, `worker/wrangler.toml`,
  `worker/src/staging.test.js`, `worker/wrangler.staging.toml`
- `worker/mailer/src/index.js`, `worker/mailer/src/index.test.js`,
  `worker/mailer/wrangler.toml`, `worker/mailer/migrations/0001_delivery_ledger.sql`
- `src/lib/turnstile.js`, `src/components/PostEventHome.jsx`
- `worker/src/community.d1.integration.mjs`
- `scripts/cloudflare/check-phase4-config.mjs`, `package.json`
- `docs/notes/phase-4-service-integration.md`

## Required Brevo configuration

Create/verify the sender in Brevo and disable click tracking for transactional
mail at the provider account/sender level before any real send. The API request
includes confirmation and unsubscribe links verbatim; token-bearing links must
not be rewritten or tracked. Brevo's documented transactional send endpoint does
not establish idempotency guarantees, so the Worker ledger remains authoritative.

Configure Worker secrets/settings (values are intentionally omitted):

- Secret `BREVO_API_KEY` — Brevo API key with only the required send capability.
- Vars `MAIL_FROM_EMAIL` and `MAIL_FROM_NAME` — authenticated sender identity.
- Provision the dedicated delivery D1 binding `DELIVERY_DB` and apply
  `worker/mailer/migrations/0001_delivery_ledger.sql` only to its staging instance
  through a separately approved local/staging process.

The staging API also needs its `NEWSLETTER_MAILER` service binding to the staging
mailer. Production service binding must be configured only in a separately
approved production change after all gates below. Never put these values in
Vite variables or source.

## Required Cloudflare settings

- Create separate staging API, subscriber D1, mailer, and delivery-ledger D1
  resources. Replace the conspicuous D1 ID placeholders with the IDs of those
  newly created staging databases only after owner review. Never copy the
  production `japanday-workshops` ID into staging.
- Set staging API `TURNSTILE_SECRET_KEY` as a secret and set
  `TURNSTILE_HOSTNAME` to the actual staging site hostname. Set the public
  staging widget site key only in the separately reviewed staging website
  runtime config; use Cloudflare's staging credentials and exact hostname.
  Never reuse production credentials.
- Replace `STAGING_ALLOWED_ORIGIN` and the `STAGING_ALLOWED_ORIGIN` embedded in
  documentation/configuration with the one exact HTTPS origin of the staging
  website (no wildcard, path or trailing slash). The staging wrapper denies
  configuration if the value is absent or wildcarded.
- Set `NEWSLETTER_LINK_ORIGIN` to the exact staging API host serving the
  confirmation/unsubscribe landing pages, and align the staging API's allowed
  link-origin validation before enabling staging signup. Keep signup disabled
  until that integration test passes.
- Choose distinct account-unique positive integer namespace IDs for
  `SUBMISSION_LIMITER` in production and staging. The committed `1001` and
  `1002` are documented placeholders and are not approved account values.
- Keep D1 abuse limits, Turnstile Siteverify, feature flags and API origin checks
  enabled. Do not weaken these controls to make local tests pass.

## Staging deployment procedure (not performed)

1. Obtain owner approval for exact origin, resource names, separate D1 IDs,
   Turnstile staging hostname/credentials, namespace IDs, sender identity,
   consent notice and retention policy.
2. Create staging resources manually in the approved Cloudflare account. Do not
   use production D1. Apply the existing migrations to the new staging subscriber
   D1 and the mailer ledger migration to the separate delivery D1 only after
   reviewing the target IDs and backup/restore procedure.
3. Configure Worker secrets through Cloudflare secret management:
   `TURNSTILE_SECRET_KEY`, `ABUSE_HMAC_SECRET`, and mailer `BREVO_API_KEY`.
   Configure staging vars including exact `STAGING_ALLOWED_ORIGIN`,
   `NEWSLETTER_LINK_ORIGIN`, `NEWSLETTER_CONSENT_VERSION`, and Turnstile hostname.
4. Deploy the staging mailer and API only after resource IDs and bindings have
   been reviewed. Keep `NEWSLETTER_SIGNUP_ENABLED` and `FEEDBACK_ENABLED` false
   until the approved nonproduction end-to-end exercise is explicitly authorized.
5. Verify staging origin CORS, action/hostname Siteverify, rate limiting, API to
   mailer binding, idempotency, localized messages, and confirmation/withdrawal
   lifecycle with test recipients and staging credentials. Check provider
   settings to ensure link tracking is disabled and the received URLs retain
   their token fragments exactly.
6. Any production activation, production resource binding, live recipient send,
   DNS/routing change, or migration requires a separate explicit approval.

## GDPR requirements outstanding

Owner/legal approval is still required for controller identity and contact,
privacy notice and consent wording/version, purpose/legal basis, retention for
feedback and subscribers, pending-subscription expiry, withdrawal/suppression
policy, data-subject access/deletion workflow, backup retention, breach handling,
and processor/subprocessor terms and transfer safeguards for Brevo/Cloudflare.
The mailer ledger stores the API-generated idempotency hash and timestamps without
the recipient address; its retention/purge period still needs owner approval.
Free-text feedback can contain identifying data despite having no required
identity fields. Withdrawal currently preserves consent evidence; it is not full
erasure. These policies must be settled before live submissions.

## Manual approval gates

- Approve GDPR notice, consent version, retention, deletion and suppression policy.
- Approve Brevo processor terms, sender authentication, least-privilege key,
  click-tracking-disabled behavior, and delivery-failure reconciliation process.
- Approve exact staging origin, staging credentials, resource IDs, and distinct
  limiter namespaces; verify staging D1 is isolated from production.
- Authorize a nonproduction real-email exercise separately; this phase sends no
  email. Production form activation, binding, migration, DNS/routing, deployment
  and production send each require separate approval.

## Test results

| Check | Result |
| --- | --- |
| `npm run test:mailer` (includes Turnstile module tests) | PASSED: 11/11 |
| `npm run check:phase4-config` | PASSED |
| `npm run test:worker` | PASSED: 93/93, including staging-origin checks |
| `npm run test:community:d1` | PASSED: 2/2 isolated local workerd/D1 and browser tests; API binding used the actual mailer adapter with mocked provider |
| `npm run test:community:ui` | All 10 Chromium assertions reported passed across five locales; process did not exit after the web-server cleanup wait and was interrupted, so command completion is NOT VERIFIED |
| `npm run lint` | PASSED |
| `npm run build` | PASSED; existing ~601 kB JS chunk warning remains |
| `git diff --check` | PASSED |
| Remote resources, remote D1 migrations, deployment, DNS, real provider calls/emails | NOT RUN by design |

Cloudflare configuration follows the official [Workers rate-limit binding
format](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).
Mail delivery uses Brevo's official [transactional email endpoint](https://developers.brevo.com/reference/send-transac-email).
