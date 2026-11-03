# Workshop D1 migration chain repair — 2026-11-03

Branch/HEAD at start: `main` / `2408906687a38216a093d834c58ea55c5625165a`.

## Root cause and strategy

`0001` created integer workshop IDs even though `0002` declares TEXT workshop
foreign keys and the current Worker uses opaque string IDs. `0002` also rebuilds
registration IDs as TEXT. Production has the resulting application schema but an
empty `d1_migrations` ledger, so Wrangler sees `0001` as pending and collides with
existing tables. The production rollout record confirms `0002` was executed
directly against production; that migration file was therefore left unchanged.

Changed `0001` to define TEXT workshop, registration, and workshop reference IDs
and to match the current production workshop columns and constraints. Updated
`0003` and `0004` to use transient ordinary helper tables because D1 rejects
`CREATE TEMP TABLE`; each helper table is dropped by its migration. `0004` now
sets workshop IDs to their stable slugs, then seeds the seven canonical parents
and 21 sessions. The existing migration guards and registration preservation
behavior remain in place.

## Canonical ID types

- `workshops.id`: TEXT; the seed assigns the workshop slug.
- `workshop_sessions.id`: TEXT; `workshop_id`: TEXT referencing workshops.
- `registrations.id`: TEXT NOT NULL; `workshop_id` and nullable `session_id`:
  TEXT.
- `registration_payments.id` and `registration_id`: TEXT.

## Fresh local D1 result

Applied all four migrations successfully with Wrangler against an isolated,
empty local persistence directory. `sqlite_schema` contains the four expected
application tables, expected indexes and session-required trigger, and no helper
tables. Foreign-key check is empty. Seeded counts: 7 workshops, 21 sessions, 0
registrations, 0 payments. Workshop IDs are the seven registration-required
slugs; session IDs match the catalogue's 21 canonical IDs. The Worker tests
exercise successful registration lookup for the eight requested session IDs and
assert invalid sessions return `SESSION_NOT_FOUND`.

## Schema comparison with production

All listed local and production columns have the same declared type. Constraint
definitions, defaults, indexes, foreign keys, and trigger also match; there are
no application-schema differences.

| Table | Columns (type) | Production type | Constraint differences |
| --- | --- | --- | --- |
| `workshops` | `id`, `slug`, `title`, `lecturer`, `short_description`, `description`, `start_at`, `end_at`, `location`, `currency`, `created_at`, `updated_at` (TEXT); `capacity`, `price_cents`, `active`, `registration_open` (INTEGER) | Same for each column | None |
| `workshop_sessions` | `id`, `workshop_id`, `start_at`, `end_at`, `location`, `created_at`, `updated_at` (TEXT); `capacity`, `active`, `registration_open` (INTEGER) | Same for each column | None |
| `registrations` | `id`, `workshop_id`, `session_id`, `first_name`, `last_name`, `email`, `phone`, `status`, `payment_status`, `payment_reference`, `registration_access_token_hash`, `created_at`, `updated_at`, `paid_at`, `cancelled_at` (TEXT) | Same for each column | None |
| `registration_payments` | `id`, `registration_id`, `currency`, `payment_reference`, `iban`, `bic`, `beneficiary_name`, `message`, `pay_by_square_payload`, `payment_status`, `created_at`, `paid_at` (TEXT); `amount_cents` (INTEGER) | Same for each column | None |

## Production recommendation

Production reports zero rows in all four application tables. Its schema,
indexes, foreign keys, and trigger are structurally equivalent to the output of
`0001` through `0003`; `0003` is a no-op on the confirmed empty workshop data.
The least invasive repair is therefore to reconcile those three migration names
in the empty ledger, then let Wrangler execute `0004` and record it. This keeps
the existing schema and avoids an application-table outage. This manual history
reconciliation is justified by the completed structural comparison. Do not drop
`d1_migrations`, `_cf_KV`, or any Cloudflare-managed object. Do not run these
commands before review:

```sh
npx.cmd wrangler d1 execute japanday-workshops --remote --command "SELECT name FROM d1_migrations ORDER BY name;" --config worker/wrangler.toml
npx.cmd wrangler d1 execute japanday-workshops --remote --command "INSERT INTO d1_migrations (name) VALUES ('0001_initial.sql'), ('0002_workshop_sessions_and_payments.sql'), ('0003_tea_tasting_sessions.sql');" --config worker/wrangler.toml
npx.cmd wrangler d1 migrations apply japanday-workshops --remote --config worker/wrangler.toml
```

No production writes, migration apply, or deployment were performed.

## Verification

- `node --test worker/src/worker.test.js worker/src/pay-by-square.test.js` — 23
  passed.
- `npx.cmd eslint worker/src/worker.test.js` — passed.
- Wrangler local migration apply — all four migrations passed on an isolated
  empty D1 store.
- Wrangler local `sqlite_schema`, row counts, canonical IDs, and
  `PRAGMA foreign_key_check` inspection — passed.
- Wrangler remote `sqlite_schema`, `PRAGMA table_info`, foreign-key, index, and
  trigger inspection — read-only; matched the repaired local schema.
- `git diff --check` — passed.

Next action: review the local migration result and schema comparison; only then
decide whether to execute the two documented production commands.
