import { friendlyQueryError } from '../lib/friendlyError';
import { Bell, RefreshCw } from 'lucide-react';
import DataState from '../components/DataState';
import SectionHeading from '../components/SectionHeading';
import { fetchAnnouncements } from '../lib/publicSite';
import { usePublicData } from '../lib/usePublicData';

function postedDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
export default function AnnouncementsPage() {
  const { status, data, error, refresh } = usePublicData(fetchAnnouncements, 'announcements');
  return <div className="mx-auto max-w-[1040px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><SectionHeading eyebrow="Updates / KALAM 2K26" title="Announcements" description="Official festival notices, newest first." /><button type="button" onClick={refresh} className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy hover:bg-page"><RefreshCw size={14} aria-hidden="true" />Refresh</button></div>
    {status === 'loading' ? <DataState status="loading" /> : status === 'offline' ? <DataState status="offline" onRetry={refresh} /> : status === 'error' ? <DataState status="error" description={friendlyQueryError(error)} onRetry={refresh} /> : !data.length ? <DataState status="empty" title="No announcements published yet" description="Official notices will appear here when available." /> : <div className="grid gap-5">{data.map(item => <article key={item.id} className="rounded-panel border border-line bg-white p-6 shadow-soft sm:p-8"><div className="flex items-center gap-2 text-xs font-semibold text-muted"><Bell size={16} className="text-burgundy" aria-hidden="true" /><time dateTime={item.created_at}>{postedDate(item.created_at)}</time></div><h2 className="mt-4 text-xl font-bold tracking-tight text-navy sm:text-2xl">{item.title}</h2><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink sm:text-base">{item.body}</p></article>)}</div>}
  </div>;
}
