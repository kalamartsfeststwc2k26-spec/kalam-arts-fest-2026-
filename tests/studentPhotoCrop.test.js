import { test } from 'node:test';
import assert from 'node:assert/strict';
import {studentPhotoGeometry,STUDENT_PHOTO_SIZE} from '../src/lib/studentPhotoCrop.js';
test('student photo crop covers the square across dimensions, zoom and positions',()=>{
 for(const [w,h] of [[400,1200],[1200,400],[500,500]]) for(const z of [1,2,3]) for(const x of [-100,0,100]) for(const y of [-100,0,100]){
  const r=studentPhotoGeometry(w,h,z,x,y);assert(r.left<=0);assert(r.top<=0);assert(r.left+r.width>=STUDENT_PHOTO_SIZE-1e-8);assert(r.top+r.height>=STUDENT_PHOTO_SIZE-1e-8);
 }
});
test('invalid student crop geometry is rejected',()=>{for(const args of [[0,1,1,0,0],[1,1,0,0,0],[1,1,1,101,0]])assert.throws(()=>studentPhotoGeometry(...args));});
