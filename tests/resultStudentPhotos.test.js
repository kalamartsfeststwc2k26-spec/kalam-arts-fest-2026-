import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fetchResultStudentPhotos } from '../src/lib/resultStudentPhotos.js';

function fakeClient(callback) {
  const calls = [];
  return {
    calls,
    from(table) {
      return { select(fields) { return { in(key, ids) {
        calls.push({ table, fields, key, ids });
        return callback(ids, calls.length);
      }}; }};
    },
  };
}

test('looks up only distinct individual result IDs and the two required fields', async () => {
  const client = fakeClient(async () => ({ data: [
    { student_id: 'one', photo_url: ' https://example.com/a.jpg ' },
    { student_id: 'two', photo_url: null },
  ], error: null }));
  const result = await fetchResultStudentPhotos(client, [
    { student_id: 'one' }, { student_id: 'one' }, { student_id: 'two' }, { student_id: null },
  ]);
  assert.deepEqual(client.calls, [{ table: 'public_team_roster', fields: 'student_id,photo_url', key: 'student_id', ids: ['one', 'two'] }]);
  assert.equal(result.one, 'https://example.com/a.jpg');
  assert.equal(result.two, undefined);
});

test('does not query for empty and team-only results', async () => {
  const client = fakeClient(() => { throw new Error('unexpected call'); });
  assert.deepEqual(Object.keys(await fetchResultStudentPhotos(client, [{ student_id: null }, {}])), []);
  assert.equal(client.calls.length, 0);
  assert.deepEqual(Object.keys(await fetchResultStudentPhotos(null, [])), []);
});

test('batches large lookups and preserves successful photos if another batch fails', async () => {
  const client = fakeClient(async (ids, count) => count === 1
    ? { data: ids.map(id => ({ student_id: id, photo_url: `https://example.com/${id}.jpg` })), error: null }
    : { data: null, error: new Error('lookup failed') });
  const results = Array.from({ length: 105 }, (_, index) => ({ student_id: `id-${index}` }));
  const photos = await fetchResultStudentPhotos(client, results);
  assert.deepEqual(client.calls.map(call => call.ids.length), [100, 5]);
  assert.equal(Object.keys(photos).length, 100);
  assert.equal(photos['id-104'], undefined);
});

test('network exceptions also return a safe fallback', async () => {
  const client = fakeClient(async () => { throw new Error('offline'); });
  assert.deepEqual(Object.keys(await fetchResultStudentPhotos(client, [{ student_id: 'one' }])), []);
});

test('results page uses the image component only for an individual student', async () => {
  const source = await readFile(new URL('../src/pages/ResultsPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /row\.student_id && <IdentityImage/);
  assert.match(source, /photos\[row\.student_id\]/);
  assert.match(source, /if \(active\) setPhotos\(data\)/);
  assert.match(source, /usePublicData\(fetchResultsData/);
});
