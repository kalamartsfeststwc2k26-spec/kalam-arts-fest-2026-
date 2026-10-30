import { friendlyQueryError } from '../lib/friendlyError';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, RefreshCw, Search, Trophy } from 'lucide-react';
import DataState from '../components/DataState';
import SectionHeading from '../components/SectionHeading';
import SelectField from '../components/SelectField';
import { COMPETITION_TYPES } from '../constants/branding';
import { categoryStyle } from '../constants/festivalTheme';
import { fetchResultsData } from '../lib/publicRecords';
import { formatPoints } from '../lib/rankings';
import { usePublicData } from '../lib/usePublicData';

function publishedDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Publication time unavailable';
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}
export default function ResultsPage() {
  const { status, data: results, error, refresh } = usePublicData(fetchResultsData, 'results');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [grade, setGrade] = useState('');
  const grades = useMemo(() => [...new Set((results || []).map(row => row.grade).filter(Boolean))].sort(), [results]);
  const visible = useMemo(() => (results || []).filter(row => {
    const needle = query.trim().toLocaleLowerCase();
    return (!needle || [row.event_name, row.student_name, row.team_name, row.item_category].some(value => String(value ?? '').toLocaleLowerCase().includes(needle)))
      && (!type || row.competition_type === type)
      && (!grade || row.grade === grade);
  }), [results, query, type, grade]);
  return <div className="mx-auto max-w-[1120px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><SectionHeading eyebrow="Published / KALAM 2K26" title="Results" description="Search officially published results by event, student or team." /><button onClick={refresh} className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy hover:bg-page"><RefreshCw size={14} aria-hidden="true" />Refresh</button></div>
    <div role="group" aria-label="Filter results by competition category" className="mb-5 flex gap-2 overflow-x-auto pb-2">{['',...COMPETITION_TYPES].map(item=><button key={item||'all'} type="button" aria-pressed={type===item} onClick={()=>setType(item)} className={`shrink-0 rounded-full border px-4 py-2.5 text-[13px] font-semibold ${type===item?'border-clay-700 bg-clay-700 text-white':'border-line bg-white text-muted hover:text-clay-800'}`}>{item||'All'}</button>)}</div>
    <div className="mb-7 grid gap-4 rounded-panel border border-line bg-white p-5 shadow-panel sm:grid-cols-2 sm:p-6"><label htmlFor="result-query" className="block text-sm font-semibold text-ink">Search results<div className="relative mt-2"><Search size={17} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input id="result-query" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Event, student or team" className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-muted focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy" /></div></label><SelectField id="results-grade" label="Grade" options={grades} value={grade} onChange={e => setGrade(e.target.value)} /></div>
    {status === 'loading' ? <DataState status="loading" /> : status === 'offline' ? <DataState status="offline" onRetry={refresh} /> : status === 'error' ? <DataState status="error" description={friendlyQueryError(error)} onRetry={refresh} /> : !visible.length ? <DataState status="empty" title={results?.length ? 'No matching results' : 'No results published yet'} description={results?.length ? 'Try changing your search or filters.' : 'Published results will appear here when available.'} /> : <><p className="mb-4 text-xs font-semibold tabular-nums text-muted">{visible.length} {visible.length === 1 ? 'result' : 'results'} · newest first</p><div className="grid gap-4">{visible.map(row => <article key={row.id} className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${categoryStyle(row.competition_type).chip}`}>{row.competition_type}</p><p className="mt-2 text-xs text-muted">{row.item_category} · {row.division}</p><Link to={`/events/${encodeURIComponent(row.event_id)}`} className="mt-2 inline-block text-lg font-bold text-navy hover:text-burgundy hover:underline">{row.event_name}</Link></div><span className="rounded-full bg-paper px-3 py-1 text-xs font-bold text-clay-800">Place {row.placement}{row.grade ? ` · Grade ${row.grade}` : ''}</span></div><div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4"><div><p className="text-sm font-semibold text-navy">{row.student_name || row.team_name || 'Recipient not listed'}</p>{row.student_name && row.team_name && <p className="mt-1 text-xs text-muted">Team: {row.team_name}</p>}<p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted"><CalendarDays size={13} aria-hidden="true" />{publishedDate(row.published_at)}</p></div><p className="whitespace-nowrap text-xl font-extrabold tabular-nums text-navy">{formatPoints(Number(row.points))} <span className="text-xs font-medium text-muted">pts</span></p></div></article>)}</div></>}
  </div>;
}
