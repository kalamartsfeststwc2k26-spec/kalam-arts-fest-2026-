import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('committee tab routes to dedicated photo-enabled manager', async () => {
 const collection=await readFile(new URL('../src/components/admin/ManagedCollection.jsx',import.meta.url),'utf8');
 const manager=await readFile(new URL('../src/components/admin/CommitteeMembersManager.jsx',import.meta.url),'utf8');
 assert.match(collection,/props\.config\.table === 'committee_members'/);
 assert.match(collection,/<CommitteeMembersManager/);
 assert.match(manager,/from\('committee-photos'\)/);
 assert.match(manager,/<CommitteePhotoCrop/);
});
