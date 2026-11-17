import { mutationError } from '../../lib/adminMutation';
import { studentSaveError } from '../../lib/studentSaveError';
import LoadingInline from '../LoadingInline';
import StudentPhotoCrop from './StudentPhotoCrop';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { readAllAdminRows } from '../../lib/adminRows';

const blank = { name: '', roll_number: '', team_id: '', is_attc: false };
const inputClass = 'mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy';
export default function StudentsManager({ profile, teams = [], onChange }) {
  const superAdmin = profile.role === 'super_admin';
  const [rows,setRows]=useState([]), [form,setForm]=useState(blank), [editing,setEditing]=useState(null);
  const [currentPhoto,setCurrentPhoto]=useState(''), [originalTeam,setOriginalTeam]=useState('');
  const [photo,setPhoto]=useState(null), [removePhoto,setRemovePhoto]=useState(false), [buckets,setBuckets]=useState({});
  const [loading,setLoading]=useState(true), [busy,setBusy]=useState(false), [error,setError]=useState(''), [readError,setReadError]=useState(''), [notice,setNotice]=useState('');
  const cropRef=useRef(null), savingRef=useRef(false);
  const setCrop=useCallback(fn=>{cropRef.current=fn;},[]);
  function selectPhoto(file) { cropRef.current=null; setPhoto(file); }
  async function load() {
    setLoading(true);
    const {data,error:fetchError}=await readAllAdminRows('students','id,name,roll_number,photo_url,team_id,is_attc,division,created_at',query=>{
      const scoped=superAdmin?query:query.eq('team_id',profile.team_id);
      return scoped.order('created_at',{ascending:false}).order('id');
    });
    if(fetchError)setReadError('Could not load students. Please retry.'); else {setRows(data);setReadError('');} setLoading(false);
  }
  async function loadBuckets() {
    const {data,error:err}=await supabase.from('student_photo_bucket_map').select('team_id,bucket_id');
    if(err) {setBuckets({});return;}
    setBuckets(Object.fromEntries((data||[]).map(row=>[row.team_id,row.bucket_id])));
  }
  useEffect(()=>{reset();load();loadBuckets();},[profile.role,profile.team_id]);
  function reset() { setEditing(null);setForm(blank);setCurrentPhoto('');setOriginalTeam('');setPhoto(null);setRemovePhoto(false);cropRef.current=null; }
  function begin(row) { setEditing(row.id);setForm({name:row.name,roll_number:row.roll_number||'',team_id:row.team_id,is_attc:row.is_attc});setCurrentPhoto(row.photo_url||'');setOriginalTeam(row.team_id);setPhoto(null);setRemovePhoto(false);cropRef.current=null;setError('');setNotice('');window.scrollTo({top:0,behavior:'smooth'}); }
  async function save(event) {
    event.preventDefault();setError('');setNotice('');
    const teamId=superAdmin?form.team_id:profile.team_id;
    if(!form.name.trim()){setError('Student name is required.');return;}
    if(!teamId){setError('Choose a team.');return;}
    if(editing && superAdmin && teamId!==originalTeam && currentPhoto && !removePhoto) {setError('To change teams, first select Remove current photo, then save. You can upload a new photo for the new team. The old public image remains in storage.');return;}
    if(photo && (!buckets[teamId] || !cropRef.current)){setError(!buckets[teamId]?'Photo storage is not configured for this team. Contact the Super Admin.':'Wait for the crop preview to load or choose another image.');return;}
    if(savingRef.current)return; savingRef.current=true; setBusy(true);
    let blob=null;
    if(photo) {try {blob=await cropRef.current();} catch {savingRef.current=false;setBusy(false);setError('Could not crop the image. Choose another PNG or JPEG.');return;}}
    let studentId=editing; let savedDetails=false;
    try {
      const shared={name:form.name.trim(),roll_number:form.roll_number.trim()||null};
      if(removePhoto) shared.photo_url=null;
      let result;
      if(editing) result=await supabase.from('students').update(superAdmin?{...shared,team_id:teamId,is_attc:form.is_attc}:shared).eq('id',editing).select('id');
      else if(superAdmin) result=await supabase.from('students').insert({...shared,team_id:teamId,is_attc:form.is_attc}).select('id');
      else result=await supabase.rpc('add_student_to_my_team',{p_name:shared.name,p_roll_number:shared.roll_number,p_photo_url:null});
      const saveError=studentSaveError(result,{groupCreate:!superAdmin&&!editing,action:editing?'update':'create'});
      if(saveError) throw new Error(saveError);
      studentId=editing || (superAdmin?result.data?.[0]?.id:result.data);
      if(!studentId || typeof studentId!=='string') throw new Error('Student save could not be confirmed. Refresh the list before retrying to avoid duplicates.');
      savedDetails=true;setEditing(studentId);setOriginalTeam(teamId);if(removePhoto)setCurrentPhoto('');setRemovePhoto(false);
      if(blob) {
        const bucket=buckets[teamId]; const path=`${studentId}/${crypto.randomUUID()}.${photo.type==='image/png'?'png':'jpg'}`;
        const uploaded=await supabase.storage.from(bucket).upload(path,blob,{contentType:photo.type,cacheControl:'3600',upsert:false});
        if(uploaded.error) throw new Error('The student was saved, but the photo upload could not be confirmed. Check storage before retrying.');
        const url=supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
        const linked=await supabase.from('students').update({photo_url:url}).eq('id',studentId).select('id');
        if(mutationError(linked,'update')) throw new Error('The student was saved, but the photo link could not be confirmed. The public file remains in storage for an owner to review.');
      }
      setNotice('Student saved. Any replaced or removed public photo remains in storage for an owner to review.');reset();await load();onChange?.();
    } catch(cause) {
      setError(savedDetails ? (cause.message || 'Student saved, but the photo could not be confirmed. Review before retrying.') : (cause.message || 'Could not save the student. Check the list before retrying.'));
      if(savedDetails) {await load();onChange?.();}
    } finally {savingRef.current=false;setBusy(false);}
  }
  async function remove(row) {
    if(!window.confirm(`Permanently delete ${row.name} and their registrations? The photo file remains public in storage until an owner removes it.`))return;
    setError('');setNotice('');const deleted=await supabase.from('students').delete().eq('id',row.id).select('id');const deleteError=mutationError(deleted,'delete');
    if(deleteError){setError(deleteError);return;}setNotice('Student deleted. The public photo file remains in storage.');if(editing===row.id)reset();await load();onChange?.();
  }
  return <section className="space-y-6"><div><h2 className="text-xl font-bold text-navy">Students</h2><p className="mt-1 text-sm text-muted">{superAdmin?'Manage students across every team.':`Add students one at a time for ${teams.find(team=>team.id===profile.team_id)?.name||'your assigned team'}. ATTC membership requires Super Admin verification.`}</p></div>
    {notice&&<p role="status" className="rounded-xl bg-page p-4 text-sm font-semibold text-emerald">{notice}</p>}{error&&<p role="alert" className="rounded-xl bg-page p-4 text-sm font-semibold text-burgundy">{error}</p>}
    <form onSubmit={save} className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><h3 className="font-bold text-navy">{editing?'Edit student':'Add one student'}</h3><fieldset disabled={busy} className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold text-ink">Student name *<input value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))} required className={inputClass} /></label>
      <label className="text-sm font-semibold text-ink">Roll number<input value={form.roll_number} onChange={e=>setForm(v=>({...v,roll_number:e.target.value}))} className={inputClass} /></label>
      {superAdmin?<label className="text-sm font-semibold text-ink">Assigned team *<select value={form.team_id} onChange={e=>setForm(v=>({...v,team_id:e.target.value}))} className={inputClass} required><option value="">Choose a team</option>{teams.map(team=><option key={team.id} value={team.id}>{team.name}</option>)}</select></label>:<div className="text-sm font-semibold text-ink">Assigned team<p className="mt-2 rounded-xl bg-page px-3 py-3 font-medium text-navy">{teams.find(team=>team.id===profile.team_id)?.name||'Assigned team'}</p></div>}
      {superAdmin&&<label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={form.is_attc} onChange={e=>setForm(v=>({...v,is_attc:e.target.checked}))} />Verified ATTC category</label>}
      <StudentPhotoCrop photo={photo} onChange={selectPhoto} onCropChange={setCrop} existingUrl={currentPhoto} removePhoto={removePhoto} onRemoveChange={setRemovePhoto} disabled={busy} />
    </fieldset><div className="mt-6 flex gap-3"><button disabled={busy} className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy?'Saving…':editing?'Save student':'Add student'}</button>{editing&&<button type="button" disabled={busy} onClick={reset} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-navy">Cancel edit</button>}</div></form>
    <div className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><div className="mb-4 flex justify-between"><h3 className="font-bold text-navy">Student records</h3><button disabled={busy} onClick={load} className="text-xs font-bold text-burgundy hover:underline">Refresh</button></div>{loading?<LoadingInline label="Loading records…"/>:readError?<p role="alert" className="text-sm text-burgundy">Could not load records. Try Refresh.</p>:!rows.length?<p className="text-sm text-muted">No students entered yet. Add one above.</p>:<ul className="divide-y divide-line">{rows.map(row=><li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-bold text-navy">{row.name}{row.is_attc?' · ATTC':''}</p><p className="text-xs text-muted">{row.roll_number?`Roll ${row.roll_number} · `:''}{teams.find(team=>team.id===row.team_id)?.name||'Assigned team'}</p></div><div className="flex gap-3"><button disabled={busy} onClick={()=>begin(row)} className="text-xs font-bold text-burgundy hover:underline">Edit</button><button disabled={busy} onClick={()=>remove(row)} className="text-xs font-bold text-burgundy-dark hover:underline">Delete</button></div></li>)}</ul>}</div>
  </section>;
}
