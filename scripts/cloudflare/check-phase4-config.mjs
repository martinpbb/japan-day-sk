import assert from 'node:assert/strict';
import fs from 'node:fs';

const prod = fs.readFileSync('worker/wrangler.toml', 'utf8');
const stage = fs.readFileSync('worker/wrangler.staging.toml', 'utf8');
const mailer = fs.readFileSync('worker/mailer/wrangler.toml', 'utf8');
const productionMailer = fs.readFileSync('worker/mailer/wrangler.production.example.toml', 'utf8');
assert.match(productionMailer, /name = "japanday-newsletter-mailer"/);
assert.match(productionMailer, /workers_dev = false/);
assert.match(productionMailer, /preview_urls = false/);
assert.match(productionMailer, /binding = "DELIVERY_DB"/);
assert.match(productionMailer, /database_id = "REPLACE_WITH_VERIFIED_PRODUCTION_LEDGER_ID"/);
assert.equal(productionMailer.includes('26f5af16-c3ee-4768-bf77-3d347c104e9f'), false);
assert.equal(productionMailer.includes('STAGING_ENVIRONMENT'), false);
for (const config of [prod, stage]) {
  assert.match(config, /FEEDBACK_ENABLED = "false"/);
  assert.match(config, /NEWSLETTER_SIGNUP_ENABLED = "false"/);
}
assert.match(prod, /\[\[ratelimits\]\][\s\S]*?name = "SUBMISSION_LIMITER"[\s\S]*?namespace_id = "1001"[\s\S]*?\[ratelimits\.simple\][\s\S]*?limit = 60[\s\S]*?period = 60/);
assert.match(stage, /name = "japanday-workshops-api-staging"/);
assert.match(stage, /database_name = "japanday-workshops-staging"/);
assert.match(stage, /database_id = "REPLACE_WITH_STAGING_D1_ID"/);
assert.equal(stage.includes('26f5af16-c3ee-4768-bf77-3d347c104e9f'), false, 'Production D1 ID must never appear in staging config');
assert.match(stage, /STAGING_ALLOWED_ORIGIN = "https:\/\/REPLACE_WITH_EXACT_STAGING_SITE_HOSTNAME"/);
assert.match(stage, /namespace_id = "1002"/);
assert.match(stage, /service = "japanday-newsletter-mailer-staging"/);
assert.match(mailer, /database_name = "japanday-newsletter-delivery-staging"/);
assert.match(mailer, /workers_dev = false/);
assert.equal(fs.readFileSync('wrangler.web-staging.jsonc', 'utf8').includes('japanday-workshops-staging'), false);
console.log('Phase 4 configuration validated: separate staging resources, explicit origin and limiter placeholders.');
