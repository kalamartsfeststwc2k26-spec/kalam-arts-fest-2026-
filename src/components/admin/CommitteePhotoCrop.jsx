import { useEffect, useRef, useState } from 'react';
import { cropCommitteePhoto, committeePhotoGeometry, COMMITTEE_PHOTO_SIZE, MAX_COMMITTEE_PHOTO_BYTES } from '../../lib/committeePhotoCrop';

export default function CommitteePhotoCrop({ photo, onChange, onCropChange, disabled }) {
  const [source, setSource] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [error, setError] = useState('');
  const input = useRef(null), drag = useRef(null);
  useEffect(() => {
    if (!photo) { setSource(null); setDimensions(null); if (input.current) input.current.value = ''; return undefined; }
    const url = URL.createObjectURL(photo);
    setDimensions(null); setSource({ file: photo, url });
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useEffect(() => {
    onCropChange(photo && source?.file === photo && dimensions ? () => cropCommitteePhoto(source.url, dimensions.width, dimensions.height, zoom, x, y, photo.type) : null);
  }, [photo, source, dimensions, zoom, x, y, onCropChange]);
  function choose(event) {
    const selected = event.target.files?.[0]; setError('');
    if (!selected) { onChange(null); return; }
    if (!['image/png', 'image/jpeg'].includes(selected.type) || selected.size > MAX_COMMITTEE_PHOTO_BYTES) {
      event.target.value = ''; onChange(null); setError('Choose a PNG or JPEG image no larger than 5 MiB.'); return;
    }
    setZoom(1); setX(0); setY(0); onChange(selected);
  }
  const rect = source?.file === photo && dimensions ? committeePhotoGeometry(dimensions.width, dimensions.height, zoom, x, y) : null;
  function start(event) {
    if (!rect || disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { px: event.clientX, py: event.clientY, x, y };
  }
  function move(event) {
    if (!drag.current || !rect) return;
    const box = event.currentTarget.getBoundingClientRect();
    const excessX = (rect.width - COMMITTEE_PHOTO_SIZE) / COMMITTEE_PHOTO_SIZE * box.width;
    const excessY = (rect.height - COMMITTEE_PHOTO_SIZE) / COMMITTEE_PHOTO_SIZE * box.height;
    const clamp = value => Math.max(-100, Math.min(100, value));
    if (excessX > 0) setX(clamp(drag.current.x - (event.clientX - drag.current.px) * 200 / excessX));
    if (excessY > 0) setY(clamp(drag.current.y - (event.clientY - drag.current.py) * 200 / excessY));
  }
  return <div className="space-y-3 sm:col-span-2">
    <label className="block text-sm font-semibold text-ink">Choose a committee photo<input ref={input} type="file" accept="image/png,image/jpeg" onChange={choose} disabled={disabled} className="mt-2 block w-full text-sm" /></label>
    <p className="text-xs text-muted">PNG or JPEG, maximum 5 MiB. Uploaded photos are publicly accessible to anyone with the link.</p>
    {error && <p role="alert" className="text-sm text-burgundy">{error}</p>}
    {photo && <div className="max-w-xs space-y-3"><p className="text-sm font-semibold">Crop preview · drag or adjust sliders</p>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-page" style={{ touchAction: 'none' }} onPointerDown={start} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
        {source?.file === photo && <img src={source.url} alt="" draggable="false" onLoad={event => setDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} onError={() => { setDimensions(null); setError('Could not open this image. Choose another PNG or JPEG.'); }} className="absolute max-w-none select-none" style={rect ? { width: `${rect.width / COMMITTEE_PHOTO_SIZE * 100}%`, height: `${rect.height / COMMITTEE_PHOTO_SIZE * 100}%`, left: `${rect.left / COMMITTEE_PHOTO_SIZE * 100}%`, top: `${rect.top / COMMITTEE_PHOTO_SIZE * 100}%` } : { visibility: 'hidden' }} />}
      </div>
      <label className="block text-sm">Zoom<input aria-label="Photo zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={event => setZoom(Number(event.target.value))} className="w-full" /></label>
      <label className="block text-sm">Horizontal position<input aria-label="Photo horizontal position" type="range" min="-100" max="100" value={x} onChange={event => setX(Number(event.target.value))} className="w-full" /></label>
      <label className="block text-sm">Vertical position<input aria-label="Photo vertical position" type="range" min="-100" max="100" value={y} onChange={event => setY(Number(event.target.value))} className="w-full" /></label>
      <button type="button" onClick={() => onChange(null)} className="text-sm font-semibold text-burgundy underline">Cancel selected photo</button>
    </div>}
  </div>;
}
