# Workshop schema reconciliation ? 2026-10-30

Task: local reconciliation with owner-supplied empty production D1 schema.
Starting branch/HEAD: main / 798670e2376c1c7b1be65efc836630c60dfadb37; clean.

IMPLEMENTED: 0002 rebuilds registrations with TEXT primary key (explicitly NOT
NULL, no default), TEXT workshop/session foreign keys, required phone, canonical
status CHECKs and registration_access_token_hash. Copies historical IDs as TEXT,
coalesces missing historical phone to empty, retains timestamps/references,
recreates lookup indexes and replaces workshop/email uniqueness with active
session/email uniqueness. New inserts still require a session via trigger.
0001 remains historical and unchanged; its integer IDs differ from production.
Worker explicitly binds crypto.randomUUID() as registration ID; payment IDs are
separate UUIDs. QR lookup accepts opaque text and retains hashed-cookie ownership.
Free confirmed = free, paid confirmed = pending with payment, waitlist = not_due
without payment. No cancellation API was introduced.

Files: worker/migrations/0002_workshop_sessions_and_payments.sql,
worker/src/worker.js, worker/src/worker.test.js, worker/README.md, this note.

TESTED: node --test worker/src/*.test.js ? 19 passed. Includes fresh on-disk
0001 + 0002 with table_info, foreign_key_list, index_list/index_info inspection,
CHECK acceptance/rejection, phone/ID NOT NULL, token column, duplicate/re-entry,
UUID and opaque-text protected QR, payment state/row behavior, legacy preservation.
VERIFIED: lint excluding generated **/.wrangler/** passed; git diff --check passed;
Wrangler local --dry-run bundle passed (90.70 KiB) after sandbox filesystem
restrictions blocked the initial attempt; graphify update . completed.
NOT RUN: full Playwright, frontend build (no frontend change), deployed D1 checks.
No remote migration, deployment, production data, variables or encoder changes.

Compatibility: Worker matches the canonical post-0002 schema. Current production
still needs 0002; it is not compatible with this Worker before that migration.
Local SQLite verifies SQL, not deployed D1 runtime. Production facts are supplied
by the owner; no production access was attempted.
Next action: review 0002 against the actual remote schema/migration ledger before
separately authorizing remote migration; coordinate schema-before-Worker rollout.
