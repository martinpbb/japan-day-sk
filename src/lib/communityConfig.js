// Public build settings only. API flags remain the authoritative kill switches.
export function communityConfig(env, locale) {
  const disabled = { feedback: null, newsletter: null };
  if (!['sk', 'en', 'de', 'es', 'ja'].includes(locale) ||
      env.VITE_COMMUNITY_PRIVACY_APPROVED !== 'true' ||
      !env.VITE_TURNSTILE_SITE_KEY?.trim()) return disabled;
  const shared = { locale, apiBase: 'https://api.japanday.sk', turnstileSiteKey: env.VITE_TURNSTILE_SITE_KEY.trim() };
  return {
    feedback: env.VITE_FEEDBACK_ENABLED === 'true' ? shared : null,
    newsletter: env.VITE_NEWSLETTER_SIGNUP_ENABLED === 'true' && env.VITE_NEWSLETTER_CONSENT_VERSION?.trim()
      ? { ...shared, consentVersion: env.VITE_NEWSLETTER_CONSENT_VERSION.trim() } : null,
  };
}
