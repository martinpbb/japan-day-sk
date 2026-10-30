# Workshop payment integration

Task: locally integrate verified PAY by square into session registration.
Branch: main; starting HEAD: 0030d84feea506d017308194b6741c01f63ea633.

IMPLEMENTED: migration 0002, session-based registration, atomic capacity/payment
writes, normalized duplicate protection, numeric references with unique constraint
and collision retry, immutable payment snapshots, protected SVG endpoint,
credentialed CORS, live frontend session availability and success/payment UI.
Encoder unchanged. No dependencies added. No production changes.

Changed areas: worker migration, worker.js and worker.test.js, worker README;
WorkshopDetail and WorkshopRegistrationForm; workshopApi hook; registration JSON.

TESTED: 14 Node tests passed, including existing independent PAY by square decode,
CRC and QR roundtrip checks; new SQLite integration tests cover free/paid/waitlist,
authoritative amount, unique numeric references, duplicate/cancelled registrations,
session counts, access protection, stable snapshots, required config, migration
preservation/foreign keys, and concurrent capacity requests.

VERIFIED: frontend build (138 SEO routes), Worker Wrangler dry-run bundle
(90.47 KiB), lint excluding generated **/.wrangler/** directories, diff check.
Plain lint fails on generated Wrangler artifacts (including pre-existing bundle),
not maintained sources. Initial dry-run failed sandbox directory traversal;
broader filesystem dry-run passed. Graphify AST update completed.

NOT RUN: full Playwright (per task), browser end-to-end/visual verification,
deployed D1/Worker checks, banking-app scan. Local SQLite adapter is not D1 runtime.

Before any separately authorized remote change: review migration and existing data
for normalized duplicate conflicts; configure PAYMENT_IBAN and
PAYMENT_BENEFICIARY_NAME (optional PAYMENT_BIC); supply verified workshops/sessions
and prices. Confirm same-site HTTPS browser cookie/QR behavior. Cookie browser
lifetime is seven days and there is no recovery flow. localhost -> production API
cannot use Lax cookies cross-site despite allowed credentialed CORS. Encoder due
date remains its existing creation-day default, frozen in the stored payload.

Next action: review local changes and complete same-site HTTPS browser acceptance
before separately authorizing migration/deploy. Stop at local implementation.
