export default function SelectField({ id, label, options, value, onChange, allLabel }) {
  return <label htmlFor={id} className="block text-sm font-semibold text-ink">{label}
    <select id={id} value={value} onChange={onChange} className="mt-2 block w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-medium text-ink focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy">
      <option value="">{allLabel || `All ${label.toLowerCase()}s`}</option>
      {options.map(option => <option value={option} key={option}>{option}</option>)}
    </select>
  </label>;
}
