import { Clock3, Mail, MapPin, Phone } from 'lucide-react';
import DataState from '../components/DataState';
import SectionHeading from '../components/SectionHeading';
import { friendlyQueryError } from '../lib/friendlyError';
import { fetchSiteContent } from '../lib/publicSite';
import { usePublicData } from '../lib/usePublicData';

export default function ContactPage() {
  const { status, data, error, refresh } = usePublicData(() => fetchSiteContent('contact'), 'contact-content');
  const phoneHref = data?.phone ? `tel:${data.phone.replace(/[^+\d]/g, '')}` : null;
  return <div className="mx-auto max-w-[1040px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-10"><SectionHeading eyebrow="Get in touch / KALAM 2K26" title="Contact" description="Published contact details for stage support and score-audit enquiries." />
    {status === 'loading' ? <DataState status="loading" title="Loading contact details" /> : status === 'offline' ? <DataState status="offline" onRetry={refresh} /> : status === 'error' ? <DataState status="error" description={friendlyQueryError(error, 'contact details')} onRetry={refresh} /> : !Object.keys(data).length ? <DataState status="empty" title="Contact details not published" description="Please check back when the festival team publishes contact information." /> : <div className="grid gap-5 md:grid-cols-2">
      <section className="rounded-panel border border-line bg-white p-6 shadow-soft sm:p-8"><MapPin size={24} className="text-burgundy" aria-hidden="true" /><h2 className="mt-5 text-lg font-bold text-navy">Visit the college</h2><p className="mt-3 text-sm leading-relaxed text-ink">{data.college || 'College name not published'}{data.address && <><br />{data.address}</>}</p></section>
      <section className="rounded-panel border border-line bg-white p-6 shadow-soft sm:p-8"><Phone size={24} className="text-burgundy" aria-hidden="true" /><h2 className="mt-5 text-lg font-bold text-navy">{data.desk || 'Stage support'}</h2>{phoneHref ? <a href={phoneHref} className="mt-3 inline-block text-base font-bold text-burgundy hover:underline" aria-label={`Call ${data.desk || 'the festival desk'} at ${data.phone}`}>{data.phone}</a> : <p className="mt-3 text-sm text-muted">Phone number not published.</p>}{data.hours && <p className="mt-3 flex items-center gap-2 text-sm text-muted"><Clock3 size={15} aria-hidden="true" />{data.hours}</p>}</section>
      <section className="rounded-panel border border-line bg-white p-6 shadow-soft sm:p-8 md:col-span-2"><Mail size={24} className="text-burgundy" aria-hidden="true" /><h2 className="mt-5 text-lg font-bold text-navy">Score audits</h2><p className="mt-2 text-sm text-muted">For questions about published scores, email:</p>{data.audit_email ? <a href={`mailto:${data.audit_email}?subject=KALAM%202K26%20Score%20Audit`} className="mt-2 inline-block break-all text-sm font-bold text-burgundy hover:underline">{data.audit_email}</a> : <p className="mt-2 text-sm text-muted">Audit email not published.</p>}</section>
    </div>}
  </div>;
}
