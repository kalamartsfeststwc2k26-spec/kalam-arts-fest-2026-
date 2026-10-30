// Homepage standings use only published totals and organiser-configured placement-count tie-breaks.
export function rankHomeResults(results, ownerKey, pointsKey, names, limit = 5, rules = [], penalties = []) {
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority || a.placement - b.placement);
  const totals = new Map();
  for (const result of results) {
    const id = result[ownerKey];
    const raw = result[pointsKey];
    if (id == null || raw == null || raw === '') continue;
    const points = Number(raw);
    if (!Number.isFinite(points) || points < 0) continue;
    const key = String(id);
    if (!totals.has(key)) totals.set(key, { id: key, name: names.get(key), pointsCents: 0, deductedCents: 0, placements: {} });
    const item = totals.get(key);
    item.pointsCents += Math.round(points * 100);
    for (const rule of sortedRules) if (result.placement === rule.placement) item.placements[rule.placement] = (item.placements[rule.placement] || 0) + 1;
  }
  for (const penalty of penalties) {
    const id = String(penalty.team_id ?? '');
    const amount = Number(penalty.deduction_points);
    if (!names.has(id) || !Number.isFinite(amount) || amount <= 0) continue;
    if (!totals.has(id)) totals.set(id, { id, name: names.get(id), pointsCents: 0, deductedCents: 0, placements: {} });
    const cents = Math.round(amount * 100);
    totals.get(id).pointsCents -= cents;
    totals.get(id).deductedCents += cents;
  }
  const compare = (a, b) => {
    if (a.pointsCents !== b.pointsCents) return b.pointsCents - a.pointsCents;
    for (const rule of sortedRules) {
      const difference = (a.placements[rule.placement] || 0) - (b.placements[rule.placement] || 0);
      if (difference) return rule.direction === 'asc' ? difference : -difference;
    }
    return 0;
  };
  const ordered = [...totals.values()].filter(row => names.has(row.id))
    .sort((a, b) => compare(a, b) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  let rank = 0;
  return ordered.map((row, index) => {
    if (!index || compare(row, ordered[index - 1])) rank = index + 1;
    return { id: row.id, name: row.name, points: row.pointsCents / 100, deductionPoints: row.deductedCents / 100, rank };
  }).slice(0, limit);
}
