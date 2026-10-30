# Workshops API Worker

The Worker runs separately from the React/Vite frontend. It binds the existing production D1 database as `DB`; the database is named `japanday-workshops`.

## Local development

1. Log in to Cloudflare locally: `npx wrangler login`
2. Check the selected account: `npm run worker:whoami`
3. Start the local Worker: `npm run worker:dev`

## Deploy

When ready, run `npm run worker:deploy`. This targets the existing Worker `japanday-workshops-api` and its existing D1 binding.

**Do not run the production migration again.** `migrations/0001_initial.sql` is historical: its integer registration IDs differ from the confirmed production TEXT IDs. Migration `0002` reconciles both starting points; do not replay `0001` remotely.
## Session registration and payments (local implementation)

Apply migrations in order only after review; this task does not authorize remote
migration or deployment. `0002` preserves historical registrations with null
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
