import { useEffect, useState } from 'react';
export const workshopApi = 'https://api.japanday.sk';
let availabilityRequest;
let availabilityCache;
function loadAvailability() {
  if (availabilityCache) return Promise.resolve(availabilityCache);
  if (!availabilityRequest) {
    availabilityRequest = fetch(`${workshopApi}/api/workshops/availability`)
      .then(response => response.ok ? response.json() : null)
      .then(result => {
        availabilityCache = result?.ok && Array.isArray(result.data) ? result.data : null;
        return availabilityCache;
      })
      .catch(() => {
        availabilityRequest = undefined;
        return null;
      });
  }
  return availabilityRequest;
}
export function useWorkshopSessionAvailability() {
  const [availability, setAvailability] = useState(availabilityCache);
  useEffect(() => {
    let active = true;
    loadAvailability().then(value => { if (active) setAvailability(value); });
    return () => { active = false; };
  }, []);
  return availability;
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
