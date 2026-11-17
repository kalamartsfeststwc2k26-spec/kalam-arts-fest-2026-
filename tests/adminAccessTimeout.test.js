import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Exercise the actual hook with stubbed React, auth, requests and a controlled
// clock. Browser integration tests also cover the mounted dashboard separately.
test('access checks time out safely, do not overlap, and reject stale results', async () => {
  let state, effect, interval, auth, calls = 0, nextTimer = 0;
  const timers = new Map();
  const pending = [];
  const profile = { id: 'fictional', role: 'super_admin', team_id: null };
  const user = { id: 'fictional' };
  const ready = { status: 'ready', profile, user, message: '' };
  const oldWindow = globalThis.window;
  globalThis.window = {
    setTimeout(fn, ms) { const id = ++nextTimer; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval(fn) { interval = fn; return 1; },
    clearInterval() {},
  };
  globalThis.__adminAccessTest = {
    useState(init) { state = init(); return [state, next => { state = next; }]; },
    useRef(value) { return { current: value }; },
    useCallback(fn) { return fn; },
    useEffect(fn) { effect = fn; },
    supabase: { auth: { onAuthStateChange(cb) { auth = cb; return { data: { subscription: { unsubscribe() {} } } }; } } },
    resolveAdminAccess() { calls++; if (calls === 1) return Promise.resolve(ready); return new Promise(resolve => pending.push(resolve)); },
  };
  try {
    let code = await readFile(new URL('../src/lib/useAdminAccess.js', import.meta.url), 'utf8');
    code = code.replace("import { useCallback, useEffect, useRef, useState } from 'react';", 'const {useCallback,useEffect,useRef,useState}=globalThis.__adminAccessTest;')
      .replace("import { supabase } from './supabaseClient';", 'const {supabase}=globalThis.__adminAccessTest;')
      .replace("import { resolveAdminAccess } from './adminAccess';", 'const {resolveAdminAccess}=globalThis.__adminAccessTest;');
    const { useAdminAccess } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
    const flush = () => new Promise(resolve => setImmediate(resolve));
    const timeout = ms => { const entry = [...timers].find(([, timer]) => timer.ms === ms); assert.ok(entry); timers.delete(entry[0]); entry[1].fn(); };
    const access = useAdminAccess();
    const cleanup = effect();
    await flush();
    assert.equal(state.status, 'ready');
    interval(); await flush();
    assert.equal(state.status, 'rechecking');
    interval(); await flush();
    assert.equal(calls, 2, 'a routine tick must not supersede an active check');
    timeout(12000); await flush();
    assert.equal(state.status, 'suspended');
    assert.equal(state.profile, profile);
    assert.match(state.message, /timed out/i);
    interval(); await flush();
    assert.equal(calls, 2, 'failed checks require explicit retry');
    access.retry(); await flush();
    assert.equal(calls, 3);
    pending[1](ready); await flush();
    assert.equal(state.status, 'ready');
    pending[0]({ status: 'denied', profile: null, user: null, message: 'stale' }); await flush();
    assert.equal(state.status, 'ready', 'late response from a timed-out check must be ignored');
    interval(); await flush();
    auth('SIGNED_OUT', null);
    assert.equal(state.status, 'denied');
    pending[2](ready); await flush();
    assert.equal(state.status, 'denied', 'sign-out must invalidate a pending check');
    cleanup();
  } finally {
    globalThis.window = oldWindow;
    delete globalThis.__adminAccessTest;
  }
});
