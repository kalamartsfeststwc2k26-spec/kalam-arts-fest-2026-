import { friendlyQueryError } from '../lib/friendlyError';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import CommitteeCard from '../components/CommitteeCard';
import DataState from '../components/DataState';
import SectionHeading from '../components/SectionHeading';
import { BRAND } from '../constants/branding';
import { fetchCommittee, fetchSiteContent } from '../lib/publicSite';
import { usePublicData } from '../lib/usePublicData';

const ROLE_ORDER = ['fest controller', 'chair person', 'chairperson', 'chief convener', 'asst convener', 'assistant convener', 'finance secretary', 'fest coordinator', 'media wing'];
function rolePriority(role) {
  const normalized = role.trim().toLocaleLowerCase().replace(/\./g, '').replace(/\s+/g, ' ');
  const index = ROLE_ORDER.indexOf(normalized);
  return index < 0 ? ROLE_ORDER.length : index;
}
export default function AboutPage() {
  const { status, data, error, refresh } = usePublicData(fetchCommittee, 'about-committee');
  const about = usePublicData(() => fetchSiteContent('about'), 'about-content');
  const members = status === 'ready' ? [...data].sort((a, b) => rolePriority(a.role_title) - rolePriority(b.role_title) || a.sort_order - b.sort_order || a.name.localeCompare(b.name)) : [];
  return <div className="mx-auto max-w-[1120px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-10"><SectionHeading eyebrow="Our festival / STWC" title="About KALAM" description="KALAM Arts Fest 2K26 at Shihab Thangal Women’s College." />
    {about.status === 'loading' ? <DataState status="loading" title="Loading festival information" /> : about.status === 'offline' ? <DataState status="offline" onRetry={about.refresh} /> : about.status === 'error' ? <DataState status="error" description={friendlyQueryError(about.error, 'festival information')} onRetry={about.refresh} /> : !about.data.intro ? <DataState status="empty" title="About information not published" description="The festival introduction will appear here when it is published." /> : <section className="rounded-panel border border-line bg-white p-7 shadow-soft sm:p-10"><p className="text-xs font-bold tracking-[.15em] text-burgundy">Organised by {BRAND.organizer}</p><h2 className="mt-4 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">KALAM Arts Fest 2K26</h2><p className="mt-5 max-w-2xl whitespace-pre-wrap text-base leading-relaxed text-ink">{about.data.intro}</p><p lang="ml" className="mt-6 border-l-2 border-burgundy pl-5 text-xl font-semibold leading-relaxed text-navy">{BRAND.tagline}</p></section>}
    <section className="mt-12" aria-labelledby="fest-committee-title"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[.15em] text-burgundy">The people behind the festival</p><h2 id="fest-committee-title" className="mt-2 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Fest Committee 2026–27</h2></div><Link to="/committee" className="inline-flex items-center gap-2 text-sm font-bold text-burgundy hover:underline">Full committee <ArrowRight size={16} aria-hidden="true" /></Link></div>{status === 'loading' ? <DataState status="loading" /> : status === 'offline' ? <DataState status="offline" onRetry={refresh} /> : status === 'error' ? <DataState status="error" description={friendlyQueryError(error)} onRetry={refresh} /> : !members.length ? <DataState status="empty" title="Committee members coming soon" description="Published Fest Committee 2026–27 details will appear here." /> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{members.map(member => <CommitteeCard key={member.id} member={member} headingLevel={3} />)}</div>}</section>
  </div>;
}
