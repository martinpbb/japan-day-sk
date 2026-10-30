import { useEffect, useState } from 'react';
export const workshopApi = 'https://api.japanday.sk';
export function useWorkshopAvailability(slug) {
  const [state, setState] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${workshopApi}/api/workshops/${encodeURIComponent(slug)}`, { credentials: 'include', signal: controller.signal })
      .then(response => response.json()).then(result => { if (result.ok) setState({ slug, data: result.data }); }).catch(() => {});
    return () => controller.abort();
  }, [slug]);
  return state?.slug === slug ? state.data : null;
}
