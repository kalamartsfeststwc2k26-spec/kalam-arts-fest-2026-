import { useEffect, useRef, useState } from 'react';
import { cropStudentPhoto, studentPhotoGeometry, STUDENT_PHOTO_SIZE, MAX_STUDENT_PHOTO_BYTES } from '../../lib/studentPhotoCrop';

export default function StudentPhotoCrop({ photo, onChange, onCropChange, existingUrl, removePhoto, onRemoveChange, disabled }) {
  const [source, setSource] = useState(''); const [dimensions, setDimensions] = useState(null);
  const [zoom, setZoom] = useState(1); const [x, setX] = useState(0); const [y, setY] = useState(0);
  const [error, setError] = useState(''); const input = useRef(null), drag = useRef(null);
  useEffect(() => {
    if (!photo) { setSource(''); setDimensions(null); if (input.current) input.current.value = ''; return undefined; }
    const url = URL.createObjectURL(photo); setSource(url); setDimensions(null);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  function choose(e) {
    const selected=e.target.files?.[0]; setError('');
    if (!selected) { onChange(null); return; }
    if (!['image/png','image/jpeg'].includes(selected.type) || selected.size > MAX_STUDENT_PHOTO_BYTES) {
      e.target.value=''; onChange(null); setError('Choose a PNG or JPEG image no larger than 5 MiB.'); return;
    }
    setZoom(1); setX(0); setY(0); onChange(selected); onRemoveChange(false);
  }
  const geometry = dimensions ? studentPhotoGeometry(dimensions.width,dimensions.height,zoom,x,y) : null;
  function start(e) { if (!geometry || disabled) return; e.currentTarget.setPointerCapture(e.pointerId); drag.current={px:e.clientX,py:e.clientY,x,y}; }
  function move(e) {
    if (!drag.current || !geometry) return; const box=e.currentTarget.getBoundingClientRect();
    const excessX=(geometry.width-STUDENT_PHOTO_SIZE)/STUDENT_PHOTO_SIZE*box.width;
    const excessY=(geometry.height-STUDENT_PHOTO_SIZE)/STUDENT_PHOTO_SIZE*box.height;
    const clamp=value=>Math.max(-100,Math.min(100,value));
    if (excessX>0) setX(clamp(drag.current.x-(e.clientX-drag.current.px)*200/excessX));
    if (excessY>0) setY(clamp(drag.current.y-(e.clientY-drag.current.py)*200/excessY));
  }
  // The parent requests the final blob only after the student record exists.
  useEffect(() => { onCropChange(photo && source && dimensions ? () => cropStudentPhoto(source,dimensions.width,dimensions.height,zoom,x,y,photo.type) : null); }, [photo,source,dimensions,zoom,x,y,onCropChange]);
  return <div className="space-y-3 sm:col-span-2">
    <p className="text-sm font-semibold text-ink">Student photo</p>
    {existingUrl && !removePhoto && !photo && <img src={existingUrl} alt="Current student photo" className="h-28 w-28 rounded-xl object-cover" />}
    <label className="block text-sm font-semibold text-ink">Choose PNG or JPEG image<input ref={input} type="file" accept="image/png,image/jpeg" onChange={choose} disabled={disabled} className="mt-2 block w-full text-sm" /></label>
    <p className="text-xs text-muted">Maximum 5 MiB. Photos appear publicly on the website.</p>
    {error && <p role="alert" className="text-sm text-burgundy">{error}</p>}
    {photo && <div className="max-w-xs space-y-3"><p className="text-sm font-semibold">Crop preview · drag or adjust sliders</p><div className="relative aspect-square overflow-hidden rounded-xl bg-page" style={{touchAction:'none'}} onPointerDown={start} onPointerMove={move} onPointerUp={() => {drag.current=null;}} onPointerCancel={() => {drag.current=null;}}><img src={source} alt="" draggable="false" onLoad={e=>setDimensions({width:e.currentTarget.naturalWidth,height:e.currentTarget.naturalHeight})} onError={()=>{setDimensions(null);setError('Could not open this image. Choose another PNG or JPEG.');}} className="absolute max-w-none select-none" style={geometry ? {width:`${geometry.width/STUDENT_PHOTO_SIZE*100}%`,height:`${geometry.height/STUDENT_PHOTO_SIZE*100}%`,left:`${geometry.left/STUDENT_PHOTO_SIZE*100}%`,top:`${geometry.top/STUDENT_PHOTO_SIZE*100}%`} : {visibility:'hidden'}} /></div>
      <label className="block text-sm">Zoom<input aria-label="Photo zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={e=>setZoom(Number(e.target.value))} className="w-full" /></label>
      <label className="block text-sm">Horizontal position<input aria-label="Photo horizontal position" type="range" min="-100" max="100" value={x} onChange={e=>setX(Number(e.target.value))} className="w-full" /></label>
      <label className="block text-sm">Vertical position<input aria-label="Photo vertical position" type="range" min="-100" max="100" value={y} onChange={e=>setY(Number(e.target.value))} className="w-full" /></label>
      <button type="button" onClick={()=>onChange(null)} className="text-sm font-semibold text-burgundy underline">Cancel selected photo</button></div>}
    {existingUrl && !photo && <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={removePhoto} onChange={e=>onRemoveChange(e.target.checked)} />Remove current photo from student record</label>}
  </div>;
}
