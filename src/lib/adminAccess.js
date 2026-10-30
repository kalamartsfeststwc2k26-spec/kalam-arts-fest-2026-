// Resolve permissions from the authenticated user's database profile, never from a
// browser-provided role, email address, or a missing/failed lookup.
export async function resolveAdminAccess(client) {
  if (!client) return { status: 'error', profile: null, user: null, message: 'Supabase is not configured.' };
  try {
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw authError;
    const user = authData?.user;
    if (!user) return { status: 'denied', profile: null, user: null, message: 'Sign in with an authorised admin account.' };
    const { data: profile, error: profileError } = await client.from('profiles').select('id,role,team_id,active').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.active || profile.id !== user.id || !['super_admin', 'group_admin'].includes(profile.role)) {
      return { status: 'denied', profile: null, user, message: 'This account has no active admin assignment. Contact a Super Admin.' };
    }
    if (profile.role === 'group_admin') {
      if (!profile.team_id) return { status: 'denied', profile: null, user, message: 'A valid assigned team is required for Group Admin access.' };
      const { data: team, error: teamError } = await client.from('teams').select('id,name').eq('id', profile.team_id).maybeSingle();
      if (teamError) throw teamError;
      if (!team || team.id !== profile.team_id) return { status: 'denied', profile: null, user, message: 'The assigned team is unavailable. Contact a Super Admin.' };
      return { status: 'ready', profile: { ...profile, team }, user, message: '' };
    }
    if (profile.team_id) return { status: 'denied', profile: null, user, message: 'Invalid Super Admin assignment. Contact support.' };
    return { status: 'ready', profile, user, message: '' };
  } catch (cause) {
    return { status: 'error', profile: null, user: null, message: cause?.message || 'Could not verify access. Retry.' };
  }
}
