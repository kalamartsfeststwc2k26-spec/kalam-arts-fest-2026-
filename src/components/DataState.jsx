import { AlertCircle, CloudOff, Inbox, LoaderCircle } from 'lucide-react';

const states = {
  loading: { Icon: LoaderCircle, title: 'Loading', description: 'Getting the latest information.' },
  empty: { Icon: Inbox, title: 'Nothing here yet', description: 'There is no published information to show right now.' },
  error: { Icon: AlertCircle, title: 'Could not load this page', description: 'Please try again in a moment.' },
  offline: { Icon: CloudOff, title: 'You are offline', description: 'Reconnect to see the latest festival information.' },
};
export default function DataState({ status, title, description, onRetry }) {
  const state = states[status] || states.empty;
  const Icon = state.Icon;
  return (
    <div role={status === 'error' || status === 'offline' ? 'alert' : 'status'} aria-live="polite" aria-busy={status === 'loading'} className="min-w-0 rounded-panel border border-line bg-white px-5 py-8 shadow-soft sm:px-10 sm:py-12">
      <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-page text-burgundy"><Icon size={19} strokeWidth={1.8} aria-hidden="true" className={status === 'loading' ? 'motion-safe:animate-spin' : ''} /></div>
      <h2 className="text-xl font-bold tracking-[-.025em] text-navy">{title || state.title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">{description || state.description}</p>
      {status === 'loading' && <div aria-hidden="true" className="mt-7 grid max-w-lg gap-3"><div className="h-3 w-4/5 rounded-full bg-page" /><div className="h-3 w-full rounded-full bg-page" /><div className="h-3 w-2/3 rounded-full bg-page" /></div>}
      {onRetry && <button type="button" onClick={onRetry} className="mt-6 rounded-full bg-burgundy px-5 py-2.5 text-sm font-bold text-white transition-colors duration-fast hover:bg-burgundy-dark">Try again</button>}
    </div>
  );
}
