export default function AdminSearch({ label, value, onChange, placeholder, note }) {
  return <div className="mb-4">
    <label className="block text-sm font-semibold text-navy">{label}
      <input type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy" />
    </label>
    {note && <p className="mt-1 text-xs text-muted">{note}</p>}
  </div>;
}
