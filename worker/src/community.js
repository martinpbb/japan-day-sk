// Public write-only APIs. No visitor content is rendered or logged here.
import { feedbackFields } from '../../src/lib/communityContract.js';
export { feedbackFields };
const locales = new Set(['sk', 'en', 'de', 'es', 'ja']);
const generic = { message: 'If eligible, a confirmation email will be sent.' };
const now = () => Math.floor(Date.now() / 1000);
const randomToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
export async function digest(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
class PublicError extends Error {
  constructor(code, status) { super(code); this.status = status; }
}
const reject = (code = 'VALIDATION_ERROR', status = 400) => { throw new PublicError(code, status); };
const query = (env, sql, ...args) => env.DB.prepare(sql).bind(...args);
async function jsonBody(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) reject('UNSUPPORTED_MEDIA_TYPE', 415);
  if (Number(request.headers.get('Content-Length')) > 20000) reject('REQUEST_TOO_LARGE', 413);
  const reader = request.body?.getReader();
  if (!reader) reject();
  const chunks = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 20000) { await reader.cancel(); reject('REQUEST_TOO_LARGE', 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let data;
  try { data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { reject('INVALID_JSON'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) reject();
  return data;
}
function fields(data, allowed) {
  if (Object.keys(data).some(key => !allowed.includes(key))) reject();
}
function text(value, max, optional = false) {
  if (optional && value === undefined) return null;
  if (typeof value !== 'string' || value.length > max) reject();
  return value.trim() || null;
}
async function limited(env, key, maximum, seconds) {
  const keyHash = await digest(`${key}:${Math.floor(now() / seconds)}`);
  const result = await query(env, `INSERT INTO submission_limits(key_hash,count,expires_at) VALUES (?,1,?)
    ON CONFLICT(key_hash) DO UPDATE SET count=count+1 WHERE count < ? RETURNING key_hash`, keyHash, now() + seconds, maximum).all();
  return result.results.length > 0;
}
async function abuse(request, env, action) {
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) reject('SECURITY_UNAVAILABLE', 503);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.ABUSE_HMAC_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${ip}:${Math.floor(now() / 86400)}`));
  const identity = Array.from(new Uint8Array(signed), b => b.toString(16).padStart(2, '0')).join('');
  // Broad shared-IP allowance; Turnstile and per-address cooldown are stronger gates.
  if (!(await env.SUBMISSION_LIMITER.limit({ key: `${action}:${identity}` })).success ||
    !await limited(env, `${action}:${identity}`, 60, 600)) reject('RATE_LIMITED', 429);
  await env.DB.batch([
    query(env, 'DELETE FROM submission_limits WHERE expires_at < ?', now()),
    query(env, 'DELETE FROM submission_challenges WHERE expires_at < ?', now()),
  ]);
}
async function challenge(env, token, action) {
  if (!text(token, 2048)) reject();
  let response, result;
  try {
    response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) reject('SECURITY_UNAVAILABLE', 503);
    result = await response.json();
  } catch { reject('SECURITY_UNAVAILABLE', 503); }
  if (result.success !== true || result.hostname !== env.TURNSTILE_HOSTNAME || result.action !== action ||
    !Number.isFinite(Date.parse(result.challenge_ts)) || Date.parse(result.challenge_ts) > Date.now() + 30000 ||
    Date.parse(result.challenge_ts) < Date.now() - 300000) reject('CHALLENGE_REJECTED', 403);
  // Siteverify reuse detection is eventually consistent: enforce a local global unique receipt too.
  const receipt = await query(env, `INSERT INTO submission_challenges(token_hash,expires_at) VALUES (?,?)
    ON CONFLICT DO NOTHING RETURNING token_hash`, await digest(token), now() + 600).all();
  if (!receipt.results.length) reject('CHALLENGE_REJECTED', 403);
}
export function emailDelivery(env) {
  if (!env.NEWSLETTER_MAILER?.fetch || !env.NEWSLETTER_LINK_ORIGIN || !env.NEWSLETTER_CONSENT_VERSION) return null;
  let origin;
  try { origin = new URL(env.NEWSLETTER_LINK_ORIGIN); } catch { return null; }
  if (origin.protocol !== 'https:' || origin.origin !== env.NEWSLETTER_LINK_ORIGIN) return null;
  return async (message) => {
    // A future trusted service must implement idempotency and send text or escaped HTML.
    const response = await env.NEWSLETTER_MAILER.fetch(new Request('https://newsletter-mailer.internal/confirmation', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': message.id },
      body: JSON.stringify(message), signal: AbortSignal.timeout(8000),
    }));
    if (!response.ok) throw new Error('DELIVERY_UNAVAILABLE');
  };
}
async function feedback(env, data) {
  fields(data, ['edition', 'locale', 'rating', 'turnstileToken', ...feedbackFields]);
  if (data.edition !== 2026 || !locales.has(data.locale)) reject();
  const rating = data.rating ?? null;
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) reject();
  const answers = feedbackFields.map(field => text(data[field], 2000, true));
  if (rating === null && !answers.some(Boolean)) reject();
  await challenge(env, data.turnstileToken, 'feedback');
  await query(env, `INSERT INTO event_feedback(id,edition,rating,enjoyed_most,improvements,next_time,favourite_food_drink,missing_food_drink,organiser_message,locale,submitted_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`, crypto.randomUUID(), 2026, rating, ...answers, data.locale, now()).all();
  return { status: 201, data: { message: 'Feedback received.' } };
}
async function subscribe(env, data, deliver) {
  fields(data, ['email', 'name', 'consent', 'consentVersion', 'locale', 'turnstileToken']);
  const email = text(data.email, 254)?.toLowerCase();
  const name = text(data.name, 100, true);
  if (!email || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email) ||
    data.consent !== true || data.consentVersion !== env.NEWSLETTER_CONSENT_VERSION || !locales.has(data.locale)) reject();
  await challenge(env, data.turnstileToken, 'newsletter');
  // Global D1 daily cooldown, including attempts for existing/confirmed subscribers.
  if (!await limited(env, `email:${await digest(email)}`, 1, 86400)) return { status: 202, data: generic };
  const stamp = now(), id = crypto.randomUUID(), token = randomToken(), tokenHash = await digest(token);
  const unsubscribe = randomToken(), unsubscribeHash = await digest(unsubscribe);
  const result = await env.DB.batch([
    query(env, `INSERT INTO newsletter_subscribers(id,email,name,status,consent_version,consent_accepted_at,source_locale,created_at,updated_at)
      VALUES (?,?,?,'pending',?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET name=excluded.name,status='pending',
      consent_version=excluded.consent_version,consent_accepted_at=excluded.consent_accepted_at,source_locale=excluded.source_locale,
      confirmed_at=NULL,unsubscribed_at=NULL,updated_at=excluded.updated_at WHERE newsletter_subscribers.status != 'confirmed'`,
    id, email, name, data.consentVersion, stamp, data.locale, stamp, stamp),
    query(env, `UPDATE newsletter_tokens SET consumed_at=?,operation_id=token_hash WHERE purpose='confirm' AND consumed_at IS NULL
      AND subscriber_id IN (SELECT id FROM newsletter_subscribers WHERE email=? AND status='pending')`, stamp, email),
    query(env, `INSERT INTO newsletter_tokens(token_hash,subscriber_id,purpose,created_at,expires_at)
      SELECT ?,id,'confirm',?,? FROM newsletter_subscribers WHERE email=? AND status='pending' RETURNING subscriber_id`, tokenHash, stamp, stamp + 86400, email),
    query(env, `INSERT INTO newsletter_consent_events(id,subscriber_id,event,consent_version,occurred_at)
      SELECT ?,subscriber_id,'requested',?,? FROM newsletter_tokens WHERE token_hash=?`, crypto.randomUUID(), data.consentVersion, stamp, tokenHash),
    query(env, `INSERT INTO newsletter_tokens(token_hash,subscriber_id,purpose,created_at,expires_at)
      SELECT ?,subscriber_id,'unsubscribe',?,NULL FROM newsletter_tokens WHERE token_hash=?`, unsubscribeHash, stamp, tokenHash),
  ]);
  if (result[2].results.length) {
    try {
      await deliver({ id: tokenHash, email, locale: data.locale,
        confirmationUrl: `${env.NEWSLETTER_LINK_ORIGIN}/newsletter/confirm?locale=${data.locale}#token=${token}`,
        unsubscribeUrl: `${env.NEWSLETTER_LINK_ORIGIN}/newsletter/unsubscribe?locale=${data.locale}#token=${unsubscribe}` });
    } catch {
      await query(env, 'UPDATE newsletter_tokens SET consumed_at=?,operation_id=token_hash WHERE token_hash=? AND consumed_at IS NULL', now(), tokenHash).all();
      // Same response for delivery failure and existing subscriber: no enumeration.
    }
  }
  return { status: 202, data: generic };
}
async function transition(env, data, purpose) {
  fields(data, ['token']);
  if (typeof data.token !== 'string' || !/^[a-f0-9]{64}$/.test(data.token)) reject('INVALID_TOKEN');
  const hash = await digest(data.token), operation = crypto.randomUUID(), stamp = now();
  const confirm = purpose === 'confirm';
  const batch = [
    query(env, `UPDATE newsletter_tokens SET consumed_at=?,operation_id=? WHERE token_hash=? AND purpose=? AND consumed_at IS NULL
      AND (expires_at IS NULL OR expires_at>?) AND subscriber_id IN
      (SELECT id FROM newsletter_subscribers WHERE status=?) RETURNING subscriber_id`, stamp, operation, hash, purpose, stamp, confirm ? 'pending' : 'confirmed'),
    query(env, confirm
      ? `UPDATE newsletter_subscribers SET status='confirmed',confirmed_at=?,updated_at=? WHERE id IN (SELECT subscriber_id FROM newsletter_tokens WHERE operation_id=?)`
      : `UPDATE newsletter_subscribers SET status='unsubscribed',unsubscribed_at=?,updated_at=? WHERE id IN (SELECT subscriber_id FROM newsletter_tokens WHERE operation_id=?)`, stamp, stamp, operation),
    query(env, `INSERT INTO newsletter_consent_events(id,subscriber_id,event,consent_version,occurred_at)
      SELECT ?,id,?,consent_version,? FROM newsletter_subscribers WHERE id IN (SELECT subscriber_id FROM newsletter_tokens WHERE operation_id=?)`,
    crypto.randomUUID(), confirm ? 'confirmed' : 'withdrawn', stamp, operation),
  ];
  if (!confirm) batch.push(query(env, `UPDATE newsletter_tokens SET consumed_at=?,operation_id=token_hash WHERE consumed_at IS NULL
    AND subscriber_id IN (SELECT subscriber_id FROM newsletter_tokens WHERE operation_id=?)`, stamp, operation));
  const result = await env.DB.batch(batch);
  if (!result[0].results.length) reject('INVALID_TOKEN');
  return { status: 200, data: { message: confirm ? 'Subscription confirmed.' : 'Subscription withdrawn.' } };
}
export async function community(request, env, path, reply, fail, origin) {
  if (!['/api/feedback', '/api/newsletter/subscribe', '/api/newsletter/confirm', '/api/newsletter/unsubscribe'].includes(path)) return null;
  try {
    if (request.method !== 'POST') reject('METHOD_NOT_ALLOWED', 405);
    const isFeedback = path === '/api/feedback';
    if (env[isFeedback ? 'FEEDBACK_ENABLED' : 'NEWSLETTER_ENABLED'] !== 'true') reject('FEATURE_DISABLED', 503);
    if (!env.DB || !env.SUBMISSION_LIMITER?.limit || typeof env.ABUSE_HMAC_SECRET !== 'string' || env.ABUSE_HMAC_SECRET.length < 32) reject('SECURITY_UNAVAILABLE', 503);
    const needsChallenge = isFeedback || path.endsWith('/subscribe');
    if (needsChallenge && (!env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_HOSTNAME)) reject('SECURITY_UNAVAILABLE', 503);
    const deliver = isFeedback ? null : emailDelivery(env);
    if (!isFeedback && !deliver) reject('NEWSLETTER_UNAVAILABLE', 503);
    await abuse(request, env, isFeedback ? 'feedback' : 'newsletter');
    const data = await jsonBody(request);
    let result;
    if (isFeedback) result = await feedback(env, data);
    else if (path.endsWith('/subscribe')) result = await subscribe(env, data, deliver);
    else result = await transition(env, data, path.endsWith('/confirm') ? 'confirm' : 'unsubscribe');
    return reply(result.data, result.status, origin);
  } catch (error) {
    return fail(error instanceof PublicError ? error.message : 'INTERNAL_ERROR', error instanceof PublicError ? error.status : 500, origin);
  }
}
