# Workshops API Worker

The Worker runs separately from the React/Vite frontend. It binds the existing production D1 database as `DB`; the database is named `japanday-workshops`.

## Local development

1. Log in to Cloudflare locally: `npx wrangler login`
2. Check the selected account: `npm run worker:whoami`
3. Start the local Worker: `npm run worker:dev`

## Deploy

When ready, run `npm run worker:deploy`. This targets the existing Worker `japanday-workshops-api` and its existing D1 binding.

## Read-only admin dashboard

The dashboard uses Cloudflare Access JWTs. Set `ACCESS_TEAM_DOMAIN` to the account's
`<team>.cloudflareaccess.com` issuer and set Worker secret `ACCESS_AUD` to the
Access application's audience tag. The Worker verifies RS256 signatures against
the issuer JWKS, issuer, audience, expiry, not-before, and email, then checks the
active D1 user and role for every `/api/admin/*` request. Missing/invalid Access
configuration fails closed with 401.

After the existing production D1 migration-ledger reconciliation described
above, apply `0005_admin_authorization.sql`. Then add approved organizer emails
to `admin_users` with role `admin`; add lecturer emails as `lecturer` and map
only their workshop IDs in `lecturer_workshops`. Deactivate access by setting
`active=0`. Do not put user assignments in frontend configuration.

Create a Cloudflare Access self-hosted application for only
`api.japanday.sk/api/admin/*`, with an allow policy for organizer/lecturer
groups. Do not protect `japanday.sk/admin*`: those static GitHub Pages routes
are public shells, and protecting them sends the Access callback to a host that
cannot serve Cloudflare's callback path. Keep eager redirect cookies enabled.
Use the application's AUD tag as `ACCESS_AUD`. Cloudflare Access injects
`Cf-Access-Jwt-Assertion` to the Worker and the Worker independently verifies
it. The admin shell sends credentialed requests to the protected API and offers
a direct sign-in link to its summary endpoint when Access authentication is
needed. Keep admin URLs out of public navigation. Static admin shells are
noindex and contain no participant data.

Admin API CORS returns explicit origins with credentials enabled for
`https://japanday.sk` and the existing local development origin
`http://localhost:5173`. OPTIONS preflights are supported for admin paths.

Deploy the frontend through the existing GitHub Pages workflow and deploy the
Worker separately only after applying the migration and setting Access values.

## Production migration ledger repair

Production currently has the application schema but no applied migration
records. The fresh local D1 chain (`0001` through `0004`) has been verified and
matches the inspected production application schema. `0002` remains unchanged:
it was previously executed directly against production, even though Wrangler's
migration ledger is empty. The recommended repair is to drop only the four empty
application schema is structurally equivalent to the schema after `0001` through
`0003`, and all application tables are empty. The recommended repair is to record
those three migrations as reconciled, then let Wrangler run `0004` normally.

Do not execute these commands until the schema comparison and zero-row audit in
`docs/notes/workshop-migration-chain-repair.md` have been reviewed. They preserve
This intentionally inserts migration history, which is justified by the exact
schema comparison. Confirm the ledger is empty first. These commands preserve
all existing application tables and Cloudflare-managed objects:

```sh
npx.cmd wrangler d1 execute japanday-workshops --remote --command "SELECT name FROM d1_migrations ORDER BY name;" --config worker/wrangler.toml
npx.cmd wrangler d1 execute japanday-workshops --remote --command "INSERT INTO d1_migrations (name) VALUES ('0001_initial.sql'), ('0002_workshop_sessions_and_payments.sql'), ('0003_tea_tasting_sessions.sql');" --config worker/wrangler.toml
npx.cmd wrangler d1 migrations apply japanday-workshops --remote --config worker/wrangler.toml
```

No Worker deployment is part of this database repair.
## Session registration and payments (local implementation)

Apply historical migrations only after schema review. `0002` preserves historical registrations with null
sessions, requires sessions for new inserts, and replaces workshop-wide duplicate
protection with normalized session/email uniqueness. No sessions are invented or
seeded. It rebuilds registrations with explicit TEXT UUID IDs, required phone,
`registration_access_token_hash`, and payment statuses `free`, `not_due`,
`pending`, `paid`, `cancelled`. Historical IDs are cast to TEXT; missing historical
phones become empty strings. The partial unique index is `(session_id, email)`
where status is not cancelled; the Worker trims and lowercases email.
QR routes accept opaque TEXT IDs and still require the ownership cookie.
Integration tests apply the actual `0001` then `0002` migrations, including a
fresh on-disk schema/constraint check. Workshop prices remain authoritative; only EUR payments are supported.

- `GET /api/workshops` and `GET /api/workshops/:slug` include active sessions,
  registration flags, capacity, registered count and remaining capacity.
- `POST /api/sessions/:sessionId/register` requires first_name, last_name, email,
  phone. The old workshop registration endpoint is retired.
- `GET /api/registrations/:id/payment/qr.svg` requires the registration cookie.

Configure Worker secrets/variables `PAYMENT_IBAN` and
`PAYMENT_BENEFICIARY_NAME`; `PAYMENT_BIC` is optional. Never put actual account
values in committed configuration. Invalid/missing configuration returns 503
before reserving a paid place. Waitlisted attendees receive no payment.

Registration and payment snapshot writes use an atomic D1 batch. Capacity is
evaluated inside the INSERT, and the unique payment reference constraint is
retried on collision. The numeric reference has at most ten digits. QR rendering
uses the stored payload, independent of later account/price changes.

Access uses a 256-bit random token, with only SHA-256 persisted. The host-only
cookie has HttpOnly, Secure, SameSite=Lax, a registration-specific payment path,
and a seven-day browser lifetime. Different registrations can coexist. After
cookie expiry there is currently no recovery flow. Local frontend calls to the
production API are cross-site: SameSite=Lax prevents QR cookie access there;
use same-site HTTPS hosts for full browser verification. CORS permission alone
does not override SameSite. Production apex/www and API are same-site.

Local tests (Node 24, built-in SQLite; no production DB access):
`node --test worker/src/worker.test.js worker/src/pay-by-square.test.js`.
This SQLite adapter tests SQL and transaction semantics, not deployed D1.
