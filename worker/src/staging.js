import productionWorker from './worker.js';

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin');
    const approved = env.STAGING_ALLOWED_ORIGIN;
    let parsed;
    try { parsed = new URL(approved); } catch { return new Response('Staging origin is not configured', { status: 503 }); }
    if (parsed.protocol !== 'https:' || parsed.origin !== approved || approved.includes('*')) return new Response('Staging origin is not configured', { status: 503 });
    if (origin !== approved) return new Response('Origin denied', { status: 403, headers: { 'Cache-Control': 'no-store' } });
    const headers = new Headers(request.headers);
    headers.delete('Origin');
    const response = await productionWorker.fetch(new Request(request, { headers }), env, ctx);
    const out = new Response(response.body, response);
    out.headers.set('Access-Control-Allow-Origin', approved);
    out.headers.set('Access-Control-Allow-Credentials', 'true');
    out.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    out.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    out.headers.append('Vary', 'Origin');
    return out;
  },
};
