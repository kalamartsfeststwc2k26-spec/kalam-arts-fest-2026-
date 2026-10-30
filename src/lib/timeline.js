function validTime(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// A missing or reversed endpoint can never become Live, Upcoming, or Completed.
export function getTimeline(events, fields, now = Date.now()) {
  const entries = events.map(event => ({ event, start: validTime(event[fields.startsAt]), end: validTime(event[fields.endsAt]) }));
  const timed = entries.filter(({ start, end }) => start !== null && end !== null && end > start);
  return {
    live: timed.filter(({ start, end }) => start <= now && now < end).sort((a, b) => a.start - b.start).map(({ event }) => event),
    next: timed.filter(({ start }) => start > now).sort((a, b) => a.start - b.start).slice(0, 3).map(({ event }) => event),
    tba: entries.filter(({ start, end }) => start === null || end === null || end <= start).slice(0, 3).map(({ event }) => event),
  };
}
