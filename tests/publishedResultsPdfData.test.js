import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPdfDate,
  makePublishedResultsPdf,
} from '../src/lib/publishedResultsPdfData.js';

const watermark = 'data:image/png;base64,AA==';

const sample = {
  id: 'a',
  status: 'published',
  published_at: '2026-11-02T06:00:00Z',
  event_name: 'കലാമേള',
  student_name: 'ഫാത്തിമ',
  team_name: 'KALIDOS',
  placement: 1,
  grade: 'A',
  points: 6,
};

test('includes individual, team, scoring and Malayalam values in the report', () => {
  const doc = makePublishedResultsPdf(
    [sample],
    new Date('2026-11-02T06:00:00Z'),
    watermark
  );

  const table = doc.content[4].table;

  assert.equal(table.headerRows, 1);
  assert.deepEqual(
    table.body[1].slice(0, 6),
    ['കലാമേള', 'ഫാത്തിമ', 'KALIDOS', '1', 'A', '6']
  );
  assert.match(table.body[1][6], /IST/);
  assert.match(doc.content[2].text, /Results: 1/);
});

test('supports team results and nullable grades', () => {
  const doc = makePublishedResultsPdf(
    [{ ...sample, student_name: null, grade: null }],
    new Date(),
    watermark
  );

  assert.equal(doc.content[4].table.body[1][1], 'KALIDOS');
  assert.equal(doc.content[4].table.body[1][4], '—');
});

test('rejects empty, duplicate, draft and missing-publication data', () => {
  const lists = [
    [],
    [sample, sample],
    [{ ...sample, status: 'draft' }],
    [{ ...sample, published_at: null }],
  ];

  for (const list of lists) {
    assert.throws(() =>
      makePublishedResultsPdf(list, new Date(), watermark)
    );
  }
});

test('reports dates in India time and handles invalid dates', () => {
  assert.match(formatPdfDate('2026-11-02T06:00:00Z'), /11:30/);
  assert.match(formatPdfDate('2026-11-02T06:00:00Z'), /IST/);
  assert.equal(formatPdfDate('invalid'), '—');
});

test('centres an uncropped low-opacity watermark on each A4 page', () => {
  const doc = makePublishedResultsPdf(
    [sample],
    new Date(),
    watermark
  );

  assert.equal(doc.pageSize, 'A4');
  assert.equal(doc.pageOrientation, 'portrait');
  assert.equal(doc.images.kalamWatermark, watermark);

  for (const page of [1, 2, 5]) {
    const background = doc.background(page, {
      width: 595.28,
      height: 841.89,
    });

    assert.equal(background.image, 'kalamWatermark');
    assert.equal(background.width, 380);
    assert.equal(background.opacity, 0.07);
    assert.ok(background.absolutePosition.x > 0);
    assert.ok(background.absolutePosition.y > 0);
  }
});

test('rejects missing watermark', () => {
  assert.throws(
    () => makePublishedResultsPdf([sample]),
    /watermark/
  );
});
