import test from 'node:test';
import assert from 'node:assert/strict';
import { studentSaveError } from '../src/lib/studentSaveError.js';

test('specific duplicate constraint maps to generic review, without server details', () => {
  const result = {
    error: {
      code: '23505',
      message: 'duplicate key violates unique constraint "students_roll_number_canonical_unique"',
      details: 'private student details',
    },
  };

  const msg = studentSaveError(result);

  assert.match(msg, /roll number may already be in use/i);
  assert.doesNotMatch(msg, /constraint|private|students_roll/);
  assert.equal(studentSaveError(result, { groupCreate: true }), msg);
});

test('unrelated unique constraints and other database errors do not leak details or masquerade as roll conflict', () => {
  for (const error of [
    { code: '23505', message: 'some_other_constraint PRIVATE' },
    { code: '42501', message: 'PRIVATE' },
    { code: '23505', details: 'PRIVATE' },
  ]) {
    const msg = studentSaveError({ error });

    assert.doesNotMatch(msg, /PRIVATE|roll number/i);
    assert.match(msg, /could not save/i);
  }
});

test('group creation retains existing successful RPC behavior', () => {
  assert.equal(
    studentSaveError({ data: 'id', error: null }, { groupCreate: true }),
    ''
  );
});

test('direct successful mutation remains exactly-one-row check', () => {
  assert.equal(
    studentSaveError({ data: [{ id: 'x' }], error: null }, { action: 'update' }),
    ''
  );

  assert.match(
    studentSaveError({ data: [], error: null }, { action: 'update' }),
    /no record/i
  );

  assert.match(
    studentSaveError({ data: [{}, {}], error: null }, { action: 'update' }),
    /no record/i
  );
});

test('missing response fails safely', () => {
  assert.match(studentSaveError(null), /could not save/i);
});
