// Search only fields already exposed in published programme cards.
function normalise(value) {
  return String(value ?? '').normalize('NFC').toLocaleLowerCase();
}

export function matchesProgrammeSearch(programme, query) {
  const needle = normalise(query).trim();
  if (!needle) return true;
  return [programme?.name, programme?.item_category].some(value => normalise(value).includes(needle));
}
