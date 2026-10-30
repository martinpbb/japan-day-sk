import { createPayBySquarePayload, normalizeIban, renderPayBySquareQrSvg } from './pay-by-square.js';

const allowedOrigins = new Set(['https://japanday.sk', 'https://www.japanday.sk', 'http://localhost:5173']);
function headers(origin) {
  const h = new Headers({ 'Vary': 'Origin', 'Cache-Control': 'no-store' });
  if (allowedOrigins.has(origin)) {
    h.set('Access-Control-Allow-Origin', origin);
    h.set('Access-Control-Allow-Credentials', 'true');
    h.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    h.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  return h;
}
function reply(data, status, origin, error = false) {
  const h = headers(origin);
  h.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(error ? { ok: false, error: data } : { ok: true, data }), { status, headers: h });
}
const fail = (code, status, origin) => reply({ code, message: code }, status, origin, true);
async function hash(token) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), b => b.toString(16).padStart(2, '0')).join('');
}
const sessionSelect = `SELECT s.*, COUNT(r.id) AS registered_count,
  MAX(0, s.capacity - COUNT(r.id)) AS remaining_capacity
  FROM workshop_sessions s LEFT JOIN registrations r ON r.session_id = s.id AND r.status = 'registered'`;
async function workshopView(db, row) {
  const { results } = await db.prepare(`${sessionSelect} WHERE s.workshop_id = ? AND s.active = 1 GROUP BY s.id ORDER BY s.start_at`).bind(String(row.id)).all();
  return { ...row, sessions: results };
}
async function register(request, env, sessionId, origin) {
  let input;
  try { input = await request.json(); } catch { return fail('INVALID_JSON', 400, origin); }
  const limits = { first_name: 100, last_name: 100, email: 254, phone: 40 };
  if (!input || Object.entries(limits).some(([key, max]) => typeof input[key] !== 'string' || !input[key].trim() || input[key].trim().length > max)) return fail('VALIDATION_ERROR', 400, origin);
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('VALIDATION_ERROR', 400, origin);
  const session = await env.DB.prepare(`SELECT s.*, w.price_cents, w.currency FROM workshop_sessions s
    JOIN workshops w ON w.id = s.workshop_id WHERE s.id = ? AND s.active = 1 AND s.registration_open = 1 AND w.active = 1`).bind(sessionId).first();
  if (!session) return fail('SESSION_NOT_FOUND', 404, origin);
  if (await env.DB.prepare("SELECT 1 FROM registrations WHERE session_id = ? AND lower(trim(email)) = ? AND status != 'cancelled'").bind(sessionId, email).first()) return fail('DUPLICATE_REGISTRATION', 409, origin);
  const id = crypto.randomUUID();
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  const tokenHash = await hash(token);
  for (let attempt = 0; attempt < 8; attempt++) {
    const reference = String(crypto.getRandomValues(new Uint32Array(1))[0]);
    let payment = null;
    // Validate config before reserving a paid seat. Full sessions need no payment config.
    const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM registrations WHERE session_id = ? AND status = 'registered'").bind(sessionId).first();
    if (session.price_cents > 0 && count.total < session.capacity) {
      try {
        const iban = normalizeIban(env.PAYMENT_IBAN);
        const beneficiary = env.PAYMENT_BENEFICIARY_NAME?.trim();
        const bic = env.PAYMENT_BIC?.trim().toUpperCase() || null;
        if (session.currency !== 'EUR' || (bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic))) throw new Error('Invalid payment configuration');
        payment = { amount_cents: session.price_cents, currency: 'EUR', payment_reference: reference,
          iban, bic, beneficiary_name: beneficiary, message: 'JAPAN DAY WORKSHOP' };
        payment.payload = createPayBySquarePayload({ iban, bic: bic || undefined, amount: session.price_cents / 100,
          currency: 'EUR', variableSymbol: reference, message: payment.message, beneficiaryName: beneficiary });
      } catch { return fail('PAYMENT_CONFIGURATION_ERROR', 503, origin); }
    }
    // INSERT ... SELECT evaluates capacity inside the write transaction; batch rolls back
    // both records on any failure. If a cancelled seat opened after the read and no
    // payment was prepared, retry without creating a payment-less paid reservation.
    const statements = [env.DB.prepare(`INSERT INTO registrations
      (workshop_id, session_id, first_name, last_name, email, phone, status, payment_status, access_token_hash)
      SELECT s.workshop_id, s.id, ?, ?, ?, ?,
        CASE WHEN (SELECT COUNT(*) FROM registrations WHERE session_id = s.id AND status = 'registered') < s.capacity THEN 'registered' ELSE 'waitlist' END,
        CASE WHEN w.price_cents = 0 THEN 'free' ELSE 'not_due' END, ?
      FROM workshop_sessions s JOIN workshops w ON w.id = s.workshop_id
      WHERE s.id = ? AND s.active = 1 AND s.registration_open = 1 AND w.active = 1
        AND w.price_cents = ? AND w.currency = ?
        AND (? = 1 OR w.price_cents = 0 OR (SELECT COUNT(*) FROM registrations WHERE session_id = s.id AND status = 'registered') >= s.capacity)
      RETURNING id, status, payment_status`).bind(input.first_name.trim(), input.last_name.trim(), email, input.phone.trim(), tokenHash,
        sessionId, session.price_cents, session.currency, payment ? 1 : 0)];
    if (payment) {
      statements.push(env.DB.prepare(`INSERT INTO registration_payments
        (id, registration_id, amount_cents, currency, payment_reference, iban, bic, beneficiary_name, message, pay_by_square_payload)
        SELECT ?, id, ?, ?, ?, ?, ?, ?, ?, ? FROM registrations WHERE access_token_hash = ? AND status = 'registered'`).bind(
        id, payment.amount_cents, payment.currency, reference, payment.iban, payment.bic, payment.beneficiary_name, payment.message, payment.payload, tokenHash));
      statements.push(env.DB.prepare("UPDATE registrations SET payment_status = 'pending' WHERE access_token_hash = ? AND status = 'registered'").bind(tokenHash));
    }
    let results;
    try { results = await env.DB.batch(statements); }
    catch (error) {
      const detail = `${error.message} ${error.cause?.message || ''}`;
      if (detail.includes('registration_payments.payment_reference')) continue;
      if (detail.includes('registrations.session_id')) return fail('DUPLICATE_REGISTRATION', 409, origin);
      throw error;
    }
    const registration = results[0].results[0];
    if (!registration) continue;
    const due = registration.status === 'registered' && payment;
    if (due) { delete payment.payload; payment.qr_url = `/api/registrations/${registration.id}/payment/qr.svg`; }
    const result = reply({ registration_id: registration.id, status: registration.status,
      payment_status: due ? 'pending' : registration.status === 'waitlist' ? 'not_due' : 'free', payment: due ? payment : null }, 201, origin);
    result.headers.append('Set-Cookie', `registration_access=${token}; Path=/api/registrations/${registration.id}/payment; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);
    return result;
  }
  return fail('REGISTRATION_RETRY_REQUIRED', 503, origin);
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (origin && !allowedOrigins.has(origin)) return fail('CORS_ORIGIN_DENIED', 403, null);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers(origin) });
    const url = new URL(request.url);
    try {
      if (request.method === 'GET' && url.pathname === '/api/health') return reply({ status: 'ok' }, 200, origin);
      if (request.method === 'GET' && url.pathname === '/api/workshops') {
        const { results } = await env.DB.prepare('SELECT * FROM workshops WHERE active = 1 ORDER BY start_at').all();
        return reply(await Promise.all(results.map(row => workshopView(env.DB, row))), 200, origin);
      }
      const detail = url.pathname.match(/^\/api\/workshops\/([^/]+)$/);
      if (request.method === 'GET' && detail) {
        const row = await env.DB.prepare('SELECT * FROM workshops WHERE slug = ? AND active = 1').bind(decodeURIComponent(detail[1])).first();
        return row ? reply(await workshopView(env.DB, row), 200, origin) : fail('WORKSHOP_NOT_FOUND', 404, origin);
      }
      const registration = url.pathname.match(/^\/api\/sessions\/([^/]+)\/register$/);
      if (request.method === 'POST' && registration) return await register(request, env, decodeURIComponent(registration[1]), origin);
      const qr = url.pathname.match(/^\/api\/registrations\/(\d+)\/payment\/qr\.svg$/);
      if (request.method === 'GET' && qr) {
        const token = request.headers.get('Cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith('registration_access='))?.slice(20);
        if (!token || !/^[a-f0-9]{64}$/.test(token)) return fail('NOT_FOUND', 404, origin);
        const row = await env.DB.prepare(`SELECT p.pay_by_square_payload FROM registration_payments p JOIN registrations r ON r.id = p.registration_id
          WHERE r.id = ? AND r.access_token_hash = ? AND r.status = 'registered' AND p.payment_status != 'cancelled'`).bind(qr[1], await hash(token)).first();
        if (!row) return fail('NOT_FOUND', 404, origin);
        const h = headers(origin);
        h.set('Content-Type', 'image/svg+xml');
        h.set('Cache-Control', 'private, max-age=300');
        h.set('Vary', 'Origin, Cookie');
        return new Response(await renderPayBySquareQrSvg(row.pay_by_square_payload), { headers: h });
      }
      return fail('NOT_FOUND', 404, origin);
    } catch { return fail('INTERNAL_ERROR', 500, origin); }
  },
};
