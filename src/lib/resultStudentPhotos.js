// Query only the IDs present in the published results, and only the two fields
// needed for the image. Photo failures must never stop the results from loading.
export async function fetchResultStudentPhotos(client, results) {
  const photos = Object.create(null);
  const ids = [...new Set((results || []).map(row => row.student_id).filter(Boolean))];
  if (!client || !ids.length) return photos;
  for (let start = 0; start < ids.length; start += 100) {
    try {
      const { data, error } = await client.from('public_team_roster')
        .select('student_id,photo_url').in('student_id', ids.slice(start, start + 100));
      if (error || !Array.isArray(data)) continue;
      for (const row of data) {
        if (row.student_id && typeof row.photo_url === 'string' && row.photo_url.trim()) {
          photos[row.student_id] = row.photo_url.trim();
        }
      }
    } catch { /* Results remain available if a photo lookup fails. */ }
  }
  return photos;
}
