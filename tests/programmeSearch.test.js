import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { matchesProgrammeSearch } from '../src/lib/programmeSearch.js';

const programme = { name: 'Malayalam Poetry', item_category: 'ON - STAGE', competition_type: 'General' };

test('programme search matches names case-insensitively and by partial text', () => {
  assert.equal(matchesProgrammeSearch(programme, '  POET  '), true);
  assert.equal(matchesProgrammeSearch(programme, 'essay'), false);
});

test('programme search supports item labels without searching unrelated fields', () => {
  assert.equal(matchesProgrammeSearch(programme, 'on - stage'), true);
  assert.equal(matchesProgrammeSearch(programme, 'General'), false);
});

test('programme search handles empty, missing, Malayalam and canonically equivalent Unicode text', () => {
  assert.equal(matchesProgrammeSearch(programme, '  '), true);
  assert.equal(matchesProgrammeSearch({ name: 'കവിത', item_category: null }, 'വിത'), true);
  assert.equal(matchesProgrammeSearch({ name: 'Café' }, 'CAFE\u0301'), true);
  assert.equal(matchesProgrammeSearch({}, 'missing'), false);
  assert.equal(matchesProgrammeSearch(null, ''), true);
});

test('public programme search reuses the published-only event loader and existing filters', async () => {
  const [hook, eventsPage, searchPage] = await Promise.all([
    readFile(new URL('../src/lib/useEvents.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/EventsPages.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/SearchPage.jsx', import.meta.url), 'utf8'),
  ]);
  assert.match(hook, /\.eq\('is_published', true\)/);
  assert.match(eventsPage, /matchesProgrammeSearch\(event, query\)/);
  assert.match(eventsPage, /!filters\.status/);
  assert.match(eventsPage, /!filters\.day_label/);
  assert.match(eventsPage, /!selectedType/);
  assert.match(searchPage, /const \{ status, data: events, error, refresh \} = usePublicEvents\(\)/);
  assert.match(searchPage, /matchesProgrammeSearch\(event, query\)/);
  assert.match(searchPage, /kind === 'students' \? <StudentSearch \/> : <ProgrammeSearch \/>/);
  assert.match(searchPage, /to=\{`\/events\/\$\{encodeURIComponent\(event\.id\)\}`\}/);
});
