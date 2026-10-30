export const EVENT_FIELDS = 'id,name,item_category,description,venue,stage_type,start_time,end_time,day_label,division,competition_type,scoring_category,min_participants,max_participants,duration_minutes,judging_criteria';

function validTime(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}
export function eventStatus(event, now = Date.now()) {
  const start = validTime(event.start_time);
  const end = validTime(event.end_time);
  if (start === null || end === null || end <= start) return 'Schedule TBA';
  if (now < start) return 'Upcoming';
  if (now < end) return 'Live';
  return 'Completed';
}
export function sortEvents(events) {
  return [...events].sort((a, b) => {
    const first = validTime(a.start_time) ?? Infinity;
    const second = validTime(b.start_time) ?? Infinity;
    return first - second || String(a.name).localeCompare(String(b.name)) || String(a.id).localeCompare(String(b.id));
  });
}
export function formatEventDate(value) {
  const time = validTime(value);
  if (time === null) return null;
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }).format(time);
}
export function formatEventTime(value) {
  const time = validTime(value);
  if (time === null) return null;
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' }).format(time);
}
export function eventSchedule(event) {
  if (eventStatus(event) === 'Schedule TBA') return 'Schedule TBA';
  const day = formatEventDate(event.start_time);
  const start = formatEventTime(event.start_time);
  const end = formatEventTime(event.end_time);
  const endDay = formatEventDate(event.end_time);
  return `${day}, ${start} – ${day === endDay ? '' : `${endDay}, `}${end}`;
}
