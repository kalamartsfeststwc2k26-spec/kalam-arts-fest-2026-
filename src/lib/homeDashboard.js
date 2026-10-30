import { getTimeline } from './timeline.js';
import { rankHomeResults } from './homeRanking.js';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Verified against the live Supabase schema and public RLS/view policies.
// Only published results are read through the narrow public_published_results view;
// students and registrations tables are never selected by anonymous homepage queries.
export const HOME_SCHEMA = {
  publicReadPoliciesVerified: true,
  publishedValue: 'published',
  events: { id: 'id', title: 'name', startsAt: 'start_time', endsAt: 'end_time' },
  announcements: { id: 'id', title: 'title', body: 'body', createdAt: 'created_at' },
  results: { id: 'id', eventId: 'event_id', eventName: 'event_name', teamId: 'team_id', teamName: 'team_name', studentId: 'student_id', studentName: 'student_name', placement: 'placement', grade: 'grade', points: 'points', publishedAt: 'published_at', status: 'status' },
  teams: { id: 'id', name: 'name' },
  penalties: { team_id: 'team_id', deduction_points: 'deduction_points' },
  tieBreakers: { scope: 'scope', division: 'division', placement: 'placement', direction: 'direction', priority: 'priority' },
};

function validTime(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}
function byNewest(records, key, limit) {
  return [...records].filter(record => validTime(record[key]) !== null)
    .sort((a, b) => validTime(b[key]) - validTime(a[key])).slice(0, limit);
}
export function shapeHomeData({ events, announcements, results, teams, tieBreakers = [], penalties = [] }, schema, now = Date.now()) {
  const teamNames = new Map(teams.map(row => [String(row[schema.teams.id]), row[schema.teams.name]]));
  const studentNames = new Map(results.filter(row => row[schema.results.studentId] != null && row[schema.results.studentName]).map(row => [String(row[schema.results.studentId]), row[schema.results.studentName]]));
  const publicResults = results.filter(row => {
    const rawPoints = row[schema.results.points];
    const points = Number(rawPoints);
    return row[schema.results.status] === schema.publishedValue
      && (!schema.results.valid || row[schema.results.valid] === schema.validValue)
      && rawPoints != null && rawPoints !== '' && Number.isFinite(points) && points >= 0;
  });
  return {
    timeline: getTimeline(events, schema.events, now),
    announcements: byNewest(announcements, schema.announcements.createdAt, 3),
    teams: rankHomeResults(publicResults, schema.results.teamId, schema.results.points, teamNames, 5, tieBreakers.filter(rule => rule.scope === 'teams' && (!rule.division || rule.division === 'Mahdhiyya')), penalties),
    individuals: rankHomeResults(publicResults, schema.results.studentId, schema.results.points, studentNames, 5, tieBreakers.filter(rule => rule.scope === 'individuals' && (!rule.division || rule.division === 'Mahdhiyya'))),
    results: byNewest(publicResults, schema.results.publishedAt, 5).map(row => ({ ...row,
      eventName: row[schema.results.eventName] ?? null,
      teamName: row[schema.results.teamName] ?? null,
      studentName: row[schema.results.studentName] ?? null,
    })),
  };
}

async function fetchAll(table, fields, filter) {
  const selected = [...new Set(Object.values(fields).filter(Boolean))];
  if (!selected.length || selected.some(field => !/^[a-zA-Z_][a-zA-Z_0-9]*$/.test(field))) throw new Error('Invalid verified schema mapping.');
  const rows = [];
  for (let start = 0; ; start += 500) {
    let query = supabase.from(table).select(selected.join(',')).range(start, start + 499);
    if (filter) query = query.eq(filter.key, filter.value);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
export async function loadHomeDashboard(now = Date.now()) {
  if (!navigator.onLine) throw Object.assign(new Error('Offline'), { offline: true });
  if (!isSupabaseConfigured) throw new Error('Supabase environment variables are missing.');
  const schema = HOME_SCHEMA;
  if (!schema?.publicReadPoliciesVerified) throw new Error('Live data is unavailable until the real schema and public read policies are verified.');
  const [events, announcements, results, teams, tieBreakers, penalties] = await Promise.all([
    fetchAll('events', schema.events, { key: 'is_published', value: true }), fetchAll('announcements', schema.announcements, { key: 'is_published', value: true }),
    fetchAll('public_published_results', schema.results, { key: schema.results.status, value: schema.publishedValue }),
    fetchAll('teams', schema.teams),
    fetchAll('standing_tie_breakers', schema.tieBreakers, { key: 'is_active', value: true }),
    fetchAll('public_team_penalty_totals', schema.penalties),
  ]);
  return shapeHomeData({ events, announcements, results, teams, tieBreakers, penalties }, schema, now);
}
