/** Verify static staging modifications before any Cloudflare deployment. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const headers = fs.readFileSync('dist/_headers', 'utf8');
assert.match(headers, /^\/\*\s*$/m, 'Global static header rule missing');
assert.match(headers, /X-Robots-Tag:\s*noindex, nofollow, noarchive/i);
assert.match(headers, /X-Content-Type-Options:\s*nosniff/i);
const page = fs.readFileSync('dist/404.html', 'utf8');
assert.match(page, /Stránka sa nenašla/);
console.log('Staging output safety check passed: noindex headers and custom 404 page.');
