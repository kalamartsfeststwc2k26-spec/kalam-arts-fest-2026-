import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
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
    <h4 className="text-sm font-bold text-navy">Registered programmes</h4>

    {state.status === 'loading' && (
      <p className="mt-2 text-xs text-muted">Loading programmes…</p>
    )}

    {state.status === 'error' && (
      <div role="alert" className="mt-2 text-xs text-burgundy">
        Could not load programmes.{' '}
        <button
          type="button"
          onClick={() => setVersion(v => v + 1)}
          className="font-bold underline focus-visible:outline focus-visible:outline-2"
        >
          Try again
        </button>
      </div>
    )}

    {state.status === 'ready' && !state.rows.length && (
      <p className="mt-2 text-xs text-muted">
        No published programme registrations.
      </p>
    )}

    {state.status === 'ready' && state.rows.length > 0 && (
      <ul className="mt-2 divide-y divide-line">
        {state.rows.map(row => (
          <li key={row.event_id} className="py-3">
            <Link
              to={`/events/${encodeURIComponent(row.event_id)}`}
              className="break-words text-sm font-semibold text-burgundy hover:underline focus-visible:outline focus-visible:outline-2"
            >
              {row.event_name}
            </Link>

            <p className="mt-1 text-xs text-muted">
              {row.competition_type}
              {row.item_category ? ` · ${row.item_category}` : ''}
            </p>

            <p className="mt-1 text-xs text-muted">
              {eventSchedule(row)} · {row.venue?.trim() || 'Venue TBA'}
            </p>
          </li>
        ))}
      </ul>
    )}
  </div>;
}

export default function StudentCard({ student }) {
  const [open, setOpen] = useState(false);
  const panelId = `student-programmes-${student.student_id}`;

  return <article className="rounded-panel border border-line bg-white shadow-soft">
    <button
      type="button"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={() => setOpen(v => !v)}
      className="flex w-full items-center gap-4 rounded-panel p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy sm:p-5"
    >
      <IdentityImage
        src={student.photo_url}
        name={student.student_name}
        kind="student"
        className="h-14 w-14 shrink-0"
      />

      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-bold text-navy">
          {student.student_name}
        </span>

        {student.roll_number && (
          <span className="mt-1 block text-xs text-muted">
            Roll no. {student.roll_number}
          </span>
        )}

        <span className="mt-1 block text-xs text-muted">
          {student.division}
          {student.is_attc ? ' · ATTC category' : ''}
        </span>

        <span className="mt-2 block text-xs font-semibold text-burgundy">
          {open ? 'Hide programmes' : 'View programmes'}
        </span>
      </span>

      <ChevronDown
        size={18}
        aria-hidden="true"
        className={`shrink-0 text-burgundy ${open ? 'rotate-180' : ''}`}
      />
    </button>

    <div
      id={panelId}
      hidden={!open}
      className="border-t border-line px-4 pb-4 pt-4 sm:px-5 sm:pb-5"
    >
      {open && <StudentProgrammes studentId={student.student_id} />}
    </div>
  </article>;
}
