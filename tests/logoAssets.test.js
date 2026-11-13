import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LOGO_URL, MARK_URL } from '../src/constants/branding.js';
import { makePublishedResultsPdf } from '../src/lib/publishedResultsPdfData.js';

const root = new URL('../', import.meta.url);
const text = path => readFileSync(new URL(path, root), 'utf8');
const pngDimensions = path => {
  const data = readFileSync(new URL(`public${path}`, root));
  assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
};

test('updated logo, icon references and service-worker cache are consistent', () => {
  assert.deepEqual(pngDimensions(LOGO_URL), [1600, 1000]);
  assert.ok(pngDimensions(MARK_URL).every(n => n > 0));
  const manifest = JSON.parse(text('public/manifest.webmanifest'));
  for (const icon of manifest.icons) {
    const [width, height] = icon.sizes.split('x').map(Number);
    assert.deepEqual(pngDimensions(icon.src), [width, height]);
    assert.ok(text('public/sw.js').includes(icon.src));
  }
  assert.ok(text('public/sw.js').includes('kalam-static-logo-v2'));
  assert.ok(text('public/sw.js').includes(LOGO_URL));
  assert.ok(text('public/sw.js').includes(MARK_URL));
  assert.ok(text('index.html').includes(manifest.icons[0].src));
  assert.ok(text('src/lib/publishedResultsPdf.js').includes(LOGO_URL.slice(1)));
});

test('PDF centres the full new logo at its actual aspect ratio', () => {
  const row = { id: 'fictional', status: 'published', published_at: '2026-11-02T06:00:00Z' };
  const doc = makePublishedResultsPdf([row], new Date(), 'data:image/png;base64,AA==');
  const page = { width: 595.28, height: 841.89 };
  const watermark = doc.background(1, page);
  assert.equal(watermark.absolutePosition.x, (page.width - watermark.width) / 2);
  assert.equal(watermark.absolutePosition.y, (page.height - watermark.width * 1000 / 1600) / 2);
});
