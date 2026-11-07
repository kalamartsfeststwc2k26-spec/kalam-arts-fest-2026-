import { mutationError } from './adminMutation.js';

// Never surface raw database error text in the student editor. Only this
// specifically identified index violation is described as a roll conflict.
export function studentSaveError(result, { groupCreate = false, action = 'change' } = {}) {
  if (!result || typeof result !== 'object') return 'Could not save the student. Please try again.';

  const error = result.error;

  if (error) {
    const isRollConflict = error.code === '23505' &&
      typeof error.message === 'string' &&
      error.message.includes('students_roll_number_canonical_unique');

    return isRollConflict
      ? 'This roll number may already be in use. Please check it or ask a Super Admin to review.'
      : 'Could not save the student. Check the details and try again.';
  }

  return groupCreate ? '' : mutationError(result, action);
}
