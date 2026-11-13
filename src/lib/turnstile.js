const SCRIPT_ID = 'cloudflare-turnstile-api';
let scriptPromise;

export function loadTurnstile() {
  if (globalThis.turnstile) return Promise.resolve(globalThis.turnstile);
  if (!scriptPromise) scriptPromise = new Promise((resolve, reject) => {
    let script = document.getElementById(SCRIPT_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.append(script);
    }
    script.addEventListener('load', () => globalThis.turnstile ? resolve(globalThis.turnstile) : reject(new Error('TURNSTILE_UNAVAILABLE')), { once: true });
    script.addEventListener('error', () => reject(new Error('TURNSTILE_UNAVAILABLE')), { once: true });
  });
  return scriptPromise;
}

export function createTurnstileTokenProvider({ sitekey, action, container, onError = () => {} }) {
  if (!['feedback', 'newsletter'].includes(action)) throw new TypeError('Unsupported Turnstile action');
  let widgetId;
  let pending;
  let disposed = false;
  const ready = loadTurnstile().then(turnstile => {
    if (disposed) return turnstile;
    widgetId = turnstile.render(container, {
      sitekey, action, execution: 'execute', appearance: 'interaction-only',
      callback: token => { if (pending) { pending.resolve(token); pending = null; } },
      'expired-callback': () => { if (pending) { pending.reject(new Error('TURNSTILE_EXPIRED')); pending = null; } if (widgetId) turnstile.reset(widgetId); },
      'error-callback': () => { if (pending) { pending.reject(new Error('TURNSTILE_ERROR')); pending = null; } onError(); if (widgetId) turnstile.reset(widgetId); },
    });
    return turnstile;
  }).catch(error => { onError(); throw error; });
  return {
    async getToken() {
      const turnstile = await ready;
      if (disposed || !widgetId) return null;
      if (pending) pending.reject(new Error('TURNSTILE_REPLACED'));
      const token = new Promise((resolve, reject) => { pending = { resolve, reject }; });
      turnstile.execute(widgetId);
      return token;
    },
    async reset() { const turnstile = await ready; if (widgetId) turnstile.reset(widgetId); },
    destroy() { disposed = true; if (widgetId && globalThis.turnstile) globalThis.turnstile.remove(widgetId); if (pending) { pending.reject(new Error('TURNSTILE_DISPOSED')); pending = null; } },
  };
}
