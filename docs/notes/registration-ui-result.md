# Registration UI

Prepared a frontend-only registration form in `src/components/RegistrationForm.jsx`, using Slovak copy in `src/data/registration.json`. No API, storage, analytics, or registration submission is connected. The local check explicitly says no registration was created.

Program items may opt in with `registration: { term, location }`. The workshop title comes from the existing item title; term should contain the confirmed date/time display string. Unset information displays “Bude upresnené”. Current program lists are empty; no workshop facts or public routes were added. The prepared form uses Slovak copy, including on other locales if enabled there.

All four fields are required and trimmed on blur and validation. Limits: names 100 characters each, email 254, phone 50. Email syntax is checked. Phone uses `type="tel"` without a country-specific pattern. Errors are associated with inputs and focus moves to the first invalid field.

Validation: lint, production build and `git diff --check` passed. Three focused Playwright validation tests passed (empty/whitespace, international phone examples, invalid email and maximum lengths). The default runner hung during preview-server shutdown and was interrupted; rerunning with a temporary server-free Playwright configuration exited successfully (3 passed). Graphify updated. Browser visual verification was not run because no confirmed program workshop is configured.

Next action: supply confirmed workshop entries and review the rendered registration form before enabling any future submission flow.
