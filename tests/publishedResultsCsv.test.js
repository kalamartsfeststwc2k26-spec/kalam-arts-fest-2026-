import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CSV_HEADERS, makePublishedResultsCsv, fetchCsvStudentPhotos, downloadPublishedResultsCsv } from '../src/lib/publishedResultsCsv.js';

const published = overrides => ({ id:'r1', status:'published', published_at:'2026-11-01T12:00:00Z', student_id:'s1', student_name:'അമീന, "A"', event_name:'Poetry', placement:1, grade:'A', team_name:'Private team column', points:99, ...overrides });

test('produces only the five requested fields, with UTF-8 BOM, CSV quoting and line endings', () => {
  const csv = makePublishedResultsCsv([published({ event_name:'Poetry\nReading' })], { s1:'https://example.test/photo.png' });
  assert.deepEqual(CSV_HEADERS, ['Student name','Programme name','Position','Grade','Student photo URL']);
  assert.equal(csv, '\uFEFF"Student name","Programme name","Position","Grade","Student photo URL"\r\n"അമീന, ""A""","Poetry\nReading","1","A","https://example.test/photo.png"\r\n');
  assert.doesNotMatch(csv, /Private team column|99|2026-11|r1|s1/);
});

test('retains team-only rows without substituting a team for a student; missing grade and photo are blank', () => {
  const csv = makePublishedResultsCsv([published({ id:'team', student_id:null, student_name:null, team_name:'A Team', grade:null, placement:2 })]);
  assert.ok(csv.endsWith('"","Poetry","2","",""\r\n'));
  assert.doesNotMatch(csv, /A Team/);
});

test('neutralises spreadsheet formula prefixes and leading control characters', () => {
  for (const value of ['=SUM(1,1)', '+123', '-1+2', '@cmd', '  =cmd', '\tvalue', '\rvalue', '\nvalue', '＝cmd', '＋cmd', '－cmd', '＠cmd']) {
    const csv = makePublishedResultsCsv([published({ student_name:value })]);
    assert.ok(csv.split('\r\n')[1].startsWith(`"'`), `not protected: ${JSON.stringify(value)}`);
  }
});

test('rejects empty, duplicate, draft, retracted and incomplete publication rows', () => {
  for (const list of [[], [published(),published()], [published({status:'draft'})], [published({status:'retracted'})], [published({published_at:null})], [published({id:null})]]) {
    assert.throws(() => makePublishedResultsCsv(list));
  }
});

test('photo lookup uses only distinct result student IDs and two necessary public fields', async () => {
  const calls = [];
  const client = { from(table) { calls.push(['from',table]); return { select(fields) { calls.push(['select',fields]); return { async in(field, ids) { calls.push(['in',field,ids]); return {data:[{student_id:'s1',photo_url:' https://example.test/a.jpg '},{student_id:'other',photo_url:'wrong'}],error:null}; } }; } }; } };
  const photos = await fetchCsvStudentPhotos(client, [published(), published({id:'r2'}), published({id:'r3',student_id:null})]);
  assert.deepEqual(calls, [['from','public_team_roster'],['select','student_id,photo_url'],['in','student_id',['s1']]]);
  assert.equal(photos.s1,'https://example.test/a.jpg'); assert.equal(photos.other,undefined);
});

test('photo lookup batches IDs and fails rather than silently reporting missing photos', async () => {
  let count = 0;
  const client = { from() { return { select() { return { async in(_field, ids) { count++; assert.ok(ids.length<=100); return count===2 ? {error:new Error('secret'),data:null} : {data:[],error:null}; } }; } }; } };
  const rows = Array.from({length:101},(_,i) => published({id:`r${i}`,student_id:`s${i}`}));
  await assert.rejects(fetchCsvStudentPhotos(client, rows), /Could not load student photo URLs/);
  assert.equal(count,2);
  assert.deepEqual(Object.keys(await fetchCsvStudentPhotos(null,[published({student_id:null})])),[]);
  await assert.rejects(fetchCsvStudentPhotos(null,[published()]), /Could not load student photo URLs/);
});

test('download makes a CSV Blob and schedules URL cleanup', () => {
  const old = { document:globalThis.document, window:globalThis.window, URL:globalThis.URL };
  let blob, clicked=false, appended=false, removed=false, revoked, scheduled;
  try {
    globalThis.URL = { createObjectURL(value) { blob=value; return 'blob:fixture'; }, revokeObjectURL(value) { revoked=value; } };
    const element = { click() { clicked=true; }, remove() { removed=true; } };
    globalThis.document = { createElement(name) { assert.equal(name,'a'); return element; }, body:{ appendChild(item) { assert.equal(item,element); appended=true; } } };
    globalThis.window = { setTimeout(fn, delay) { scheduled=delay; fn(); } };
    downloadPublishedResultsCsv([published()],{});
    assert.equal(blob.type, 'text/csv;charset=utf-8'); assert.equal(element.href,'blob:fixture'); assert.match(element.download,/^KALAM-published-results-\d{4}-\d{2}-\d{2}\.csv$/);
    assert.ok(clicked && appended && removed); assert.equal(scheduled,60000); assert.equal(revoked,'blob:fixture');
  } finally { Object.assign(globalThis,old); }
});

test('admin export uses the same fresh public-results source as PDF and does not export drafts', async () => {
  const [manager, records, adminPage] = await Promise.all([
    readFile(new URL('../src/components/admin/ResultsManager.jsx',import.meta.url),'utf8'),
    readFile(new URL('../src/lib/publicRecords.js',import.meta.url),'utf8'),
    readFile(new URL('../src/pages/AdminPages.jsx',import.meta.url),'utf8')
  ]);
  assert.match(manager,/async function downloadPublishedCsv\(\)/);
  assert.match(manager,/const results = await fetchResultsData\(\)/);
  assert.match(manager,/fetchCsvStudentPhotos\(supabase, results\)/);
  assert.match(manager,/Download published results as CSV/);
  assert.match(records,/page\('public_published_results', RESULT_FIELDS/);
  assert.match(adminPage,/Super Admin modules/);
  assert.match(adminPage,/tab === 'results' \? <ResultsManager/);
});
