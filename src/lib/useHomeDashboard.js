import { useCallback, useEffect, useState } from 'react';
import { loadHomeDashboard } from './homeDashboard';

export function useHomeDashboard() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const refresh = useCallback(async () => {
    setState(previous => ({ ...previous, status: navigator.onLine ? 'loading' : 'offline', error: null }));
    if (!navigator.onLine) return;
    try {
      const data = await loadHomeDashboard();
      setState({ status: 'ready', data, error: null });
    } catch (error) {
      setState({ status: error.offline ? 'offline' : 'error', data: null, error });
    }
  }, []);
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!navigator.onLine) { if (active) setState({ status: 'offline', data: null, error: null }); return; }
      try {
        const data = await loadHomeDashboard();
        if (active) setState({ status: 'ready', data, error: null });
      } catch (error) {
        if (active) setState({ status: error.offline ? 'offline' : 'error', data: null, error });
      }
    };
    load(); // fresh read whenever / is visited
    const timer = window.setInterval(load, 60000);
    window.addEventListener('online', load);
    const offline = () => setState({ status: 'offline', data: null, error: null });
    window.addEventListener('offline', offline);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('online', load); window.removeEventListener('offline', offline); };
  }, []);
  return { ...state, refresh };
}
