import test from 'node:test';
import assert from 'node:assert/strict';
import { BANNER_WIDTH, BANNER_HEIGHT, cropGeometry } from '../src/lib/bannerCrop.js';

test('crop covers canvas at all slider extremes without blank areas', () => {
  for (const [w,h] of [[600,1200],[2400,500],[800,600],[100,100]])
    for (const zoom of [1,2,3]) for (const x of [-100,0,100]) for (const y of [-100,0,100]) {
      const r = cropGeometry(w,h,zoom,x,y);
      assert.ok(r.left <= 0 && r.top <= 0);
      assert.ok(r.left + r.width >= BANNER_WIDTH - 1e-8 && r.top + r.height >= BANNER_HEIGHT - 1e-8);
    }
});
test('rejects invalid dimensions and ranges', () => {
  assert.throws(() => cropGeometry(0,20));
  assert.throws(() => cropGeometry(100,20,4));
  assert.throws(() => cropGeometry(100,20,1,101));
});
