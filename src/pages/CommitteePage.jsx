import { friendlyQueryError } from '../lib/friendlyError';
import { RefreshCw } from 'lucide-react';
import CommitteeCard from '../components/CommitteeCard';
import DataState from '../components/DataState';
import SectionHeading from '../components/SectionHeading';
import { fetchCommittee } from '../lib/publicSite';
import { usePublicData } from '../lib/usePublicData';

export default function CommitteePage() {
  const { status, data, error, refresh } = usePublicData(fetchCommittee, 'committee');
  return <div className="mx-auto max-w-[1120px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-10"><div className="flex flex-wrap items-end justify-between gap-4"><SectionHeading eyebrow="People / KALAM 2K26" title="Committee" description="Meet the published organising committee of the festival." /><button type="button" onClick={refresh} className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy hover:bg-page"><RefreshCw size={14} aria-hidden="true" />Refresh</button></div>
    {status === 'loading' ? <DataState status="loading" /> : status === 'offline' ? <DataState status="offline" onRetry={refresh} /> : status === 'error' ? <DataState status="error" description={friendlyQueryError(error)} onRetry={refresh} /> : !data.length ? <DataState status="empty" title="Committee details coming soon" description="Published committee members will appear here when available." /> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.map(member => <CommitteeCard key={member.id} member={member} />)}</div>}
  </div>;
}
