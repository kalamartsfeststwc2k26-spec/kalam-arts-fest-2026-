import { mutationError } from '../../lib/adminMutation';
import { useEffect, useState } from 'react';
import LoadingInline from '../LoadingInline';
import { supabase } from '../../lib/supabaseClient';
import { readAllAdminRows } from '../../lib/adminRows';
import { formatAdminTimestamp } from '../../lib/adminMetadata';

const empty = { team_id: '', points: '', reason: '' };
const inputClass = 'mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy';
export default function TeamPenaltiesManager({ teams = [], onChange }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [readError, setReadError] = useState('');
  const [notice, setNotice] = useState('');
  async function load() {
    setLoading(true);
    const { data, error: readError } = await readAllAdminRows('team_penalties', 'id,team_id,points,reason,created_at,created_by', query => query.order('created_at', { ascending: false }).order('id'));
    if (readError) setReadError('Could not load team minus marks. Please retry.');
    else { setRows(data); setReadError(''); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  function reset() { setForm(empty); setEditing(null); }
  async function save(event) {
    event.preventDefault(); setError(''); setNotice('');
    const points = Number(form.points);
    if (!form.team_id || !Number.isFinite(points) || points <= 0 || !/^\d+(\.\d{1,2})?$/.test(form.points)) { setError('Choose a team and enter a positive deduction with at most two decimal places.'); return; }
    if (form.reason.trim().length < 10) { setError('Explain the minus mark in at least 10 characters.'); return; }
    const teamName = teams.find(team => team.id === form.team_id)?.name || 'this team';
    if (!window.confirm(`${editing ? 'Change' : 'Apply'} a ${points}-point minus mark for ${teamName}? This affects the public team total and will be audited.`)) return;
    setBusy(true);
    const payload = { team_id: form.team_id, points, reason: form.reason.trim() };
    const saved = editing ? await supabase.from('team_penalties').update(payload).eq('id', editing).select('id') : await supabase.from('team_penalties').insert(payload).select('id');
    const saveError = mutationError(saved, editing ? 'update' : 'create');
    setBusy(false);
    if (saveError) { setError(saveError); return; }
    setNotice(`The ${points}-point team deduction was ${editing ? 'updated' : 'applied'} and audited. Public totals will reflect it on refresh.`);
    reset(); await load(); onChange?.();
  }
  async function remove(row) {
    const teamName = teams.find(team => team.id === row.team_id)?.name || 'this team';
    if (!window.confirm(`Remove the ${row.points}-point deduction from ${teamName}? Its points will be restored in public totals. This removal is audited.`)) return;
    setError(''); setNotice(''); setBusy(true);
    const deleted = await supabase.from('team_penalties').delete().eq('id', row.id).select('id');
    const deleteError = mutationError(deleted, 'delete');
    setBusy(false);
    if (deleteError) { setError(deleteError); return; }
    setNotice('Team minus mark removed and audited. Public totals will refresh on the next visit.'); if (editing === row.id) reset(); await load(); onChange?.();
  }
  return <section className="space-y-6"><div><h2 className="text-xl font-bold text-navy">Team minus marks</h2><p className="mt-1 text-sm text-muted">Super Admin only. Deduct points from any team’s overall total without altering event results or individual scores. Reasons and actor details remain private.</p></div>
    {notice && <p role="status" className="rounded-xl bg-page p-4 text-sm font-semibold text-emerald">{notice}</p>}{error && <p role="alert" className="rounded-xl bg-page p-4 text-sm font-semibold text-burgundy">{error}</p>}
    <form onSubmit={save} className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><h3 className="text-base font-bold text-navy">{editing ? 'Edit team deduction' : 'Apply team deduction'}</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-ink">Team *<select className={inputClass} required value={form.team_id} onChange={e => setForm(current => ({ ...current, team_id: e.target.value }))}><option value="">Choose a team</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label><label className="text-sm font-semibold text-ink">Points to subtract *<input className={inputClass} type="number" min="0.01" step="0.01" required value={form.points} onChange={e => setForm(current => ({ ...current, points: e.target.value }))} /></label><label className="text-sm font-semibold text-ink sm:col-span-2">Reason / committee reference *<textarea className={inputClass} rows={3} required minLength={10} value={form.reason} onChange={e => setForm(current => ({ ...current, reason: e.target.value }))} /></label></div><p className="mt-4 text-xs text-muted">Enter a positive amount. The leaderboard subtracts it; a team’s net total may be below zero. This does not automatically detect a no-show.</p><div className="mt-6 flex gap-3"><button disabled={busy || !teams.length} className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : editing ? 'Save deduction' : 'Apply minus mark'}</button>{editing && <button type="button" onClick={reset} className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-navy">Cancel</button>}</div></form>
    <div className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><div className="mb-5 flex items-center justify-between gap-3"><h3 className="text-base font-bold text-navy">Applied deductions</h3><button type="button" onClick={load} className="text-xs font-bold text-burgundy hover:underline">Refresh</button></div>{loading ? <LoadingInline label="Loading minus marks…" /> : readError ? <p role="alert" className="text-sm text-burgundy">Could not load deductions. Please retry.</p> : !rows.length ? <p className="text-sm text-muted">No team minus marks have been applied. Add one above; Edit and Remove appear once a deduction exists.</p> : <ul className="divide-y divide-line">{rows.map(row => <li key={row.id} className="flex flex-wrap justify-between gap-3 py-4"><div className="min-w-0"><p className="text-sm font-bold text-navy">{teams.find(team => team.id === row.team_id)?.name || 'Team unavailable'} · −{row.points} points</p><p className="mt-1 break-words text-sm text-ink">{row.reason}</p><p className="mt-1 break-all text-xs text-muted">Applied: {formatAdminTimestamp(row.created_at)} · Actor: {row.created_by || 'Former admin'}</p></div><div className="flex gap-3"><button type="button" disabled={busy} onClick={() => { setEditing(row.id); setForm({ team_id: row.team_id, points: String(row.points), reason: row.reason }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-xs font-bold text-burgundy hover:underline">Edit</button><button type="button" disabled={busy} onClick={() => remove(row)} className="text-xs font-bold text-burgundy-dark hover:underline">Remove</button></div></li>)}</ul>}</div>
  </section>;
}
