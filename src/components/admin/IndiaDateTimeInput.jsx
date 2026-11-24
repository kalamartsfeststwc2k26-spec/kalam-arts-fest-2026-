import { indiaInputDraft, indiaInputParts } from '../../lib/indiaTime';

const inputClass = 'mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy';
export default function IndiaDateTimeInput({ label, value, onChange }) {
  const parts = indiaInputParts(value);
  function update(key, next) { onChange(indiaInputDraft({ ...parts, [key]: next })); }
  return <fieldset className="min-w-0 rounded-xl border border-line p-3">
    <legend className="px-1 text-sm font-semibold text-ink">{label} · IST</legend>
    <div className="grid grid-cols-3 gap-2">
      <label className="col-span-3 text-xs font-semibold text-ink">Date<input type="date" className={inputClass} value={parts.date} onChange={e => update('date', e.target.value)} /></label>
      <label className="text-xs font-semibold text-ink">Hour<select className={inputClass} value={parts.hour} onChange={e => update('hour', e.target.value)}><option value="">Hour</option>{Array.from({length:12}, (_, i) => <option key={i+1} value={String(i+1)}>{i+1}</option>)}</select></label>
      <label className="text-xs font-semibold text-ink">Minute<select className={inputClass} value={parts.minute} onChange={e => update('minute', e.target.value)}><option value="">Minute</option>{Array.from({length:60}, (_, i) => { const m=String(i).padStart(2,'0'); return <option key={m} value={m}>{m}</option>; })}</select></label>
      <label className="text-xs font-semibold text-ink">AM / PM<select className={inputClass} value={parts.period} onChange={e => update('period', e.target.value)}><option value="">Choose</option><option value="AM">AM</option><option value="PM">PM</option></select></label>
    </div>
    <button type="button" onClick={() => onChange('')} className="mt-2 text-xs font-bold text-burgundy underline">Clear date and time</button>
    <p className="mt-1 text-xs text-muted">All four fields are needed when a date and time are entered.</p>
  </fieldset>;
}
