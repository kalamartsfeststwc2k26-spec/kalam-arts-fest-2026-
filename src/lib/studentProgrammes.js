import { supabase } from './supabaseClient';
import { fetchStudentProgrammesForClient } from './studentProgrammesQuery';

export function fetchStudentProgrammes(studentId) {
  return fetchStudentProgrammesForClient(studentId, supabase);
}
