# Workshop registration dataset repair — 2026-11-03

Branch/HEAD at start: `main` / `2408906687a38216a093d834c58ea55c5625165a`.

## Canonical frontend structure

Compared registration structure in `sk`, `en`, `es`, `de`, and `ja` workshop
catalogues. Structures match after sorting by stable IDs. Seven workshops require
registration and contain 21 sessions: japoncina (3), origami (5), shodo (3),
tsumami-zaiku (2), ayatori (2), kumihimo (4), cajova-degustacia (2). The
continuous drop-in `tvorba-kombiku` is not registerable.

## Implemented

- Replaced the local un-applied tea-only repair with
  `worker/migrations/0004_seed_registerable_workshops.sql`, which idempotently
  seeds all seven parents and canonical sessions, syncs canonical start/end and
  capacity, maps the known tea 13:30 stale ID to 14:00, removes unregistered
  stale rows for these workshops, and aborts on unexplained registered stale
  rows or ambiguous tea registration duplicates.
- Extended Worker tests to compare structural fields in every locale, verify
  migration output against all current registerable workshops/sessions, check
  missing-workshop/session API errors, and prove aborts preserve unmapped stale
  registrations.
- Updated `worker/README.md` with the audit, migration, and deployment commands.

## Production audit

Read-only Wrangler access succeeded for the configured `japanday-workshops`
database (`26f5af16-c3ee-4768-bf77-3d347c104e9f`). Counts were 0 workshops,
0 sessions, and 0 registrations. Thus all seven parents and all 21 canonical
sessions are missing; no stale backend sessions or registrations exist to
migrate. No production writes or deployment were made. Await owner review of the
audit before applying the repair.

## Verification

- `node --test worker/src/worker.test.js worker/src/pay-by-square.test.js` — 23
  passed.
- `npx.cmd eslint worker/src/worker.test.js` — passed.
- `git diff --check` — passed.
- `npm.cmd run ai:graph:update` — passed.

## Next action

Superseded by `docs/notes/workshop-migration-chain-repair.md`: the production
ledger is empty, so do not directly execute `0004`. Review the complete schema
comparison and fresh migration result before any production write.
