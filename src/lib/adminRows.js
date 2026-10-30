import { supabase } from './supabaseClient';

// Page through PostgREST's per-request row cap so every manageable record is reachable.
// No global cache: every call fetches current rows from Supabase.
export async function readAllAdminRows(table, fields, configure = query => query) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured.') };
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await configure(supabase.from(table).select(fields)).range(offset, offset + 499);
    if (error) return { data: null, error };
    rows.push(...data);
    if (data.length < 500) return { data: rows, error: null };
  }
}
