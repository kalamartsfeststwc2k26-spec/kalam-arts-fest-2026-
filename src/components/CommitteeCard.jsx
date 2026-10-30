import { Mail, Phone } from 'lucide-react';
import IdentityImage from './IdentityImage';

export default function CommitteeCard({ member, headingLevel = 2 }) {
  const phone = member.contact_phone?.trim();
  const phoneHref = phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : null;
  const email = member.contact_email?.trim();
  return <article className="flex flex-col rounded-panel border border-line bg-white p-5 shadow-soft sm:p-6"><IdentityImage src={member.photo_url} name={member.name} kind="member" className="h-16 w-16" /><p className="mt-5 text-xs font-bold tracking-[.12em] text-burgundy">{member.role_title}</p>{headingLevel === 3 ? <h3 className="mt-1 text-lg font-bold text-navy">{member.name}</h3> : <h2 className="mt-1 text-lg font-bold text-navy">{member.name}</h2>}{(phoneHref || email) && <div className="mt-5 space-y-2 border-t border-line pt-4 text-xs font-medium text-muted">{phoneHref && <a href={phoneHref} aria-label={`Call ${member.name} at ${phone}`} className="flex items-center gap-2 break-all hover:text-burgundy"><Phone size={14} aria-hidden="true" />{phone}</a>}{email && <a href={`mailto:${email}`} aria-label={`Email ${member.name} at ${email}`} className="flex items-center gap-2 break-all hover:text-burgundy"><Mail size={14} aria-hidden="true" />{email}</a>}</div>}</article>;
}
