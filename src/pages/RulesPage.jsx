import DataState from '../components/DataState';
import SectionHeading from '../components/SectionHeading';
import { friendlyQueryError } from '../lib/friendlyError';
import { fetchPublishedRules, ruleLines } from '../lib/rulesContent';
import { usePublicData } from '../lib/usePublicData';

export default function RulesPage() {
  const { status, data, error, refresh } = usePublicData(fetchPublishedRules, 'rules-content');
  return <div className="mx-auto max-w-[1080px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:px-10">
    <SectionHeading eyebrow="Participation / Mahdhiyya" title="Rules & regulations" description="Official festival regulations, published by the organisers. Expand a section to read its complete text." />
    {status === 'loading' ? <DataState status="loading" title="Loading regulations" /> : status === 'offline' ? <DataState status="offline" onRetry={refresh} /> : status === 'error' ? <DataState status="error" description={friendlyQueryError(error, 'published regulations')} onRetry={refresh} /> : !data.length ? <DataState status="empty" title="No regulations published yet" description="The official rules will appear here when the organisers publish them." /> : <div className="space-y-4" lang="ml">{data.map((section, index) => <details key={section.id} open={index === 0} className="group min-w-0 rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><summary className="cursor-pointer rounded-lg text-lg font-bold text-navy marker:text-burgundy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy sm:text-xl"><h2 className="inline text-inherit">{section.title}</h2><span className="ml-2 text-xs font-semibold text-muted">({ruleLines(section.body).length})</span></summary><ul className="mt-6 list-disc space-y-4 border-t border-line pl-5 pt-5 text-sm leading-7 text-ink marker:text-burgundy sm:text-base">{ruleLines(section.body).map((line, lineIndex) => <li key={`${section.id}-${lineIndex}`}>{line}</li>)}</ul></details>)}</div>}
  </div>;
}
