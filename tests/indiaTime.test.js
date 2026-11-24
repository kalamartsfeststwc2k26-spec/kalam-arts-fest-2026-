import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { indiaInputParts, indiaInputDraft, indiaInputToIso, formatIndiaTimestamp, indiaDateForFilename } from '../src/lib/indiaTime.js';
import { eventSchedule, eventStatus, formatEventTime } from '../src/lib/eventUtils.js';
const draft=(date,hour,minute,period)=>indiaInputDraft({date,hour,minute,period});
test('IST conversion covers midnight, noon, PM and calendar boundary', () => {
  assert.equal(indiaInputToIso(draft('2026-11-22','12','00','AM')), '2026-11-21T18:30:00.000Z');
  assert.equal(indiaInputToIso(draft('2026-11-22','12','00','PM')), '2026-11-22T06:30:00.000Z');
  assert.equal(indiaInputToIso(draft('2026-11-22','7','15','PM')), '2026-11-22T13:45:00.000Z');
  assert.deepEqual(indiaInputParts('2026-11-21T18:30:00Z'), {date:'2026-11-22',hour:'12',minute:'00',period:'AM'});
  assert.deepEqual(indiaInputParts('2026-11-22T06:30:00Z'), {date:'2026-11-22',hour:'12',minute:'00',period:'PM'});
});
test('blank optional value, malformed, partial and impossible dates fail safely', () => {
  assert.equal(indiaInputDraft({date:'',hour:'',minute:'',period:''}), '');
  assert.equal(indiaInputToIso(''), null);
  for (const value of [draft('2026-11-22','12','','AM'),draft('2026-02-30','2','00','PM'),draft('2026-11-22','0','00','PM'),draft('2026-11-22','2','60','AM'),draft('0000-01-01','2','00','AM'),'2026-11-22T12:00','garbage']) assert.throws(()=>indiaInputToIso(value));
});
test('unchanged stored instant is preserved including fractional precision', () => {
  const original='2026-11-21T18:30:59.123456+00:00';
  assert.equal(indiaInputToIso(original),original);
  assert.deepEqual(indiaInputParts(original),{date:'2026-11-22',hour:'12',minute:'00',period:'AM'});
});
test('display and download date use India time',()=>{
  assert.match(formatIndiaTimestamp('2026-11-21T18:30:00Z'), /22 Nov 2026.*12:00.*am IST/i);
  assert.equal(indiaDateForFilename('2026-11-21T18:30:00Z'),'2026-11-22');
  assert.match(formatEventTime('2026-11-22T13:30:00Z'),/7:00.*pm IST/i);
  assert.match(eventSchedule({start_time:'2026-11-21T18:00:00Z',end_time:'2026-11-21T19:30:00Z'}),/21 Nov 2026.*22 Nov 2026/);
  assert.equal(eventStatus({start_time:'2026-11-21T18:00:00Z',end_time:'2026-11-21T19:30:00Z'},Date.parse('2026-11-21T18:45:00Z')),'Live');
});
test('form conversion and display do not depend on device timezone',()=>{
 const script=`import {indiaInputDraft, indiaInputToIso, indiaInputParts, formatIndiaTimestamp} from './src/lib/indiaTime.js';console.log(JSON.stringify([indiaInputToIso(indiaInputDraft({date:'2026-11-22',hour:'9',minute:'30',period:'AM'})),indiaInputParts('2026-11-22T04:00:00Z'),formatIndiaTimestamp('2026-11-22T04:00:00Z')]));`;
 const output=['UTC','America/New_York','Asia/Tokyo','Asia/Kolkata'].map(TZ=>execFileSync(process.execPath,['--input-type=module','-e',script],{cwd:process.cwd(),env:{...process.env,TZ},encoding:'utf8'}).trim());
 assert.equal(new Set(output).size,1);assert.equal(JSON.parse(output[0])[0],'2026-11-22T04:00:00.000Z');
});
