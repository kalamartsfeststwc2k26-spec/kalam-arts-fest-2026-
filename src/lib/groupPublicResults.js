// Only presentation logic: inputs come from the existing published-results view.
export function groupPublicResults(results, { query = '', type = '', grade = '' } = {}) {
  const needle = query.trim().toLocaleLowerCase();
  const groups = new Map();
  (results || []).forEach((row, index) => {
    const eventId = typeof row.event_id === 'string' && row.event_id.trim() ? row.event_id : null;
    // An absent ID must never combine unrelated events merely because names match.
    const key = eventId ? `event:${eventId}` : `row:${index}`;
    if (!groups.has(key)) groups.set(key, { key, eventId, rows: [], total: 0 });
    const group = groups.get(key);
    group.total += 1;
    const match = (!needle || [row.event_name, row.student_name, row.team_name, row.item_category].some(value => String(value ?? '').toLocaleLowerCase().includes(needle)))
      && (!type || row.competition_type === type)
      && (!grade || row.grade === grade);
    if (match) group.rows.push(row);
  });
  const timeOf = row => {
    const value = typeof row.published_at === 'string' ? Date.parse(row.published_at) : NaN;
    return Number.isFinite(value) ? value : -Infinity;
  };
  const placeOf = row => {
    if (row.placement == null || row.placement === '') return Infinity;
    const place = Number(row.placement);
    return Number.isFinite(place) && place > 0 ? place : Infinity;
  };
  return [...groups.values()].filter(group => group.rows.length).map(group => {
    group.rows.sort((a, b) => placeOf(a) - placeOf(b) || timeOf(b) - timeOf(a) || String(a.id ?? '').localeCompare(String(b.id ?? '')));
    const timestamps = group.rows.map(row => row.published_at);
    // Only collapse exact equal, valid timestamps. Otherwise retain each one.
    const sharedPublishedAt = timestamps[0] && Number.isFinite(Date.parse(timestamps[0])) && timestamps.every(value => value === timestamps[0]) ? timestamps[0] : null;
    return { ...group, sharedPublishedAt, latest: Math.max(...group.rows.map(timeOf)) };
  }).sort((a, b) => b.latest - a.latest || a.key.localeCompare(b.key));
}
