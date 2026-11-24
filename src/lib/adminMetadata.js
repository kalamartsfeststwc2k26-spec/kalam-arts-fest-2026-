import { formatIndiaTimestamp } from './indiaTime';
import { supabase } from './supabaseClient';

export function formatAdminTimestamp(value) {
  if (!value) return 'Not recorded';
  return formatIndiaTimestamp(value);
}

// Updated-at does not exist on events/results. Use the append-only audit timestamp instead.
export async function loadLastEdits(table) {
  const { data, error } = await supabase.from('admin_audit_log')
    .select('entity_id,occurred_at').eq('entity_table', table).eq('action', 'UPDATE')
    .order('occurred_at', { ascending: false }).limit(500);
  if (error) return new Map(); // Main records remain usable if the metadata lookup fails.
  return new Map(data.map(row => [row.entity_id, row.occurred_at]).reverse());
}
