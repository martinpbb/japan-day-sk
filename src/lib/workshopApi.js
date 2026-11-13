import { useEffect, useState } from 'react';
import { getWorkshopAvailability } from './workshopAvailability.js';
export const workshopApi = 'https://api.japanday.sk';
export function useWorkshopSessionAvailability(enabled = true) {
  const [state, setState] = useState({ workshops: null, failed: false });
  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    getWorkshopAvailability().then(workshops => { if (active) setState({ workshops, failed: false }); })
      .catch(() => { if (active) setState({ workshops: null, failed: true }); });
    return () => { active = false; };
  }, [enabled]);
  return enabled ? state : { workshops: null, failed: false };
}
export function useWorkshopAvailability(slug) {
  const [state, setState] = useState(null);
  useEffect(() => {
    if (!slug) return undefined;
    const controller = new AbortController();
    fetch(`${workshopApi}/api/workshops/${encodeURIComponent(slug)}`, { credentials: 'include', signal: controller.signal })
      .then(response => response.json()).then(result => { if (result.ok) setState({ slug, data: result.data }); }).catch(() => {});
    return () => controller.abort();
  }, [slug]);
  return state?.slug === slug ? state.data : null;
}
