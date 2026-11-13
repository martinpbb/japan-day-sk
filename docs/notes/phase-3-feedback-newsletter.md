# Phase 3: feedback and newsletter backend

Local implementation on `feature/post-event-2026`, 2026-11-13. Initial HEAD
`b944c46c3308cb5611f3bd0cb0f4ba042b0dca10`; during work another actor advanced
HEAD to `17598bc97837377befee854439f671d77a905633` (centred newsletter layout).
Those changes were preserved. This session performed no commit, push, merge,
deployment, production D1 operation, account creation or real email delivery.

## Architecture and threat model

The existing Worker dispatches four write-only APIs to `worker/src/community.js`.
Existing workshop, payment and Access authorization handlers retain their logic.
The React homepage supplies no submission configuration: both forms remain
disabled. Only `tests/fixtures/community/` supplies a local, mocked configuration.
The fixture is outside the production Vite entry graph and is not in `dist`.
No public query/list/export API was added.

Threats covered: malformed/large requests, SQL injection, untrusted HTML,
cross-origin abuse, bot submissions, email flooding/enumeration, token guessing,
replay, races, email link scanners, database and security-service failure.
CORS is not authentication. Confirmation/unsubscription possession tokens are
bearer credentials; a compromised inbox can exercise those rights. Anonymous
feedback cannot prove that its author attended the event.

## Schema, indexes and migration safety

Exact additive migration: `worker/migrations/0007_feedback_newsletter.sql`.
It contains only new CREATE TABLE / CREATE INDEX statements; migrations 0001–0006
and all existing tables/indexes/triggers are unchanged.

| New table | Purpose / indexes |
| --- | --- |
| `event_feedback` | Feedback without required identifying fields, edition, locale, Unix submission time; edition/time index |
| `newsletter_subscribers` | Normalized unique case-insensitive email, optional name, status, consent version/time, confirmation/withdrawal timestamps, locale, creation/update times |
| `newsletter_tokens` | SHA-256 token hash PK, subscriber FK, purpose, creation/expiry, consumption/operation ID; subscriber/purpose index and unique operation ID |
| `newsletter_consent_events` | Requested/confirmed/withdrawn audit records, subscriber FK, notice version/time; subscriber/time index |
| `submission_limits` | Pseudonymous expiring global cooldown/counter records |
| `submission_challenges` | Unique hashes of successfully verified Turnstile challenges, with expiry |

All newsletter child FKs cascade on deliberate subscriber deletion. CHECKs enforce
supported locales, 2026 edition, nullable integer rating 1–5, text lengths,
meaningful feedback, normalized email, allowed statuses/purposes/event names,
state timestamps and token consumption consistency. API validation is stricter
than SQLite CHECKs (including Unicode whitespace, email syntax and field types).
Timestamps use epoch seconds in new tables; old timestamp conventions are untouched.

The migration runner must apply 0007 transactionally once. Raw replay intentionally
fails with “already exists”; it is not a destructive repair or an idempotent seed.
Tests install the complete fresh chain, create representative paid historical
registrations via the real Worker handler before 0007, compare serialized old rows
and every old sqlite_master object after migration, verify unique/FK constraints,
and exercise failed migration rollback and replay. D1 runtime integration uses
an isolated temporary local database, not the existing production binding remotely.

## Exact feedback question mapping

Question order is shared by the React form and backend in
`src/lib/communityContract.js`; labels remain in the five existing site JSON files.

| Existing question | Stable database/API field |
| --- | --- |
| Overall event rating | `rating` |
| What did you enjoy most? | `enjoyed_most` |
| What should we improve? | `improvements` |
| What would you like to experience next time? | `next_time` |
| Which food or drink did you enjoy most? | `favourite_food_drink` |
| What was missing from the food and drink selection? | `missing_food_drink` |
| Any other message for the organisers | `organiser_message` |

No identity fields are accepted or stored with feedback. Blank text becomes NULL.
Free-text answers may still contain personal information entered by a visitor, so
feedback is not guaranteed anonymous. Every question is optional; a rating or at
least one nonblank text answer is required.

## API contracts

All four endpoints accept only POST with `Content-Type: application/json`.
Successful envelopes use the existing `{ok:true,data:...}` convention; errors use
`{ok:false,error:{code,message}}` with generic codes, never submitted data or SQL.

```json
POST /api/feedback
{"edition":2026,"locale":"sk","rating":5,"favourite_food_drink":"Matcha","turnstileToken":"<fresh challenge>"}
201 {"ok":true,"data":{"message":"Feedback received."}}

POST /api/newsletter/subscribe
{"email":"person@example.com","name":"Optional","consent":true,"consentVersion":"<approved current version>","locale":"sk","turnstileToken":"<fresh challenge>"}
202 {"ok":true,"data":{"message":"If eligible, a confirmation email will be sent."}}

POST /api/newsletter/confirm
{"token":"<64 lowercase hexadecimal characters>"}
200 {"ok":true,"data":{"message":"Subscription confirmed."}}

POST /api/newsletter/unsubscribe
{"token":"<64 lowercase hexadecimal characters>"}
200 {"ok":true,"data":{"message":"Subscription withdrawn."}}
```

Examples show HTTP method/path and response status, not literal JSON file syntax.
Unknown properties, unsupported editions/locales, invalid input and token
replay return 400; denied Origin/Turnstile verification 403; unsupported method
405; oversize 413; media type 415; rate limit 429; internal database failure 500;
disabled/unconfigured/unavailable security dependencies 503. Existing admin
authentication continues to use 401/403. OPTIONS is unchanged (204).

`GET /newsletter/confirm?locale=sk` and `/newsletter/unsubscribe?locale=sk` return
isolated, localized, noindex documents only. A token travels in `#token=...`, never
in a server query string. The document immediately removes the fragment and sends
the token as JSON only after an explicit button click. GET never accesses the DB
or changes subscription state. Pages have no analytics/remote assets, nonce CSP,
frame denial, no-referrer and no-store. They require no static frontend routes.
`NEWSLETTER_LINK_ORIGIN` must be exactly `https://api.japanday.sk`, the approved
HTTPS origin routing these paths to this Worker
without trailing slash/path. Future messages
must also use fragment links, never put tokens/emails in logging query strings.

## Validation and limits

- Body maximum: 20,000 UTF-8 bytes, enforced while streaming, also checking
  Content-Length; malformed JSON/UTF-8, arrays, primitives and unknown fields fail.
- Feedback text: 2,000 JS UTF-16 code units per answer before trimming. The byte
  ceiling also applies, so a complete set of long multibyte answers can exceed it.
- Email: 254 characters maximum, trim/lowercase, conservative ASCII syntax;
  internationalized mailbox addresses are currently not supported.
- Name: optional, at most 100 characters. Locale: sk/en/de/es/ja.
- Consent must be literal boolean true and match the server's current notice
  version. There is no preselected UI checkbox.
- Challenge at most 2,048 characters; ownership token exactly 32 random bytes,
  represented as 64 lowercase hexadecimal characters.
- Visitor answers remain untrusted text. Nothing is returned as trusted HTML.
  Future exports must escape spreadsheet formula prefixes (`=`, `+`, `-`, `@`,
  tab, CR/LF) as well as CSV delimiters; no feedback/subscriber export exists now.

## Anti-abuse and origin strategy

Siteverify is called only at the official HTTPS endpoint with an eight-second
timeout. Success, exact configured hostname, exact action (`feedback` or
`newsletter`), and challenge time within five minutes are required. Raw IP is not
sent to Siteverify. D1 unique challenge receipts also reject concurrent reuse,
because Siteverify reuse detection is eventually consistent.

A mandatory `SUBMISSION_LIMITER` Workers binding rejects bursts before D1 writes.
Its counters are approximate/per-location, so it is supplemented with D1 counters:
60 attempts per action/IP-derived identity per ten-minute bucket, and one newsletter
email attempt per normalized address per UTC day. Daily IP identities use HMAC
with a server-only secret; only further hashes are persisted. No raw visitor IP
or user agent is stored/logged. Missing CF-Connecting-IP fails closed; only the
Cloudflare edge (or explicit local mocks) is trusted to supply it.

Use a broad binding allowance (suggested initial 60/60 seconds) to reduce shared-IP
collateral damage; Turnstile and per-email cooldown supply stronger controls.
UTC bucket boundaries permit adjacent-window bursts. Per-address cooldown returns
the same 202 as other valid subscription outcomes. Existing confirmed addresses
never receive another confirmation. Concurrent pending requests create only one
email attempt. Expired abuse records are deleted during subsequent allowed requests;
an idle database retains them until maintenance/next request.

No rate-limit binding exists in the current Wrangler configuration. An owner must
choose an account-unique namespace and approve the binding before activation.
No resources or binding namespace were created in this session.

Existing allowed origins remain apex, www and `http://localhost:5173`, with
credentialed admin headers unchanged. Staging is not implicitly trusted. Review
and add only its exact approved origin if needed; do not use wildcard Pages origins.
Originless clients must still pass challenge/rate/token checks.

## Consent, privacy and token lifecycle

Valid requests record pending consent and an audit event. Only one-time confirmation
can activate a pending subscriber. Updates, token consumption and audit events
execute in one D1 batch, gated by a unique operation ID, so losing concurrent
requests cannot confirm or record consent twice. All queries bind visitor input.

Pending renewals can retry after the daily cooldown and invalidate old confirmation
tokens. Confirmations expire after 24 hours. Unsubscribe tokens deliberately have
NULL expiry: old email links remain usable until consumed/revoked/deleted. This is
the explicit durable-link exception to expiring confirmation credentials. They are
purpose-scoped and work only for a confirmed subscriber. Successful withdrawal
consumes/revokes all subscriber tokens and records consent withdrawal atomically.
Replays return generic invalid-token errors and cannot affect a new consent cycle.
An old unused unsubscribe token from the same pending lifecycle can withdraw a
later confirmed subscription; the original inbox ownership proof is intentional.

Subscriber IDs and token hashes remain private; tokens are never stored plaintext
in D1. There are no logs of request bodies, emails, answers, tokens or provider
errors in the new handlers. Future administration must require verified Cloudflare
Access plus explicit active admin authorization, not lecturer workshop access.

## Delivery abstraction and failure behavior

`emailDelivery(env)` uses a trusted `NEWSLETTER_MAILER` service binding, not an
assumed third-party provider. POST `/confirmation` carries an Idempotency-Key and
JSON `{id,email,locale,confirmationUrl,unsubscribeUrl}`. The service must implement
idempotent delivery, escaped HTML or plain text, authenticated sender configuration,
safe logs, provider error monitoring and appropriate data-processing arrangements.
The URLs must not be rewritten into tracked links that expose credentials.
The provider and actual adapter/service are unresolved production dependencies.
No service binding is configured; all automated delivery is mocked.

Missing delivery configuration returns 503 before subscriber creation. If a
configured service rejects/times out, the record remains pending, its confirmation
token is invalidated and the same generic 202 is returned to prevent enumeration.
No automatic resend happens. Retry is possible after the next UTC-day bucket.
An ambiguous timeout can therefore produce an unusable email; this favors safety
over automatic retry. The service must monitor delivery failures without logging
credentials; the public API intentionally does not disclose delivery outcome.

## Retention and deletion considerations

Owner approval is required for retention periods, lawful notice/version wording,
delivery provider, suppression policy and administrators. Personal-data deletion
requests will initially be handled manually by the administrator using a reviewed
data procedure; there is no newsletter administration UI or public deletion API.
Do not interpret this as automatic feedback anonymity: visitors can include
identifying details in free-text responses.
Suggested review points, not implemented automatic policy: delete expired pending
subscriptions after a short approved period; anonymize or remove free-text feedback
after analysis; retain only the agreed consent/suppression evidence. Withdrawal
currently retains the subscriber row and audit trail but prohibits active status.
It is not a full erasure operation. Deleting a subscriber cascades token/audit
deletion and allows a future clean opt-in; coordinate this with suppression policy
and backups. No automatic deletion of workshop history occurs.

## Feature flags and required configuration

The committed switches are `FEEDBACK_ENABLED = "false"`,
`NEWSLETTER_SIGNUP_ENABLED = "false"` and
`NEWSLETTER_TOKEN_ACTIONS_ENABLED = "true"`. Signup opt-in requires exact
`"true"`. Keep token actions enabled when pausing signup; setting their flag to
`"false"` is a full lifecycle shutdown that also disables outstanding links.
Mandatory shared dependencies: DB, SUBMISSION_LIMITER, ABUSE_HMAC_SECRET (at least
32 characters). Submission routes require TURNSTILE_SECRET_KEY and
TURNSTILE_HOSTNAME. Newsletter also requires NEWSLETTER_CONSENT_VERSION,
NEWSLETTER_LINK_ORIGIN (exactly `https://api.japanday.sk`) and NEWSLETTER_MAILER.
Confirmation and unsubscribe do not depend on the mailer or signup flag. Secrets belong only in Worker secret
configuration, never in VITE variables/source. No real secrets were generated.

The existing homepage never supplies `config`, so setting Worker flags alone does
not enable its forms. A separately reviewed frontend activation must integrate
real Turnstile widget execution/reset with the expected actions, fresh tokens for
retry, the approved notice version and API origin. There is no URL/localStorage
switch or public test bypass. Test config is supplied only in the isolated fixture.
Once activated, preserve the newsletter lifecycle service/flag and abuse secret so
historic unsubscribe links continue working; do not disable it as a marketing pause.

## Local commands and coverage matrix

Use Node 24 and the installed npm dependencies. No Cloudflare login is needed for
the mocked suites. Local D1/workerd may require permission for Wrangler's local
development registry and installed templates; it never uses a remote D1 command.

```powershell
npm.cmd run test:worker
npm.cmd run test:community
npm.cmd run test:community:d1
npm.cmd run test:community:ui
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e -- --workers=4 --output=test-results/phase3-default
npx.cmd playwright test --config playwright.archive.config.ts --project chromium
git -c core.safecrlf=false diff --check
graphify update .
```

Run default/archive suites sequentially: their original report/output directories
are shared. Community UI uses separate output/report directories. PowerShell 5's
redirection can turn stderr warnings into NativeCommandError; `cmd /c` capture
preserves the process result. Do not confuse that warning with a successful gate.

| Area | Automated evidence |
| --- | --- |
| Migration safety | Full chain, populated historical paid registration/payment/session/admin preservation, schema/index equality, FK/unique/CHECK enforcement, replay, transaction rollback |
| Feedback | Complete/minimal/anonymous, all locales, optional questions, 1/3/5 and invalid ratings, every text field type/length, edition/locale, unknown fields, empty/invalid JSON, content type/byte limits, HTML/SQL text, stored values, insertion failure |
| Newsletter | Strict true consent/version, optional name, length/email normalization, duplicate/pending/confirmed/unsubscribed requests, concurrency, uniqueness, generic enumeration-safe responses, no duplicate emails, audit events, delivery failure |
| Tokens | Purpose/hash/expiration, invalid and replayed tokens, concurrent confirmation, stale confirmation invalidation, durable old unsubscribe links, no email-only withdrawal, repeat withdrawal, atomic failure rollback |
| Security | Origin/preflight/methods, fail-closed config/flags, Siteverify action/hostname/age/outage/reuse, separate signup/token edge limits, scheduled bounded cleanup, no public personal-data/admin access, sanitized errors, CSP and mutation-free landing GET |
| Real local D1 | Browser signup, email-link confirmation and unsubscribe through actual Worker routes and isolated D1/workerd binding |
| Frontend | Five locales: question labels, rating keyboard controls, anonymous fields, consent default/native validation, loading/error/retry/success after mocked response only, mobile width, Axe; explicit landing-page click and fragment removal |
| Regression | Existing worker registration/capacity/waitlist/payment/token/Access/lecturer/availability suite; full default Chromium and archive suites, including disabled forms and accessibility |

Final measured results are recorded below.

## Production prerequisites, backup and recovery

Before any separately authorized production change: review this diff, approve the
consent notice and retention policy, select/implement/test the mail service, verify
its idempotency/monitoring, configure sender authentication, Turnstile widget and
exact hostname/actions, approve the rate-limit namespace, secrets, staging origin
and Worker routing for informational pages. Configure account-level WAF and D1
budget alerts for abuse/cost monitoring. Test real provider delivery and complete
confirmation/withdrawal in an approved nonproduction environment. Validate that
unsubscribe still works after the email is old and when campaigns are paused.

Verify the existing migration ledger/schema first; old notes mention a historical
ledger repair, so never blindly rerun old migrations. Take an authorized encrypted
D1 export/snapshot and verify a restore to an isolated database before migration.
Record table counts, known historical-row checksums and foreign-key integrity.
Apply only pending additive migration 0007 through the transactional runner.
If migration fails, preserve the old schema/data and investigate the rolled-back
transaction. After a successful migration, rollback application activation by
turning off new submissions/returning to the prior Worker; leave new tables intact.
Never DROP/rebuild workshop tables as rollback. Preserve an available unsubscribe
path for any real subscribers. Recovery after data loss requires a reviewed restore
and reconciliation of withdrawals after the backup, to avoid reactivating consent.
Encrypt/restrict backups and account for their retention in deletion procedures.

## Known limitations and source references

No live provider, real Turnstile widget or rate-limit binding is configured. No
production feature is enabled. The local mock fixture is not an activation UI.
Actual outbound newsletter campaigns/exports are outside this phase; their sender
must generate fresh hashed purpose-scoped unsubscribe tokens per delivered message
and include durable links using this contract. It cannot recover plaintext tokens
from D1. No campaign sending service was implemented or called.
The workshop CSV exporter prefixes spreadsheet formula-triggering cells with an
apostrophe before CSV quoting. Newsletter data has no exporter or administration UI.
No Firefox/WebKit or production/CDN/provider tests are claimed. Distributed abuse
can still consume D1 work; account-level WAF/billing protections require separate
owner review. CORS, Turnstile and rate limits do not identify a human attendee.

Implementation follows Cloudflare's official documentation:
[Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/),
[Workers rate limit binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/),
and [D1 batch transactions](https://developers.cloudflare.com/d1/worker-api/d1-database/).

## Verification results

| Gate | Final actual result |
| --- | --- |
| `npm run test:worker` | PASSED: 86 tests, 0 failed/skipped; includes all existing Worker/payment regressions and new migration/API/security tests |
| `npm run test:community:d1` | PASSED: 1 actual isolated local D1/workerd test, exit 0 |
| `npm run test:community:ui` | PASSED: 10 Chromium tests, 0 failed/skipped, exit 0 (22.0 seconds); all five locales, Axe and scanner-safe links |
| `npm run test:e2e -- --workers=4 --output=test-results/phase3-default` | PASSED: 441 passed, 1 intentionally skipped production-origin test, 0 failures, exit 0 (2.7 minutes); includes existing accessibility tests |
| Archive Chromium configuration | PASSED: 206 tests, 0 failures/skips, exit 0 (3.1 minutes) |
| `npm run lint` | PASSED, exit 0 |
| `npm run build` | PASSED, exit 0; 170 localized static SEO documents; existing nonfatal >500 kB bundle warning (~599 kB JS) |
| `git -c core.safecrlf=false diff --check` | PASSED |
| `graphify update .` | PASSED, AST only, no paid semantic extraction; final 1,022 nodes / 1,745 edges / 115 communities; community naming freshness warning |
| Production operations / real emails / browser-provider integration | NOT RUN, intentionally unauthorized/disabled |
| Firefox/WebKit / `ai:validate` | NOT RUN; no AI-support instruction files changed |

Initial failures were corrected before the final runs: nullable rating CHECK,
missing theme/H1 in the isolated fixture, Unicode loss when PowerShell piped new
localized strings, and collisions from running original Playwright configurations
against their shared artifact directory. The initial main run had 429 pass,
12 fail, 1 skip; the final full rerun above has no failures. The first sandboxed
archive and D1 attempts were blocked by local template/registry filesystem access.
The identical localhost-only work succeeded with approved broader filesystem
access. Early UI runs completed their test assertions but their sandboxed server
cleanup hung and were interrupted; only the final completed exit-0 run is counted.

Ignored local logs: `test-worker-phase3-final.log`, `test-d1-phase3-verified.log`,
`test-community-ui-verified.log`, `test-e2e-phase3-final.log`,
`test-archive-phase3-final.log`, `test-lint-phase3-final.log`,
`test-build-phase3-final.log`. Community HTML report:
`playwright-report/community/index.html`; the final main suite is in the default
Playwright report. No mock challenge/test fixture strings were found in `dist`.

## Changed source files

- Worker: `worker/src/community.js`, `newsletter-page.js`, `worker.js`,
  `community.test.js`, `community.d1.integration.mjs`, `test-d1.js`,
  `worker.test.js`; configuration: `worker/wrangler.toml`.
- Migration: `worker/migrations/0007_feedback_newsletter.sql`.
- Frontend: `src/components/PostEventHome.jsx`,
  `src/lib/communityContract.js`, `src/data/newsletter-actions.json`,
  the five `src/data/locales/{sk,en,de,es,ja}/site.json` form-status copies.
- Test configuration/scripts: `package.json`, `playwright.config.ts`,
  `playwright.community.config.ts`, `tests/community/forms.spec.ts`,
  `tests/fixtures/community/index.html`, `tests/fixtures/community/main.jsx`.
- Documentation: this note. No dependencies or lockfile changes.

Next safe action: owner review of this local diff and unresolved production
dependencies. Deployment and activation require separate explicit approval.

## Independent security audit remediation (2026-11-13)

Applied the reproduced API-origin and signup/mail coupling fixes. Confirmation
and unsubscribe accept the exact API origin only on their own POST routes; signup
has its own switch, and token actions remain available without signup or mailer
configuration unless the explicit full-shutdown switch is false. Link generation
is pinned to the Worker-owned API origin. Token requests have an independent edge
rate-limit key and cheap validation before D1; cleanup is scheduled and deletes at
most 500 expired rows per table per run. The workshop CSV exporter now neutralizes
spreadsheet formula prefixes. No newsletter administration UI or campaign system
was added; personal-data deletion requests remain manual administrator work.

Verification after these changes: `npm run test:community` passed (65 tests),
`npm run test:worker` passed (90 tests), `npm run test:community:d1` passed (2
isolated workerd/D1 and Chromium tests), `npm run lint` passed, and `git diff
--check` passed. The browser test exercised subscribe, API-hosted confirmation
and unsubscribe, stale/reused tokens, concurrent transitions, signup pause and
missing mailer. No production resources, credentials, deployment, or live email
were used. Staging routing, provider delivery, owner/legal notice and retention
approval, plus account-level WAF/budget alerts remain prerequisites before launch.
