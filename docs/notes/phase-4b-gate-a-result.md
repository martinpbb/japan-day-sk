# Phase 4B Gate A result — 2026-11-14

Gate A resource provisioning and migration are **IMPLEMENTED / VERIFIED** under
the owner's explicit approval in this session. This supersedes the remote
inventory and unexecuted Gate A status in `phase-4-service-integration.md`.
Production API deployment, website deployment, live emails and public activation
remain outside this approval.

Repository: branch `feature/post-event-2026`, starting HEAD
`6476f025fec7c82fd17a6ffc33398b26d1b52e1a`; initially clean. No commit or push.
Account: `c4024a24868c52c3afe155f9c1cd27a2`.

## Created resources

| Resource | Verified identifier / configuration |
| --- | --- |
| Production D1 ledger `japanday-newsletter-delivery` | `b80263e1-1bc0-42be-9766-f4cc44d20b48`, EEUR |
| Production Worker `japanday-newsletter-mailer` | Version `f1c18edd-6ba4-4fb2-8cd7-5b030193525e`, 100% deployment |
| Mailer binding `DELIVERY_DB` | Dedicated ledger ID above |
| Turnstile `japanday-community` | Public site key `0x4AAAAAAGAeNTUScWY2IHhR`; exact hostname `japanday.sk`; Managed; pre-clearance disabled |

Mailer verification: workers.dev disabled, preview URLs disabled, zero routes,
zero custom domains. No sender variables, Brevo key, staging variables, or API
service binding were configured. The mailer remains unable to send real emails.
Ledger migration `0001_delivery_ledger.sql` applied only to the new database;
`mail_delivery_ledger` exists, contains zero rows, quick_check is OK, and no
foreign-key violations were found.

The ignored local config is `worker/mailer/production.local/wrangler.toml`.
It deliberately omits sender settings rather than inventing an approved sender.
No committed runtime configuration or source code changed.

## Migration and registration verification

Target: `japanday-workshops`, ID `26f5af16-c3ee-4768-bf77-3d347c104e9f`.

- Reviewed the complete `0007_feedback_newsletter.sql`: six CREATE TABLE and
  three CREATE INDEX statements; no registration references or modifications to
  existing objects. Its SHA-256 was
  `3d96cda436b7c738e5ce559a536a8a1a2d52d5cc2bb67c0a394e67044d9dc715`.
- Before application: only 0007 pending; all nine explicit names absent;
  **251 registrations**; remote quick_check OK; zero foreign-key violations.
- Backup export restored into isolated in-memory SQLite. Every existing table's
  count and sorted full-row SHA-256 matched the live database. Full integrity_check
  and foreign_key_check passed. Applying 0007 to that restored copy preserved all
  existing table data and passed both checks again.
- Applied 0007 successfully through the D1 migration runner. Migration history now
  contains 0001–0007; no pending migrations remain.
- After application: **251 registrations**, identical registration row hash;
  every pre-existing application table's data and every existing schema object
  unchanged. Only migration history gained the expected entry.
- Verified all new schema definitions, including implicit uniqueness indexes,
  against SQLite's application of the reviewed migration. All six new tables
  are empty. Remote quick_check remains OK; zero foreign-key violations.
- The optional remote full `PRAGMA integrity_check` was rejected by D1 with
  HTTP 400/code 7500. Remote quick_check succeeded; full integrity_check succeeded
  on the restored backup. Do not describe the remote full check as passed.

Registration row SHA-256 before and after:
`15fe83b4286360a4e02d158299839dbbdc10ca8301a9bcd5593473441d3090ce`.
No registration records or personal data were printed or stored in repository notes.

## Backup and recovery

Pre-migration Time Travel bookmark:
`0000033b-00000000-00005123-6573347c913e553a89b4d382b16cee51`.

Encrypted backup, created at `2026-11-14T06:38:04Z`:
`C:\Users\Martin\AppData\Local\JapanDay\Backups\gate-a-2026-11-14\japanday-workshops-pre-0007.sql.dpapi`.

Protection: owner-only Windows directory ACL plus DPAPI CurrentUser encryption.
Decrypt round-trip verified; temporary plaintext removed. Original SQL export
SHA-256: `bf46a071dc63f54a4aa11d5d6f618462b927ce44335f7737be98720cc1a26b73`.
The owner must retain the Windows profile/DPAPI keys to decrypt this copy; it is
not a separately managed off-device backup. Recovery ownership and long-term
retention remain owner decisions. Time Travel bookmarks expire; see
[Cloudflare's recovery documentation](https://developers.cloudflare.com/d1/reference/time-travel/).
No production restore was attempted. A restore requires separate incident
approval and reconciliation of registrations created after the recovery point.

Wrangler unexpectedly emitted a one-hour signed export-download URL in tool
output. It is omitted here and was redacted from the generated local Wrangler
log. The URL's expiry is `2026-11-14T07:38:03Z`; the already emitted tool output
cannot be retracted. Do not share that output during its validity window.

## Remaining configuration and exact owner actions

No manual action is required to finish this Gate A provisioning. Before the next
approved deployment/release:

1. In Brevo, verify the chosen sending domain and exact sender email/display name,
   confirm transactional permission, and create a dedicated least-privilege REST
   API key. Obtain separate approval before any DNS edits. Supply the approved
   sender identity; store the key only as mailer secret `BREVO_API_KEY`.
2. Obtain Brevo confirmation that transactional click rewriting is disabled.
   A separately authorized test message must later prove both token links retain
   their original origin and complete fragments. Provider behavior is unverified.
3. Approve privacy/controller details, consent wording/version, retention,
   suppression/deletion procedures and processor terms before live submissions.
4. For the next approved API deployment, retrieve the new widget secret privately
   from Cloudflare Turnstile `japanday-community` and store it as API secret
   `TURNSTILE_SECRET_KEY`; generate/store `ABUSE_HMAC_SECRET` securely. Neither
   secret was copied into this repository, logs or this report.
5. Review/select an account-unique limiter namespace, replacing placeholder 1001;
   review API domain mapping, cron and existing bindings. Configure
   `TURNSTILE_HOSTNAME=japanday.sk`, `NEWSLETTER_MAILER` targeting the new mailer,
   `NEWSLETTER_LINK_ORIGIN=https://api.japanday.sk`, and the approved consent
   version only as part of the next authorized API configuration/deployment.
6. Keep submission flags false and website feature/privacy switches off. Use the
   public site key only in future approved build settings. Before launch, verify
   `www` canonical redirect behavior because Siteverify accepts one exact hostname.
7. Provide separate approval for API deployment, controlled recipient testing,
   website deployment and eventual public feature activation. No real email test
   is authorized by Gate A.

API version remains `81685f8a-1671-4b04-a7fa-4880b334c79d`. Its bindings remain
`DB`, `ACCESS_TEAM_DOMAIN`, and secret `ACCESS_AUD`; community flags are absent
on this pre-community deployment. Local submission flags remain false; no remote
submission flag was enabled. Adding API bindings was deferred because the owner
explicitly prohibited API deployment in this gate.

No website deployment, DNS change, GitHub visibility change, new staging
infrastructure, tvoj-hlas modification, workshop behavior change or email send.

## Checks actually run

- `npm.cmd run test:community`: PASSED, 66/66.
- `npm.cmd run test:mailer`: PASSED, 11/11.
- `npm.cmd run check:phase4-config`: PASSED, config validation plus 2/2 tests.
- Remote identity/inventory, migration lists, Time Travel bookmark, row hashes,
  schema comparison, integrity checks and mailer isolation checks: PASSED as above.
- `git diff --check`: PASSED before this note; final check recorded in chat.
- Initial `npm` invocation was blocked by PowerShell script policy; rerunning
  with `npm.cmd` completed successfully.
- Lint/build/UI/live provider tests: NOT RUN; application source unchanged.

Gate A has no unresolved provisioning or migration blocker. Brevo setup, privacy
approval, API configuration and live integration verification remain release
blockers. Next safe action: owner completes Brevo/sender and privacy decisions,
then explicitly authorizes the next reviewed API deployment.
