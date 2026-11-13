import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { BANNER_HEIGHT, BANNER_WIDTH, cropBannerImage, cropGeometry, MAX_IMAGE_BYTES } from '../../lib/bannerCrop';

const BUCKET = 'kalam-about-banners';
const empty = { alt_text: '', sort_order: 0, is_published: false };
const inputClass = 'mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy';
const buttonClass = 'rounded-full border border-line px-4 py-2 text-sm font-semibold text-navy hover:bg-page disabled:opacity-50';

export default function AboutBannerManager() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [source, setSource] = useState('');
  const [dimensions, setDimensions] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const drag = useRef(null);
  const fileInput = useRef(null);

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase.from('about_banners').select('id,object_path,alt_text,sort_order,is_published').order('sort_order').order('id');
    if (err) setError('Could not load banners. Check that banner setup and permissions are installed.');
    else setRows(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!file) { setSource(''); setDimensions(null); return undefined; }
    const url = URL.createObjectURL(file); setSource(url); setDimensions(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function reset() {
    setEditing(null); setForm(empty); setFile(null); setZoom(1); setX(0); setY(0);
    if (fileInput.current) fileInput.current.value = '';
  }
  function edit(row) {
    reset(); setEditing(row); setForm({ alt_text: row.alt_text, sort_order: row.sort_order, is_published: row.is_published }); setNotice(''); setError('');
    document.getElementById('about-banner-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function chooseFile(event) {
    const selected = event.target.files?.[0]; setError('');
    if (!selected) { setFile(null); return; }
    if (!['image/png', 'image/jpeg'].includes(selected.type) || selected.size > MAX_IMAGE_BYTES) {
      setFile(null); event.target.value = ''; setError('Choose a PNG or JPG up to 5 MiB.'); return;
    }
    setFile(selected); setZoom(1); setX(0); setY(0);
  }
  const geometry = dimensions ? cropGeometry(dimensions.width, dimensions.height, zoom, x, y) : null;
  function onPointerDown(event) {
    if (!geometry) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, px: x, py: y, width: rect.width, height: rect.height, geo: geometry };
  }
  function onPointerMove(event) {
    const d = drag.current; if (!d || d.pointerId !== event.pointerId) return;
    const overflowX = d.width * (d.geo.width / BANNER_WIDTH - 1);
    const overflowY = d.height * (d.geo.height / BANNER_HEIGHT - 1);
    const clamp = value => Math.max(-100, Math.min(100, value));
    if (overflowX > 0.1) setX(clamp(d.px - (event.clientX - d.x) / overflowX * 200));
    if (overflowY > 0.1) setY(clamp(d.py - (event.clientY - d.y) / overflowY * 200));
  }
  async function save(event) {
    event.preventDefault(); setError(''); setNotice('');
    const alt = form.alt_text.trim();
    if (!alt || alt.length > 180) { setError('Enter an image description of up to 180 characters.'); return; }
    if (!Number.isInteger(Number(form.sort_order))) { setError('Display order must be a whole number.'); return; }
    if (!editing && !file) { setError('Choose an image first.'); return; }
    if (file && (!dimensions || !source)) { setError('Wait for the image preview to load.'); return; }
    setBusy(true); let uploaded = null;
    try {
      if (file) {
        const blob = await cropBannerImage(source, dimensions.width, dimensions.height, zoom, x, y, file.type);
        const path = `banners/${crypto.randomUUID()}.${file.type === 'image/png' ? 'png' : 'jpg'}`;
        const result = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: file.type, cacheControl: '3600', upsert: false });
        if (result.error) throw new Error('Upload could not be confirmed. Check your connection and permissions; an unused public file may remain in the bucket.');
        uploaded = path;
      }
      const payload = { alt_text: alt, sort_order: Number(form.sort_order), is_published: form.is_published, object_path: uploaded || editing.object_path };
      const result = editing ? await supabase.from('about_banners').update(payload).eq('id', editing.id).select('id') : await supabase.from('about_banners').insert(payload).select('id');
      if (result.error || result.data?.length !== 1) throw new Error('Could not save the banner record. Check your permissions and try again.');
      const replaced = Boolean(editing && uploaded);
      uploaded = null;
      reset(); await load();
      setNotice(replaced ? 'Banner saved. The previous public file remains in storage; ask a Supabase dashboard owner to remove it if no longer needed.' : 'Banner saved.');
    } catch (cause) {
      let message = cause.message || 'Could not save the banner.';
      // A failed response does not prove the database rejected the record; never
      // delete an uploaded file here because a record may already reference it.
      if (uploaded) message += ' The file was uploaded, but the record could not be confirmed. Refresh and ask a Supabase dashboard owner to check for unused files.';
      setError(message);
    } finally { setBusy(false); }
  }
  async function remove(row) {
    if (!window.confirm('Remove this banner from the site? Its public image file will remain in storage until a Supabase dashboard owner removes it.')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await supabase.from('about_banners').delete().eq('id', row.id).select('id');
      if (result.error || result.data?.length !== 1) throw new Error('Could not confirm that the banner record was removed. Refresh and check before retrying.');
      if (editing?.id === row.id) reset();
      await load(); setNotice('Banner removed from the site. The public file remains in storage; ask a Supabase dashboard owner to remove it if no longer needed.');
    } catch (cause) { setError(cause.message || 'Could not remove the banner.'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-6">
    <div><h2 className="text-xl font-bold text-navy">About banner</h2><p className="mt-1 text-sm text-muted">Upload, crop and publish festival images. Files in this public bucket can be viewed by anyone with their URL, even when hidden.</p></div>
    {error && <p role="alert" className="rounded-xl bg-page p-4 text-sm font-semibold text-burgundy">{error}</p>}{notice && <p role="status" className="rounded-xl bg-page p-4 text-sm font-semibold text-emerald">{notice}</p>}
    <form id="about-banner-editor" onSubmit={save} className="space-y-5 rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7">
      <h3 className="font-bold text-navy">{editing ? 'Edit banner' : 'Add banner'}</h3>
      <label className="block text-sm font-semibold text-ink">{editing ? 'Replace image (optional)' : 'Choose image'}<input ref={fileInput} type="file" accept="image/jpeg,image/png" onChange={chooseFile} className={inputClass} /></label>
      <p className="text-xs text-muted">PNG or JPG, up to 5 MiB. Only the cropped version is stored; keep the original if you want to crop it again later.</p>
      {file && source && <div className="max-w-lg space-y-3"><p className="text-sm font-semibold text-ink">Crop preview · drag the image or use the sliders</p>
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-page" style={{touchAction:'none'}} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
          <img src={source} alt="" draggable="false" onLoad={event => setDimensions({width:event.currentTarget.naturalWidth,height:event.currentTarget.naturalHeight})} onError={() => { setDimensions(null); setError('This image could not be opened. Choose a valid PNG or JPG.'); }} className="absolute max-w-none select-none" style={geometry ? {width:`${geometry.width / BANNER_WIDTH * 100}%`,height:`${geometry.height / BANNER_HEIGHT * 100}%`,left:`${geometry.left / BANNER_WIDTH * 100}%`,top:`${geometry.top / BANNER_HEIGHT * 100}%`} : {visibility:'hidden'}} />
        </div>
        <label className="block text-sm font-semibold text-ink">Zoom <input aria-label="Zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full" /></label>
        <label className="block text-sm font-semibold text-ink">Horizontal position <input aria-label="Horizontal crop position" type="range" min="-100" max="100" value={x} onChange={e => setX(Number(e.target.value))} className="w-full" /></label>
        <label className="block text-sm font-semibold text-ink">Vertical position <input aria-label="Vertical crop position" type="range" min="-100" max="100" value={y} onChange={e => setY(Number(e.target.value))} className="w-full" /></label>
      </div>}
      <label className="block text-sm font-semibold text-ink">Image description (alt text) *<input className={inputClass} required maxLength={180} value={form.alt_text} onChange={e => setForm(v => ({...v, alt_text:e.target.value}))} /></label>
      <label className="block max-w-xs text-sm font-semibold text-ink">Display order<input className={inputClass} type="number" step="1" required value={form.sort_order} onChange={e => setForm(v => ({...v, sort_order:e.target.value}))} /></label>
      <label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={form.is_published} onChange={e => setForm(v => ({...v,is_published:e.target.checked}))} />Show in banner</label>
      <div className="flex flex-wrap gap-3"><button disabled={busy} className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save banner'}</button>{editing && <button type="button" disabled={busy} onClick={reset} className={buttonClass}>Cancel edit</button>}</div>
    </form>
    <div className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><div className="flex items-center justify-between"><h3 className="font-bold text-navy">Images</h3><button type="button" disabled={busy} onClick={load} className={buttonClass}>Refresh</button></div>
      {loading ? <p className="mt-4 text-sm text-muted">Loading…</p> : !rows.length ? <p className="mt-4 text-sm text-muted">No banner images yet.</p> : <ul className="mt-4 divide-y divide-line">{rows.map(row => <li key={row.id} className="flex flex-wrap items-center gap-4 py-4"><img src={supabase.storage.from(BUCKET).getPublicUrl(row.object_path).data.publicUrl} alt="" className="h-20 w-28 rounded-lg bg-page object-cover" /><div className="min-w-0 flex-1"><p className="break-words text-sm font-bold text-navy">{row.alt_text}</p><p className="text-xs text-muted">Order {row.sort_order} · {row.is_published ? 'Published' : 'Hidden'}</p></div><button type="button" disabled={busy} onClick={() => edit(row)} className={buttonClass}>Edit</button><button type="button" disabled={busy} onClick={() => remove(row)} className={buttonClass}>Remove</button></li>)}</ul>}
    </div>
  </section>;
}
