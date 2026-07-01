/**
 * Tests for the content-pipeline glossary validator.
 *
 * Standalone Node/TS tooling — deliberately NOT run via Vitest (which is
 * scoped to `src/**\/*.test.ts` in vite.config.ts) and imports nothing from
 * `src/`. Run with:
 *
 *   node --experimental-strip-types --test content-pipeline/validate-glossary.test.ts
 *
 * (wired as `npm run validate-glossary:test` is NOT required by the plan;
 * the group's step 7.7 runs this file directly, see the execution report.)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateGlossary } from './validate-glossary.ts';

const validEntry = {
  id: 'java-generics',
  term: 'Generics',
  description: 'Type parameters that let classes and methods operate on typed objects.',
  translationPl: 'Generyki',
  descriptionPl: 'Parametry typu pozwalające klasom i metodom operować na typowanych obiektach.',
  category: 'Java',
  level: 'Regular',
};

test('passes on a well-formed fixture array (all required fields present, valid enums)', () => {
  const fixture = [
    validEntry,
    { ...validEntry, id: 'java-streams', term: 'Streams API', category: 'Java', level: 'Senior' },
  ];

  const errors = validateGlossary(fixture);

  assert.deepEqual(errors, []);
});

test('fails with a clear error when a category value is outside the 12-value enum', () => {
  const fixture = [{ ...validEntry, category: 'Rust' }];

  const errors = validateGlossary(fixture);

  assert.equal(errors.length, 1);
  assert.match(errors[0], /category/i);
  assert.match(errors[0], /Rust/);
});

test('fails with a clear error when a level value is outside Junior/Regular/Senior', () => {
  const fixture = [{ ...validEntry, level: 'Staff' }];

  const errors = validateGlossary(fixture);

  assert.equal(errors.length, 1);
  assert.match(errors[0], /level/i);
  assert.match(errors[0], /Staff/);
});

test('fails on duplicate id values within the array', () => {
  const fixture = [
    validEntry,
    { ...validEntry, term: 'Generics (dup)' },
  ];

  const errors = validateGlossary(fixture);

  assert.equal(errors.length, 1);
  assert.match(errors[0], /duplicate/i);
  assert.match(errors[0], /id/i);
  assert.match(errors[0], /java-generics/);
});

test('fails on duplicate (term, category) pairs within the array', () => {
  const fixture = [
    validEntry,
    { ...validEntry, id: 'java-generics-2' },
  ];

  const errors = validateGlossary(fixture);

  assert.equal(errors.length, 1);
  assert.match(errors[0], /duplicate/i);
  assert.match(errors[0], /Generics/);
  assert.match(errors[0], /Java/);
});
