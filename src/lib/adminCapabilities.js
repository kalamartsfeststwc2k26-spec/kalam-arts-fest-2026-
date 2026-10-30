import { ADMIN_MODULES } from '../constants/adminModules.js';

const ownTeamTabs = [
  { key: 'students', label: 'Students' },
  { key: 'registrations', label: 'Registrations' },
];
const festivalTabs = [
  { key: 'users', label: 'Admin roles & teams' },
  ...ownTeamTabs,
  { key: 'results', label: 'Results' },
  { key: 'team_penalties', label: 'Team minus marks' },
  ...ADMIN_MODULES.map(item => ({ key: item.table, label: item.label })),
  { key: 'audit', label: 'Audit log' },
];

// The UI scope is informational only. PostgreSQL RLS / guarded RPCs enforce it.
export function adminTabsForRole(role) {
  if (role === 'super_admin') return festivalTabs;
  if (role === 'group_admin') return ownTeamTabs;
  return [];
}
