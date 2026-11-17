import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import { resolveAdminAccess } from './adminAccess';

const CHECK_TIMEOUT_MS = 12000;
// A timed-out SDK call may still be running. Bound outstanding work even when
// its network request or internal auth lock cannot be cancelled by this hook.
const MAX_OUTSTANDING_CHECKS = 2;
const loading = () => ({ status: 'loading', profile: null, user: null, message: '' });
const hasVerifiedDashboard = state => Boolean(state.profile && state.user && ['ready', 'rechecking', 'suspended'].includes(state.status));

export function useAdminAccess() {
  const [state, setState] = useState(loading);
  const stateRef = useRef(state);
  const request = useRef(0);
  const active = useRef(null);
  const outstanding = useRef(new Set());
  const update = useCallback(next => {
    stateRef.current = next;
    setState(next);
  }, []);
  const resolve = useCallback(async () => {
    // Routine ticks and repeated Retry clicks do not replace an active check.
    if (active.current !== null) return;
    const previous = stateRef.current;
    const verified = hasVerifiedDashboard(previous);
    if (outstanding.current.size >= MAX_OUTSTANDING_CHECKS) {
      const message = 'Earlier access checks are still pending. If retry does not work, a page reload may be needed; unsaved changes will be lost.';
      update(verified ? { ...previous, status: 'suspended', message } : { status: 'error', profile: null, user: null, message });
      return;
    }
    const current = ++request.current;
    active.current = current;
    update(verified ? { ...previous, status: 'rechecking', message: '' } : loading());

    let timeoutId;
    const task = Promise.resolve().then(() => resolveAdminAccess(supabase)).catch(() => ({ status: 'error', profile: null, user: null, message: 'Could not verify access. Retry.' }));
    outstanding.current.add(task);
    task.then(() => outstanding.current.delete(task));
    const timeout = new Promise(resolveTimeout => {
      timeoutId = window.setTimeout(() => resolveTimeout({ status: 'error', profile: null, user: null, message: 'Access check timed out. Check your connection and retry.' }), CHECK_TIMEOUT_MS);
    });
    const next = await Promise.race([task, timeout]);
    window.clearTimeout(timeoutId);
    if (active.current === current) active.current = null;
    if (current !== request.current) return;
    if (next.status === 'error' && verified) update({ ...previous, status: 'suspended', message: next.message });
    else update(next);
  }, [update]);

  useEffect(() => {
    resolve();
    if (!supabase) return () => { request.current++; active.current = null; };
    let authTimer;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) return;
      ++request.current;
      active.current = null; // An auth event makes an older check unsafe to accept.
      window.clearTimeout(authTimer);
      const previous = stateRef.current;
      const sameVerifiedUser = event === 'SIGNED_IN' && session?.user?.id &&
        session.user.id === previous.user?.id && hasVerifiedDashboard(previous);
      if (event === 'SIGNED_OUT') {
        update({ status: 'denied', profile: null, user: null, message: 'Sign in with an authorised admin account.' });
        return;
      }
      update(sameVerifiedUser ? { ...previous, status: 'rechecking', message: '' } : loading());
      // Defer Supabase calls outside the auth callback to avoid auth-lock issues.
      authTimer = window.setTimeout(() => resolve(), 0);
    });
    // Only healthy dashboards get automatic checks; failure requires explicit retry.
    const timer = window.setInterval(() => { if (stateRef.current.status === 'ready') resolve(); }, 30000);
    return () => { ++request.current; active.current = null; subscription.unsubscribe(); window.clearTimeout(authTimer); window.clearInterval(timer); };
  }, [resolve, update]);
  return { ...state, retry: () => resolve() };
}
