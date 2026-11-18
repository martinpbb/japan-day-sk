// Public build settings only. API flags remain the authoritative kill switches.
const stagingApiOrigin = 'https://japanday-workshops-api-staging.marzo2k.workers.dev';

export function communityConfig(env, locale) {
  const disabled = { feedback: null, newsletter: null };
  if (!['sk', 'en', 'de', 'es', 'ja'].includes(locale) ||
      env.VITE_COMMUNITY_PRIVACY_APPROVED !== 'true' ||
      !env.VITE_TURNSTILE_SITE_KEY?.trim()) return disabled;
  const staging = env.VITE_STAGING_ENVIRONMENT === 'true';
  const apiBase = env.VITE_COMMUNITY_API_BASE?.trim() || (staging ? '' : 'https://api.japanday.sk');
  let apiOrigin;
  try { apiOrigin = new URL(apiBase).origin; } catch { return disabled; }
  if (apiBase !== apiOrigin || !apiBase.startsWith('https://') ||
      (staging && (!env.VITE_COMMUNITY_API_BASE?.trim() || apiOrigin !== stagingApiOrigin))) return disabled;
  const shared = { locale, apiBase, turnstileSiteKey: env.VITE_TURNSTILE_SITE_KEY.trim() };
  return {
    feedback: env.VITE_FEEDBACK_ENABLED === 'true' ? shared : null,
    newsletter: env.VITE_NEWSLETTER_SIGNUP_ENABLED === 'true' && env.VITE_NEWSLETTER_CONSENT_VERSION?.trim()
      ? { ...shared, consentVersion: env.VITE_NEWSLETTER_CONSENT_VERSION.trim() } : null,
  };
}
