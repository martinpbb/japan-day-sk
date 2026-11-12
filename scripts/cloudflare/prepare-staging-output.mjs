/**
 * Modify only dist/ (ignored build output) for non-indexable staging hosting.
 * Run after `npm run build`, never when preparing a production release.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dist = path.join(root, 'dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('Build first: dist/index.html not found');
const headerFile = path.join(dist, '_headers');
if (fs.existsSync(headerFile)) throw new Error('Cannot safely replace an existing dist/_headers file');
fs.writeFileSync(headerFile, `/*
  X-Robots-Tag: noindex, nofollow, noarchive
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
`);
const notFound = path.join(dist, '404.html');
if (!fs.existsSync(notFound)) fs.writeFileSync(notFound, `<!doctype html><html lang="sk"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="robots" content="noindex, nofollow"/><title>Stránka sa nenašla – Japonský deň</title><style>body{background:#f4efe4;color:#1d3935;font:18px system-ui,sans-serif;margin:0;padding:12vh 24px}main{max-width:600px;margin:auto}h1{font:clamp(2.2rem,6vw,4rem) Georgia,serif}a{color:#aa4934}</style></head><body><main><h1>Stránka sa nenašla</h1><p>Požadovaná stránka nie je dostupná.</p><a href="/">Späť na úvod</a></main></body></html>`);
console.log('Staging-only noindex headers and 404 page written to dist/.');
