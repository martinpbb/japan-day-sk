---
applyTo:
  - "src/**"
  - ".github/workflows/**"
  - ".env*"
---

# Security and environment instructions

This project is currently a client-side application.

## Secrets

Never commit or expose:

- private API keys;
- passwords;
- access tokens;
- service credentials;
- private signing keys;
- secret webhook credentials.

Any value included in the browser bundle must be treated as public.

`VITE_*` environment variables are available to client-side code after build and must never contain true secrets.

## CI and deployment

A secret is no longer secret if its value is injected into generated frontend JavaScript, HTML, JSON, or another publicly deployed asset.

Do not expose a CI secret to the React application merely because it originates from a trusted CI environment.

## External services

Before integrating an external service, determine whether its credential is designed to be public or private.

If a service requires a private credential, client-side React code cannot safely hold it.

Require a trusted server-side, serverless, or provider-hosted integration rather than simulating security in the frontend.
