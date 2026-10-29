# Slovak workshop catalog

Added seven records to `src/data/locales/sk/workshops.json` on main, starting HEAD `7c08eafa4abe5c372d8691f966acab62aea6b7e3`. Used the requested fields inside an `items` wrapper consistent with adjacent catalogs; no existing workshop catalog schema or consumer exists in this checkout.

All sessions are empty, durations unknown, registration closed. Category and image remain empty. Six workshops are free; the paid placeholder has an unknown price. Only shodo is assigned to akiko-komura. Origami remains unassigned because performer content mentions both Hisayo Yasuda and Asuka Emura without an unambiguous mapping to this catalog entry. No workshop-specific time or capacity was found.

Validation: JSON parsing, seven unique slugs, UTF-8 text and pending scheduling state passed. Production build passed. Graphify update completed. Development server failed dependency optimization with filesystem access/resolution errors; production preview worked. A focused browser check (no full Playwright suite) opened /workshopy, /workshopy/origami, /workshopy/shodo and /workshopy/plateny-workshop, blocking external and API requests. All rendered the home page, with zero workshop links and registration forms; unknown-price copy was absent. Thus cards, required contact fields, empty-session handling and unknown-price presentation could not be verified. Existing routing has no workshop pages and content.js does not load this catalog. Registration logic and all prohibited files were untouched. No registrations or deployment occurred.

Next action: provide the checkout containing the workshop UI, then confirm its schema and repeat the four-route browser check.
