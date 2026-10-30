// Keep raw PostgREST and network diagnostics out of public-facing copy.
export function friendlyQueryError(error, subject = 'information') {
  const code = error?.code;
  if (code === 'PGRST116') return `We couldn't find this ${subject}. It may no longer be published.`;
  if (code === '42501' || /permission denied|not authorized|jwt expired/i.test(error?.message || '')) return `Access to this ${subject} is unavailable right now. Please refresh or sign in again.`;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'You appear to be offline. Reconnect and try again.';
  if (/fetch|network|timeout/i.test(error?.message || '')) return `We couldn't reach the festival service for ${subject}. Check your connection and try again.`;
  return `We couldn't load ${subject} right now. Please try again in a moment.`;
}
