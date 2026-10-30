import { useState } from 'react';
import { MAX_IMPORT_ROWS, previewExcelRows, registrationTemplate, studentTemplate } from '../../lib/excelImport';

export default function ExcelImportPanel({ kind, teamName, students = [], events = [], registrations = [], saveRow, onComplete, disabled = false }) {
  const [preview, setPreview] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isStudents = kind === 'students';
  const title = isStudents ? 'Student Excel template' : 'Registration Excel template';
  const inputId = `excel-${kind}-upload`;

  async function download() {
    setError(''); setBusy(true);
    try {
      const { default: writeExcelFile } = await import('write-excel-file/browser');
      const sheets = isStudents ? studentTemplate(teamName) : registrationTemplate(teamName, students, events);
      await writeExcelFile(sheets).toFile(isStudents ? 'KALAM_team_students_template.xlsx' : 'KALAM_team_registrations_template.xlsx');
    } catch { setError('Could not create the template. Please try again.'); }
    finally { setBusy(false); }
  }

  async function chooseFile(event) {
    const file = event.target.files?.[0];
    setPreview(null); setFeedback([]); setError('');
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xlsx') || file.size > 2_000_000) {
      setError('Choose an .xlsx file up to 2 MB.'); return;
    }
    setBusy(true);
    try {
      const { readSheet } = await import('read-excel-file/browser');
      const sheet = await readSheet(file, isStudents ? 'Students' : 'Registrations');
      const rows = previewExcelRows(sheet, kind, { students, events, registrations });
      if (!rows.length) throw new Error('The template has no filled rows.');
      setPreview(rows);
    } catch (cause) { setError(cause.message || 'Could not read this Excel file. Download a fresh template and try again.'); }
    finally { setBusy(false); event.target.value = ''; }
  }

  async function importRows() {
    const ready = preview?.filter(row => row.status === 'ready') || [];
    if (!ready.length || disabled || busy) return;
    if (!window.confirm(`Import ${ready.length} new ${isStudents ? 'students' : 'registrations'} for ${teamName}? Existing rows will not be overwritten. Import may partially succeed if the server rejects a row.`)) return;
    setBusy(true); setError('');
    const outcomes = [];
    for (const row of ready) {
      try {
        const result = await saveRow(row.values);
        if (result.error) outcomes.push({ line: row.line, status: result.error.code === '23505' ? 'skip' : 'failed', reason: result.error.message || 'Server rejected the row.' });
        else outcomes.push({ line: row.line, status: 'added', reason: row.label });
      } catch { outcomes.push({ line: row.line, status: 'failed', reason: 'Network error. Check this row before retrying.' }); }
    }
    setFeedback([...preview.filter(row => row.status !== 'ready'), ...outcomes].sort((a, b) => a.line - b.line));
    setPreview(null); // Never silently resubmit successfully imported rows.
    try { await onComplete?.(); }
    catch { setError('Import finished, but the list could not refresh. Refresh the page before importing again.'); }
    finally { setBusy(false); }
  }

  const readyCount = preview?.filter(row => row.status === 'ready').length || 0;
  return <section className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7" aria-labelledby={`${inputId}-title`}>
    <h3 id={`${inputId}-title`} className="text-lg font-bold text-navy">{title}</h3>
    <p className="mt-2 text-sm text-muted">Keep using the manual form above, or download a template, fill it in Excel and upload the completed .xlsx here. This adds new records only for your assigned team; it never replaces existing records. Up to {MAX_IMPORT_ROWS} filled rows per upload.</p>
    {!isStudents && <p className="mt-2 text-sm text-muted">Import students first, then download a new registration template. Copy IDs from its Students and Programmes reference sheets. Eligibility and registration limits are checked by the server.</p>}
    <div className="mt-4 flex flex-wrap items-end gap-4"><button type="button" onClick={download} disabled={busy || disabled} className="rounded-full border border-line bg-page px-4 py-2.5 text-sm font-bold text-navy hover:bg-white disabled:opacity-50">Download .xlsx template</button>
      <label htmlFor={inputId} className="text-sm font-semibold text-navy">Upload completed .xlsx<input id={inputId} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={chooseFile} disabled={busy || disabled} className="mt-1 block w-full max-w-xs text-sm font-normal text-ink file:mr-3 file:rounded-full file:border-0 file:bg-page file:px-4 file:py-2 file:font-semibold file:text-navy" /></label></div>
    {busy && <p role="status" className="mt-3 text-sm text-navy">Processing Excel file. Please keep this page open…</p>}
    {error && <p role="alert" className="mt-3 text-sm font-semibold text-burgundy">{error}</p>}
    {preview && <div className="mt-5 rounded-xl border border-line bg-page p-4"><p role="status" className="text-sm font-bold text-navy">Preview: {readyCount} ready, {preview.filter(row => row.status === 'skip').length} duplicates skipped, {preview.filter(row => row.status === 'invalid').length} invalid. No rows have been saved yet.</p><ul className="mt-2 max-h-48 overflow-y-auto text-sm text-ink">{preview.slice(0, 25).map(row => <li key={row.line}>Row {row.line}: {row.status} — {row.label || row.reason}</li>)}</ul>{preview.length > 25 && <p className="mt-2 text-xs">Showing first 25 of {preview.length} rows.</p>}<div className="mt-4 flex gap-3"><button type="button" onClick={importRows} disabled={!readyCount || busy || disabled} className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">Import {readyCount} new {isStudents ? 'students' : 'registrations'}</button><button type="button" onClick={() => setPreview(null)} disabled={busy} className="text-sm font-bold text-navy underline">Cancel</button></div></div>}
    {feedback.length > 0 && <div role="status" className="mt-5 rounded-xl border border-line bg-page p-4"><p className="text-sm font-bold text-navy">Import complete: {feedback.filter(row => row.status === 'added').length} added, {feedback.filter(row => row.status === 'skip').length} skipped, {feedback.filter(row => row.status === 'invalid' || row.status === 'failed').length} not imported.</p><ul className="mt-2 max-h-48 overflow-y-auto text-sm text-ink">{feedback.slice(0, 40).map(row => <li key={row.line}>Row {row.line}: {row.status} — {row.reason}</li>)}</ul>{feedback.length > 40 && <p className="mt-2 text-xs">Showing first 40 of {feedback.length} rows.</p>}</div>}
  </section>;
}
