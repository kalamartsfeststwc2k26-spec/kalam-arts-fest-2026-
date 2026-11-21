import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchStudentProgrammesForClient } from '../src/lib/studentProgrammesQuery.js';

function fakeClient(pages) {
  const calls=[];
  return { calls, from(table) { calls.push(['from',table]); return {
    select(fields) { calls.push(['select',fields]); return this; },
    eq(field,value) { calls.push(['eq',field,value]); return this; },
    order(field,opts) { calls.push(['order',field,opts]); return this; },
    async range(start,end) { calls.push(['range',start,end]); return pages.shift(); },
  }; }};
}
test('fetches only the chosen student and paginates with stable ordering', async () => {
  const full=Array.from({length:500},(_,i)=>({event_id:String(i)}));
  const client=fakeClient([{data:full,error:null},{data:[{event_id:'last'}],error:null}]);
  const rows=await fetchStudentProgrammesForClient('student-one',client);
  assert.equal(rows.length,501);
  assert.equal(client.calls.filter(c=>c[0]==='from').length,2);
  assert.ok(client.calls.filter(c=>c[0]==='from').every(c=>c[1]==='public_student_programmes'));
  assert.deepEqual(client.calls.filter(c=>c[0]==='eq'),[['eq','student_id','student-one'],['eq','student_id','student-one']]);
  assert.deepEqual(client.calls.filter(c=>c[0]==='range'),[['range',0,499],['range',500,999]]);
  assert.ok(client.calls.some(c=>c[0]==='order'&&c[1]==='event_id'));
});
test('returns empty, rejects errors and invalid data without silently hiding failures',async()=>{
  assert.deepEqual(await fetchStudentProgrammesForClient('s',fakeClient([{data:[],error:null}])),[]);
  await assert.rejects(fetchStudentProgrammesForClient('s',fakeClient([{data:null,error:new Error('failure')}])),/failure/);
  await assert.rejects(fetchStudentProgrammesForClient('s',fakeClient([{data:null,error:null}])),/Invalid/);
  await assert.rejects(fetchStudentProgrammesForClient('',fakeClient([])),/Student ID/);
  await assert.rejects(fetchStudentProgrammesForClient('s',null),/configured/);
});
