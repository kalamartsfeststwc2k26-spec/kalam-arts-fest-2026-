// Client-side review aid only. The database revalidates the selection and permissions.
export function evaluateDraftSelection(rows, selectedIds, events) {
  if (
    !Array.isArray(selectedIds) ||
    selectedIds.length === 0 ||
    selectedIds.length > 500 ||
    new Set(selectedIds).size !== selectedIds.length
  ) {
    return {
      valid: false,
      message: 'Select between 1 and 500 distinct draft results.',
    };
  }

  const chosen = rows.filter(row => selectedIds.includes(row.id));

  if (
    chosen.length !== selectedIds.length ||
    chosen.some(row => row.status !== 'draft')
  ) {
    return {
      valid: false,
      message: 'The selection changed. Refresh and review the draft results again.',
    };
  }

  const eventNames = [];

  for (const row of chosen) {
    const event = events.find(item => item.id === row.event_id);

    if (!event?.is_published) {
      return {
        valid: false,
        message: 'Publish the event before publishing its results.',
      };
    }

    if (!eventNames.includes(event.name)) {
      eventNames.push(event.name);
    }
  }

  return {
    valid: true,
    count: chosen.length,
    eventNames,
  };
}
