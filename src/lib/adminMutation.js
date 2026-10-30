// PostgREST can return success with zero affected rows when RLS hides an UPDATE
// or DELETE. A mutation is successful only when exactly one visible row changed.
export function mutationError(result, action = 'change') {
  if (result.error) return result.error.message || `Could not ${action} the record.`;
  if (!Array.isArray(result.data) || result.data.length !== 1) {
    return `No record was ${action}d. It may have been removed or your assigned scope may not allow this action. Refresh and try again.`;
  }
  return '';
}
