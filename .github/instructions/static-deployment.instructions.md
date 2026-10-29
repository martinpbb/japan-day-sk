---
applyTo:
  - ".github/workflows/**"
  - "vite.config.*"
  - "src/App.jsx"
  - "src/main.jsx"
  - "index.html"
---

# Static deployment instructions

The website is designed for static hosting.

## Constraints

Do not assume:

- a persistent Node.js server;
- server-side sessions;
- server-side API routes;
- runtime filesystem access;
- private server environment variables.

## Navigation and assets

When modifying routing, entry behavior, or assets, verify:

- Vite base-path handling;
- asset URLs;
- direct navigation behavior;
- refresh/deep-link behavior if routes are added;
- generated build paths.

Do not introduce routing behavior that requires a traditional application server unless deployment architecture is explicitly changed.

## Build

Prefer repository build scripts.

When deployment behavior changes, run a production build before completion.
