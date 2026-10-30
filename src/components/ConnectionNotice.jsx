import { isSupabaseConfigured } from '../lib/supabaseClient';
export default function ConnectionNotice() {
  if (isSupabaseConfigured) return null;
  return <div role="alert" className="border-b border-line bg-page px-4 py-2 text-center text-xs font-semibold text-navy">Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.</div>;
}
