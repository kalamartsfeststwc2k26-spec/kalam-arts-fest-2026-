export const STUDENT_HEADERS = ['Student name', 'Roll number', 'Photo URL'];
export const REGISTRATION_HEADERS = ['Student ID', 'Programme ID'];
export const MAX_IMPORT_ROWS = 250;
const tidy = value => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
const key = value => tidy(value).toLocaleLowerCase();
const hasContent = row => Array.isArray(row) && row.some(value => value !== null && value !== undefined && String(value).trim() !== '');

// The first worksheet is a strict data template; the other sheets are read-only references.
export function previewExcelRows(sheet, kind, { students = [], events = [], registrations = [] } = {}) {
  const headers = kind === 'students' ? STUDENT_HEADERS : REGISTRATION_HEADERS;
  if (!Array.isArray(sheet) || !sheet.length || headers.some((header, i) => tidy(sheet[0]?.[i]) !== header)) {
    throw new Error(`Use the ${kind === 'students' ? 'Students' : 'Registrations'} template. Do not rename its column headings.`);
  }
  const nonempty = sheet.slice(1).map((cells, i) => ({ cells, line: i + 2 })).filter(({ cells }) => hasContent(cells));
  if (nonempty.length > MAX_IMPORT_ROWS) throw new Error(`Upload no more than ${MAX_IMPORT_ROWS} filled rows at a time.`);
  const seen = new Set();
  const existingRolls = new Set(students.map(s => key(s.roll_number)).filter(Boolean));
  const existingNames = new Set(students.map(s => key(s.name)));
  const existingPairs = new Set(registrations.map(r => `${r.student_id}:${r.event_id}`));
  const studentIds = new Set(students.map(s => s.id));
  const eventIds = new Set(events.map(e => e.id));
  return nonempty.map(({ cells, line }) => {
    const row = Array.isArray(cells) ? cells : [];
    if (row.slice(headers.length).some(value => value !== null && value !== undefined && String(value).trim() !== '')) {
      return { line, status: 'invalid', reason: 'Unexpected extra column. Use the template headings.' };
    }
    if (kind === 'students') {
      const [name, roll_number, photo_url] = row.map(tidy);
      if (!name || name.length > 200 || roll_number?.length > 80 || photo_url?.length > 500) {
        return { line, status: 'invalid', reason: 'Provide a student name (up to 200 characters); check roll number and photo URL lengths.' };
      }
      if (photo_url && !/^https:\/\//i.test(photo_url)) return { line, status: 'invalid', reason: 'Photo URL must begin with https:// or be blank.' };
      const identity = roll_number ? `roll:${key(roll_number)}` : `name:${key(name)}`;
      if (seen.has(identity) || (roll_number ? existingRolls.has(key(roll_number)) : existingNames.has(key(name)) || seen.has(`name:${key(name)}`))) {
        return { line, status: 'skip', reason: 'Duplicate student or roll number; existing records are not overwritten.' };
      }
      seen.add(identity);
      return { line, status: 'ready', label: name, values: { name, roll_number: roll_number || null, photo_url: photo_url || null } };
    }
    const student_id = tidy(row[0]);
    const event_id = tidy(row[1]);
    if (!studentIds.has(student_id)) return { line, status: 'invalid', reason: 'Student ID is not in your team reference sheet. Refresh and download a new template.' };
    if (!eventIds.has(event_id)) return { line, status: 'invalid', reason: 'Programme ID is not a currently published programme. Refresh and download a new template.' };
    const pair = `${student_id}:${event_id}`;
    if (existingPairs.has(pair) || seen.has(pair)) return { line, status: 'skip', reason: 'This registration already exists or is repeated in the file.' };
    seen.add(pair);
    return { line, status: 'ready', label: `${students.find(s => s.id === student_id)?.name} → ${events.find(e => e.id === event_id)?.name}`, values: { student_id, event_id } };
  });
}

export function studentTemplate(teamName) {
  return [
    { sheet: 'Students', data: [STUDENT_HEADERS, ...Array.from({ length: 15 }, () => [null, null, null])], columns: [{ width: 30 }, { width: 22 }, { width: 55 }] },
    { sheet: 'Instructions', data: [
      ['Team', teamName],
      ['How to use', 'Fill the Students sheet, save as .xlsx, then upload it in your own Students tab.'],
      ['Student name', 'Required. Enter each new student once.'],
      ['Roll number', 'Optional. Format this column as Text in Excel to preserve leading zeros.'],
      ['Photo URL', 'Optional HTTPS link. Do not paste image files into cells.'],
      ['Permissions', 'Your assigned team is set by the server. ATTC verification requires Super Admin. Existing students are skipped, not updated.'],
    ] }
  ];
}

export function registrationTemplate(teamName, students, events) {
  return [
    { sheet: 'Registrations', data: [REGISTRATION_HEADERS, ...Array.from({ length: 15 }, () => [null, null])], columns: [{ width: 42 }, { width: 42 }] },
    { sheet: 'Students', data: [['Student ID', 'Student name', 'Roll number'], ...students.map(s => [s.id, s.name, s.roll_number || ''])], columns: [{ width: 42 }, { width: 32 }, { width: 22 }] },
    { sheet: 'Programmes', data: [['Programme ID', 'Programme name', 'Competition category', 'Stage format'], ...events.map(e => [e.id, e.name, e.competition_type, e.stage_type || ''])], columns: [{ width: 42 }, { width: 35 }, { width: 24 }, { width: 20 }] },
    { sheet: 'Instructions', data: [
      ['Team', teamName],
      ['How to use', 'Copy a Student ID from the Students sheet and a Programme ID from Programmes into each Registrations row. Save and upload this .xlsx.'],
      ['Before importing', 'Import new students in the Students tab first, then download a fresh Registrations template.'],
      ['Limits', 'The server checks published programmes, ATTC eligibility, team permissions and 3 On-stage / 3 Non-stage / 4 General maximums.'],
      ['Existing entries', 'Duplicates are skipped. No existing registration is changed or deleted.'],
    ] }
  ];
}
