# Workshop registration reopening tests

The historical active-registration scenarios are stored in
`tests/registration-reopening/registration.spec.ts`. They were recovered from
Git history (`c21f636`) when the archive suite replaced active registration
coverage. The default Playwright configuration and the archive configuration
ignore this directory. Existing archive registration-closure checks remain in
`tests/ui/registration.spec.ts`.

Run these tests only when explicitly requested:

```sh
npm run test:registration:reopening
```

The pure validation and localization checks run. Historical browser scenarios
are explicitly marked `fixme` because the 2026 archive intentionally has no
registration interface. Playwright reports them as skipped with a pending test
status; they are not reported as passing. Recovered coverage includes form
validation and submission, availability and capacity states, and availability
API failure. Pending mocked scenarios also preserve session selection,
waiting-list response and registration API error coverage.

Before registrations open for a future event:

1. Adapt the historical browser scenarios to the current form, session model,
   capacity rules, wait-list behavior and API contract.
2. Keep all API responses mocked with synthetic test data. Do not point this
   configuration at production or submit real registrations.
3. Remove the explicit `browserTest.fixme` markers only after the scenarios are
   adapted, then run `npm run test:registration:reopening` and review every
   result, including failures and skips.
4. Confirm `npm run test:e2e` and the archive suite still exclude this directory
   and that archive closure assertions continue to pass.

This configuration serves the local static preview only; the mocked browser
scenarios may need to run against a dedicated local registration-enabled build
when they are reactivated. Do not restore registration forms to archive pages.
