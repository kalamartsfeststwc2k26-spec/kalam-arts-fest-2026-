import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import { resolveAdminAccess } from './adminAccess';

const loading = () => ({ status: 'loading', profile: null, user: null, message: '' });

export function useAdminAccess() {
  const [state, setState] = useState(loading);
  // Keep a synchronous copy: auth callbacks can arrive before React renders.
  const stateRef = useRef(state);
  const request = useRef(0);
  const update = useCallback(next => {
    stateRef.current = next;
    setState(next);
  }, []);
  const resolve = useCallback(async () => {
    const current = ++request.current;
    const previous = stateRef.current;
    const verified = previous.profile && previous.user && ['ready', 'rechecking', 'suspended'].includes(previous.status);
    if (verified) update({ ...previous, status: 'rechecking', message: '' });
    else update(loading());

    const next = await resolveAdminAccess(supabase);
    if (current !== request.current) return;
    // Preserve the mounted draft on an uncertain result, but do not allow actions
    // until access is successfully verified again. Denials never retain it.
    if (next.status === 'error' && verified) {
      update({ ...previous, status: 'suspended', message: next.message });
    } else {
      update(next);
    }
  }, [update]);

  useEffect(() => {
    resolve();
    if (!supabase) return () => { request.current++; };
    let authTimer;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) return;
      ++request.current;
      window.clearTimeout(authTimer);
      const previous = stateRef.current;
      const sameVerifiedUser = event === 'SIGNED_IN' && session?.user?.id &&
        session.user.id === previous.user?.id && previous.profile &&
        ['ready', 'rechecking', 'suspended'].includes(previous.status);
      if (event === 'SIGNED_OUT') {
        update({ status: 'denied', profile: null, user: null, message: 'Sign in with an authorised admin account.' });
        return;
      }
      // Other identities and USER_UPDATED must not retain the previous dashboard.
      update(sameVerifiedUser ? { ...previous, status: 'rechecking', message: '' } : loading());
      // Supabase recommends deferring async work outside the auth callback.
      authTimer = window.setTimeout(() => resolve(), 0);
    });
    const timer = window.setInterval(() => resolve(), 30000);
    return () => { ++request.current; subscription.unsubscribe(); window.clearTimeout(authTimer); window.clearInterval(timer); };
  }, [resolve, update]);
  return { ...state, retry: resolve };
}
