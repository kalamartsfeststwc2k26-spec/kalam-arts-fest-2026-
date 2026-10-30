import { mutationError } from '../../lib/adminMutation';
import LoadingInline from '../LoadingInline';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { readAllAdminRows } from '../../lib/adminRows';

const blank = { name: '', roll_number: '', photo_url: '', team_id: '', is_attc: false };
export default function StudentsManager({ profile, teams = [], onChange }) {
  const superAdmin = profile.role === 'super_admin';
  const [rows, setRows] = useState([]);import { mutationError } from '../../lib/adminMutation';
import LoadingInlinimport { mutationError } from '../../lib/adminMutation';
import LoadingInline from '../LoadingInline';
import ExcelImportPanel from './ExcelImportPanel';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { readAllAdminRows } from '../../lib/adminRows';

const blank = { name: '', roll_number: '', photo_url: '', team_id: '', is_attc: false };
export default function StudentsManager({ profile, teams = [], onChange }) {
  const superAdmin = profile.role === 'super_admin';
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [readError, setReadError] = useState('');
  const [notice, setNotice] = useState('');
  async function load() {
    setLoading(true);
    const { data, error: fetchError } = await readAllAdminRows('students', 'id,name,roll_number,photo_url,team_id,is_attc,division,created_at', query => {
      const scoped = superAdmin ? query : query.eq('team_id', profile.team_id); // RLS is authoritative.
      return scoped.order('created_at', { ascending: false }).order('id');
    });
    if (fetchError) setReadError('Could not load students. Please retry.'); else { setRows(data); setReadError(''); }
    setLoading(false);
  }
  useEffect(() => { reset(); load(); }, [profile.role, profile.team_id]);
  function reset() { setEditing(null); setForm(blank); }
  function begin(row) { setEditing(row.id); setForm({ name: row.name, roll_number: row.roll_number || '', photo_url: row.photo_url || '', team_id: row.team_id, is_attc: row.is_attc }); setError(''); setNotice(''); }
  async function save(event) {
    event.preventDefault(); setError(''); setNotice('');
    if (!form.name.trim()) { setError('Student name is required.'); return; }
    if (superAdmin && !form.team_id) { setError('Choose a team.'); return; }
    setBusy(true);
    const shared = { name: form.name.trim(), roll_number: form.roll_number.trim() || null, photo_url: form.photo_url.trim() || null };
    let result;
    if (editing) result = await supabase.from('students').update(superAdmin ? { ...shared, team_id: form.team_id, is_attc: form.is_attc } : shared).eq('id', editing).select('id');
    else if (superAdmin) result = await supabase.from('students').insert({ ...shared, team_id: form.team_id, is_attc: form.is_attc }).select('id');
    else result = await supabase.rpc('add_student_to_my_team', { p_name: shared.name, p_roll_number: shared.roll_number, p_photo_url: shared.photo_url });
    setBusy(false);
    const saveError = superAdmin || editing ? mutationError(result, editing ? 'update' : 'create') : result.error?.message;
    if (saveError) { setError(saveError); return; }
    setNotice(editing ? 'Student updated. Change recorded in the audit log.' : 'Student added to the assigned team. Change recorded in the audit log.'); reset(); await load(); onChange?.();
  }
  async function remove(row) {
    if (!window.confirm(`Permanently delete ${row.name} and their registrations? This action is audited and cannot be undone.`)) return;
    setError(''); setNotice('');
    const deleted = await supabase.from('students').delete().eq('id', row.id).select('id');
    const deleteError = mutationError(deleted, 'delete');
    if (deleteError) { setError(deleteError); return; }
    setNotice('Student deleted. Change recorded in the audit log.'); if (editing === row.id) reset(); await load(); onChange?.();
  }
  const inputClass = 'mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy';
  return <section className="space-y-6"><div><h2 className="text-xl font-bold text-navy">Students</h2><p className="mt-1 text-sm text-muted">{superAdmin ? 'Manage students across every team.' : `Add students one at a time for ${teams.find(team => team.id === profile.team_id)?.name || 'your assigned team'}. ATTC membership requires Super Admin verification.`}</p></div>
    {notice && <p role="status" className="rounded-xl bg-page p-4 text-sm font-semibold text-emerald">{notice}</p>}{error && <p role="alert" className="rounded-xl bg-page p-4 text-sm font-semibold text-burgundy">{error}</p>}
    <form onSubmit={save} className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><h3 className="font-bold text-navy">{editing ? 'Edit student' : 'Add one student'}</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-ink">Student name *<input value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} required className={inputClass} /></label><label className="text-sm font-semibold text-ink">Roll number<input value={form.roll_number} onChange={e => setForm(v => ({ ...v, roll_number: e.target.value }))} className={inputClass} /></label><label className="text-sm font-semibold text-ink">Photo URL<input value={form.photo_url} onChange={e => setForm(v => ({ ...v, photo_url: e.target.value }))} className={inputClass} /></label>{superAdmin ? <label className="text-sm font-semibold text-ink">Assigned team *<select value={form.team_id} onChange={e => setForm(v => ({ ...v, team_id: e.target.value }))} className={inputClass} required><option value="">Choose a team</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label> : <div className="text-sm font-semibold text-ink">Assigned team<p className="mt-2 rounded-xl bg-page px-3 py-3 font-medium text-navy">{teams.find(team => team.id === profile.team_id)?.name || 'Assigned by Super Admin'}</p></div>}{superAdmin && <label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={form.is_attc} onChange={e => setForm(v => ({ ...v, is_attc: e.target.checked }))} className="h-4 w-4 accent-burgundy" />Verified ATTC category</label>}</div><div className="mt-6 flex gap-3"><button disabled={busy} className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : editing ? 'Save student' : 'Add student'}</button>{editing && <button type="button" onClick={reset} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold">Cancel</button>}</div></form>
    {!superAdmin && <ExcelImportPanel kind="students" teamName={teams.find(team => team.id === profile.team_id)?.name || 'your team'} students={rows} disabled={loading || Boolean(readError)} saveRow={values => supabase.rpc('add_student_to_my_team', { p_name: values.name, p_roll_number: values.roll_number, p_photo_url: values.photo_url })} onComplete={async () => { await load(); onChange?.(); }} />}
    <div className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><div className="mb-4 flex justify-between"><h3 className="font-bold text-navy">Student records</h3><button onClick={load} className="text-xs font-bold text-burgundy hover:underline">Refresh</button></div>{loading ? <LoadingInline label="Loading records…" /> : readError ? <p role="alert" className="text-sm text-burgundy">Could not load records. Try Refresh.</p> : !rows.length ? <p className="text-sm text-muted">No students entered yet. Add one above; Edit and Delete appear for students in your permitted team scope.</p> : <ul className="divide-y divide-line">{rows.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-bold text-navy">{row.name}{row.is_attc ? ' · ATTC' : ''}</p><p className="text-xs text-muted">{row.roll_number ? `Roll ${row.roll_number} · ` : ''}{teams.find(team => team.id === row.team_id)?.name || 'Assigned team'}</p></div><div className="flex gap-3"><button onClick={() => begin(row)} className="text-xs font-bold text-burgundy hover:underline">Edit</button><button onClick={() => remove(row)} className="text-xs font-bold text-burgundy-dark hover:underline">Delete</button></div></li>)}</ul>}</div>
  </section>;
}
e from '../LoadingInline';
import ExcelImportPanel from './ExcelImportPanel';import { mutationError } from '../../lib/adminMutation';
import LoadingInline from '../LoadingInline';
import ExcelImportPanel from './ExcelImportPanel';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { readAllAdminRows } from '../../lib/adminRows';

const blank = { name: '', roll_number: '', photo_url: '', team_id: '', is_attc: false };
export default function StudentsManager({ profile, teams = [], onChange }) {
  const superAdmin = profile.role === 'super_admin';
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [readError, setReadError] = useState('');
  const [notice, setNotice] = useState('');
  async function load() {
    setLoading(true);
    const { data, error: fetchError } = await readAllAdminRows('students', 'id,name,roll_number,photo_url,team_id,is_attc,division,created_at', query => {
      const scoped = superAdmin ? query : query.eq('team_id', profile.team_id); // RLS is authoritative.
      return scoped.order('created_at', { ascending: false }).order('id');
    });
    if (fetchError) setReadError('Could not load students. Please retry.'); else { setRows(data); setReadError(''); }
    setLoading(false);
  }
  useEffect(() => { reset(); load(); }, [profile.role, profile.team_id]);
  function reset() { setEditing(null); setForm(blank); }
  function begin(row) { setEditing(row.id); setForm({ name: row.name, roll_number: row.roll_number || '', photo_url: row.photo_url || '', team_id: row.team_id, is_attc: row.is_attc }); setError(''); setNotice(''); }
  async function save(event) {
    event.preventDefault(); setError(''); setNotice('');
    if (!form.name.trim()) { setError('Student name is required.'); return; }
    if (superAdmin && !form.team_id) { setError('Choose a team.'); return; }
    setBusy(true);
    const shared = { name: form.name.trim(), roll_number: form.roll_number.trim() || null, photo_url: form.photo_url.trim() || null };
    let result;
    if (editing) result = await supabase.from('students').update(superAdmin ? { ...shared, team_id: form.team_id, is_attc: form.is_attc } : shared).eq('id', editing).select('id');
    else if (superAdmin) result = await supabase.from('students').insert({ ...shared, team_id: form.team_id, is_attc: form.is_attc }).select('id');
    else result = await supabase.rpc('add_student_to_my_team', { p_name: shared.name, p_roll_number: shared.roll_number, p_photo_url: shared.photo_url });
    setBusy(false);
    const saveError = superAdmin || editing ? mutationError(result, editing ? 'update' : 'create') : result.error?.message;
    if (saveError) { setError(saveError); return; }
    setNotice(editing ? 'Student updated. Change recorded in the audit log.' : 'Student added to the assigned team. Change recorded in the audit log.'); reset(); await load(); onChange?.();
  }
  async function remove(row) {
    if (!window.confirm(`Permanently delete ${row.name} and their registrations? This action is audited and cannot be undone.`)) return;
    setError(''); setNotice('');
    const deleted = await supabase.from('students').delete().eq('id', row.id).select('id');
    const deleteError = mutationError(deleted, 'delete');
    if (deleteError) { setError(deleteError); return; }
    setNotice('Student deleted. Change recorded in the audit log.'); if (editing === row.id) reset(); await load(); onChange?.();
  }
  const inputClass = 'mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy';
  return <section className="space-y-6"><div><h2 className="text-xl font-bold text-navy">Students</h2><p className="mt-1 text-sm text-muted">{superAdmin ? 'Manage students across every team.' : `Add students one at a time for ${teams.find(team => team.id === profile.team_id)?.name || 'your assigned team'}. ATTC membership requires Super Admin verification.`}</p></div>
    {notice && <p role="status" className="rounded-xl bg-page p-4 text-sm font-semibold text-emerald">{notice}</p>}{error && <p role="alert" className="rounded-xl bg-page p-4 text-sm font-semibold text-burgundy">{error}</p>}
    <form onSubmit={save} className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><h3 className="font-bold text-navy">{editing ? 'Edit student' : 'Add one student'}</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-ink">Student name *<input value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} required className={inputClass} /></label><label className="text-sm font-semibold text-ink">Roll number<input value={form.roll_number} onChange={e => setForm(v => ({ ...v, roll_number: e.target.value }))} className={inputClass} /></label><label className="text-sm font-semibold text-ink">Photo URL<input value={form.photo_url} onChange={e => setForm(v => ({ ...v, photo_url: e.target.value }))} className={inputClass} /></label>{superAdmin ? <label className="text-sm font-semibold text-ink">Assigned team *<select value={form.team_id} onChange={e => setForm(v => ({ ...v, team_id: e.target.value }))} className={inputClass} required><option value="">Choose a team</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label> : <div className="text-sm font-semibold text-ink">Assigned team<p className="mt-2 rounded-xl bg-page px-3 py-3 font-medium text-navy">{teams.find(team => team.id === profile.team_id)?.name || 'Assigned by Super Admin'}</p></div>}{superAdmin && <label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={form.is_attc} onChange={e => setForm(v => ({ ...v, is_attc: e.target.checked }))} className="h-4 w-4 accent-burgundy" />Verified ATTC category</label>}</div><div className="mt-6 flex gap-3"><button disabled={busy} className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : editing ? 'Save student' : 'Add student'}</button>{editing && <button type="button" onClick={reset} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold">Cancel</button>}</div></form>
    {!superAdmin && <ExcelImportPanel kind="students" teamName={teams.find(team => team.id === profile.team_id)?.name || 'your team'} students={rows} disabled={loading || Boolean(readError)} saveRow={values => supabase.rpc('add_student_to_my_team', { p_name: values.name, p_roll_number: values.roll_number, p_photo_url: values.photo_url })} onComplete={async () => { await load(); onChange?.(); }} />}
    <div className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><div className="mb-4 flex justify-between"><h3 className="font-bold text-navy">Student records</h3><button onClick={load} className="text-xs font-bold text-burgundy hover:underline">Refresh</button></div>{loading ? <LoadingInline label="Loading records…" /> : readError ? <p role="alert" className="text-sm text-burgundy">Could not load records. Try Refresh.</p> : !rows.length ? <p className="text-sm text-muted">No students entered yet. Add one above; Edit and Delete appear for students in your permitted team scope.</p> : <ul className="divide-y divide-line">{rows.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-bold text-navy">{row.name}{row.is_attc ? ' · ATTC' : ''}</p><p className="text-xs text-muted">{row.roll_number ? `Roll ${row.roll_number} · ` : ''}{teams.find(team => team.id === row.team_id)?.name || 'Assigned team'}</p></div><div className="flex gap-3"><button onClick={() => begin(row)} className="text-xs font-bold text-burgundy hover:underline">Edit</button><button onClick={() => remove(row)} className="text-xs font-bold text-burgundy-dark hover:underline">Delete</button></div></li>)}</ul>}</div>
  </section>;
}

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { readAllAdminRows } from '../../lib/adminRows';

const blank = { name: '', roll_number: '', photo_url: '', team_id: '', is_attc: false };
export default function StudentsManager({ profile, teams = [], onChange }) {
  const superAdmin = profile.role === 'super_admin';
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [readError, setReadError] = useState('');
  const [notice, setNotice] = useState('');
  async function load() {
    setLoading(true);
    const { data, error: fetchError } = await readAllAdminRows('students', 'id,name,roll_number,photo_url,team_id,is_attc,division,created_at', query => {
      const scoped = superAdmin ? query : query.eq('team_id', profile.team_id); // RLS is authoritative.
      return scoped.order('created_at', { ascending: false }).order('id');
    });
    if (fetchError) setReadError('Could not load students. Please retry.'); else { setRows(data); setReadError(''); }
    setLoading(false);
  }
  useEffect(() => { reset(); load(); }, [profile.role, profile.team_id]);
  function reset() { setEditing(null); setForm(blank); }
  function begin(row) { setEditing(row.id); setForm({ name: row.name, roll_number: row.roll_number || '', photo_url: row.photo_url || '', team_id: row.team_id, is_attc: row.is_attc }); setError(''); setNotice(''); }
  async function save(event) {
    event.preventDefault(); setError(''); setNotice('');
    if (!form.name.trim()) { setError('Student name is required.'); return; }
    if (superAdmin && !form.team_id) { setError('Choose a team.'); return; }
    setBusy(true);
    const shared = { name: form.name.trim(), roll_number: form.roll_number.trim() || null, photo_url: form.photo_url.trim() || null };
    let result;
    if (editing) result = await supabase.from('students').update(superAdmin ? { ...shared, team_id: form.team_id, is_attc: form.is_attc } : shared).eq('id', editing).select('id');
    else if (superAdmin) result = await supabase.from('students').insert({ ...shared, team_id: form.team_id, is_attc: form.is_attc }).select('id');
    else result = await supabase.rpc('add_student_to_my_team', { p_name: shared.name, p_roll_number: shared.roll_number, p_photo_url: shared.photo_url });
    setBusy(false);
    const saveError = superAdmin || editing ? mutationError(result, editing ? 'update' : 'create') : result.error?.message;
    if (saveError) { setError(saveError); return; }
    setNotice(editing ? 'Student updated. Change recorded in the audit log.' : 'Student added to the assigned team. Change recorded in the audit log.'); reset(); await load(); onChange?.();
  }
  async function remove(row) {
    if (!window.confirm(`Permanently delete ${row.name} and their registrations? This action is audited and cannot be undone.`)) return;
    setError(''); setNotice('');
    const deleted = await supabase.from('students').delete().eq('id', row.id).select('id');
    const deleteError = mutationError(deleted, 'delete');
    if (deleteError) { setError(deleteError); return; }
    setNotice('Student deleted. Change recorded in the audit log.'); if (editing === row.id) reset(); await load(); onChange?.();
  }
  const inputClass = 'mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy';
  return <section className="space-y-6"><div><h2 className="text-xl font-bold text-navy">Students</h2><p className="mt-1 text-sm text-muted">{superAdmin ? 'Manage students across every team.' : `Add students one at a time for ${teams.find(team => team.id === profile.team_id)?.name || 'your assigned team'}. ATTC membership requires Super Admin verification.`}</p></div>
    {notice && <p role="status" className="rounded-xl bg-page p-4 text-sm font-semibold text-emerald">{notice}</p>}{error && <p role="alert" className="rounded-xl bg-page p-4 text-sm font-semibold text-burgundy">{error}</p>}
    <form onSubmit={save} className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><h3 className="font-bold text-navy">{editing ? 'Edit student' : 'Add one student'}</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-ink">Student name *<input value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} required className={inputClass} /></label><label className="text-sm font-semibold text-ink">Roll number<input value={form.roll_number} onChange={e => setForm(v => ({ ...v, roll_number: e.target.value }))} className={inputClass} /></label><label className="text-sm font-semibold text-ink">Photo URL<input value={form.photo_url} onChange={e => setForm(v => ({ ...v, photo_url: e.target.value }))} className={inputClass} /></label>{superAdmin ? <label className="text-sm font-semibold text-ink">Assigned team *<select value={form.team_id} onChange={e => setForm(v => ({ ...v, team_id: e.target.value }))} className={inputClass} required><option value="">Choose a team</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label> : <div className="text-sm font-semibold text-ink">Assigned team<p className="mt-2 rounded-xl bg-page px-3 py-3 font-medium text-navy">{teams.find(team => team.id === profile.team_id)?.name || 'Assigned by Super Admin'}</p></div>}{superAdmin && <label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={form.is_attc} onChange={e => setForm(v => ({ ...v, is_attc: e.target.checked }))} className="h-4 w-4 accent-burgundy" />Verified ATTC category</label>}</div><div className="mt-6 flex gap-3"><button disabled={busy} className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : editing ? 'Save student' : 'Add student'}</button>{editing && <button type="button" onClick={reset} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold">Cancel</button>}</div></form>
    {!superAdmin && <ExcelImportPanel kind="students" teamName={teams.find(team => team.id === profile.team_id)?.name || 'your team'} students={rows} disabled={loading || Boolean(readError)} saveRow={values => supabase.rpc('add_student_to_my_team', { p_name: values.name, p_roll_number: values.roll_number, p_photo_url: values.photo_url })} onComplete={async () => { await load(); onChange?.(); }} />}
    <div className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><div className="mb-4 flex justify-between"><h3 className="font-bold text-navy">Student records</h3><button onClick={load} className="text-xs font-bold text-burgundy hover:underline">Refresh</button></div>{loading ? <LoadingInline label="Loading records…" /> : readError ? <p role="alert" className="text-sm text-burgundy">Could not load records. Try Refresh.</p> : !rows.length ? <p className="text-sm text-muted">No students entered yet. Add one above; Edit and Delete appear for students in your permitted team scope.</p> : <ul className="divide-y divide-line">{rows.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-bold text-navy">{row.name}{row.is_attc ? ' · ATTC' : ''}</p><p className="text-xs text-muted">{row.roll_number ? `Roll ${row.roll_number} · ` : ''}{teams.find(team => team.id === row.team_id)?.name || 'Assigned team'}</p></div><div className="flex gap-3"><button onClick={() => begin(row)} className="text-xs font-bold text-burgundy hover:underline">Edit</button><button onClick={() => remove(row)} className="text-xs font-bold text-burgundy-dark hover:underline">Delete</button></div></li>)}</ul>}</div>
  </section>;
}

  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [readError, setReadError] = useState('');
  const [notice, setNotice] = useState('');
  async function load() {
    setLoading(true);
    const { data, error: fetchError } = await readAllAdminRows('students', 'id,name,roll_number,photo_url,team_id,is_attc,division,created_at', query => {
      const scoped = superAdmin ? query : query.eq('team_id', profile.team_id); // RLS is authoritative.
      return scoped.order('created_at', { ascending: false }).order('id');
    });
    if (fetchError) setReadError('Could not load students. Please retry.'); else { setRows(data); setReadError(''); }
    setLoading(false);
  }
  useEffect(() => { reset(); load(); }, [profile.role, profile.team_id]);
  function reset() { setEditing(null); setForm(blank); }
  function begin(row) { setEditing(row.id); setForm({ name: row.name, roll_number: row.roll_number || '', photo_url: row.photo_url || '', team_id: row.team_id, is_attc: row.is_attc }); setError(''); setNotice(''); }
  async function save(event) {
    event.preventDefault(); setError(''); setNotice('');
    if (!form.name.trim()) { setError('Student name is required.'); return; }
    if (superAdmin && !form.team_id) { setError('Choose a team.'); return; }
    setBusy(true);
    const shared = { name: form.name.trim(), roll_number: form.roll_number.trim() || null, photo_url: form.photo_url.trim() || null };
    let result;
    if (editing) result = await supabase.from('students').update(superAdmin ? { ...shared, team_id: form.team_id, is_attc: form.is_attc } : shared).eq('id', editing).select('id');
    else if (superAdmin) result = await supabase.from('students').insert({ ...shared, team_id: form.team_id, is_attc: form.is_attc }).select('id');
    else result = await supabase.rpc('add_student_to_my_team', { p_name: shared.name, p_roll_number: shared.roll_number, p_photo_url: shared.photo_url });
    setBusy(false);
    const saveError = superAdmin || editing ? mutationError(result, editing ? 'update' : 'create') : result.error?.message;
    if (saveError) { setError(saveError); return; }
    setNotice(editing ? 'Student updated. Change recorded in the audit log.' : 'Student added to the assigned team. Change recorded in the audit log.'); reset(); await load(); onChange?.();
  }
  async function remove(row) {
    if (!window.confirm(`Permanently delete ${row.name} and their registrations? This action is audited and cannot be undone.`)) return;
    setError(''); setNotice('');
    const deleted = await supabase.from('students').delete().eq('id', row.id).select('id');
    const deleteError = mutationError(deleted, 'delete');
    if (deleteError) { setError(deleteError); return; }
    setNotice('Student deleted. Change recorded in the audit log.'); if (editing === row.id) reset(); await load(); onChange?.();
  }
  const inputClass = 'mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy';
  return <section className="space-y-6"><div><h2 className="text-xl font-bold text-navy">Students</h2><p className="mt-1 text-sm text-muted">{superAdmin ? 'Manage students across every team.' : `Add students one at a time for ${teams.find(team => team.id === profile.team_id)?.name || 'your assigned team'}. ATTC membership requires Super Admin verification.`}</p></div>
    {notice && <p role="status" className="rounded-xl bg-page p-4 text-sm font-semibold text-emerald">{notice}</p>}{error && <p role="alert" className="rounded-xl bg-page p-4 text-sm font-semibold text-burgundy">{error}</p>}
    <form onSubmit={save} className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><h3 className="font-bold text-navy">{editing ? 'Edit student' : 'Add one student'}</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-ink">Student name *<input value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} required className={inputClass} /></label><label className="text-sm font-semibold text-ink">Roll number<input value={form.roll_number} onChange={e => setForm(v => ({ ...v, roll_number: e.target.value }))} className={inputClass} /></label><label className="text-sm font-semibold text-ink">Photo URL<input value={form.photo_url} onChange={e => setForm(v => ({ ...v, photo_url: e.target.value }))} className={inputClass} /></label>{superAdmin ? <label className="text-sm font-semibold text-ink">Assigned team *<select value={form.team_id} onChange={e => setForm(v => ({ ...v, team_id: e.target.value }))} className={inputClass} required><option value="">Choose a team</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label> : <div className="text-sm font-semibold text-ink">Assigned team<p className="mt-2 rounded-xl bg-page px-3 py-3 font-medium text-navy">{teams.find(team => team.id === profile.team_id)?.name || 'Assigned by Super Admin'}</p></div>}{superAdmin && <label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={form.is_attc} onChange={e => setForm(v => ({ ...v, is_attc: e.target.checked }))} className="h-4 w-4 accent-burgundy" />Verified ATTC category</label>}</div><div className="mt-6 flex gap-3"><button disabled={busy} className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : editing ? 'Save student' : 'Add student'}</button>{editing && <button type="button" onClick={reset} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold">Cancel</button>}</div></form>
    <div className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><div className="mb-4 flex justify-between"><h3 className="font-bold text-navy">Student records</h3><button onClick={load} className="text-xs font-bold text-burgundy hover:underline">Refresh</button></div>{loading ? <LoadingInline label="Loading records…" /> : readError ? <p role="alert" className="text-sm text-burgundy">Could not load records. Try Refresh.</p> : !rows.length ? <p className="text-sm text-muted">No students entered yet. Add one above; Edit and Delete appear for students in your permitted team scope.</p> : <ul className="divide-y divide-line">{rows.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-bold text-navy">{row.name}{row.is_attc ? ' · ATTC' : ''}</p><p className="text-xs text-muted">{row.roll_number ? `Roll ${row.roll_number} · ` : ''}{teams.find(team => team.id === row.team_id)?.name || 'Assigned team'}</p></div><div className="flex gap-3"><button onClick={() => begin(row)} className="text-xs font-bold text-burgundy hover:underline">Edit</button><button onClick={() => remove(row)} className="text-xs font-bold text-burgundy-dark hover:underline">Delete</button></div></li>)}</ul>}</div>
  </section>;
}
