# Phase 4 — Service integration and controlled production release

## Phase 4B current state — 2026-11-14

This section supersedes the staging-first instructions below, which remain a
historical Phase 4A record. Phase 4B reuses the production API/D1 and the existing
static staging website; no additional staging backend is proposed.

**COMPLETED locally; OWNER APPROVAL REQUIRED for remote changes.** Starting
branch `feature/post-event-2026`, HEAD `24053e8ec0e0c7a3fafcabb08e8093e92d7a271d`,
clean worktree. No commits, pushes, deployments, remote migrations, resource
creation, DNS edits, secret writes or real emails were performed in this task.

### VERIFIED remote inventory (read-only)

Wrangler authentication was initially expired; the owner restored it. Account
`c4024a24868c52c3afe155f9c1cd27a2` was then inspected using Wrangler and
authenticated GET requests. Secret values were not printed.

| Resource | Observed state |
| --- | --- |
| `japanday-workshops-api` | Exists; current version `81685f8a-1671-4b04-a7fa-4880b334c79d` (2026-11-05) |
| API bindings | `DB`, `ACCESS_TEAM_DOMAIN`, secret `ACCESS_AUD` only; no community flags, limiter, Turnstile/abuse secrets or mailer binding |
| `japanday-workshops` | ID `26f5af16-c3ee-4768-bf77-3d347c104e9f`; 251 registration records at inspection |
| Migration history | Only `0007_feedback_newsletter.sql` pending; schema inspection confirms no community tables; queries reported zero rows written |
| `japanday-sk-web-staging` | Exists; do not recreate |
| Newsletter mailer / ledger | Neither exists in the account inventory; only the workshop D1 database exists |
| Turnstile | Only an unrelated widget for `studentskevolby.info` / `www.studentskevolby.info` exists; do not reuse or modify it |
| `tvoj-hlas` | Listed only; unchanged |
| Public website | GET `https://japanday.sk` returned 200 with `server: GitHub.com`; do not assume production Cloudflare static hosting |
| Community API | GET `/api/feedback` returned 404; deployed API predates Phase 4. Local flags are false; remote community flags are absent, not verified false |

Route/DNS detail queries did not yield usable verification. Confirm the existing
`api.japanday.sk` custom-domain mapping in the dashboard before deployment.
The local API config has no route declaration; preserve the current domain.
Brevo account state, sender authentication, transactional permission and tracking
configuration remain **BLOCKED / CONFIGURATION REQUIRED** pending account access.

### Local changes and retained behavior

- `src/lib/communityConfig.js` supplies independent feedback/newsletter configs
  from public build settings; both default off. Newsletter additionally requires
  a consent version. Both require a site key and explicit privacy approval.
- `PostEventHome.jsx` now consumes those configs separately, memoized by locale.
  Existing form design, validation, anonymous feedback and five locales remain.
- Added config unit tests and a browser check for independent switches, retaining
  the existing local mock fixture and all existing assertions.
- Added an isolated real D1 ledger test proving that an ambiguous provider failure
  persists and duplicate attempts do not resend.
- Added `worker/mailer/wrangler.production.example.toml`, a review template with
  unresolved sender/ledger placeholders, no public routes and no staging mode.
  It is not a deployed resource or a ready-to-run production config.
- Extended `check:phase4-config` to check the template and frontend flag behavior.
  Passing this check means repository safety, **not production readiness**.
- No migration, API handler, mailer delivery algorithm or dependency was changed.
  Migration 0007 remains additive. The API owns consent, token hashes and subscriber
  lifecycle; the isolated mailer ledger owns duplicate-delivery protection.

### Configuration and owner dashboard actions

**Cloudflare, after Gate A approval:** select the account above. In Workers &
Pages, open `japanday-workshops-api`, Settings, and inspect Domains & Routes,
Bindings, and Variables and Secrets. Preserve `DB`, `ACCESS_AUD`, and
`ACCESS_TEAM_DOMAIN`. Recheck all remote settings immediately before deployment;
do not overwrite newly added settings with this snapshot.

1. In Storage & databases > D1, create only `japanday-newsletter-delivery` if
   inventory still confirms it absent. Record its generated ID. Its isolation
   is required by the existing mailer architecture; no new subscriber DB is needed.
2. Copy the mailer review template to `worker/mailer/wrangler.production.local`
   (ignored by `*.local`); fill the verified ledger ID and sender. Keep
   `workers_dev=false`, `preview_urls=false`, no routes, no staging variables.
3. In Turnstile, Add widget named `japanday-community`, Managed mode, hostname
   `japanday.sk`, pre-clearance disabled. Do not reuse the unrelated widget.
   The current API accepts one exact hostname, so verify `www` redirects to the
   canonical host before launch; supporting both needs an explicit tested change.
   Store its secret as API secret `TURNSTILE_SECRET_KEY`, public site key only in
   website build settings, and API var `TURNSTILE_HOSTNAME=japanday.sk`.
4. Generate a random API secret `ABUSE_HMAC_SECRET` of at least 32 characters via
   a secure local secret manager; enter through Variables and Secrets. Never
   put secrets in shell arguments, notes, Vite variables or Git.
5. Assign an account-unique positive integer `SUBMISSION_LIMITER` namespace after
   inspecting account usage; `1001` and `1002` remain unapproved placeholders.
   Keep the existing limit of 60 requests / 60 seconds and D1 limits.
6. Add service binding `NEWSLETTER_MAILER` -> `japanday-newsletter-mailer` in the
   reviewed API config. Set `NEWSLETTER_LINK_ORIGIN=https://api.japanday.sk` and
   the owner-approved `NEWSLETTER_CONSENT_VERSION`. Keep `FEEDBACK_ENABLED=false`
   and `NEWSLETTER_SIGNUP_ENABLED=false`; keep token actions enabled for withdrawal.
   Review the existing scheduled cleanup trigger as part of the API deployment.

Community requests retain existing exact origins `https://japanday.sk`,
`https://www.japanday.sk`, and the existing localhost development origin.
Confirmation/withdrawal also accept the API origin on their own POST endpoints.
CORS is not the access restriction for controlled live testing.

**Brevo:** Settings > Senders, Domains, IPs > Domains: add/verify the approved
sending domain, publish only the DNS records Brevo supplies (separate approval
for DNS changes), and verify authentication. Under Senders, verify the exact
owner-selected sender address and display name. Settings > SMTP & API > API Keys:
create a dedicated key with the narrowest available permissions and confirm that
transactional sending is enabled. Store it only as mailer secret `BREVO_API_KEY`.
Do not confuse an SMTP key with the REST API key.

**BLOCKED: link tracking.** Official docs reviewed do not establish a per-message
REST switch disabling click rewriting. Do not invent a header or treat anonymous
tracking as disabled tracking. Ask Brevo support to disable transactional click
tracking for this account/sender and confirm the effective setting. Before release,
inspect an approved delivered message's HTML and text: both token-bearing URLs
must point directly to `api.japanday.sk` and preserve the complete fragments.
If Brevo cannot guarantee this, newsletter release remains blocked. No provider
replacement is proposed. Templates already cover SK/EN/DE/ES/JA, HTML escaping
and plain text; no marketing campaign or unsolicited send is part of this release.

### Exact migration / deployment plan — NOT EXECUTED

Gate A must approve the API deployment, migration 0007 on the exact workshop DB,
new isolated ledger and mailer, Turnstile widget, namespace, secrets/bindings and
cleanup schedule. Final namespace, sender and generated ledger ID must be recorded
before deployment. The creation step can be approved by exact resource name first.

Read-only recheck commands (PowerShell, repository root):

```powershell
npx.cmd wrangler d1 migrations list japanday-workshops --remote --config worker/wrangler.toml
npx.cmd wrangler d1 execute japanday-workshops --remote --config worker/wrangler.toml --command "SELECT name,sql FROM sqlite_master WHERE type IN ('table','index'); SELECT COUNT(*) AS registration_count FROM registrations;"
npx.cmd wrangler deployments list --config worker/wrangler.toml
npx.cmd wrangler secret list --config worker/wrangler.toml
```

Before any mutation, record the active API version and a D1 Time Travel bookmark;
export to an access-restricted, encrypted owner backup directory outside Git:

```powershell
npx.cmd wrangler d1 time-travel info japanday-workshops --config worker/wrangler.toml
# Replace the output path with the approved protected location; contains personal data.
npx.cmd wrangler d1 export japanday-workshops --remote --config worker/wrangler.toml --output <protected-backup-path.sql>
```

Verify the export restores into an isolated local database before proceeding.
Do not print the export, commit it or attach it to chat. Record backup retention
and recovery ownership. Rerun the migration list; proceed only if **0007 alone**
is pending and the six tables are absent. If compatible tables already exist,
stop and reconcile migration history without recreating or dropping them.

After explicit approval only:

```powershell
npx.cmd wrangler d1 create japanday-newsletter-delivery
# Populate the reviewed mailer local config with the returned production ID.
npx.cmd wrangler d1 migrations apply japanday-workshops --remote --config worker/wrangler.toml
npx.cmd wrangler d1 migrations apply japanday-newsletter-delivery --remote --config worker/mailer/wrangler.production.local
# Configure approved secrets interactively/dashboard, then deploy mailer before API.
npx.cmd wrangler deploy --config worker/mailer/wrangler.production.local
npx.cmd wrangler deploy --config worker/wrangler.toml --keep-vars
```

The last command requires the reviewed API file to contain the verified namespace
and service binding first. `--keep-vars` preserves dashboard variables, but is not
a substitute for reviewing bindings, routes and triggers. Recheck registration
count/schema and existing read-only workshop availability after deployment; do
not create a real workshop registration to test. Record concurrent legitimate
registrations rather than assuming an unchanged count proves full data integrity.

### Controlled verification, public activation and rollback

Step B leaves both API submission flags false and both website build flags off.
Verify direct POSTs cannot persist data or send mail. Do not expose a test bypass
token, secret query parameter, or browser-only allowlist.

For Step C, first approve the privacy wording and a developer-owned inbox/IP.
An owner-approved Cloudflare WAF rule may restrict only the two submission paths
on `api.japanday.sk` to the test IP while leaving workshop and token endpoints
untouched. Verify denial from a non-allowlisted IP **before** temporarily enabling
API submission flags. Use a local developer UI with the real widget/site hostname
through an approved test setup, or an Access-protected existing staging page with
explicitly reviewed hostname/CORS configuration. The current local mock fixture
is not a live-testing harness. The restricted UI/hostname and rule are still
CONFIGURATION REQUIRED; do not enable public forms just to test. If a safe test
setup cannot be verified, stop. Approval of a deployment alone does not authorize
a real email; obtain the exact recipient and send approval before Step C.

Test persistence, new/pending/confirmed subscription behavior, inbox delivery,
original URLs, confirmation, repeated/expired/invalid tokens, withdrawal, duplicate
feedback attempts, bad/expired Turnstile, rate limiting, failure responses and all
five locales. Read back only dedicated test records. Record actual outcomes;
local mocks do not verify Brevo, Cloudflare Siteverify or remote bindings.

At Gate B, present live evidence and request separate public activation approval.
Publish approved privacy text and translations before setting build variables:

| Public Vite setting | Default / requirement |
| --- | --- |
| `VITE_FEEDBACK_ENABLED` | absent/false; literal `true` only after approval |
| `VITE_NEWSLETTER_SIGNUP_ENABLED` | absent/false; independent literal `true` |
| `VITE_COMMUNITY_PRIVACY_APPROVED` | absent/false; set only after publishing approved notices in all locales |
| `VITE_TURNSTILE_SITE_KEY` | actual public widget key, never secret |
| `VITE_NEWSLETTER_CONSENT_VERSION` | exact same approved version as API |

These are build-time settings: changing them requires a website rebuild/release.
They attest to review; they do not themselves publish a notice or enforce law.
No workflow currently supplies them. GitHub Pages deploys on push to `main` or
manual dispatch. Cloudflare static staging deploys by manual dispatch only;
`cloudflare-check.yml` validates/builds without deployment. No production static
Cloudflare deploy workflow was found. Do not merge/push main or dispatch either
deployment as part of preparation. Verify any dashboard-managed build triggers
before approving the final website release mechanism.

**Immediate disable:** set only the affected API flag to `false` in Worker
Variables and Secrets and deploy that change; disable both if uncertain. Then
rebuild the website with the matching Vite flags false. Leave token actions
enabled so existing subscribers can withdraw. After restricted testing, return
API flags to false before removing any test access restriction.

**Rollback:** prefer disabling submission and rolling back the API to its recorded
previous version through Workers & Pages > API > Deployments. Keep additive tables
and ledger intact. Do not delete ledger rows or run down migrations. Before any
public signup exists, the recorded pre-Phase-4 version is suitable for workshop
recovery; after activation it would remove withdrawal endpoints, so use a known
good Phase 4 version with signup disabled instead. Database restoration is a
separate approved incident action: restoring the entire DB to an old bookmark
can erase registrations made since that bookmark. Pause affected writes and
reconcile later registrations before considering Time Travel. Never restore the
whole production DB merely to undo an additive schema change.

### Delivery failure recovery and privacy decisions

Do not reset `sending`/`failed` ledger entries or resend their message automatically.
`failed` can represent ambiguous provider delivery; `sending` can remain after a
crash. Correlate the delivery hash/time with Brevo transactional logs privately.
The API consumes the failed confirmation token, so even a late-delivered message
may no longer confirm. Record provider evidence and resolution without email/token
values in repository notes. A subscriber may initiate a fresh request after the
existing daily cooldown; it creates a new token and invalidates old confirmation
tokens. An operator must not bulk resend, reactivate a token, or mark consent
confirmed manually. If receipt is uncertain, leave the ledger unchanged.

**OWNER APPROVAL REQUIRED:** controller legal identity/address/contact, feedback
lawful basis, purposes, all retention periods (feedback, pending/confirmed/
withdrawn subscribers, consent evidence, ledger, backups), processors/transfers,
and handling of rights requests. Existing 24-hour confirmation-token expiry and
bounded abuse cleanup are implemented technical limits, not an approved general
retention policy. No automated subscriber/feedback retention purge exists.

Draft Slovak text for legal/owner review, **not published**:

> Prevádzkovateľom osobných údajov je [právny názov, adresa], kontakt [kontakt].
> Spätnú väzbu používame na vyhodnotenie podujatia a prípravu ďalšieho ročníka
> na právnom základe [schválený právny základ]. Meno ani e-mail nevyžadujeme.
> Do voľného textu, prosím, neuvádzajte citlivé údaje ani osobné údaje iných osôb.
> Odpovede uchovávame [schválená lehota]. Technickí poskytovatelia a prípadné
> prenosy údajov: [schválené informácie o Cloudflare a zárukách].

> Súhlasím, aby [prevádzkovateľ] používal moju e-mailovú adresu a dobrovoľne
> uvedené meno na zasielanie noviniek o Japonskom dni čaju a kultúry.
> Odber sa aktivuje až po potvrdení e-mailu. Súhlas môžem kedykoľvek odvolať
> odkazom v e-maile alebo na [kontakt]; odvolanie nemá vplyv na zákonnosť
> predchádzajúceho spracúvania. Údaje uchovávame [schválené lehoty pre odber,
> nepotvrdené žiadosti a dôkaz súhlasu]. Pri doručovaní využívame Brevo
> a pri prevádzke Cloudflare [schválené podmienky a prenosy].

Complete the notice with applicable access, correction, deletion, restriction,
objection/portability rights, complaint route and processor details; translate
approved wording into EN/DE/ES/JA in existing locale data. Checkbox remains
unchecked and independent of feedback. Never use placeholders as a live notice.

Rights workflow: accept requests through the approved controller contact, verify
identity proportionately, locate only relevant records privately, provide a secure
export, and review erasure versus required evidence retention with the owner.
Withdrawal is not erasure. Subscriber deletion cascades to tokens/consent events,
so approve evidence handling first. For free-text feedback, redact/delete only
identified personal content after review; do not demand an identity to submit
feedback. Include provider logs and backup expiry in the response/procedure.
No public lookup, export or deletion endpoint is introduced.

### Phase 4B verification

| Check | Actual result |
| --- | --- |
| `npm.cmd run test:worker` | PASSED 93, including historical-data migration preservation and lifecycle cases |
| `npm.cmd run test:mailer` | PASSED 11, including Turnstile module tests; provider mocked |
| `npm.cmd run test:community:d1` | PASSED 3 isolated local D1/browser tests, including the delivery-ledger migration and ambiguous-failure deduplication |
| `npm.cmd run test:community:ui` | PASSED 11, clean exit; all five locales and independent flags |
| `npm.cmd run check:phase4-config` | PASSED, including 2 new config tests |
| `npm.cmd run lint` | PASSED |
| `npm.cmd run build` | PASSED, 170 SEO documents; existing ~601 kB chunk warning |
| `git diff --check` | PASSED |
| `graphify update .` | PASSED, AST graph refreshed; semantic documentation graph not rebuilt |
| Full E2E | NOT RUN: no shared routing, workflow or major layout changes; targeted UI covers changed behavior |
| Real provider sends / remote mutations / public activation | NOT RUN; explicit approval gates pending |

Official references checked for this runbook:
[D1 commands and backups](https://developers.cloudflare.com/d1/wrangler-commands/),
[Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/),
[Turnstile setup](https://developers.cloudflare.com/turnstile/get-started/),
[Brevo domain authentication](https://help.brevo.com/hc/en-us/articles/12163873383186-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC),
[Brevo tracking anonymization](https://help.brevo.com/hc/en-us/articles/11643306229906-Can-I-anonymize-the-tracking-of-opens-and-clicks-for-my-emails),
[EU data protection guidance](https://europa.eu/youreurope/business/governance-and-sustainability/digital-and-data-compliance/data-protection-gdpr/index_en.htm).

Final worktree: ten intended modified/new files, no commit or push; branch and
HEAD unchanged. Generated Graphify artifacts remain ignored.

Next safe action: obtain Gate A approval for the exact scoped resources/migration
above, resolve the sender/namespace and privacy decisions, then recheck remote
state before any approved mutation. Production integration is not yet operational.

## Historical Phase 4A preparation record

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
