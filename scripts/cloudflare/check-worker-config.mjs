/**
 * Fail closed if the staging configuration accidentally acquires production
 * routes, an existing Worker name, or access to D1/KV/R2 resources.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync('wrangler.web-staging.jsonc', 'utf8'));
assert.equal(config.name, 'japanday-sk-web-staging', 'Unexpected Worker name');
assert.equal(config.workers_dev, true, 'Staging must deploy only to workers.dev');
assert.equal(config.preview_urls, false, 'Preview URLs should be disabled');
assert.equal(config.assets?.directory, './dist', 'Static output directory mismatch');
assert.equal(config.assets?.not_found_handling, '404-page', 'Unknown pages must be HTTP 404');
assert.equal(config.assets?.html_handling, 'auto-trailing-slash', 'Preserve existing trailing slash URLs');
for (const forbidden of ['routes', 'route', 'd1_databases', 'kv_namespaces', 'r2_buckets', 'services', 'durable_objects', 'main', 'env', 'unsafe']) {
  assert.equal(Object.hasOwn(config, forbidden), false, `Staging configuration must not declare ${forbidden}`);
}
console.log('Staging safety check passed: assets-only Worker, no production routes or data bindings.');
