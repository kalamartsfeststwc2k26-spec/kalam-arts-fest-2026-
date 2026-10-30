import { friendlyQueryError } from '../lib/friendlyError';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, Clock3, MapPin, RefreshCw } from 'lucide-react';
import DataState from '../components/DataState';
import SectionHeading from '../components/SectionHeading';
import { StatusBadge } from './EventsPages';
import { categoryStyle } from '../constants/festivalTheme';
import { eventStatus, formatEventDate, formatEventTime } from '../lib/eventUtils';
import { listPublishedEvents } from '../lib/useEvents';
import { groupSchedule } from '../lib/schedule';
import { usePublicData } from '../lib/usePublicData';

export default function SchedulePage() {
  const { status, data, error, refresh } = usePublicData(listPublishedEvents, 'schedule');
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30000); return () => window.clearInterval(timer); }, []);
  const groups = status === 'ready' ? groupSchedule(data) : [];
  return <div className="mx-auto max-w-[1080px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><SectionHeading eyebrow="Programme guide / KALAM 2K26" title="Schedule" description="Published programmes grouped by day. Unconfirmed schedules appear separately." /><button onClick={refresh} className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy hover:bg-page"><RefreshCw size={14} aria-hidden="true" />Refresh</button></div>
    {status === 'loading' ? <DataState status="loading" /> : status === 'offline' ? <DataState status="offline" onRetry={refresh} /> : status === 'error' ? <DataState status="error" description={friendlyQueryError(error)} onRetry={refresh} /> : !groups.length ? <DataState status="empty" title="No schedule published yet" description="Events will appear here as they are published." /> : <div className="space-y-10">{groups.map(group => <section key={group.label} aria-label={group.label}><div className="mb-4 flex flex-wrap items-center gap-3"><CalendarDays size={19} className="text-burgundy" aria-hidden="true" /><h2 className="text-xl font-bold text-navy sm:text-2xl">{group.label}</h2>{!group.unscheduled && <span className="text-sm text-muted">{formatEventDate(group.events[0].start_time)}</span>}</div>{group.unscheduled && <p className="mb-4 text-sm text-muted">These events have an unconfirmed day label or incomplete start/end times.</p>}<div className="grid gap-4">{group.events.map(event => <Link key={event.id} to={`/events/${encodeURIComponent(event.id)}`} className="group flex flex-wrap items-center gap-4 rounded-[18px] border border-line bg-white p-5 shadow-panel transition-shadow duration-fast hover:shadow-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy sm:p-6"><div className="w-full shrink-0 text-xs font-bold tabular-nums text-navy sm:w-28"><Clock3 size={15} className="mb-1 text-burgundy" aria-hidden="true" />{eventStatus(event, now) === 'Schedule TBA' ? 'Schedule TBA' : `${formatEventTime(event.start_time)} – ${formatEventTime(event.end_time)}`}</div><div className="min-w-0 flex-1"><h3 className="text-base font-bold text-navy group-hover:text-burgundy">{event.name}</h3><p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted"><MapPin size={13} aria-hidden="true" />{event.venue?.trim() || 'Venue TBA'}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${categoryStyle(event.competition_type).chip}`}>{event.competition_type}</span><StatusBadge status={eventStatus(event, now)} /><ChevronRight size={17} className="text-burgundy" aria-hidden="true" /></Link>)}</div></section>)}</div>}
  </div>;
}
