import { useCallback, useEffect, useRef, useState } from 'react';
import LoadingInline from '../LoadingInline';
import CommitteePhotoCrop from './CommitteePhotoCrop';
import { readAllAdminRows } from '../../lib/adminRows';
import { supabase } from '../../lib/supabaseClient';

const blank = { name: '', role_title: '', sort_order: '0', photo_url: '', contact_phone: '', contact_email: '', is_published: false };
const inputClass = 'mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy';
const fields = ['name', 'role_title', 'sort_order', 'photo_url', 'contact_phone', 'contact_email', 'is_published'];
function formFor(row) {
  return Object.fromEntries(fields.map(key => [key, key === 'is_published' ? Boolean(row?.[key]) : String(row?.[key] ?? (key === 'sort_order' ? 0 : ''))]));
}
export default function CommitteeMembersManager({ onChange }) {
  const [rows, setRows] = useState([]), [form, setForm] = useState(blank), [editing, setEditing] = useState(null);
  const [photo, setPhoto] = useState(null), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const cropRef = useRef(null), savingRef = useRef(false);
  const setCrop = useCallback(fn => { cropRef.current = fn; }, []);
  function selectPhoto(file) { cropRef.current = null; setPhoto(file); }
  function reset() { setForm(blank); setEditing(null); setPhoto(null); cropRef.current = null; }
  async function load() {
    setLoading(true);
    const result = await readAllAdminRows('committee_members', '*', query => query.order('created_at', { ascending: false }).order('id'));
    if (result.error) setReadError('Could not load committee members. Please retry.');
    else { setRows(result.data); setReadError(''); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  function edit(row) { setEditing(row.id); setForm(formFor(row)); setPhoto(null); cropRef.current = null; setError(''); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async function save(event) {
    event.preventDefault(); setError(''); setNotice('');
    if (!form.name.trim() || !form.role_title.trim()) { setError('Name and role are required.'); return; }
    const sort = Number(form.sort_order);
    if (!form.sort_order.trim() || !Number.isInteger(sort) || sort < -2147483648 || sort > 2147483647) { setError('Sort order must be a whole number.'); return; }
    if (photo && !cropRef.current) { setError('Wait for the photo preview to load or select another image.'); return; }
    if (savingRef.current) return;
    savingRef.current = true; setBusy(true);
    let recordSaved = false;
    try {
      const blob = photo ? await cropRef.current() : null;
      const payload = { name: form.name.trim(), role_title: form.role_title.trim(), sort_order: sort, photo_url: form.photo_url.trim() || null, contact_phone: form.contact_phone.trim() || null, contact_email: form.contact_email.trim() || null, is_published: form.is_published };
      const query = editing ? supabase.from('committee_members').update(payload).eq('id', editing) : supabase.from('committee_members').insert(payload);
      const result = await query.select('id');
      if (result.error || !Array.isArray(result.data) || result.data.length !== 1 || !result.data[0]?.id) throw new Error('Could not confirm the member was saved. Refresh the records before retrying to avoid duplicates.');
      const id = result.data[0].id;
      recordSaved = true; setEditing(id);
      if (blob) {
        const path = `${id}/${crypto.randomUUID()}.${photo.type === 'image/png' ? 'png' : 'jpg'}`;
        const bucket = supabase.storage.from('committee-photos');
        const uploaded = await bucket.upload(path, blob, { contentType: photo.type, cacheControl: '3600', upsert: false });
        if (uploaded.error) throw new Error('The member was saved, but the photo upload could not be confirmed. Check storage before retrying.');
        const url = bucket.getPublicUrl(path).data.publicUrl;
        const linked = await supabase.from('committee_members').update({ photo_url: url }).eq('id', id).select('id');
        if (linked.error || !Array.isArray(linked.data) || linked.data.length !== 1) throw new Error('The member was saved, but the photo link could not be confirmed. The uploaded public file remains in storage for an owner to review.');
      }
      setNotice('Committee member saved. Replaced or removed public files remain in storage.');
      reset(); await load(); onChange?.();
    } catch (cause) {
      const message = cause?.message || '';
      setError(message.startsWith('The member was saved,') || message.startsWith('Could not confirm') ? message : recordSaved ? 'The member was saved, but the photo could not be confirmed. Review storage and the record before retrying.' : 'Could not complete the save. Refresh records before retrying to avoid duplicates.');
      if (recordSaved) { await load(); onChange?.(); }
    } finally { savingRef.current = false; setBusy(false); }
  }
  async function remove(row) {
    if (!window.confirm(`Delete committee member “${row.name}”? Their public photo file remains in storage until an owner removes it.`)) return;
    setError(''); setNotice(''); setBusy(true);
    try {
      const result = await supabase.from('committee_members').delete().eq('id', row.id).select('id');
      if (result.error || !Array.isArray(result.data) || result.data.length !== 1) throw new Error();
      setNotice('Member deleted. The public photo file remains in storage.'); if (editing === row.id) reset(); await load(); onChange?.();
    } catch { setError('Could not confirm deletion. Refresh and check the records.'); }
    finally { setBusy(false); }
  }
  const set = key => event => setForm(current => ({ ...current, [key]: event.target.value }));
  return <section className="space-y-6"><div><h2 className="text-xl font-bold text-navy">Committee Members</h2><p className="mt-1 text-sm text-muted">Super Admin access · public photos</p></div>
    {notice && <p role="status" className="rounded-xl bg-page px-4 py-3 text-sm font-semibold text-emerald">{notice}</p>}
    {error && <p role="alert" className="rounded-xl bg-page px-4 py-3 text-sm font-semibold text-burgundy">{error}</p>}
    <form onSubmit={save} className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><h3 className="text-base font-bold text-navy">{editing ? 'Edit committee member' : 'Add committee member'}</h3>
      <fieldset disabled={busy} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-ink">Name *<input required value={form.name} onChange={set('name')} className={inputClass} /></label>
        <label className="block text-sm font-semibold text-ink">Role *<input required value={form.role_title} onChange={set('role_title')} className={inputClass} /></label>
        <label className="block text-sm font-semibold text-ink">Sort order *<input type="number" step="1" required value={form.sort_order} onChange={set('sort_order')} className={inputClass} /></label>
        <label className="block text-sm font-semibold text-ink">Public phone<input value={form.contact_phone} onChange={set('contact_phone')} className={inputClass} /></label>
        <label className="block text-sm font-semibold text-ink">Public email<input type="email" value={form.contact_email} onChange={set('contact_email')} className={inputClass} /></label>
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={form.is_published} onChange={event => setForm(current => ({ ...current, is_published: event.target.checked }))} />Published</label>
        {form.photo_url && !photo && <div className="sm:col-span-2"><p className="text-sm font-semibold text-ink">Current photo</p><img src={form.photo_url} alt="Current committee member" className="mt-2 h-24 w-24 rounded-xl object-cover" /></div>}
        <label className="block text-sm font-semibold text-ink sm:col-span-2">Photo URL (optional)<input type="text" value={form.photo_url} onChange={set('photo_url')} disabled={Boolean(photo)} className={inputClass} /><span className="mt-1 block text-xs font-normal text-muted">Leave unchanged to retain an existing photo, or clear it to remove the link. Choosing a file replaces this URL after a successful upload.</span></label>
        <CommitteePhotoCrop photo={photo} onChange={selectPhoto} onCropChange={setCrop} disabled={busy} />
      </fieldset>
      <div className="mt-6 flex gap-3"><button disabled={busy} className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : editing ? 'Save changes' : 'Create record'}</button>{editing && <button type="button" disabled={busy} onClick={reset} className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-navy">Cancel edit</button>}</div>
    </form>
    <div className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><div className="mb-4 flex justify-between"><h3 className="font-bold text-navy">Existing records</h3><button disabled={busy} onClick={load} className="text-xs font-bold text-burgundy hover:underline">Refresh</button></div>
      {loading ? <LoadingInline label="Loading records…" /> : readError ? <p role="alert" className="text-sm text-burgundy">{readError}</p> : !rows.length ? <p className="text-sm text-muted">No committee members yet. Add one above.</p> : <ul className="divide-y divide-line">{rows.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-bold text-navy">{row.name}</p><p className="text-xs text-muted">{row.role_title} · {row.is_published ? 'Published' : 'Unpublished'}</p></div><div className="flex gap-3"><button disabled={busy} onClick={() => edit(row)} className="text-xs font-bold text-burgundy hover:underline">Edit</button><button disabled={busy} onClick={() => remove(row)} className="text-xs font-bold text-burgundy-dark hover:underline">Delete</button></div></li>)}</ul>}
    </div>
  </section>;
}
