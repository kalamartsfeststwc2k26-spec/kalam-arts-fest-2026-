import { friendlyQueryError } from '../lib/friendlyError';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import DataState from '../components/DataState';
import IdentityImage from '../components/IdentityImage';
import SectionHeading from '../components/SectionHeading';
import { searchStudents } from '../lib/publicSite';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ status: 'prompt', rows: [], error: null });
  useEffect(() => {
    const term = query.trim();
    if (!term) { setState({ status: 'prompt', rows: [], error: null }); return; }
    if (!navigator.onLine) { setState({ status: 'offline', rows: [], error: null }); return; }
    let active = true;
    setState({ status: 'loading', rows: [], error: null });
    const timer = window.setTimeout(async () => {
      try { const rows = await searchStudents(term); if (active) setState({ status: 'ready', rows, error: null }); }
      catch (error) { if (active) setState({ status: 'error', rows: [], error }); }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, version]);
  const retry = () => setVersion(n => n + 1);
  return <div className="mx-auto max-w-[1040px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-10"><SectionHeading eyebrow="Student directory / KALAM 2K26" title="Search" description="Find students by name. Search is case-insensitive and matches part of a name." />
    <label htmlFor="student-search" className="block text-sm font-semibold text-ink">Student name<div className="relative mt-2"><SearchIcon size={19} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" /><input id="student-search" type="search" autoComplete="off" value={query} onChange={e => setQuery(e.target.value)} placeholder="Start typing a student’s name" className="w-full rounded-xl border border-line bg-white py-4 pl-12 pr-4 text-base text-ink shadow-soft placeholder:text-muted focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy" /></div></label>
    <div className="mt-7" aria-live="polite">{state.status === 'prompt' ? <DataState status="empty" title="Search for a student" description="Type a name above to look up students in the public roster." /> : state.status === 'loading' ? <DataState status="loading" title="Searching students" /> : state.status === 'offline' ? <DataState status="offline" onRetry={retry} /> : state.status === 'error' ? <DataState status="error" description={friendlyQueryError(state.error)} onRetry={retry} /> : !state.rows.length ? <DataState status="empty" title="No matching students" description="Try a different or shorter name." /> : <><p className="mb-4 text-xs font-semibold text-muted">{state.rows.length === 50 ? 'Showing the first 50 matches. Refine your search for more.' : `${state.rows.length} ${state.rows.length === 1 ? 'student' : 'students'} found`}</p><div className="grid gap-4 sm:grid-cols-2">{state.rows.map(student => <article key={student.student_id} className="flex items-center gap-4 rounded-panel border border-line bg-white p-4 shadow-soft sm:p-5"><IdentityImage src={student.photo_url} name={student.student_name} kind="student" className="h-14 w-14" /><div className="min-w-0"><h2 className="break-words text-sm font-bold text-navy">{student.student_name}</h2>{student.roll_number && <p className="mt-1 text-xs text-muted">Roll no. {student.roll_number}</p>}<p className="mt-1 text-xs text-muted">{student.is_attc ? 'Mahdhiyya · ATTC category' : 'Mahdhiyya'}</p><Link to={`/teams/${encodeURIComponent(student.team_id)}`} className="mt-1 inline-block text-xs font-semibold text-burgundy hover:underline">Team: {student.team_name}</Link></div></article>)}</div></>}</div>
  </div>;
}
