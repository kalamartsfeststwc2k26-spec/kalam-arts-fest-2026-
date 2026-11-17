import { test } from 'node:test';
import assert from 'node:assert/strict';
import { committeePhotoGeometry, COMMITTEE_PHOTO_SIZE } from '../src/lib/committeePhotoCrop.js';
test('committee crop covers canvas at all extremes', () => {
  for (const [w,h] of [[400,1200],[1200,400],[500,500]]) for (const z of [1,2,3]) for (const x of [-100,0,100]) for (const y of [-100,0,100]) {
    const r = committeePhotoGeometry(w,h,z,x,y);
    assert(r.left <= 0); assert(r.top <= 0); assert(r.left+r.width >= COMMITTEE_PHOTO_SIZE-1e-8); assert(r.top+r.height >= COMMITTEE_PHOTO_SIZE-1e-8);
  }
});
test('invalid crop geometry rejected', () => { for (const args of [[0,1,1,0,0],[1,1,0,0,0],[1,1,1,101,0]]) assert.throws(() => committeePhotoGeometry(...args)); });
