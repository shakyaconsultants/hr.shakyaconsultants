import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeRegex, buildSearchFilter } from '../src/infrastructure/database/query/search.helper.js';

test('escapeRegex escapes metacharacters', () => {
  assert.equal(escapeRegex('a+b(c)'), 'a\\+b\\(c\\)');
});

test('buildSearchFilter returns empty object for blank search', () => {
  assert.deepEqual(buildSearchFilter('   ', ['name']), {});
});

test('buildSearchFilter builds safe regex filter', () => {
  const filter = buildSearchFilter('test', ['name', 'email']);
  assert.ok(Array.isArray(filter.$or));
  assert.equal(filter.$or?.length, 2);
});
