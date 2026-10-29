const allowedOrigins = new Set([
  "https://japanday.sk",
  "https://www.japanday.sk",
  "http://localhost:5173",
]);

const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };
const fieldLimits = { first_name: 100, last_name: 100, email: 254, phone: 40 };

function response(body, status, origin) {
  const headers = new Headers(jsonHeaders);
  if (origin && allowedOrigins.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function ok(data, status, origin) {
  return response({ ok: true, data }, status, origin);
}

function fail(code, message, status, origin) {
  return response({ ok: false, error: { code, message } }, status, origin);
}

function workshopView(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    lecturer: row.lecturer,
    short_description: row.short_description,
    description: row.description,
    start_at: row.start_at,
    end_at: row.end_at,
    location: row.location,
    capacity: row.capacity,
    price_cents: row.price_cents,
    currency: row.currency,
  };
}

function randomReference() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return `WS-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

async function createPaymentReference(db) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const reference = randomReference();
    const exists = await db.prepare(
      "SELECT 1 FROM registrations WHERE payment_reference = ? LIMIT 1",
    ).bind(reference).first();
    if (!exists) return reference;
  }
  throw new Error("reference generation failed");
}

async function readJson(request) {
  try {
    const value = await request.json();
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function validRequiredString(value, max) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

async function register(request, env, id, origin) {
  const input = await readJson(request);
  if (!input) return fail("INVALID_JSON", "Request body must be a JSON object.", 400, origin);

  for (const field of ["first_name", "last_name"]) {
    if (!validRequiredString(input[field], fieldLimits[field])) {
      return fail("VALIDATION_ERROR", `${field} is required and must be at most ${fieldLimits[field]} characters.`, 400, origin);
    }
  }

  if (!validRequiredString(input.email, fieldLimits.email)) {
    return fail("VALIDATION_ERROR", "A valid email address is required.", 400, origin);
  }
  const email = input.email.trim().toLowerCase();
  if (email.length > fieldLimits.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("VALIDATION_ERROR", "A valid email address is required.", 400, origin);
  }
  if (input.phone != null && (typeof input.phone !== "string" || input.phone.trim().length > fieldLimits.phone)) {
    return fail("VALIDATION_ERROR", `phone must be at most ${fieldLimits.phone} characters.`, 400, origin);
  }

  const workshop = await env.DB.prepare(
    "SELECT id, capacity, price_cents FROM workshops WHERE id = ? AND active = 1 AND registration_open = 1",
  ).bind(id).first();
  if (!workshop) return fail("WORKSHOP_NOT_FOUND", "Workshop is unavailable.", 404, origin);

  const duplicate = await env.DB.prepare(
    "SELECT 1 FROM registrations WHERE workshop_id = ? AND lower(trim(email)) = ? AND status != 'cancelled' LIMIT 1",
  ).bind(id, email).first();
  if (duplicate) return fail("DUPLICATE_REGISTRATION", "An active registration already exists for this email.", 409, origin);

  const count = await env.DB.prepare(
    "SELECT COUNT(*) AS total FROM registrations WHERE workshop_id = ? AND status = 'registered'",
  ).bind(id).first();
  const status = count.total < workshop.capacity ? "registered" : "waitlist";
  const paymentStatus = workshop.price_cents === 0 ? "free" : "pending";
  const paymentReference = workshop.price_cents > 0 ? await createPaymentReference(env.DB) : null;

  try {
    const result = await env.DB.prepare(
      `INSERT INTO registrations
        (workshop_id, first_name, last_name, email, phone, status, payment_status, payment_reference)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id, workshop_id, first_name, last_name, email, phone, status, payment_status, payment_reference, created_at`,
    ).bind(
      id,
      input.first_name.trim(),
      input.last_name.trim(),
      email,
      input.phone?.trim() || null,
      status,
      paymentStatus,
      paymentReference,
    ).first();
    return ok(result, 201, origin);
  } catch {
    return fail("REGISTRATION_FAILED", "Registration could not be completed.", 500, origin);
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      if (origin && !allowedOrigins.has(origin)) return fail("CORS_ORIGIN_DENIED", "Origin is not allowed.", 403, null);
      return new Response(null, { status: 204, headers: {
        ...(origin ? {
          "Access-Control-Allow-Origin": origin,
          "Vary": "Origin",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        } : {}),
      } });
    }
    if (origin && !allowedOrigins.has(origin)) return fail("CORS_ORIGIN_DENIED", "Origin is not allowed.", 403, null);

    try {
      if (request.method === "GET" && url.pathname === "/api/health") {
        return ok({ status: "ok" }, 200, origin);
      }
      if (request.method === "GET" && url.pathname === "/api/workshops") {
        const { results } = await env.DB.prepare(
          `SELECT id, slug, title, lecturer, short_description, description, start_at, end_at,
                  location, capacity, price_cents, currency
           FROM workshops WHERE active = 1 ORDER BY start_at ASC`,
        ).all();
        return ok(results.map(workshopView), 200, origin);
      }
      const detailMatch = url.pathname.match(/^\/api\/workshops\/([^/]+)$/);
      if (request.method === "GET" && detailMatch) {
        const row = await env.DB.prepare(
          `SELECT id, slug, title, lecturer, short_description, description, start_at, end_at,
                  location, capacity, price_cents, currency
           FROM workshops WHERE slug = ? AND active = 1`,
        ).bind(decodeURIComponent(detailMatch[1])).first();
        return row ? ok(workshopView(row), 200, origin) : fail("WORKSHOP_NOT_FOUND", "Workshop not found.", 404, origin);
      }
      const registrationMatch = url.pathname.match(/^\/api\/workshops\/(\d+)\/register$/);
      if (request.method === "POST" && registrationMatch) {
        return await register(request, env, Number(registrationMatch[1]), origin);
      }
      return fail("NOT_FOUND", "Endpoint not found.", 404, origin);
    } catch {
      return fail("INTERNAL_ERROR", "An internal error occurred.", 500, origin);
    }
  },
};
