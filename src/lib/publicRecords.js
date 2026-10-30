import { supabase } from './supabaseClient';

async function page(table, fields, prepare) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const rows = [];
  for (let start = 0; ; start += 500) {
    let query = supabase.from(table).select(fields).range(start, start + 499);
    if (prepare) query = prepare(query);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}

const RESULT_FIELDS = 'id,event_id,event_name,team_id,team_name,student_id,student_name,placement,grade,points,published_at,status,division,competition_type,scoring_category,item_category';
const TEAM_FIELDS = 'id,name,logo_url';
export async function fetchStandingsData() {
  const [teams, results, titles, tieBreakers, penalties] = await Promise.all([
    page('teams', TEAM_FIELDS, query => query.order('name')),
    page('public_published_results', RESULT_FIELDS, query => query.order('published_at', { ascending: false }).order('id')),
    page('public_special_titles', 'id,title_type,award_title,division,published_at,recipient_name,recipient_kind', query => query.order('published_at', { ascending: false }).order('id')),
    page('standing_tie_breakers', 'id,scope,division,placement,direction,priority', query => query.eq('is_active', true).order('priority').order('id')),
    page('public_team_penalty_totals', 'team_id,deduction_points,deduction_count', query => query.order('team_id')),
  ]);
  return { teams, results, titles, tieBreakers, penalties };
}
export async function fetchResultsData() {
  return page('public_published_results', RESULT_FIELDS, query => query.order('published_at', { ascending: false }).order('id'));
}
export async function fetchTeamsData() {
  const [teams, roster, results, penalties, tieBreakers] = await Promise.all([
    page('teams', TEAM_FIELDS, query => query.order('name')),
    page('public_team_roster', 'student_id,team_id', query => query.order('student_id')),
    page('public_published_results', 'id,team_id,points,placement', query => query.order('id')),
    page('public_team_penalty_totals', 'team_id,deduction_points,deduction_count', query => query.order('team_id')),
    page('standing_tie_breakers', 'id,scope,division,placement,direction,priority', query => query.eq('is_active', true).eq('scope','teams').order('priority').order('id')),
  ]);
  return { teams, roster, results, penalties, tieBreakers };
}
export async function fetchTeamDetail(id) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: team, error } = await supabase.from('teams').select(TEAM_FIELDS).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!team) return { team: null, roster: [], penalty: null, results: [] };
  const roster = await page('public_team_roster', 'student_id,team_id,student_name,roll_number,photo_url,division,is_attc', query => query.eq('team_id', id).order('student_name').order('student_id'));
  const { data: penalty, error: penaltyError } = await supabase.from('public_team_penalty_totals').select('team_id,deduction_points,deduction_count').eq('team_id', id).maybeSingle();
  if (penaltyError) throw penaltyError;
  const results = await page('public_published_results', 'id,team_id,points', query => query.eq('team_id', id).order('id'));
  return { team, roster, penalty, results }; 
}
