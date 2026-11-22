// Match within the fields deliberately exposed by each admin list.
export function matchesAdminSearch(query, ...values) {
  const needle = String(query ?? '').trim().toLocaleLowerCase();
  return !needle || values.some(value => value != null && String(value).toLocaleLowerCase().includes(needle));
}
