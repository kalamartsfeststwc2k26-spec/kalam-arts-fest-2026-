import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import { resolveAdminAccess } from './adminAccess';

export function useAdminAccess() {
  const [state, setState] = useState({ status: 'loading', profile: null, user: null, message: '' });
  const request = useRef(0);
  const resolve = useCallback(async (invalidate = false) => {
    const current = ++request.current;
    // Background verification must not make every Add/Edit/Delete control vanish
    // every 30 seconds. A changed login, however, immediately hides old controls.
    if (invalidate) setState({ status: 'loading', profile: null, user: null, message: '' });
    const next = await resolveAdminAccess(supabase);
    if (current === request.current) setState(next);
  }, []);
  useEffect(() => {
    resolve();
    if (!supabase) return () => { request.current++; };
    let authTimer;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
        ++request.current;
        setState({ status: 'loading', profile: null, user: null, message: '' });
        window.clearTimeout(authTimer);
        authTimer = window.setTimeout(() => resolve(), 0);
      }
    });
    const timer = window.setInterval(() => resolve(), 30000);
    return () => { ++request.current; subscription.unsubscribe(); window.clearTimeout(authTimer); window.clearInterval(timer); };
  }, [resolve]);
  return { ...state, retry: () => resolve(true) };
}
