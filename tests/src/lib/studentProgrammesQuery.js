const FIELDS = 'student_id,event_id,event_name,competition_type,item_category,venue,start_time,end_time,day_label';

// Retrieve only one student's published programmes. Stable ordering supports pagination.
export async function fetchStudentProgrammesForClient(studentId, client) {
  if (!client) throw new Error('Supabase is not configured.');
  if (!studentId) throw new Error('Student ID is required.');
  const rows = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await client.from('public_student_programmes')
      .select(FIELDS).eq('student_id', studentId)
      .order('start_time', { ascending: true, nullsFirst: false })
      .order('event_id', { ascending: true }).range(start, start + 499);
    if (error) throw error;
    if (!Array.isArray(data)) throw new Error('Invalid programme response.');
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
