import { useCallback, useEffect, useState } from 'react';

export function usePublicData(loader, key = '') {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(value => value + 1), []);
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!navigator.onLine) { if (active) setState({ status: 'offline', data: null, error: null }); return; }
      if (active) setState({ status: 'loading', data: null, error: null });
      try { const data = await loader(); if (active) setState({ status: 'ready', data, error: null }); }
      catch (error) { if (active) setState({ status: 'error', data: null, error }); }
    };
    load();
    const onOffline = () => setState({ status: 'offline', data: null, error: null });
    window.addEventListener('online', load);
    window.addEventListener('offline', onOffline);
    return () => { active = false; window.removeEventListener('online', load); window.removeEventListener('offline', onOffline); };
  }, [key, version]);
  return { ...state, refresh };
}
