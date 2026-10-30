import LoadingInline from '../components/LoadingInline';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, ShieldAlert } from 'lucide-react';
import SectionHeading from '../components/SectionHeading';
import ManagedCollection from '../components/admin/ManagedCollection';
import StudentsManager from '../components/admin/StudentsManager';
import RegistrationsManager from '../components/admin/RegistrationsManager';
import ResultsManager from '../components/admin/ResultsManager';
import TeamPenaltiesManager from '../components/admin/TeamPenaltiesManager';
import UserManager from '../components/admin/UserManager';
import { ADMIN_MODULES } from '../constants/adminModules';
import { adminTabsForRole } from '../lib/adminCapabilities';
import { supabase } from '../lib/supabaseClient';
import { readAllAdminRows } from '../lib/adminRows';
import { useAdminAccess } from '../lib/useAdminAccess';
import { resolveAdminAccess } from '../lib/adminAccess';

const tabClass = active => `rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${active ? 'bg-clay-700 text-white' : 'border border-line bg-white text-navy hover:bg-page'}`;
export function AdminLoginPage() {
  const navigate = useNavigate();
  const access = useAdminAccess();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (access.status === 'ready') navigate('/admin/dashboard', { replace: true }); }, [access.status, navigate]);
  async function signIn(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) throw authError;
      const verified = await resolveAdminAccess(supabase);
      if (verified.status !== 'ready') {
        if (verified.status === 'denied') await supabase.auth.signOut();
        throw new Error(verified.message);
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (cause) { setError(cause.message || 'Sign-in failed.'); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:px-10"><SectionHeading eyebrow="Administration" title="Admin sign in" description="One secure entry point for Super Admins and Group Admins." /><div className="max-w-md rounded-panel border border-line bg-white p-7 shadow-soft sm:p-9"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-page text-burgundy"><LockKeyhole size={23} aria-hidden="true" /></div>{access.status === 'loading' ? <LoadingInline label="Checking your existing session…" /> : access.status === 'ready' ? <p role="status" className="text-sm text-muted">Opening your dashboard…</p> : <form onSubmit={signIn} className="space-y-5"><label className="block text-sm font-semibold text-ink">Email<input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm focus:border-burgundy focus:outline focus:outline-2 focus:outline-burgundy" /></label><label className="block text-sm font-semibold text-ink">Password<input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm focus:border-burgundy focus:outline focus:outline-2 focus:outline-burgundy" /></label>{(error || access.status === 'error') && <p role="alert" className="text-sm font-semibold text-burgundy">{error || access.message}</p>}<button disabled={busy} className="rounded-full bg-burgundy px-6 py-3 text-sm font-bold text-white hover:bg-burgundy-dark disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button></form>}<p className="mt-6 text-xs leading-relaxed text-muted">Role and assigned team are verified from your active database profile. Browser controls never grant permissions.</p></div></div>;
}
function AuditPanel() {
  const [state, setState] = useState({ status: 'loading', rows: [], error: '' });
  async function load() {
    setState(previous => ({ ...previous, status: 'loading' }));
    const { data, error } = await supabase.from('admin_audit_log').select('id,actor_id,action,entity_table,entity_id,occurred_at').order('occurred_at', { ascending: false }).limit(100);
    setState(error ? { status: 'error', rows: [], error: error.message } : { status: 'ready', rows: data, error: '' });
  }
  useEffect(() => { load(); }, []);
  return <div className="rounded-panel border border-line bg-white p-6 shadow-soft"><div className="mb-5 flex justify-between"><h2 className="text-xl font-bold text-navy">Audit log</h2><button onClick={load} className="text-xs font-bold text-burgundy hover:underline">Refresh</button></div>{state.status === 'loading' ? <LoadingInline label="Loading audit records…" /> : state.status === 'error' ? <p role="alert" className="text-sm text-burgundy">{state.error}</p> : !state.rows.length ? <p className="text-sm text-muted">No changes recorded yet.</p> : <ul className="divide-y divide-line">{state.rows.map(row => <li key={row.id} className="py-3 text-sm"><p className="font-bold text-navy">{row.action} · {row.entity_table}</p><p className="mt-1 break-all text-xs text-muted">{new Date(row.occurred_at).toLocaleString('en-IN')} · Actor {row.actor_id || 'trusted server'} · Record {row.entity_id || '—'}</p></li>)}</ul>}</div>;
}
function SuperDashboard({ profile }) {
  const [tab, setTab] = useState('users');
  const [lookups, setLookups] = useState({ teams: [], events: [], students: [] });
  const [lookupsError, setLookupsError] = useState('');
  async function refreshLookups() {
    const [teams, events, students] = await Promise.all([
      readAllAdminRows('teams', 'id,name', query => query.order('name').order('id')),
      readAllAdminRows('events', 'id,name,competition_type,scoring_category,stage_type,is_published', query => query.order('name').order('id')),
      readAllAdminRows('students', 'id,name', query => query.order('name').order('id')),
    ]);
    const error = teams.error || events.error || students.error;
    if (error) setLookupsError(error.message);
    else { setLookups({ teams: teams.data, events: events.data, students: students.data }); setLookupsError(''); }
  }
  useEffect(() => { refreshLookups(); }, []);
  const tabs = adminTabsForRole(profile.role);
  const config = ADMIN_MODULES.find(item => item.table === tab);
  return <div><p className="mb-5 text-sm text-muted">Festival-wide management. Changes are checked by RLS and recorded in the server audit log.</p><nav aria-label="Super Admin modules" className="mb-7 flex flex-wrap gap-2 pb-3">{tabs.map(item => <button key={item.key} onClick={() => setTab(item.key)} className={`${tabClass(tab === item.key)} shrink-0`} aria-pressed={tab === item.key}>{item.label}</button>)}</nav>{lookupsError && <p role="alert" className="mb-5 rounded-xl bg-white p-4 text-sm text-burgundy">{lookupsError}<button onClick={refreshLookups} className="ml-3 font-bold underline">Retry</button></p>}{tab === 'users' ? <UserManager teams={lookups.teams} /> : tab === 'students' ? <StudentsManager profile={profile} teams={lookups.teams} onChange={refreshLookups} /> : tab === 'registrations' ? <RegistrationsManager profile={profile} teams={lookups.teams} /> : tab === 'results' ? <ResultsManager lookups={lookups} onChange={refreshLookups} /> : tab === 'team_penalties' ? <TeamPenaltiesManager teams={lookups.teams} onChange={refreshLookups} /> : tab === 'audit' ? <AuditPanel /> : config ? <ManagedCollection key={tab} config={config} lookups={lookups} onChange={refreshLookups} /> : null}</div>;
}
function GroupDashboard({ profile }) {
  const [tab, setTab] = useState('students');
  const team = profile.team; // Resolved and verified before rendering this dashboard.
  return <div><p className="mb-5 text-sm text-muted">Assigned team: <strong className="text-navy">{team.name}</strong>. You cannot manage other groups, roles or global settings.</p><nav aria-label="Group Admin modules" className="mb-7 flex gap-2">{adminTabsForRole(profile.role).map(item => <button key={item.key} onClick={() => setTab(item.key)} className={tabClass(tab === item.key)} aria-pressed={tab === item.key}>{item.label}</button>)}</nav>{tab === 'students' ? <StudentsManager profile={profile} teams={[team]} /> : <RegistrationsManager profile={profile} teams={[team]} />}</div>;
}
export function AdminDashboardPage() {
  const navigate = useNavigate();
  const access = useAdminAccess();
  const [signingOut, setSigningOut] = useState(false);
  async function signOut() { setSigningOut(true); await supabase?.auth.signOut(); navigate('/admin/login', { replace: true }); }
  return <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:px-10"><div className="flex flex-wrap items-start justify-between gap-4"><SectionHeading eyebrow="Administration" title="Dashboard" description="Your modules depend on your verified role and assigned team." /><button onClick={signOut} disabled={signingOut} className="mb-8 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-navy hover:bg-page">Sign out</button></div>{access.status === 'loading' ? <div className="rounded-panel border border-line bg-white p-8"><LoadingInline label="Verifying your admin access…" /></div> : access.status === 'error' ? <div role="alert" className="rounded-panel border border-line bg-white p-8"><p className="text-sm text-burgundy">{access.message}</p><button onClick={access.retry} className="mt-4 text-sm font-bold text-burgundy underline">Retry access check</button></div> : access.status === 'denied' ? <div role="alert" className="rounded-panel border border-line bg-white p-8"><ShieldAlert size={25} className="text-burgundy" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold text-navy">Access denied</h2><p className="mt-2 text-sm text-muted">{access.message}</p><Link to="/admin/login" className="mt-5 inline-block text-sm font-bold text-burgundy hover:underline">Go to sign in</Link></div> : access.profile.role === 'super_admin' ? <SuperDashboard profile={access.profile} /> : <GroupDashboard profile={access.profile} />}</div>;
}
