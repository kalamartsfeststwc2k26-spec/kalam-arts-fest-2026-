import { friendlyQueryError } from '../lib/friendlyError';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, MapPin, RefreshCw, Users } from 'lucide-react';
import DataState from '../components/DataState';
import SectionHeading from '../components/SectionHeading';
import SelectField from '../components/SelectField';
import { COMPETITION_TYPES } from '../constants/branding';
import { categoryStyle } from '../constants/festivalTheme';
import { eventSchedule, eventStatus } from '../lib/eventUtils';
import { useEventDetails, usePublicEvents } from '../lib/useEvents';

function useCurrentTime() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30000); return () => window.clearInterval(timer); }, []);
  return now;
}
const statusNames = ['Upcoming', 'Live', 'Completed', 'Schedule TBA'];
export function StatusBadge({ status }) {
  const tone = status === 'Live' ? 'bg-pink-600 text-white' : status === 'Upcoming' ? 'bg-[#F0E0FF] text-[#6112AE]' : status === 'Completed' ? 'bg-[#E3F3D9] text-[#2D5B00]' : 'bg-paper text-clay-800';
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{status === 'Live' && <span aria-hidden="true" className="live-dot h-2 w-2 rounded-full bg-white" />}{status}</span>;
}
function EventCard({ event, now }) {
  const status = eventStatus(event, now);
  return <Link to={`/events/${encodeURIComponent(event.id)}`} className={`group flex flex-col rounded-[18px] border border-line border-l-[6px] ${categoryStyle(event.competition_type).border} bg-white p-5 shadow-panel transition-shadow duration-fast hover:shadow-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy sm:p-6`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${categoryStyle(event.competition_type).chip}`}>{event.competition_type}</span><StatusBadge status={status} /></div>
    <h2 className="mt-4 text-xl font-bold tracking-[-.025em] text-navy group-hover:text-burgundy">{event.name}</h2>
    <p className="mt-2 text-sm text-muted">{event.item_category} · {event.division}</p>
    <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-xs text-muted"><span className="inline-flex items-center gap-1.5"><CalendarDays size={14} aria-hidden="true" />{eventSchedule(event)}</span><span className="inline-flex items-center gap-1.5"><MapPin size={14} aria-hidden="true" />{event.venue?.trim() || 'Venue TBA'}</span></div>
    <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-burgundy">Event details <ArrowRight size={14} aria-hidden="true" /></span>
  </Link>;
}
function DataArea({ status, error, refresh, children, emptyTitle, emptyDescription }) {
  if (status === 'loading') return <DataState status="loading" />;
  if (status === 'offline') return <DataState status="offline" onRetry={refresh} />;
  if (status === 'error') return <DataState status="error" description={friendlyQueryError(error)} onRetry={refresh} />;
  if (!children) return <DataState status="empty" title={emptyTitle} description={emptyDescription} />;
  return children;
}
export function EventsPage() {
  const { status, data: events, error, refresh } = usePublicEvents();
  const now = useCurrentTime();
  const [searchParams] = useSearchParams();
  const selectedType = COMPETITION_TYPES.includes(searchParams.get('type')) ? searchParams.get('type') : '';
  const [filters, setFilters] = useState({ status: '', day_label: '' });
  const days = useMemo(() => [...new Set((events || []).map(event => event.day_label?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [events]);
  const filtered = useMemo(() => (events || []).filter(event =>
    (!filters.status || eventStatus(event, now) === filters.status) &&
    (!selectedType || event.competition_type === selectedType) &&
    (!filters.day_label || event.day_label?.trim() === filters.day_label)), [events, filters, now, selectedType]);
  const change = key => e => setFilters(current => ({ ...current, [key]: e.target.value }));
  return <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><SectionHeading eyebrow="KALAM / 2026" title="Events" description="Explore the published programmes and their schedules." /><button type="button" onClick={refresh} className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy hover:bg-page focus-visible:outline focus-visible:outline-2 focus-visible:outline-burgundy"><RefreshCw size={14} aria-hidden="true" />Refresh</button></div>
    <nav aria-label="Filter by competition category" className="mb-5 flex gap-2 overflow-x-auto pb-2">{['',...COMPETITION_TYPES].map(type => <Link key={type || 'all'} to={type ? `/events?type=${encodeURIComponent(type)}` : '/events'} aria-current={selectedType === type ? 'page' : undefined} className={`shrink-0 rounded-full border px-4 py-2.5 text-[13px] font-semibold ${selectedType === type ? 'border-clay-700 bg-clay-700 text-white' : 'border-line bg-white text-muted hover:text-clay-800'}`}>{type || 'All'}</Link>)}</nav>
    <div className="mb-7 grid gap-4 rounded-panel border border-line bg-white p-5 shadow-panel sm:grid-cols-2 sm:p-6">
      <SelectField id="status-filter" label="Status" allLabel="All statuses" options={statusNames} value={filters.status} onChange={change('status')} />
      <SelectField id="day-filter" label="Day label" allLabel="All day labels" options={days} value={filters.day_label} onChange={change('day_label')} />
    </div>
    <DataArea status={status} error={error} refresh={refresh} emptyTitle={events?.length ? 'No matching events' : 'No events published yet'} emptyDescription={events?.length ? 'Try another combination of filters.' : 'Published programmes will appear here when available.'}>
      {filtered.length > 0 && <><p className="mb-4 text-xs font-semibold tabular-nums text-muted">{filtered.length} {filtered.length === 1 ? 'event' : 'events'}</p><div className="grid gap-4 sm:grid-cols-2 min-[1040px]:grid-cols-3">{filtered.map(event => <EventCard key={event.id} event={event} now={now} />)}</div></>}
    </DataArea>
  </div>;
}
function DetailField({ label, children, Icon }) {
  return <div className="rounded-xl border border-line bg-page p-4"><dt className="flex items-center gap-2 text-xs font-bold tracking-[.09em] text-muted">{Icon && <Icon size={14} aria-hidden="true" />}{label}</dt><dd className="mt-2 text-sm font-semibold leading-relaxed text-navy">{children}</dd></div>;
}
export function EventDetailPage() {
  const { id } = useParams();
  const { status, data, error, refresh } = useEventDetails(id);
  const now = useCurrentTime();
  const event = data?.event;
  return <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-10">
    <Link to="/events" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-burgundy hover:underline"><ArrowLeft size={16} aria-hidden="true" />Back to events</Link>
    {!event && <h1 className="sr-only">Event details</h1>}
    <DataArea status={status} error={error} refresh={refresh} emptyTitle="Event not found" emptyDescription="This event may not exist or may not be published.">
      {event && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
        <div className="grid gap-6"><article className="rounded-panel border border-line bg-white p-6 shadow-soft sm:p-8"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryStyle(event.competition_type).chip}`}>{event.competition_type}</span><StatusBadge status={eventStatus(event, now)} /></div><h1 className="mt-5 text-[2rem] font-extrabold leading-tight tracking-[-.04em] text-navy sm:text-[2.6rem]">{event.name}</h1>{event.description && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-ink">{event.description}</p>}
          <dl className="mt-8 grid gap-3 border-t border-line pt-7 sm:grid-cols-2"><DetailField label="Date & time" Icon={CalendarDays}>{eventSchedule(event)}</DetailField><DetailField label="Venue" Icon={MapPin}>{event.venue?.trim() || 'Venue TBA'}</DetailField><DetailField label="Division">{event.division}</DetailField><DetailField label="Competition category">{event.competition_type}</DetailField>{event.stage_type && <DetailField label="Stage format">{event.stage_type}</DetailField>}{event.scoring_category && <DetailField label="Scoring category">Category {event.scoring_category}</DetailField>}<DetailField label="Participant limits" Icon={Users}>{event.max_participants === null ? `${event.min_participants}+ participants` : event.min_participants === event.max_participants ? `${event.min_participants} participant${event.min_participants === 1 ? '' : 's'}` : `${event.min_participants}–${event.max_participants} participants`}</DetailField>{event.duration_minutes != null && <DetailField label="Duration" Icon={Clock3}>{event.duration_minutes} minutes</DetailField>}</dl>
          {event.judging_criteria && <section className="mt-7 border-t border-line pt-6"><h2 className="text-base font-bold text-navy">Judging criteria</h2><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{event.judging_criteria}</p></section>}
          {event.competition_type === 'ATTC' && <div className="mt-7 rounded-xl border border-line bg-page p-4"><h2 className="text-sm font-bold text-navy">ATTC students only</h2><p className="mt-1 text-sm leading-relaxed text-muted">Only students in the ATTC category within Mahdhiyya may register for ATTC-category programmes, including Teaching, still Model, working model and chart-making. ATTC-category students may also take part in On-stage, Non-stage and General programmes.</p></div>}
        </article></div>
        <aside className="rounded-panel border border-line bg-white shadow-soft"><div className="flex items-center gap-2 border-b border-line px-6 py-5"><Users size={18} className="text-burgundy" aria-hidden="true" /><h2 className="text-lg font-bold text-navy">Registered students</h2></div><div className="p-6">{data.registrations.length === 0 ? <p className="rounded-xl bg-page px-4 py-6 text-center text-sm text-muted">No registrations yet</p> : <ul className="divide-y divide-line">{data.registrations.map(row => <li key={row.registration_id} className="py-3 first:pt-0 last:pb-0"><p className="text-sm font-semibold text-navy">{row.student_name}</p><p className="mt-0.5 text-xs text-muted">Team: {row.team_name}</p></li>)}</ul>}</div></aside>
      </div>}
    </DataArea>
  </div>;
}
