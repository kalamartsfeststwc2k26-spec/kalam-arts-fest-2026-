import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { EVENT_FIELDS, sortEvents } from './eventUtils';

export async function listPublishedEvents() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('events').select(EVENT_FIELDS).eq('is_published', true)
      .order('start_time', { ascending: true, nullsFirst: false }).order('id', { ascending: true }).range(offset, offset + 499);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) return sortEvents(rows);
  }
}
async function getPublishedEvent(id) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('events').select(EVENT_FIELDS).eq('id', id).eq('is_published', true).maybeSingle();
  if (error) throw error;
  if (!data) return { event: null, registrations: [] };
  const { data: registrations, error: registrationError } = await supabase.from('public_event_registrations')
    .select('registration_id,event_id,student_name,team_name').eq('event_id', id).order('student_name', { ascending: true });
  if (registrationError) throw registrationError;
  return { event: data, registrations };
}
function useFreshData(loader, dependency) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(n => n + 1), []);
  useEffect(() => {
    let active = true;
    async function load() {
      if (!navigator.onLine) { if (active) setState({ status: 'offline', data: null, error: null }); return; }
      setState({ status: 'loading', data: null, error: null });
      try { const data = await loader(); if (active) setState({ status: 'ready', data, error: null }); }
      catch (error) { if (active) setState({ status: 'error', data: null, error }); }
    }
    load();
    const online = () => load();
    const offline = () => setState({ status: 'offline', data: null, error: null });
    window.addEventListener('online', online); window.addEventListener('offline', offline);
    return () => { active = false; window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, [dependency, version]); // route visit and ID changes trigger fresh reads
  return { ...state, refresh };
}
export function usePublicEvents() { return useFreshData(listPublishedEvents, 'events'); }
export function useEventDetails(id) { return useFreshData(() => getPublishedEvent(id), id); }
