const localeCopy = {
  sk: { subject: 'Potvrďte odber noviniek', intro: 'Potvrďte svoju e-mailovú adresu a prihláste sa na odber noviniek.', confirm: 'Potvrdiť odber', unsubscribe: 'Odhlásiť sa' },
  en: { subject: 'Confirm your newsletter subscription', intro: 'Confirm your email address to subscribe to our newsletter.', confirm: 'Confirm subscription', unsubscribe: 'Unsubscribe' },
  de: { subject: 'Bestätigen Sie Ihr Newsletter-Abonnement', intro: 'Bestätigen Sie Ihre E-Mail-Adresse, um unseren Newsletter zu abonnieren.', confirm: 'Abonnement bestätigen', unsubscribe: 'Abmelden' },
  es: { subject: 'Confirma tu suscripción al boletín', intro: 'Confirma tu dirección de correo para suscribirte al boletín.', confirm: 'Confirmar suscripción', unsubscribe: 'Cancelar suscripción' },
  ja: { subject: 'ニュースレター登録の確認', intro: 'メールアドレスを確認して、ニュースレターに登録してください。', confirm: '登録を確認', unsubscribe: '配信停止' },
};
const esc = value => String(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]);
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const validUrl = (value, allowedOrigin) => { try { const u = new URL(value); return u.protocol === 'https:' && u.origin === allowedOrigin && !u.username && !u.password; } catch { return false; } };

export function renderEmail(message, allowedOrigin = 'https://api.japanday.sk') {
  const copy = localeCopy[message.locale];
  if (!copy || !validUrl(message.confirmationUrl, allowedOrigin) || !validUrl(message.unsubscribeUrl, allowedOrigin) || !/^[a-f0-9]{64}$/.test(message.id)) throw new Error('INVALID_MESSAGE');
  // URLs are emitted verbatim: credential-bearing fragments are never tracked or rewritten.
  const confirmationUrl = message.confirmationUrl;
  const unsubscribeUrl = message.unsubscribeUrl;
  const text = `${copy.intro}\n\n${copy.confirm}: ${confirmationUrl}\n${copy.unsubscribe}: ${unsubscribeUrl}`;
  const html = `<!doctype html><html lang="${message.locale}"><meta charset="utf-8"><body><p>${esc(copy.intro)}</p><p><a href="${esc(confirmationUrl)}">${esc(copy.confirm)}</a></p><p><a href="${esc(unsubscribeUrl)}">${esc(copy.unsubscribe)}</a></p></body></html>`;
  return { subject: copy.subject, text, html };
}

async function sendBrevo(message, rendered, env, fetcher) {
  if (!env.BREVO_API_KEY || !env.MAIL_FROM_EMAIL || !env.MAIL_FROM_NAME) throw new Error('MAIL_CONFIGURATION');
  const payload = { sender: { email: env.MAIL_FROM_EMAIL, name: env.MAIL_FROM_NAME }, to: [{ email: message.email }], subject: rendered.subject,
    htmlContent: rendered.html, textContent: rendered.text, headers: { 'X-Mailin-custom': `delivery:${message.id}` } };
  // Brevo does not document Idempotency-Key as a send guarantee. The D1 ledger owns dedupe.
  // Only one bounded retry is allowed for an explicit 429 rejection; timeouts/5xx are ambiguous.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response;
    try {
      response = await fetcher('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'api-key': env.BREVO_API_KEY }, body: JSON.stringify(payload), signal: AbortSignal.timeout(8000) });
    } catch { throw new Error('PROVIDER_AMBIGUOUS'); }
    if (response.ok) return;
    if (response.status === 429 && attempt === 0) {
      const seconds = Number(response.headers.get('Retry-After'));
      if (Number.isFinite(seconds) && seconds >= 0 && seconds <= 2) { await new Promise(resolve => setTimeout(resolve, seconds * 1000)); continue; }
    }
    throw new Error(response.status >= 500 ? 'PROVIDER_AMBIGUOUS' : 'PROVIDER_REJECTED');
  }
}

export function createMailer({ fetcher = fetch, mockProvider = null } = {}) {
  return { async fetch(request, env) {
    const requestUrl = new URL(request.url);
    if (request.method !== 'POST' || requestUrl.hostname !== 'newsletter-mailer.internal' || requestUrl.pathname !== '/confirmation') return json({ ok: false }, 404);
    if (!env.DELIVERY_DB?.prepare) return json({ ok: false }, 503);
    let message;
    try { message = await request.json(); } catch { return json({ ok: false }, 400); }
    const key = request.headers.get('Idempotency-Key');
    if (!message || Object.keys(message).some(field => !['id', 'email', 'locale', 'confirmationUrl', 'unsubscribeUrl'].includes(field)) ||
      !key || key !== message.id || !/^[a-f0-9]{64}$/.test(key) || typeof message.email !== 'string' || message.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.email)) return json({ ok: false }, 400);
    let allowedOrigin = 'https://api.japanday.sk';
    if (env.STAGING_ENVIRONMENT === 'true') allowedOrigin = `https://${env.STAGING_API_HOSTNAME || ''}`;
    let rendered;
    try { rendered = renderEmail(message, allowedOrigin); } catch { return json({ ok: false }, 400); }
    const stamp = Math.floor(Date.now() / 1000);
    try {
      const claim = await env.DELIVERY_DB.prepare("INSERT INTO mail_delivery_ledger(idempotency_key,state,created_at,updated_at) VALUES (?,'sending',?,?) ON CONFLICT DO NOTHING RETURNING idempotency_key").bind(key, stamp, stamp).first();
      if (!claim) {
        const prior = await env.DELIVERY_DB.prepare('SELECT state FROM mail_delivery_ledger WHERE idempotency_key=?').bind(key).first();
        return prior?.state === 'sent' || prior?.state === 'sending' ? json({ ok: true, duplicate: true }, 202) : json({ ok: false }, 503);
      }
      try {
        if (mockProvider) await mockProvider(message, rendered);
        else await sendBrevo(message, rendered, env, fetcher);
        await env.DELIVERY_DB.prepare("UPDATE mail_delivery_ledger SET state='sent',updated_at=? WHERE idempotency_key=?").bind(Math.floor(Date.now()/1000), key).run();
        return json({ ok: true }, 202);
      } catch {
        await env.DELIVERY_DB.prepare("UPDATE mail_delivery_ledger SET state='failed',updated_at=? WHERE idempotency_key=?").bind(Math.floor(Date.now()/1000), key).run();
        return json({ ok: false }, 503);
      }
    } catch { return json({ ok: false }, 503); }
  } };
}

export default createMailer();
