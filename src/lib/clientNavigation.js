export function navigateWithinApp(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const anchor = event.currentTarget;
  if (anchor.target || anchor.hasAttribute('download')) return;
  const destination = new URL(anchor.href, window.location.href);
  if (destination.origin !== window.location.origin) return;
  event.preventDefault();
  window.history.pushState({}, '', `${destination.pathname}${destination.search}${destination.hash}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
