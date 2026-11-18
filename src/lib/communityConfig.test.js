import test from 'node:test';
import assert from 'node:assert/strict';
import { communityConfig } from './communityConfig.js';

const ready = { VITE_COMMUNITY_PRIVACY_APPROVED: 'true', VITE_TURNSTILE_SITE_KEY: 'public-key',
  VITE_NEWSLETTER_CONSENT_VERSION: 'approved-v1' };
test('production forms fail closed without privacy approval and widget settings', () => {
  const enabled = { ...ready, VITE_FEEDBACK_ENABLED: 'true', VITE_NEWSLETTER_SIGNUP_ENABLED: 'true' };
  for (const env of [{}, { VITE_FEEDBACK_ENABLED: 'true' }, { ...enabled, VITE_COMMUNITY_PRIVACY_APPROVED: 'false' },
    { ...enabled, VITE_TURNSTILE_SITE_KEY: '' }]) {
    assert.deepEqual(communityConfig(env, 'sk'), { feedback: null, newsletter: null });
  }
});
test('independent switches preserve all locales and require newsletter consent version', () => {
  for (const locale of ['sk', 'en', 'de', 'es', 'ja']) {
    const feedback = communityConfig({ ...ready, VITE_FEEDBACK_ENABLED: 'true' }, locale);
    assert.equal(feedback.feedback.locale, locale);
    assert.equal(feedback.newsletter, null);
    const newsletter = communityConfig({ ...ready, VITE_NEWSLETTER_SIGNUP_ENABLED: 'true' }, locale);
    assert.equal(newsletter.feedback, null);
    assert.equal(newsletter.newsletter.consentVersion, 'approved-v1');
    assert.equal(newsletter.newsletter.apiBase, 'https://api.japanday.sk');
  }
  assert.equal(communityConfig({ ...ready, VITE_NEWSLETTER_SIGNUP_ENABLED: 'true', VITE_NEWSLETTER_CONSENT_VERSION: '' }, 'sk').newsletter, null);
});

test('staging feedback requires its explicit HTTPS workers.dev API origin', () => {
  const staging = { ...ready, VITE_STAGING_ENVIRONMENT: 'true', VITE_FEEDBACK_ENABLED: 'true',
    VITE_COMMUNITY_API_BASE: 'https://japanday-workshops-api-staging.marzo2k.workers.dev' };
  assert.equal(communityConfig(staging, 'sk').feedback.apiBase, staging.VITE_COMMUNITY_API_BASE);
  for (const apiBase of ['', 'https://api.japanday.sk', 'http://japanday-workshops-api-staging.marzo2k.workers.dev',
    'https://japanday-workshops-api-staging.marzo2k.workers.dev/path', 'https://other.workers.dev']) {
    assert.equal(communityConfig({ ...staging, VITE_COMMUNITY_API_BASE: apiBase }, 'sk').feedback, null);
  }
});
