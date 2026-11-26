import test from 'node:test';
import assert from 'node:assert/strict';
import { groupPublicResults } from '../src/lib/groupPublicResults.js';
const row = (id, overrides = {}) => ({ id, event_id:'e1', event_name:'Poetry', student_name:'Amina', team_name:'Red', item_category:'Literary', competition_type:'On-stage', grade:'A', published_at:'2026-11-01T00:00:00Z', placement:1, ...overrides });
test('groups by event ID, sorts placements, retains ties and team-only rows', () => {
 const rows=[row('third',{placement:3}),row('team',{placement:2,student_name:null,team_name:'Blue'}),row('second',{placement:2,student_name:'Bilal'}),row('first',{placement:1}),row('other',{event_id:'e2',placement:1})];
 const groups=groupPublicResults(rows);assert.equal(groups.length,2);const group=groups.find(x=>x.eventId==='e1');assert.deepEqual(group.rows.map(x=>x.placement),[1,2,2,3]);assert.equal(group.rows.length,4);assert.ok(group.rows.some(x=>x.id==='team'));assert.equal(group.sharedPublishedAt,'2026-11-01T00:00:00Z');
});
test('missing IDs stay separate even if names match, and missing place stays last',()=>{
 const groups=groupPublicResults([row('x',{event_id:null}),row('y',{event_id:null}),row('a',{placement:null}),row('b',{placement:1})]);assert.equal(groups.length,3);assert.deepEqual(groups.find(x=>x.eventId==='e1').rows.map(x=>x.id),['b','a']);
});
test('search/category/grade filter existing rows and report partial counts without leaks',()=>{
 const rows=[row('a',{student_name:'Amina',grade:'A'}),row('b',{student_name:'Bilal',grade:'B'}),row('c',{event_id:'e2',event_name:'Drawing',competition_type:'Non-stage'})];
 let groups=groupPublicResults(rows,{query:'bil'});assert.equal(groups.length,1);assert.deepEqual(groups[0].rows.map(x=>x.id),['b']);assert.equal(groups[0].total,2);
 groups=groupPublicResults(rows,{query:' POET ',grade:'A'});assert.deepEqual(groups[0].rows.map(x=>x.id),['a']);assert.equal(groups[0].total,2);
 assert.deepEqual(groupPublicResults(rows,{type:'Non-stage'}).map(x=>x.eventId),['e2']);assert.equal(groupPublicResults(rows,{query:'no match'}).length,0);
});
test('groups newest matching publication first, retains per-row different dates and handles invalid timestamps',()=>{
 const groups=groupPublicResults([row('a',{published_at:'2026-11-01T00:00:00Z'}),row('b',{published_at:'2026-11-02T00:00:00Z'}),row('c',{event_id:'e2',published_at:'2026-11-03T00:00:00Z'}),row('d',{event_id:'e3',published_at:null})]);
 assert.deepEqual(groups.map(g=>g.eventId),['e2','e1','e3']);assert.equal(groups[1].sharedPublishedAt,null);assert.equal(groups[2].sharedPublishedAt,null);
});
