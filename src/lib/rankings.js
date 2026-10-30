function cents(value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number * 100) : null;
}
export function formatPoints(value) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
}
export function sumTeamDeductions(penalties) {
  const totals = new Map();
  for (const row of penalties) {
    const amount = cents(row.deduction_points);
    if (row.team_id == null || amount == null) continue;
    const id = String(row.team_id);
    totals.set(id, (totals.get(id) || 0) + amount);
  }
  return totals;
}
export function sumTeamPoints(results) {
  const totals = new Map();
  for (const row of results) {
    const amount = cents(row.points);
    if (row.team_id == null || amount == null) continue;
    const id = String(row.team_id);
    totals.set(id, (totals.get(id) || 0) + amount);
  }
  return totals;
}
export function rankStandings(items, tieBreakers = []) {
  // A tie-breaker is applied only if one has been explicitly configured by organisers.
  // Alphabetical/ID ordering stabilises display but never resolves a score tie.
  const compareScore = (a, b) => {
    if (a.pointsCents !== b.pointsCents) return b.pointsCents - a.pointsCents;
    for (const { key, direction = 'desc' } of tieBreakers) {
      const left = a[key] ?? 0;
      const right = b[key] ?? 0;
      if (left !== right) return (left > right ? 1 : -1) * (direction === 'asc' ? 1 : -1);
    }
    return 0;
  };
  const ordered = [...items].sort((a, b) => compareScore(a, b) || a.name.localeCompare(b.name) || String(a.id).localeCompare(String(b.id)));
  let rank = 0;
  return ordered.map((item, index) => {
    if (index === 0 || compareScore(item, ordered[index - 1]) !== 0) rank = index + 1;
    return { ...item, rank, tied: ordered.some((other, i) => i !== index && compareScore(item, other) === 0), points: item.pointsCents / 100 };
  });
}
function placementMetrics(results, ownerKey, rules) {
  const metrics = new Map();
  for (const row of results) {
    if (row[ownerKey] == null || cents(row.points) == null) continue;
    const id = String(row[ownerKey]);
    if (!metrics.has(id)) metrics.set(id, {});
    for (const rule of rules) {
      if (row.placement === rule.placement) {
        const key = `placement_${rule.placement}`;
        const record = metrics.get(id);
        record[key] = (record[key] || 0) + 1;
      }
    }
  }
  return metrics;
}
function configuredRules(rules) {
  return rules.map(({ placement, direction }) => ({ key: `placement_${placement}`, direction }));
}
export function makeTeamStandings(teams, results, tieBreakers = [], penalties = []) {
  const filtered = results;
  const totals = sumTeamPoints(filtered);
  const deductions = sumTeamDeductions(penalties);
  const metrics = placementMetrics(filtered, 'team_id', tieBreakers);
  return rankStandings(teams.map(team => ({ id: String(team.id), name: team.name, logo_url: team.logo_url, pointsCents: (totals.get(String(team.id)) || 0) - (deductions.get(String(team.id)) || 0), earnedPoints: (totals.get(String(team.id)) || 0) / 100, deductionPoints: (deductions.get(String(team.id)) || 0) / 100, ...metrics.get(String(team.id)) })), configuredRules(tieBreakers));
}
export function makeIndividualStandings(results, tieBreakers = []) {
  const filtered = results;
  const totals = new Map();
  const metrics = placementMetrics(filtered, 'student_id', tieBreakers);
  for (const row of filtered) {
    const amount = cents(row.points);
    if (row.student_id == null || !row.student_name || amount == null) continue;
    const id = String(row.student_id);
    const current = totals.get(id);
    totals.set(id, { id, name: row.student_name, teamName: row.team_name, pointsCents: (current?.pointsCents || 0) + amount });
  }
  return rankStandings([...totals.values()].map(item => ({ ...item, ...metrics.get(item.id) })), configuredRules(tieBreakers));
}
