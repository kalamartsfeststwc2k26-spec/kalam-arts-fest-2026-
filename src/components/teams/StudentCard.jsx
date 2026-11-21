import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';
import IdentityImage from '../IdentityImage';
import { eventSchedule } from '../../lib/eventUtils';
import { fetchStudentProgrammes } from '../../lib/studentProgrammes';

function StudentProgrammes({ studentId }) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ status: 'loading', rows: [] });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading', rows: [] });
    fetchStudentProgrammes(studentId).then(rows => {
      if (active) setState({ status: 'ready', rows });
    }).catch(() => {
      if (active) setState({ status: 'error', rows: [] });
    });
    return () => { active = false; };
  }, [studentId, version]);

  return <div aria-live="polite" aria-busy={state.status === 'loading'}>
    <h3 className="text-sm font-bold text-navy">Registered programmes</h3>
    {state.status === 'loading' && <p className="mt-3 text-sm text-muted">Loading programmes…</p>}
    {state.status === 'error' && <div role="alert" className="mt-3 text-sm text-burgundy">Could not load programmes. <button type="button" onClick={() => setVersion(v => v + 1)} className="font-bold underline focus-visible:outline focus-visible:outline-2">Try again</button></div>}
    {state.status === 'ready' && !state.rows.length && <p className="mt-3 text-sm text-muted">No published programme registrations.</p>}
    {state.status === 'ready' && state.rows.length > 0 && <ul className="mt-3 divide-y divide-line">
      {state.rows.map(row => <li key={row.event_id} className="py-3">
        <Link to={`/events/${encodeURIComponent(row.event_id)}`} className="break-words text-sm font-semibold text-burgundy hover:underline focus-visible:outline focus-visible:outline-2">{row.event_name}</Link>
        <p className="mt-1 text-xs text-muted">{row.competition_type}{row.item_category ? ` · ${row.item_category}` : ''}</p>
        <p className="mt-1 text-xs text-muted">{eventSchedule(row)} · {row.venue?.trim() || 'Venue TBA'}</p>
      </li>)}
    </ul>}
  </div>;
}

function StudentDialog({ student, dialogId, onDismiss, triggerRef }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const titleId = `${dialogId}-title`;

  useEffect(() => {
    const dialog = dialogRef.current;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    closeRef.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = originalOverflow;
      triggerRef.current?.focus();
    };
  }, [triggerRef]);

  return <dialog
    ref={dialogRef}
    id={dialogId}
    aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onDismiss(); }}
    onClick={event => { if (event.target === event.currentTarget) onDismiss(); }}
    className="fixed inset-0 m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-panel border border-line bg-white/95 p-0 text-ink shadow-raised backdrop:bg-navy/40 backdrop:backdrop-blur-sm"
  >
    <div className="p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <IdentityImage src={student.photo_url} name={student.student_name} kind="student" className="h-16 w-16 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-burgundy">Student details</p>
            <h2 id={titleId} className="mt-1 break-words text-lg font-extrabold text-navy sm:text-xl">{student.student_name}</h2>
            {student.roll_number && <p className="mt-1 text-xs text-muted">Roll no. {student.roll_number}</p>}
            <p className="mt-1 text-xs text-muted">{student.division}{student.is_attc ? ' · ATTC category' : ''}</p>
          </div>
        </div>
        <button ref={closeRef} type="button" onClick={onDismiss} aria-label="Close student details" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-navy hover:bg-page focus-visible:outline focus-visible:outline-2 focus-visible:outline-burgundy"><X size={18} aria-hidden="true" /></button>
      </div>
      <div className="mt-5 border-t border-line pt-5"><StudentProgrammes studentId={student.student_id} /></div>
    </div>
  </dialog>;
}

export default function StudentCard({ student }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const dialogId = `student-programmes-${student.student_id}`;
  return <article className="rounded-panel border border-line bg-white shadow-soft">
    <button ref={triggerRef} type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? dialogId : undefined} onClick={() => setOpen(true)} className="flex w-full items-center gap-4 rounded-panel p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy sm:p-5">
      <IdentityImage src={student.photo_url} name={student.student_name} kind="student" className="h-14 w-14 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-bold text-navy">{student.student_name}</span>
        {student.roll_number && <span className="mt-1 block text-xs text-muted">Roll no. {student.roll_number}</span>}
        <span className="mt-1 block text-xs text-muted">{student.division}{student.is_attc ? ' · ATTC category' : ''}</span>
        <span className="mt-2 block text-xs font-semibold text-burgundy">View programmes</span>
      </span>
      <ArrowUpRight size={18} aria-hidden="true" className="shrink-0 text-burgundy" />
    </button>
    {open && <StudentDialog student={student} dialogId={dialogId} onDismiss={() => setOpen(false)} triggerRef={triggerRef} />}
  </article>;
}
