import LoadingInline from '../LoadingInline';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke('manage-group-admin', { body });
  if (error) {
    const detail = await error.context?.json?.().catch(() => null);
    throw new Error(detail?.error || error.message);
  }
  return data;
}
export default function UserManager({ teams = [] }) {
  const [users, setUsers] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [existingId, setExistingId] = useState('');
  const [existingTeamId, setExistingTeamId] = useState('');
  const [email, setEmail] = useState('');
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [readError, setReadError] = useState('');
  const [notice, setNotice] = useState('');
  async function load() {
    setLoading(true); setReadError('');
    try { const data = await invoke({ action: 'list' }); setUsers(data.users || []); setUnassigned(data.unassigned || []); }
    catch (cause) { setReadError(cause.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  async function action(body, success) {
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await invoke(body);
      setNotice(response.warning || `${success} Role and scope change recorded in the audit log.`);
      await load(); setBusy(false); return true;
    } catch (cause) { setError(cause.message); setBusy(false); return false; }
  }
  async function create(event) {
    event.preventDefault();
    if (!email.trim() || !teamId) { setError('Enter an email and choose exactly one team.'); return; }
    if (await action({ action: 'create', email: email.trim(), team_id: teamId }, 'Invitation sent.')) { setEmail(''); setTeamId(''); }
  }
  async function assignExisting(event) {
    event.preventDefault();
    const account = unassigned.find(user => user.id === existingId);
    const team = teams.find(item => item.id === existingTeamId);
    if (!account || !team) { setError('Choose an unassigned account and a valid team.'); return; }
    if (!window.confirm(`Grant Group Admin access to ${account.email} for ${team.name}? Verify this account belongs to the intended organiser. This assignment is audited.`)) return;
    if (await action({ action: 'assign_existing', id: existingId, team_id: existingTeamId }, 'Existing account assigned.')) {
      setExistingId(''); setExistingTeamId('');
    }
  }
  const inputClass = 'mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy';
  return <section className="space-y-6"><div><h2 className="text-xl font-bold text-navy">Group Admin accounts</h2><p className="mt-1 text-sm text-muted">Only a Super Admin can invite, scope, suspend, restore or remove a Group Admin.</p></div>{notice && <p role="status" className="rounded-xl bg-page p-4 text-sm font-semibold text-emerald">{notice}</p>}{error && <p role="alert" className="rounded-xl bg-page p-4 text-sm font-semibold text-burgundy">{error}</p>}
    <form onSubmit={create} className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><h3 className="font-bold text-navy">Invite a new Group Admin</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-ink">Email *<input type="email" value={email} required onChange={e => setEmail(e.target.value)} className={inputClass} /></label><label className="text-sm font-semibold text-ink">Assigned team *<select required value={teamId} onChange={e => setTeamId(e.target.value)} className={inputClass}><option value="">Choose one team</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label></div>{teams.length === 0 && <p className="mt-4 text-sm text-burgundy">Add the three official teams in the Teams module before inviting conveners.</p>}<button disabled={busy || teams.length === 0} className="mt-5 rounded-full bg-burgundy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Working…' : 'Send invite & assign team'}</button><p className="mt-3 text-xs text-muted">Already has a sign-in? Use the verified existing-account assignment below instead of inviting again.</p></form>
    <form onSubmit={assignExisting} className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><h3 className="font-bold text-navy">Assign an existing account</h3><p className="mt-1 text-sm text-muted">These signed-in Auth accounts have no admin profile. Select only a known organiser. Nothing is assigned automatically.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-ink">Unassigned account *<select required value={existingId} onChange={e => setExistingId(e.target.value)} className={inputClass}><option value="">Choose an account</option>{unassigned.map(user => <option key={user.id} value={user.id}>{user.email}</option>)}</select></label><label className="text-sm font-semibold text-ink">Assigned team *<select required value={existingTeamId} onChange={e => setExistingTeamId(e.target.value)} className={inputClass}><option value="">Choose one team</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label></div>{!loading && !readError && !unassigned.length && <p className="mt-3 text-sm text-muted">No unassigned accounts available.</p>}<button disabled={busy || loading || Boolean(readError) || !unassigned.length || !teams.length} className="mt-5 rounded-full bg-burgundy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Working…' : 'Grant Group Admin for selected team'}</button></form>
    <div className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7"><div className="mb-4 flex justify-between"><h3 className="font-bold text-navy">Assigned Group Admins</h3><button onClick={load} className="text-xs font-bold text-burgundy hover:underline">Refresh</button></div>{loading ? <LoadingInline label="Loading accounts…" /> : readError ? <p role="alert" className="text-sm text-burgundy">Could not load accounts. Try Refresh.</p> : !users.length ? <p className="text-sm text-muted">No Group Admin accounts yet. Invite one above; assignment and account controls appear after creation.</p> : <ul className="divide-y divide-line">{users.map(user => <li key={user.id} className="py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="break-all text-sm font-bold text-navy">{user.email || user.id}</p><p className="mt-1 text-xs text-muted">{teams.find(team => team.id === user.team_id)?.name || 'Team missing'} · {user.active ? 'Active' : 'Suspended / revoked'}</p></div><div className="flex flex-wrap gap-3">{user.active ? <button disabled={busy} onClick={() => window.confirm(`Suspend access for ${user.email || user.id} immediately?`) && action({ action: 'suspend', id: user.id }, 'Access suspended.')} className="text-xs font-bold text-burgundy hover:underline">Suspend</button> : <button disabled={busy} onClick={() => action({ action: 'restore', id: user.id }, 'Access restored.')} className="text-xs font-bold text-emerald hover:underline">Restore</button>}{user.active && <button disabled={busy} onClick={() => window.confirm(`Revoke Group Admin access for ${user.email || user.id}?`) && action({ action: 'revoke', id: user.id }, 'Access revoked.')} className="text-xs font-bold text-burgundy hover:underline">Revoke</button>}<button disabled={busy} onClick={() => window.confirm(`Permanently remove ${user.email || user.id}’s Group Admin account?`) && action({ action: 'delete', id: user.id }, 'Account removed.')} className="text-xs font-bold text-burgundy-dark hover:underline">Delete account</button></div></div><label className="mt-3 block max-w-sm text-xs font-semibold text-ink">Change assigned team<select value={user.team_id} disabled={busy} onChange={e => window.confirm(`Assign ${user.email || user.id} to this team? Previous team access will end immediately.`) && action({ action: 'assign', id: user.id, team_id: e.target.value }, 'Team scope changed.')} className={inputClass}>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label></li>)}</ul>}</div>
  </section>;
}
