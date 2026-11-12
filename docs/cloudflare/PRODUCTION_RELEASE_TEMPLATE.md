# Production release — intentionally not activated

Do **not** enable production deployment until the owner reviews and approves the
staging URL, API/CORS behavior, redirects, five language variants, and SEO pages.

The production Worker must have a different name from `japanday-workshops-api`.
Use the same static build and asset routing as `wrangler.web-staging.jsonc`,
but a production-specific configuration, a GitHub Environment requiring approval,
and explicit production custom domains attached only during the approved cutover.

No live domain, DNS record, GitHub Pages workflow or existing Worker must change
merely because this staging configuration is merged.

After approval and traffic cutover, configure automatic production deployment on
pushes to the agreed production branch. Keep the legacy GitHub Pages workflow and
the old DNS settings documented for rollback until the migration is verified.

Rollback: restore the previously recorded DNS/origin routing for both
`japanday.sk` and `www.japanday.sk`, reactivate the last known good GitHub Pages
deployment if necessary, verify key URLs and the separate API worker; keep
Cloudflare staging available for debugging but with no production route.

**Do not** run `wrangler deploy --config worker/wrangler.toml`, D1 migrations,
or any Cloudflare action involving `tvoj-hlas` as part of this migration.
