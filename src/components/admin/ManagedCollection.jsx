import { mutationError } from '../../lib/adminMutation';
import LoadingInline from '../LoadingInline';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { readAllAdminRows } from '../../lib/adminRows';
import { eventSchedule, eventStatus } from '../../lib/eventUtils';
import { formatAdminTimestamp, loadLastEdits } from '../../lib/adminMetadata';

const inputClass = 'mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy';
function localDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function initial(fields, row) {
  return Object.fromEntries(fields.map(field => [field.key, field.type === 'boolean' ? Boolean(row?.[field.key]) : field.type === 'datetime' ? localDate(row?.[field.key]) : String(row?.[field.key] ?? field.default ?? '')]));
}
export default function ManagedCollection({ config, lookups = {}, onChange }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(() => initial(config.fields));
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lastEdits, setLastEdits] = useState(new Map());
  async function load() {
    setStatus('loading'); setError('');
    const { data, error: fetchError } = await readAllAdminRows(config.table, '*', query => query.order('created_at', { ascending: false }).order('id'));
    if (fetchError) { setError(fetchError.message); setStatus('error'); return; }
    setRows(data);
    if (config.table === 'events') setLastEdits(await loadLastEdits('events'));
    setStatus('ready');
  }
  useEffect(() => { setEditing(null); setForm(initial(config.fields)); load(); }, [config.table]);
  function edit(row) { setEditing(row.id); setForm(initial(config.fields, row)); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function reset() { setEditing(null); setForm(initial(config.fields)); }
  async function save(event) {
    event.preventDefault(); setError(''); setNotice('');
    const payload = {};
    for (const field of config.fields) {
      const value = form[field.key];
      if (field.required && value !== true && !String(value ?? '').trim()) { setError(`${field.label} is required.`); return; }
      payload[field.key] = field.type === 'boolean' ? Boolean(value) : field.type === 'number' ? (value === '' ? null : Number(value)) : field.type === 'datetime' ? (value ? new Date(value).toISOString() : null) : value === '' ? null : String(value).trim();
    }
    if (config.table === 'events') {
      if (payload.competition_type !== 'General') payload.scoring_category = null;
      if (payload.competition_type !== 'ATTC') payload.stage_type = null;
      if (!Number.isInteger(payload.min_participants) || payload.min_participants < 1) { setError('Minimum participants must be a positive whole number.'); return; }
      if (payload.max_participants !== null && (!Number.isInteger(payload.max_participants) || payload.max_participants < payload.min_participants)) { setError('Maximum participants must be a whole number at least as large as the minimum.'); return; }
      if (payload.duration_minutes !== null && (!Number.isInteger(payload.duration_minutes) || payload.duration_minutes < 1)) { setError('Duration must be a positive whole number.'); return; }
      if (payload.start_time && payload.end_time && Date.parse(payload.end_time) <= Date.parse(payload.start_time)) { setError('End time must be after start time. Leave either date empty if the schedule is not confirmed.'); return; }
    }
    if (config.table === 'site_content' && !((payload.page === 'about' && payload.content_key === 'intro') || (payload.page === 'contact' && ['college','address','desk','phone','hours','audit_email'].includes(payload.content_key)))) { setError('Choose a content field belonging to the selected page.'); return; }
    if (config.table === 'special_titles' && Boolean(payload.recipient_student_id) === Boolean(payload.recipient_team_id)) { setError('Choose exactly one recipient: a student or a team.'); return; }
    if (config.table === 'special_titles' && payload.is_published && !payload.published_at) payload.published_at = new Date().toISOString();
    setStatus('saving');
    const query = editing ? supabase.from(config.table).update(payload).eq('id', editing) : supabase.from(config.table).insert(payload);
    const saved = await query.select('id');
    const saveError = mutationError(saved, editing ? 'update' : 'create');
    if (saveError) { setError(saveError); setStatus('ready'); return; }
    setNotice(editing ? 'Changes saved and recorded in the audit log.' : 'Record created and recorded in the audit log.'); reset(); await load(); onChange?.();
  }
  async function remove(row) {
    if (!window.confirm(`Delete ${config.label.toLowerCase()} “${row[config.titleKey] || row.id}”? This cannot be undone.`)) return;
    setError(''); setNotice('');
    const deleted = await supabase.from(config.table).delete().eq('id', row.id).select('id');
    const deleteError = mutationError(deleted, 'delete');
    if (deleteError) { setError(deleteError); return; }
    setNotice('Record deleted and recorded in the audit log.'); if (editing === row.id) reset(); await load(); onChange?.();
  }
  return <section className="space-y-6"><div><h2 className="text-xl font-bold text-navy">{config.label}</h2><p className="mt-1 text-sm text-muted">Super Admin access · all groups</p></div>
    {notice && <p role="status" className="rounded-xl bg-page px-4 py-3 text-sm font-semibold text-emerald">{notice}</p>}{error && <p role="alert" className="rounded-xl bg-page px-4 py-3 text-sm font-semibold text-burgundy">{error}</p>}
    {['category_points','grade_points'].includes(config.table) && <div role="note" className="rounded-xl border border-line bg-page p-5 text-sm leading-relaxed text-navy"><strong>Scoring policy:</strong> Changes are audited and affect future calculations only. Already-published results keep their saved point totals. Update the published rules whenever this matrix changes.</div>}
    {config.table === 'events' && <div role="note" className="rounded-xl border border-line bg-page p-5 text-sm leading-relaxed text-navy"><strong>Eligibility classification:</strong> Teaching, still Model, working model and chart making must be marked ATTC in Competition category. Use Stage format separately if an ATTC programme is On-stage or Non-stage. The database checks ATTC membership on registration; it does not infer a category from a programme name.</div>}
    <form onSubmit={save} className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><h3 className="text-base font-bold text-navy">{editing ? `Edit ${config.label.toLowerCase()}` : `Add ${config.label.toLowerCase()}`}</h3><div className="mt-5 grid gap-4 sm:grid-cols-2">{config.fields.filter(field => config.table !== 'events' || (field.key !== 'scoring_category' || form.competition_type === 'General') && (field.key !== 'stage_type' || form.competition_type === 'ATTC')).map(field => <label key={field.key} className={`block text-sm font-semibold text-ink ${field.type === 'textarea' ? 'sm:col-span-2' : ''}`}>{field.type === 'boolean' ? <span className="inline-flex items-center gap-2"><input type="checkbox" checked={Boolean(form[field.key])} onChange={e => setForm(current => ({ ...current, [field.key]: e.target.checked }))} className="h-4 w-4 accent-burgundy" />{field.label}</span> : <>{field.label}{field.type === 'textarea' ? <textarea rows={3} value={form[field.key]} onChange={e => setForm(current => ({ ...current, [field.key]: e.target.value }))} className={inputClass} /> : field.type === 'select' ? <select value={form[field.key]} onChange={e => setForm(current => ({ ...current, [field.key]: e.target.value, ...(config.table === 'site_content' && field.key === 'page' ? { content_key: '' } : {}) }))} className={inputClass}><option value="">{field.required ? 'Choose one' : 'None'}</option>{(config.table === 'site_content' && field.key === 'content_key' ? (form.page === 'about' ? ['intro'] : form.page === 'contact' ? ['college','address','desk','phone','hours','audit_email'] : []) : field.options || lookups[field.lookup] || []).map(option => typeof option === 'string' ? <option key={option} value={option}>{option}</option> : <option key={option.id} value={option.id}>{option.name}</option>)}</select> : <input type={field.type === 'datetime' ? 'datetime-local' : field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'} step={field.type === 'number' ? 'any' : undefined} value={form[field.key]} onChange={e => setForm(current => ({ ...current, [field.key]: e.target.value }))} className={inputClass} />}</>}</label>)}</div><div className="mt-6 flex gap-3"><button type="submit" disabled={status === 'saving'} className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-bold text-white hover:bg-burgundy-dark disabled:opacity-50">{status === 'saving' ? 'Saving…' : editing ? 'Save changes' : 'Create record'}</button>{editing && <button type="button" onClick={reset} className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-navy">Cancel edit</button>}</div></form>
    <div className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><div className="mb-4 flex items-center justify-between"><h3 className="text-base font-bold text-navy">Existing records</h3><button type="button" onClick={load} className="text-xs font-bold text-burgundy hover:underline">Refresh</button></div>{status === 'loading' ? <LoadingInline label="Loading records…" /> : status === 'error' ? <p role="alert" className="text-sm text-burgundy">Could not load records. Use Refresh to try again.</p> : !rows.length ? <p className="text-sm text-muted">No records yet. Add one using the form above; Edit and Delete appear beside saved records.</p> : <ul className="divide-y divide-line">{rows.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-navy">{row[config.titleKey] || row.id}</p>{config.table === 'events' ? <div className="mt-1 space-y-1 text-xs text-muted"><p>{eventStatus(row) === 'Schedule TBA' ? 'Schedule not set' : `${eventSchedule(row)} · ${eventStatus(row)}`}</p><p>Competition: {row.competition_type}{row.competition_type === 'General' ? ` · Point category ${row.scoring_category || 'not set'}` : ''}{row.competition_type === 'ATTC' ? ` · Stage format ${row.stage_type || 'not set'}` : ''}</p><p>Created: {formatAdminTimestamp(row.created_at)}{lastEdits.has(row.id) ? ` · Last edited (audit): ${formatAdminTimestamp(lastEdits.get(row.id))}` : ''}</p></div> : <p className="mt-0.5 break-all text-xs text-muted">{row.id}</p>}</div><div className="flex gap-3"><button onClick={() => edit(row)} className="text-xs font-bold text-burgundy hover:underline">Edit</button><button onClick={() => remove(row)} className="text-xs font-bold text-burgundy-dark hover:underline">Delete</button></div></li>)}</ul>}</div>
  </section>;
}
