import { createPayBySquarePayload, normalizeIban, renderPayBySquareQrSvg } from './pay-by-square.js';
import { community } from './community.js';
import { newsletterPage } from './newsletter-page.js';

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
async function accessIdentity(request, env) {
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  const team = String(env.ACCESS_TEAM_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const audience = env.ACCESS_AUD;
  if (!jwt || !team || !audience) return null;
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const decode = (part) => JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    const header = decode(parts[0]);
    const claims = decode(parts[1]);
    const now = Math.floor(Date.now() / 1000);
    if (header.alg !== 'RS256' || claims.iss !== `https://${team}` || !claims.sub || typeof claims.email !== 'string' ||
      !Number.isFinite(claims.exp) || !Array.isArray(claims.aud) || !claims.aud.includes(audience) ||
      claims.exp <= now || (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now))) return null;
    const jwks = await fetch(`https://${team}/cdn-cgi/access/certs`, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (!jwks.ok) return null;
    const key = (await jwks.json()).keys.find((item) => item.kid === header.kid && item.kty === 'RSA');
    if (!key) return null;
    const publicKey = await crypto.subtle.importKey('jwk', key, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const signature = Uint8Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signature, new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    return valid ? { email: claims.email.trim().toLowerCase() } : null;
  } catch { return null; }
}
async function adminUser(request, env, origin) {
  const identity = await accessIdentity(request, env);
  if (!identity) return { response: fail('UNAUTHENTICATED', 401, origin) };
  const user = await env.DB.prepare('SELECT email, role FROM admin_users WHERE email = ? AND active = 1').bind(identity.email).first();
  return user ? { user } : { response: fail('FORBIDDEN', 403, origin) };
}
async function canAccessWorkshop(db, user, id) {
  if (user.role === 'admin') return true;
  return Boolean(await db.prepare('SELECT 1 FROM lecturer_workshops WHERE email = ? AND workshop_id = ?').bind(user.email, id).first());
}
const adminData = (data, status, origin) => reply(data, status, origin);
const sessionAggregateSelect = `SELECT s.id, s.workshop_id, s.start_at, s.end_at, s.capacity, s.location, s.registration_open,
  SUM(CASE WHEN r.status = 'registered' THEN 1 ELSE 0 END) AS registered_count,
  SUM(CASE WHEN r.status = 'waitlist' THEN 1 ELSE 0 END) AS waitlist_count,
  MAX(0, s.capacity - SUM(CASE WHEN r.status = 'registered' THEN 1 ELSE 0 END)) AS available
  FROM workshop_sessions s LEFT JOIN registrations r ON r.session_id = s.id AND r.status != 'cancelled'`;
async function sessionAggregates(db, { workshopId, sessionId, activeOnly = true } = {}) {
  const conditions = [];
  const values = [];
  if (activeOnly) conditions.push('s.active = 1');
  if (workshopId !== undefined) { conditions.push('s.workshop_id = ?'); values.push(workshopId); }
  if (sessionId !== undefined) { conditions.push('s.id = ?'); values.push(sessionId); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { results } = await db.prepare(`${sessionAggregateSelect} ${where} GROUP BY s.id ORDER BY s.start_at, s.id`).bind(...values).all();
  return results.map((session) => ({
    ...session,
    capacity: Number(session.capacity || 0),
    registered_count: Number(session.registered_count || 0),
    waitlist_count: Number(session.waitlist_count || 0),
    available: Number(session.available || 0),
  }));
}
function workshopAggregate(workshop, sessions) {
  const workshopSessions = sessions.filter((session) => String(session.workshop_id) === String(workshop.id));
  return {
    ...workshop,
    session_count: workshopSessions.length,
    registered_count: workshopSessions.reduce((total, session) => total + session.registered_count, 0),
    waitlist_count: workshopSessions.reduce((total, session) => total + session.waitlist_count, 0),
    capacity: workshopSessions.reduce((total, session) => total + session.capacity, 0),
    available_count: workshopSessions.reduce((total, session) => total + session.available, 0),
    sessions: workshopSessions,
  };
}
async function workshopView(db, row) {
  const sessions = await sessionAggregates(db, { workshopId: String(row.id) });
  return { ...row, sessions: sessions.map((session) => ({ ...session, remaining_capacity: session.available })) };
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
  const registrationId = crypto.randomUUID();
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
      (id, workshop_id, session_id, first_name, last_name, email, phone, status, payment_status, registration_access_token_hash)
      SELECT ?, s.workshop_id, s.id, ?, ?, ?, ?,
        CASE WHEN (SELECT COUNT(*) FROM registrations WHERE session_id = s.id AND status = 'registered') < s.capacity THEN 'registered' ELSE 'waitlist' END,
        CASE WHEN w.price_cents = 0 AND (SELECT COUNT(*) FROM registrations WHERE session_id = s.id AND status = 'registered') < s.capacity THEN 'free' ELSE 'not_due' END, ?
      FROM workshop_sessions s JOIN workshops w ON w.id = s.workshop_id
      WHERE s.id = ? AND s.active = 1 AND s.registration_open = 1 AND w.active = 1
        AND w.price_cents = ? AND w.currency = ?
        AND (? = 1 OR w.price_cents = 0 OR (SELECT COUNT(*) FROM registrations WHERE session_id = s.id AND status = 'registered') >= s.capacity)
      RETURNING id, status, payment_status`).bind(registrationId, input.first_name.trim(), input.last_name.trim(), email, input.phone.trim(), tokenHash,
        sessionId, session.price_cents, session.currency, payment ? 1 : 0)];
    if (payment) {
      statements.push(env.DB.prepare(`INSERT INTO registration_payments
        (id, registration_id, amount_cents, currency, payment_reference, iban, bic, beneficiary_name, message, pay_by_square_payload)
        SELECT ?, id, ?, ?, ?, ?, ?, ?, ?, ? FROM registrations WHERE registration_access_token_hash = ? AND status = 'registered'`).bind(
        crypto.randomUUID(), payment.amount_cents, payment.currency, reference, payment.iban, payment.bic, payment.beneficiary_name, payment.message, payment.payload, tokenHash));
      statements.push(env.DB.prepare("UPDATE registrations SET payment_status = 'pending' WHERE registration_access_token_hash = ? AND status = 'registered'").bind(tokenHash));
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
      if (request.method === 'GET' && ['/newsletter/confirm', '/newsletter/unsubscribe'].includes(url.pathname)) {
        return newsletterPage(url, env.NEWSLETTER_ENABLED === 'true');
      }
      const communityResponse = await community(request, env, url.pathname, reply, fail, origin);
      if (communityResponse) return communityResponse;
      if (request.method === 'GET' && url.pathname === '/api/health') return reply({ status: 'ok' }, 200, origin);
      if (url.pathname.startsWith('/api/admin/')) {
        if (request.method !== 'GET') return fail('METHOD_NOT_ALLOWED', 405, origin);
        const auth = await adminUser(request, env, origin);
        if (auth.response) return auth.response;
        const user = auth.user;
        const scope = user.role === 'lecturer' ? ' AND EXISTS (SELECT 1 FROM lecturer_workshops lw WHERE lw.email = ? AND lw.workshop_id = w.id)' : '';
        const workshopRows = await env.DB.prepare(`SELECT w.id,w.title,w.lecturer,w.short_description,w.description,w.location,w.active
          FROM workshops w WHERE w.active=1 AND w.registration_open=1${scope} ORDER BY w.title`)
          .bind(...(user.role === 'lecturer' ? [user.email] : [])).all();
        const allSessions = await sessionAggregates(env.DB);
        const workshops = workshopRows.results.map((workshop) => workshopAggregate(workshop, allSessions));
        if (url.pathname === '/api/admin/summary' || url.pathname === '/api/admin/workshops') {
          const total = workshops.reduce((a,w) => ({ registrations:a.registrations+w.registered_count, waitlist:a.waitlist+w.waitlist_count, capacity:a.capacity+w.capacity }), {registrations:0,waitlist:0,capacity:0});
          return adminData(url.pathname.endsWith('summary') ? { ...total, workshop_count:workshops.length, workshops } : workshops, 200, origin);
        }
        const detail = url.pathname.match(/^\/api\/admin\/workshops\/([^/]+)$/);
        if (detail) {
          const id = decodeURIComponent(detail[1]);
          if (!await canAccessWorkshop(env.DB,user,id)) return fail('FORBIDDEN',403,origin);
          const workshop = await env.DB.prepare('SELECT id,title,lecturer,short_description,description,location FROM workshops WHERE id=?').bind(id).first();
          if (!workshop) return fail('WORKSHOP_NOT_FOUND',404,origin);
          const sessions = await sessionAggregates(env.DB, { workshopId: id });
          return adminData({workshop,sessions},200,origin);
        }
        const sessionRoute = url.pathname.match(/^\/api\/admin\/sessions\/([^/]+)\/(registrations|export\.csv)$/);
        if (sessionRoute) {
          const id = decodeURIComponent(sessionRoute[1]);
          const [session] = await sessionAggregates(env.DB, { sessionId: id, activeOnly: false });
          if (!session) return fail('SESSION_NOT_FOUND',404,origin);
          if (!await canAccessWorkshop(env.DB,user,session.workshop_id)) return fail('FORBIDDEN',403,origin);
          const {results:registrations} = await env.DB.prepare(`SELECT first_name,last_name,email,phone,status,payment_status,created_at FROM registrations WHERE session_id=? AND status != 'cancelled' ORDER BY created_at,id`).bind(id).all();
          if (sessionRoute[2] === 'export.csv') {
            const fields=['first_name','last_name','email','phone','status','payment_status','created_at'];
            const quote=(value)=>`"${String(value ?? '').replace(/"/g,'""')}"`;
            const csv=[fields.join(','),...registrations.map((row)=>fields.map((field)=>quote(row[field])).join(','))].join('\r\n');
            const h=headers(origin); h.set('Content-Type','text/csv; charset=utf-8'); h.set('Content-Disposition','attachment; filename="session-registrations.csv"');
            return new Response(`\uFEFF${csv}`,{headers:h});
          }
          return adminData({session,registrations},200,origin);
        }
        return fail('NOT_FOUND',404,origin);
      }
      if (request.method === 'GET' && url.pathname === '/api/workshops') {
        const { results } = await env.DB.prepare('SELECT * FROM workshops WHERE active = 1 ORDER BY start_at').all();
        return reply(await Promise.all(results.map(row => workshopView(env.DB, row))), 200, origin);
      }
      if (request.method === 'GET' && url.pathname === '/api/workshops/availability') {
        const { results: workshops } = await env.DB.prepare('SELECT id,title FROM workshops WHERE active = 1 ORDER BY title').all();
        const sessions = await sessionAggregates(env.DB);
        const data = workshops.map((workshop) => {
          const aggregate = workshopAggregate(workshop, sessions);
          return {
            id: String(workshop.id),
            title: workshop.title,
            session_count: aggregate.session_count,
            registered_count: aggregate.registered_count,
            waitlist_count: aggregate.waitlist_count,
            capacity: aggregate.capacity,
            available_count: aggregate.available_count,
            sessions: aggregate.sessions.map(({ id, start_at, end_at, capacity, registered_count, waitlist_count, available }) => ({
              id, start_at, end_at, capacity, registered_count, waitlist_count, available_count: available,
            })),
          };
        });
        return reply({ workshops: data }, 200, origin);
      }
      const detail = url.pathname.match(/^\/api\/workshops\/([^/]+)$/);
      if (request.method === 'GET' && detail) {
        const row = await env.DB.prepare('SELECT * FROM workshops WHERE slug = ? AND active = 1').bind(decodeURIComponent(detail[1])).first();
        return row ? reply(await workshopView(env.DB, row), 200, origin) : fail('WORKSHOP_NOT_FOUND', 404, origin);
      }
      const registration = url.pathname.match(/^\/api\/sessions\/([^/]+)\/register$/);
      if (request.method === 'POST' && registration) return await register(request, env, decodeURIComponent(registration[1]), origin);
      const qr = url.pathname.match(/^\/api\/registrations\/([^/]+)\/payment\/qr\.svg$/);
      if (request.method === 'GET' && qr) {
        const token = request.headers.get('Cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith('registration_access='))?.slice(20);
        if (!token || !/^[a-f0-9]{64}$/.test(token)) return fail('NOT_FOUND', 404, origin);
        const row = await env.DB.prepare(`SELECT p.pay_by_square_payload FROM registration_payments p JOIN registrations r ON r.id = p.registration_id
          WHERE r.id = ? AND r.registration_access_token_hash = ? AND r.status = 'registered' AND p.payment_status != 'cancelled'`).bind(decodeURIComponent(qr[1]), await hash(token)).first();
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
