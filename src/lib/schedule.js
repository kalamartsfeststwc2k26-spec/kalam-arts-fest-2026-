import { eventStatus, sortEvents } from './eventUtils.js';

export function groupSchedule(events) {
  const groups = new Map();
  const unscheduled = [];
  for (const event of events) {
    const day = typeof event.day_label === 'string' ? event.day_label.trim() : '';
    if (!day || eventStatus(event) === 'Schedule TBA') { unscheduled.push(event); continue; }
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day).push(event);
  }
  const scheduled = [...groups].map(([label, entries]) => ({ label, events: sortEvents(entries) }))
    .sort((a, b) => Date.parse(a.events[0].start_time) - Date.parse(b.events[0].start_time) || a.label.localeCompare(b.label, undefined, { numeric: true }));
  if (unscheduled.length) scheduled.push({ label: 'Schedule TBA', events: sortEvents(unscheduled), unscheduled: true });
  return scheduled;
}
