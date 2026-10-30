# Workshop production rollout — 2026-10-30

Branch/HEAD: main / 798670e2376c1c7b1be65efc836630c60dfadb37.
Existing uncommitted reconciliation changes preserved.

VERIFIED precheck: production japanday-workshops had 0 workshops and 0
registrations, TEXT registration IDs, nullable phone, old workshop/email active
unique index, no session/payment tables, and no migration ledger table.
0002 was unapplied by schema inspection; no unexpected application tables/data.

IMPLEMENTED: executed only worker/migrations/0002_workshop_sessions_and_payments.sql
using Wrangler D1 remote execute (15 queries). 0001 was not replayed. Direct SQL
execution does not create a migration ledger; it remains absent. Do not blindly
run migrations apply: baseline/ledger reconciliation is needed before using it.

VERIFIED remote schema: TEXT NOT NULL registration primary key, required phone,
session/token-hash columns, all five registration payment states, session-required
insert trigger, active session/email uniqueness, obsolete workshop/email index
removed. All four foreign-key relationships correct; foreign_key_check empty.
All four application tables had 0 rows after migration. D1's reported writes
were schema/internal work, not application records.

DEPLOYED: japanday-workshops-api with worker/wrangler.toml and --keep-vars.
Initial sandbox build failed before upload; expanded-access retry succeeded.
Deployment ID: ff9640c7-3958-4863-90f6-988a5167fe73.
Version ID: 7c1f1f1c-2b0e-4d72-bec3-3f363295406f (100%).

VERIFIED live: GET /api/health 200 with ok/status ok; GET /api/workshops 200
with {"ok":true,"data":[]}. Production-origin OPTIONS checks both 204 with
exact echoed origin and credentials true; unapproved origin 403, no allow-origin.
Source also allows localhost:5173; no wildcard origin.
DB binding retained: 26f5af16-c3ee-4768-bf77-3d347c104e9f.
PAYMENT_IBAN and PAYMENT_BENEFICIARY_NAME present/nonempty; optional PAYMENT_BIC
absent. Values not recorded. Existing api.japanday.sk domain association intact.

NOT RUN: full Playwright, production registration/payment creation, new payment
end-to-end validation. No workshop/session/registration/payment records inserted;
no frontend, DNS, CNAME, or tvoj-hlas changes.

Remaining: no observed blocker to adding owner-confirmed real workshops/sessions.
Payment-variable presence was checked, not banking accuracy or a paid transaction.
Next action: owner review of real workshop/session data before a separate import.
