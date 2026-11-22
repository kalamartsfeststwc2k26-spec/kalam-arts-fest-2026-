import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesAdminSearch } from '../src/lib/adminSearch.js';
test('admin search: blank, whitespace, case-insensitive partial matching and null fields', () => {
  assert.equal(matchesAdminSearch('', 'Anything'), true);
  assert.equal(matchesAdminSearch('  ', null), true);
  assert.equal(matchesAdminSearch(' aLi ', 'Alice'), true);
  assert.equal(matchesAdminSearch('42', null, undefined, 142), true);
  assert.equal(matchesAdminSearch('alice', null, 'Bob'), false);
  assert.equal(matchesAdminSearch('അലി', 'അലിഫ്'), true);
});
