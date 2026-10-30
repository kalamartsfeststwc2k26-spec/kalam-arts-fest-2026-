export default function LoadingInline({ label = 'Loading records…' }) {
  return <div role="status" aria-live="polite" className="w-full max-w-md rounded-xl bg-page px-4 py-5 text-sm font-medium text-muted">
    <span>{label}</span>
    <div aria-hidden="true" className="mt-4 space-y-2"><div className="h-3 w-full rounded-full bg-white" /><div className="h-3 w-4/5 rounded-full bg-white" /></div>
  </div>;
}
