# Validation

Choose the smallest checks that actually cover the change:

```bash
npm run ai:validate
npm run lint
npm run build
```

For SEO-only generator changes, also inspect generated route HTML, canonical tags, JSON-LD, sitemap and robots outputs.

Report checks honestly as PASSED / FAILED / NOT RUN. Do not claim a build was verified if dependencies or environment prevented it.
