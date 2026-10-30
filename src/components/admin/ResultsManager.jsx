import { mutationError } from '../../lib/adminMutation';
import { useEffect, useMemo, useState } from 'react';
import LoadingInline from '../LoadingInline';
import { supabase } from '../../lib/supabaseClient';
import { readAllAdminRows } from '../../lib/adminRows';
import { eventScoringKey } from '../../lib/scoringKey';
import { formatAdminTimestamp, loadLastEdits } from '../../lib/adminMetadata';

const blank = { event_id: '', student_id: '', team_id: '', placement: '', grade: '', status: 'draft', published_at: '', points_source: 'calculated', points: '', points_explanation: '' };
const inputClass = 'mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy';
function localDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export default function ResultsManager({ lookups, onChange }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [readError, setReadError] = useState('');
  const [notice, setNotice] = useState('');
  const [lastEdits, setLastEdits] = useState(new Map());
  const [preview, setPreview] = useState({ status: 'idle', data: null, message: '' });
  async function load() {
    setLoading(true);
    const { data, error: queryError } = await readAllAdminRows('results', '*', query => query.order('created_at', { ascending: false }).order('id'));
    if (queryError) setReadError('Could not load result records. Please retry.');
    else { setRows(data); setReadError(''); setLastEdits(await loadLastEdits('results')); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  const event = useMemo(() => (lookups.events || []).find(item => item.id === form.event_id), [lookups.events, form.event_id]);
  const key = eventScoringKey(event);
  useEffect(() => {
    if (form.points_source !== 'calculated') { setPreview({ status: 'idle', data: null, message: '' }); return; }
    if (!form.event_id) { setPreview({ status: 'idle', data: null, message: 'Choose an event to preview the calculation.' }); return; }
    if (!event) { setPreview({ status: 'idle', data: null, message: 'Event details are loading. Try Refresh if this persists.' }); return; }
    if (!key) { setPreview({ status: 'unavailable', data: null, message: event.competition_type === 'ATTC' ? 'ATTC event needs an On-stage or Non-stage stage format. Use approved manual entry until it is set.' : "Set this event's category first. General programmes need point category A or B; use approved manual fallback until it is set." }); return; }
    if (!form.placement) { setPreview({ status: 'idle', data: null, message: 'Choose a placement to preview the calculation.' }); return; }
    if (form.grade && !form.student_id) { setPreview({ status: 'unavailable', data: null, message: 'Grade points apply to individual students only. Choose a student or use approved manual entry.' }); return; }
    let active = true;
    setPreview({ status: 'loading', data: null, message: 'Calculating on the server…' });
    supabase.rpc('calculate_result_points', { p_category: key, p_position: Number(form.placement), p_grade: form.grade || null }).then(({ data, error: calcError }) => {
      if (!active) return;
      setPreview(calcError ? { status: 'unavailable', data: null, message: calcError.message || 'The scoring service is unavailable. Use approved manual entry.' } : { status: 'ready', data, message: '' });
    });
    return () => { active = false; };
  }, [form.points_source, form.event_id, form.placement, form.grade, form.student_id, event, key]);
  function set(keyName, value) { setForm(current => ({ ...current, [keyName]: value })); setError(''); }
  function reset() { setForm(blank); setEditing(null); }
  function edit(row) {
    setEditing(row.id); setError(''); setNotice('');
    setForm({ event_id: row.event_id, student_id: row.student_id || '', team_id: row.student_id ? '' : row.team_id || '', placement: row.placement == null ? '' : String(row.placement), grade: row.grade || '', status: row.status, published_at: localDate(row.published_at), points_source: row.points_source || 'manual', points: String(row.points ?? ''), points_explanation: row.points_source === 'manual' ? row.points_explanation || '' : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function save(e) {
    e.preventDefault(); setError(''); setNotice('');
    if (!form.event_id || (!form.student_id && !form.team_id)) { setError('Choose an event and a student or team.'); return; }
    if (!['1','2','3'].includes(form.placement)) { setError('Choose 1st, 2nd or 3rd place.'); return; }
    if (form.student_id && !form.grade) { setError('Choose a grade for an individual student result.'); return; }
    if (form.status === 'published' && !event?.is_published) { setError('Publish the event before publishing its result.'); return; }
    const calculated = form.points_source === 'calculated';
    if (calculated && preview.status !== 'ready') { setError('Calculation is not available. Resolve the event scoring category or choose manual entry with an approval reason.'); return; }
    if (!calculated && (!Number.isFinite(Number(form.points)) || Number(form.points) < 0 || form.points === '' || form.points_explanation.trim().length < 10)) { setError('Manual points must be non-negative and include an approval reason of at least 10 characters.'); return; }
    const payload = { event_id: form.event_id, student_id: form.student_id || null, team_id: form.student_id ? null : form.team_id || null, placement: Number(form.placement), grade: form.grade || null, status: form.status, published_at: form.status === 'published' ? (form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString()) : (form.published_at ? new Date(form.published_at).toISOString() : null), points_source: form.points_source, points: calculated ? Number(preview.data.total) : Number(form.points), points_explanation: calculated ? 'Pending trusted server calculation' : form.points_explanation.trim() };
    setBusy(true);
    const query = editing ? supabase.from('results').update(payload).eq('id', editing) : supabase.from('results').insert(payload);
    const { data, error: saveError } = await query.select('id,points,points_source,points_explanation').single();
    setBusy(false);
    if (saveError) { setError(saveError.message || 'Could not save this result.'); return; }
    setNotice(`${editing ? 'Result updated' : 'Result created'} and audited. ${data.points_source === 'calculated' ? `Server-calculated ${data.points} points.` : `Manually approved ${data.points} points; reason recorded.`}`);
    reset(); await load(); onChange?.();
  }
  async function remove(row) {
    if (!window.confirm(`Permanently delete result ${row.id}? This change is audited.`)) return;
    const deleted = await supabase.from('results').delete().eq('id', row.id).select('id');
    const deleteError = mutationError(deleted, 'delete');
    if (deleteError) { setError(deleteError); return; }
    setNotice('Result deleted and audited.'); if (editing === row.id) reset(); await load();
  }
  return <section className="space-y-6"><div><h2 className="text-xl font-bold text-navy">Results</h2><p className="mt-1 text-sm text-muted">Placement points and individual grade points are added when both apply. The server verifies every calculated total before saving.</p></div>
    {notice && <p role="status" className="rounded-xl bg-page p-4 text-sm font-semibold text-emerald">{notice}</p>}{error && <p role="alert" className="rounded-xl bg-page p-4 text-sm font-semibold text-burgundy">{error}</p>}
    <form onSubmit={save} className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><h3 className="text-base font-bold text-navy">{editing ? 'Edit result' : 'Add result'}</h3><div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold text-ink">Event *<select required className={inputClass} value={form.event_id} onChange={e => set('event_id', e.target.value)}><option value="">Choose event</option>{(lookups.events || []).map(item => <option key={item.id} value={item.id}>{item.name} · {item.competition_type}</option>)}</select></label>
      <label className="text-sm font-semibold text-ink">Student (individual result)<select className={inputClass} value={form.student_id} onChange={e => { set('student_id', e.target.value); if (e.target.value) setForm(current => ({ ...current, student_id: e.target.value, team_id: '' })); }}><option value="">None — team result</option>{(lookups.students || []).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      {!form.student_id && <label className="text-sm font-semibold text-ink">Team (for team results) *<select required={!form.student_id} className={inputClass} value={form.team_id} onChange={e => set('team_id', e.target.value)}><option value="">Choose team</option>{(lookups.teams || []).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
      <label className="text-sm font-semibold text-ink">Placement *<select required className={inputClass} value={form.placement} onChange={e => set('placement', e.target.value)}><option value="">Choose placement</option><option value="1">1st</option><option value="2">2nd</option><option value="3">3rd</option></select></label>
      <label className="text-sm font-semibold text-ink">Result grade {form.student_id ? '*' : '(individuals)'}<select required={Boolean(form.student_id)} className={inputClass} value={form.grade} onChange={e => set('grade', e.target.value)}><option value="">No grade</option>{['A+','A','B','C'].map(grade => <option key={grade}>{grade}</option>)}</select></label>
      <label className="text-sm font-semibold text-ink">Publication status<select className={inputClass} value={form.status} onChange={e => set('status', e.target.value)}>{['draft','published','retracted'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="text-sm font-semibold text-ink">Publication date (optional)<input className={inputClass} type="datetime-local" value={form.published_at} onChange={e => set('published_at', e.target.value)} /></label>
    </div><fieldset className="mt-6 rounded-xl border border-line p-4"><legend className="px-2 text-sm font-bold text-navy">Point entry method</legend><div className="flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><input type="radio" name="points-source" checked={form.points_source === 'calculated'} onChange={() => set('points_source','calculated')} />Server-calculated</label><label className="flex items-center gap-2"><input type="radio" name="points-source" checked={form.points_source === 'manual'} onChange={() => set('points_source','manual')} />Approved manual fallback</label></div></fieldset>
    {form.points_source === 'calculated' ? <div className="mt-5 rounded-xl border border-line bg-page p-5 text-sm text-navy" aria-live="polite"><h4 className="font-bold">Server calculation preview</h4>{preview.status === 'ready' ? <div className="mt-3 space-y-1"><p>Event point category: {event?.competition_type === 'General' ? event.scoring_category : 'Not applicable'} · Scoring key: {preview.data.category} · Place {preview.data.position}</p><p>Placement points: {preview.data.category_points}</p><p>Individual grade {preview.data.grade || 'none'}: {preview.data.grade_points} points</p><p className="pt-2 text-lg font-extrabold">Computed total: {preview.data.total} points</p><p className="text-xs text-muted">Read-only preview. The database recalculates the total when saved.</p></div> : <p className="mt-2 text-burgundy">{preview.message || 'Waiting for event details…'}{preview.status === 'unavailable' && ' Switch to approved manual fallback if the category cannot be configured.'}</p>}</div> : <div className="mt-5 grid gap-4 rounded-xl border border-line bg-page p-5 sm:grid-cols-2"><label className="text-sm font-semibold text-ink">Approved manual points *<input type="number" min="0" step="0.01" required className={inputClass} value={form.points} onChange={e => set('points',e.target.value)} /></label><label className="text-sm font-semibold text-ink sm:col-span-2">Reason or approval reference (10+ characters) *<textarea rows={3} required minLength={10} className={inputClass} value={form.points_explanation} onChange={e => set('points_explanation', e.target.value)} /></label><p className="text-xs text-muted sm:col-span-2">Manual points are not presented as calculated. The reason and every change are saved in the server audit log.</p></div>}
    <div className="mt-6 flex flex-wrap gap-3"><button disabled={busy || (form.points_source === 'calculated' && preview.status !== 'ready')} className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : editing ? 'Save result' : 'Create result'}</button>{editing && <button type="button" onClick={reset} className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-navy">Cancel edit</button>}</div></form>
    <div className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-base font-bold text-navy">Result records</h3><button type="button" onClick={load} className="text-xs font-bold text-burgundy hover:underline">Refresh</button></div>{loading ? <LoadingInline label="Loading results…" /> : readError ? <p role="alert" className="text-sm text-burgundy">Could not load results. Try Refresh.</p> : !rows.length ? <p className="text-sm text-muted">No results entered yet. Add a result above; Edit and Delete appear beside saved results.</p> : <ul className="divide-y divide-line">{rows.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="break-words text-sm font-bold text-navy">{(lookups.events || []).find(item => item.id === row.event_id)?.name || 'Event'} · Place {row.placement ?? '—'}{row.grade ? ` · Grade ${row.grade}` : ''}</p><p className="mt-1 text-xs text-muted">{row.points} points · {row.points_source === 'calculated' ? 'Calculated by server' : 'Approved manually'} · {row.status}</p><p className="mt-1 text-xs text-muted">Created: {formatAdminTimestamp(row.created_at)}{lastEdits.has(row.id) ? ` · Last edited (audit): ${formatAdminTimestamp(lastEdits.get(row.id))}` : ''}</p></div><div className="flex gap-3"><button type="button" onClick={() => edit(row)} className="text-xs font-bold text-burgundy hover:underline">Edit</button><button type="button" onClick={() => remove(row)} className="text-xs font-bold text-burgundy-dark hover:underline">Delete</button></div></li>)}</ul>}</div>
  </section>;
}
