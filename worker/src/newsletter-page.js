import translations from '../../src/data/newsletter-actions.json' with { type: 'json' };

// GET serves only an isolated document: no DB access, analytics or remote assets.
export function newsletterPage(url, enabled) {
  const purpose = url.pathname.endsWith('/confirm') ? 'confirm' : 'unsubscribe';
  const locale = Object.hasOwn(translations, url.searchParams.get('locale')) ? url.searchParams.get('locale') : 'sk';
  const copy = translations[locale];
  const nonce = crypto.randomUUID();
  const escape = value => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const scriptCopy = JSON.stringify(copy).replace(/</g, '\\u003c');
  return new Response(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escape(copy[purpose])}</title></head>
<body><main><h1>${escape(copy[purpose])}</h1><p>${escape(enabled ? copy.intro : copy.disabled)}</p><button type="button" disabled>${escape(copy[purpose])}</button><p role="status" aria-live="polite"></p></main>
<script nonce="${nonce}">
const token = new URLSearchParams(location.hash.slice(1)).get('token');
history.replaceState(null, '', location.pathname + location.search);
const button = document.querySelector('button'), status = document.querySelector('[role=status]'), copy = ${scriptCopy};
button.disabled = !${enabled === true} || !/^[a-f0-9]{64}$/.test(token || '');
button.addEventListener('click', async () => {
  button.disabled = true;
  try {
    const response = await fetch('/api/newsletter/${purpose}', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token}),credentials:'omit'});
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error();
    status.textContent = copy.success;
  } catch { status.textContent = copy.error; button.disabled = false; }
});
</script></body></html>`, { headers: {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow',
    'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
  } });
}
