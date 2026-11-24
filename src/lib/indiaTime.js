// Only explicit-offset instants are accepted; timezone-less values are ambiguous.
const instantPattern = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;
const formatter = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short', hour12: true });
const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });

export function formatIndiaTimestamp(value, fallback = 'Not recorded') {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? `${formatter.format(date)} IST` : fallback;
}
export function indiaDateForFilename(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const p = Object.fromEntries(dateFormatter.formatToParts(date).map(part => [part.type, part.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
// Form values are either an existing explicit-offset instant, empty, or a partial
// draft marked with |. Keeping the original instant preserves seconds on edit.
export function indiaInputParts(value) {
  if (!value) return { date: '', hour: '', minute: '', period: '' };
  if (value.startsWith('|')) {
    const [, date = '', hour = '', minute = '', period = ''] = value.split('|');
    return { date, hour, minute, period };
  }
  if (!instantPattern.test(value) || !Number.isFinite(Date.parse(value))) return { date: '', hour: '', minute: '', period: '' };
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value)).map(part => [part.type, part.value]));
  const h = Number(p.hour);
  return { date: `${p.year}-${p.month}-${p.day}`, hour: String(h % 12 || 12), minute: p.minute, period: h < 12 ? 'AM' : 'PM' };
}
export function indiaInputDraft(parts) {
  const { date, hour, minute, period } = parts;
  if (![date, hour, minute, period].some(Boolean)) return '';
  return `|${date}|${hour}|${minute}|${period}`;
}
export function indiaInputToIso(value) {
  if (!value) return null;
  if (!value.startsWith('|')) {
    if (!instantPattern.test(value) || !Number.isFinite(Date.parse(value))) throw new Error('Invalid date and time.');
    return value;
  }
  const { date, hour, minute, period } = indiaInputParts(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date.startsWith('0000') || !/^(?:[1-9]|1[0-2])$/.test(hour) || !/^[0-5]\d$/.test(minute) || !['AM','PM'].includes(period)) throw new Error('Complete the date, hour, minute and AM/PM.');
  const hour24 = Number(hour) % 12 + (period === 'PM' ? 12 : 0);
  const local = `${date}T${String(hour24).padStart(2, '0')}:${minute}`;
  const ms = Date.parse(`${local}:00+05:30`);
  if (!Number.isFinite(ms) || new Date(ms + 330 * 60000).toISOString().slice(0,16) !== local) throw new Error('Enter a valid date and time.');
  return new Date(ms).toISOString();
}
