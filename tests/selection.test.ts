import assert from 'node:assert/strict';
import test from 'node:test';
import {
  toggleHeader,
  toggleMultilineQuote,
  toggleNumberedList,
  toggleSubtext,
} from '../src/lib/selection.ts';

test('toggles a header prefix on selected lines', () => {
  const result = toggleHeader('Title', 0, 5);

  assert.equal(result.text, '# Title');
});

test('toggles subtext on single and multiple lines', () => {
  const single = toggleSubtext('note', 0, 4);
  const multi = toggleSubtext('first\nsecond', 0, 12);
  const unwrapped = toggleSubtext(multi.text, 0, multi.text.length);

  assert.equal(single.text, '-# note');
  assert.equal(multi.text, '-# first\n-# second');
  assert.equal(unwrapped.text, 'first\nsecond');
});

test('toggles numbered lists with sequential numbering', () => {
  const wrapped = toggleNumberedList('first\nsecond', 0, 12);
  const unwrapped = toggleNumberedList(wrapped.text, 0, wrapped.text.length);

  assert.equal(wrapped.text, '1. first\n2. second');
  assert.equal(unwrapped.text, 'first\nsecond');
});

test('toggles multiline quote marker on the first selected line only', () => {
  const wrapped = toggleMultilineQuote('line one\nline two', 0, 17);
  const unwrapped = toggleMultilineQuote(wrapped.text, 0, wrapped.text.length);

  assert.equal(wrapped.text, '>>> line one\nline two');
  assert.equal(unwrapped.text, 'line one\nline two');
});
