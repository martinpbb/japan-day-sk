import assert from 'node:assert/strict';
import fs from 'node:fs';

const prod = fs.readFileSync('worker/wrangler.toml', 'utf8');
const stage = fs.readFileSync('worker/wrangler.staging.toml', 'utf8');
const mailer = fs.readFileSync('worker/mailer/wrangler.toml', 'utf8');
const productionMailer = fs.readFileSync('worker/mailer/wrangler.production.example.toml', 'utf8');
const localStage = fs.readFileSync('worker/wrangler.staging.local.toml', 'utf8');
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
assert.match(stage, /STAGING_ALLOWED_ORIGIN = "https:\/\/japanday-sk-web-staging\.marzo2k\.workers\.dev"/);
assert.match(stage, /TURNSTILE_HOSTNAME = "japanday-sk-web-staging\.marzo2k\.workers\.dev"/);
assert.match(stage, /namespace_id = "1002"/);
assert.equal(stage.includes('NEWSLETTER_MAILER'), false, 'Feedback staging must not have a mailer service binding');
assert.equal(stage.includes('BREVO'), false);
assert.equal(localStage.includes('26f5af16-c3ee-4768-bf77-3d347c104e9f'), false, 'Local staging D1 must not use production D1');
assert.match(localStage, /database_name = "japanday-workshops-staging-local"/);
assert.match(localStage, /database_id = "00000000-0000-0000-0000-000000000000"/);
assert.match(localStage, /migrations_dir = "migrations"/);
assert.equal(localStage.includes('NEWSLETTER_MAILER'), false);
assert.match(stage, /migrations_dir = "migrations"/);
assert.match(mailer, /database_name = "japanday-newsletter-delivery-staging"/);
assert.match(mailer, /workers_dev = false/);
assert.equal(fs.readFileSync('wrangler.web-staging.jsonc', 'utf8').includes('japanday-workshops-staging'), false);
console.log('Feedback staging configuration validated: isolated D1, exact origin, separate limiter placeholder, no mailer or production D1.');
