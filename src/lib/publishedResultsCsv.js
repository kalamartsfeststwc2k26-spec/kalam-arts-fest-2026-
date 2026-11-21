// CSV is made only from the public published-results view and public roster.
// IDs and publication metadata are used for validation/lookup, never exported.
export const CSV_HEADERS = ['Student name', 'Programme name', 'Position', 'Grade', 'Student photo URL'];

function csvCell(value) {
  let text = String(value ?? '');
  // A quoted CSV cell can still be interpreted as a spreadsheet formula.
  // Prefix a literal apostrophe for potentially dangerous leading characters,
  // including whitespace/control prefixes and full-width formula symbols.
  if (/^[\t\r\n]/u.test(text) || /^[\s\uFEFF]*[=+\-@＝＋－＠]/u.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function makePublishedResultsCsv(results, photos = {}) {
  if (!Array.isArray(results) || !results.length) throw new Error('There are no published results to download.');
  const ids = new Set();
  for (const row of results) {
    if (!row?.id || ids.has(row.id) || row.status !== 'published' || !row.published_at) {
      throw new Error('The results changed during download. Please try again.');
    }
    ids.add(row.id);
  }
  const lines = [CSV_HEADERS, ...results.map(row => [
    row.student_id ? row.student_name ?? '' : '',
    row.event_name ?? '',
    row.placement ?? '',
    row.grade ?? '',
    row.student_id ? photos[row.student_id] ?? '' : '',
  ])];
  // UTF-8 BOM helps spreadsheet apps detect Malayalam; CRLF supports common CSV readers.
  return '\uFEFF' + lines.map(line => line.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

// Unlike the public results cards, an export must not silently omit photos if
// a request fails. Fail the download so the admin can retry instead.
export async function fetchCsvStudentPhotos(client, results) {
  const photos = Object.create(null);
  const ids = [...new Set((results || []).map(row => row.student_id).filter(Boolean))];
  if (!ids.length) return photos;
  if (!client) throw new Error('Could not load student photo URLs. Please try again.');
  for (let start = 0; start < ids.length; start += 100) {
    let response;
    try {
      response = await client.from('public_team_roster')
        .select('student_id,photo_url').in('student_id', ids.slice(start, start + 100));
    } catch {
      throw new Error('Could not load student photo URLs. Please try again.');
    }
    if (response?.error || !Array.isArray(response?.data)) throw new Error('Could not load student photo URLs. Please try again.');
    for (const row of response.data) {
      if (ids.includes(row.student_id) && typeof row.photo_url === 'string' && row.photo_url.trim()) photos[row.student_id] = row.photo_url.trim();
    }
  }
  return photos;
}

export function downloadPublishedResultsCsv(results, photos) {
  const csv = makePublishedResultsCsv(results, photos);
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  try {
    link.href = url;
    link.download = `KALAM-published-results-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    // Allow the browser time to start the download before releasing the object URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
