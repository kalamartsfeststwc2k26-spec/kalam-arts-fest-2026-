import { mutationError } from '../../lib/adminMutation';
import LoadingInline from '../LoadingInline';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { readAllAdminRows } from '../../lib/adminRows';

export default function RegistrationsManager({ profile, teams = [] }) {
  const superAdmin = profile.role === 'super_admin';
  const [data, setData] = useState({ students: [], events: [], registrations: [] });
  const [form, setForm] = useState({ student_id: '', event_id: '' });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [readError, setReadError] = useState('');
  const [notice, setNotice] = useState('');
  async function load() {
    setLoading(true);
    const [studentResult, eventResult, registrationResult] = await Promise.all([
      readAllAdminRows('students', 'id,name,team_id,is_attc', query => (superAdmin ? query : query.eq('team_id', profile.team_id)).order('name').order('id')),
      readAllAdminRows('events', 'id,name,competition_type,stage_type', query => query.eq('is_published', true).order('name').order('id')),
      readAllAdminRows('registrations', 'id,event_id,student_id,created_at', query => query.order('created_at', { ascending: false }).order('id')),
    ]);
    const problem = studentResult.error || eventResult.error || registrationResult.error;
    if (problem) { setData({ students: [], events: [], registrations: [] }); setReadError('Could not load registrations and dropdown choices. Please retry.'); } else { setData({ students: studentResult.data, events: eventResult.data, registrations: registrationResult.data }); setReadError(''); }
    setLoading(false);
  }
  useEffect(() => { reset(); load(); }, [profile.role, profile.team_id]);
  function reset() { setEditing(null); setForm({ student_id: '', event_id: '' }); }
  async function save(event) {
    event.preventDefault(); setError(''); setNotice('');
    if (!form.student_id || !form.event_id) { setError('Choose a student and a programme.'); return; }
    if (data.registrations.some(row => row.student_id === form.student_id && row.event_id === form.event_id && row.id !== editing)) { setError('This student is already registered for that programme.'); return; }
    setBusy(true);
    const payload = { student_id: form.student_id, event_id: form.event_id }; // No client team ID. RLS and trigger verify ownership and ATTC.
    const result = editing ? await supabase.from('registrations').update(payload).eq('id', editing).select('id') : await supabase.from('registrations').insert(payload).select('id');
    setBusy(false);
    const saveError = mutationError(result, editing ? 'update' : 'create');
    if (saveError) { setError(result.error?.code === '23505' ? 'This student is already registered for that programme.' : saveError); return; }
    setNotice(editing ? 'Registration updated and audited.' : 'Student registered and change audited.'); reset(); await load();
  }
  async function remove(row) {
    const student = data.students.find(item => item.id === row.student_id)?.name || 'this student';
    const programme = data.events.find(item => item.id === row.event_id)?.name || 'this programme';
    if (!window.confirm(`Delete ${student}’s registration for ${programme}? This is permanent and audited.`)) return;
    setError(''); setNotice('');
    const deleted = await supabase.from('registrations').delete().eq('id', row.id).select('id');
    const deleteError = mutationError(deleted, 'delete');
    if (deleteError) { setError(deleteError); return; }
    setNotice('Registration deleted and change audited.'); if (editing === row.id) reset(); await load();
  }
  const chosenEvent = data.events.find(item => item.id === form.event_id);
  const inputClass = 'mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy';
  return <section className="space-y-6"><div><h2 className="text-xl font-bold text-navy">Program registrations</h2><p className="mt-1 text-sm text-muted">{superAdmin ? 'Manage registrations across all teams.' : `Register students belonging to ${teams.find(team => team.id === profile.team_id)?.name || 'your assigned team'} only.`}</p></div>{notice && <p role="status" className="rounded-xl bg-page p-4 text-sm font-semibold text-emerald">{notice}</p>}{error && <p role="alert" className="rounded-xl bg-page p-4 text-sm font-semibold text-burgundy">{error}</p>}
    <form onSubmit={save} className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><h3 className="font-bold text-navy">{editing ? 'Edit registration' : 'Register one student'}</h3><p className="mt-3 rounded-xl bg-page p-3 text-sm text-navy">Maximum per student: 3 On-stage, 3 Non-stage and 4 General programmes (A and B combined). ATTC-category programmes count toward their On-stage or Non-stage format.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-ink">Student *<select required value={form.student_id} onChange={e => setForm(v => ({ ...v, student_id: e.target.value }))} className={inputClass}><option value="">Choose a student</option>{data.students.map(student => <option key={student.id} value={student.id}>{student.name}{superAdmin ? ` · ${teams.find(t => t.id === student.team_id)?.name || 'Team'}` : ''}{student.is_attc ? ' · ATTC' : ''}</option>)}</select></label><label className="text-sm font-semibold text-ink">Published programme *<select required value={form.event_id} onChange={e => setForm(v => ({ ...v, event_id: e.target.value }))} className={inputClass}><option value="">Choose a programme</option>{data.events.map(item => <option key={item.id} value={item.id}>{item.name} · {item.competition_type}{item.competition_type === 'ATTC' ? ` (${item.stage_type || 'stage format not set'})` : ''}</option>)}</select></label></div>{!loading && !readError && (!data.students.length || !data.events.length) && <p role="status" className="mt-4 rounded-xl bg-page p-3 text-sm text-muted">{!data.students.length ? 'Add a student in the Students tab before registering.' : 'Publish a programme in the Events tab before registering.'}</p>}{chosenEvent?.competition_type === 'ATTC' && <p className="mt-4 rounded-xl bg-page p-3 text-sm font-semibold text-navy">ATTC-category programme: only a student whose ATTC membership was verified by a Super Admin can register. {!chosenEvent.stage_type && 'Set its On-stage or Non-stage format in Events before registering students.'}</p>}<div className="mt-6 flex gap-3"><button disabled={busy || loading || Boolean(readError) || !data.students.length || !data.events.length} className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : editing ? 'Save registration' : 'Register student'}</button>{editing && <button type="button" onClick={reset} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold">Cancel</button>}</div></form>
    <div className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><div className="mb-4 flex justify-between"><h3 className="font-bold text-navy">Existing registrations</h3><button onClick={load} className="text-xs font-bold text-burgundy hover:underline">Refresh</button></div>{loading ? <LoadingInline label="Loading records…" /> : readError ? <p role="alert" className="text-sm text-burgundy">Could not load records. Try Refresh.</p> : !data.registrations.length ? <p className="text-sm text-muted">No registrations yet. Register a student above; Edit and Delete appear for registrations you may manage.</p> : <ul className="divide-y divide-line">{data.registrations.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-bold text-navy">{data.students.find(item => item.id === row.student_id)?.name || 'Student'}</p><p className="text-xs text-muted">{data.events.find(item => item.id === row.event_id)?.name || 'Programme'} · {new Date(row.created_at).toLocaleDateString('en-IN')}</p></div><div className="flex gap-3"><button onClick={() => { setEditing(row.id); setForm({ student_id: row.student_id, event_id: row.event_id }); }} className="text-xs font-bold text-burgundy hover:underline">Edit</button><button onClick={() => remove(row)} className="text-xs font-bold text-burgundy-dark hover:underline">Delete</button></div></li>)}</ul>}</div>
  </section>;
}
