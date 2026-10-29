# Workshops API Worker

The Worker runs separately from the React/Vite frontend. It binds the existing production D1 database as `DB`; the database is named `japanday-workshops`.

## Local development

1. Log in to Cloudflare locally: `npx wrangler login`
2. Check the selected account: `npm run worker:whoami`
3. Start the local Worker: `npm run worker:dev`

## Deploy

When ready, run `npm run worker:deploy`. This targets the existing Worker `japanday-workshops-api` and its existing D1 binding.

**Do not run the production migration again.** `migrations/0001_initial.sql` is a repository copy of the schema already applied to production.
