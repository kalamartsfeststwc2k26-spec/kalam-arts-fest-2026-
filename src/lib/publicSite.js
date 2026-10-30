import { supabase } from './supabaseClient';

async function fetchPages(table, fields, build) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const all = [];
  for (let offset = 0; ; offset += 500) {
    let query = supabase.from(table).select(fields).range(offset, offset + 499);
    query = build(query);
    const { data, error } = await query;
    if (error) throw error;
    all.push(...data);
    if (data.length < 500) return all;
  }
}
export function fetchAnnouncements() {
  return fetchPages('announcements', 'id,title,body,created_at', query => query.eq('is_published', true).order('created_at', { ascending: false }).order('id'));
}
export function fetchCommittee() {
  return fetchPages('committee_members', 'id,name,role_title,photo_url,contact_phone,contact_email,sort_order', query => query.eq('is_published', true).order('sort_order').order('name').order('id'));
}
export function escapeLike(text) {
  return text.replace(/[\\%_]/g, '\\$&');
}
export async function searchStudents(query) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const term = query.trim();
  if (!term) return [];
  const { data, error } = await supabase.from('public_team_roster')
    .select('student_id,student_name,roll_number,photo_url,team_id,team_name,is_attc')
    .ilike('student_name', `%${escapeLike(term)}%`)
    .order('student_name').order('student_id').limit(50);
  if (error) throw error;
  return data;
}

export async function fetchSiteContent(contentPage) {
  if (!['about', 'contact'].includes(contentPage)) throw new Error('Unknown content page.');
  const rows = await fetchPages('site_content', 'content_key,content', query => query.eq('page', contentPage).eq('is_published', true).order('content_key'));
  return Object.fromEntries(rows.map(row => [row.content_key, row.content]));
}
