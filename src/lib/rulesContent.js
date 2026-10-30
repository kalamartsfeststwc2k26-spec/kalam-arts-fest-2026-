import { supabase } from './supabaseClient';

export async function fetchPublishedRules() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('rules_content')
    .select('id,title,body,display_order').eq('is_published', true)
    .order('display_order', { ascending: true }).order('id', { ascending: true });
  if (error) throw error;
  return data;
}

export function ruleLines(body) {
  return String(body || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}
