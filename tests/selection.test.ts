import { describe, expect, it } from 'vitest';
import {
  insertAt,
  insertMaskedLink,
  toggleBlockPrefix,
  toggleCodeBlock,
  toggleHeader,
  toggleMultilineQuote,
  toggleNumberedList,
  toggleSubtext,
  toggleWrap,
  toggleWrapAsymmetric,
} from '../src/lib/selection';

describe('selection helpers', () => {
  it('wraps and unwraps symmetric tokens from surrounding text', () => {
    expect(toggleWrap('Title', 0, 5, '**')).toEqual({
      text: '**Title**',
      selection: { start: 2, end: 7 },
    });

    expect(toggleWrap('**Title**', 2, 7, '**')).toEqual({
      text: 'Title',
      selection: { start: 0, end: 5 },
    });
  });

  it('unwraps symmetric tokens when they are part of the selection', () => {
    expect(toggleWrap('**Title**', 0, 9, '**')).toEqual({
      text: 'Title',
      selection: { start: 0, end: 5 },
    });
  });

  it('wraps and unwraps asymmetric tokens', () => {
    expect(toggleWrapAsymmetric('label', 0, 5, '[', '](url)')).toEqual({
      text: '[label](url)',
      selection: { start: 1, end: 6 },
    });

    expect(toggleWrapAsymmetric('[label](url)', 1, 6, '[', '](url)')).toEqual({
      text: 'label',
      selection: { start: 0, end: 5 },
    });
  });

  it('inserts text at the cursor', () => {
    expect(insertAt('Hello world', 5, ',')).toEqual({
      text: 'Hello, world',
      selection: { start: 6, end: 6 },
    });
  });

  it('toggles block prefixes while preserving blank lines', () => {
    const wrapped = toggleBlockPrefix('one\n\ntwo', 0, 8, '>');
    const unwrapped = toggleBlockPrefix(wrapped.text, 0, wrapped.text.length, '>');

    expect(wrapped.text).toBe('> one\n\n> two');
    expect(unwrapped.text).toBe('one\n\ntwo');
  });

  it('toggles numbered lists with sequential numbering', () => {
    const wrapped = toggleNumberedList('first\nsecond', 0, 12);
    const normalized = toggleNumberedList('1. first\nsecond', 0, 15);
    const unwrapped = toggleNumberedList(wrapped.text, 0, wrapped.text.length);

    expect(wrapped.text).toBe('1. first\n2. second');
    expect(normalized.text).toBe('1. first\n2. second');
    expect(unwrapped.text).toBe('first\nsecond');
  });

  it('preserves blank lines when normalizing mixed numbered selections', () => {
    expect(toggleNumberedList('1. first\n\nthird', 0, 15).text).toBe('1. first\n\n2. third');
  });

  it('toggles a header prefix on selected lines', () => {
    expect(toggleHeader('Title', 0, 5).text).toBe('# Title');
  });

  it('toggles subtext on single and multiple lines', () => {
    const single = toggleSubtext('note', 0, 4);
    const multi = toggleSubtext('first\nsecond', 0, 12);
    const unwrapped = toggleSubtext(multi.text, 0, multi.text.length);

    expect(single.text).toBe('-# note');
    expect(multi.text).toBe('-# first\n-# second');
    expect(unwrapped.text).toBe('first\nsecond');
  });

  it('toggles multiline quote marker on the first selected line only', () => {
    const wrapped = toggleMultilineQuote('line one\nline two', 0, 17);
    const unwrapped = toggleMultilineQuote(wrapped.text, 0, wrapped.text.length);

    expect(wrapped.text).toBe('>>> line one\nline two');
    expect(unwrapped.text).toBe('line one\nline two');
  });

  it('unwraps a bare multiline quote marker and expands selection to the end of the text', () => {
    expect(toggleMultilineQuote('>>>\nrest', 0, 3)).toEqual({
      text: '\nrest',
      selection: { start: 0, end: 0 },
    });

    expect(toggleBlockPrefix('tail', 0, 4, '>').selection).toEqual({ start: 0, end: 6 });
  });

  it('wraps code blocks and preserves the no-op existing-fence branch', () => {
    expect(toggleCodeBlock('const x = 1;', 0, 12, 'ts')).toEqual({
      text: '```ts\nconst x = 1;\n```',
      selection: { start: 6, end: 18 },
    });

    const nested = toggleCodeBlock('```js\ncode\n```tail', 6, 10, 'js');
    expect(nested.text).toContain('```js\ncode\n```');
  });

  it('inserts masked links with placeholder and explicit URLs', () => {
    expect(insertMaskedLink('hello', 0, 5)).toEqual({
      text: '[hello](url)',
      selection: { start: 8, end: 11 },
    });

    expect(insertMaskedLink('hello', 0, 0, 'https://example.com')).toEqual({
      text: '[link text](https://example.com)hello',
      selection: { start: 0, end: 32 },
    });
  });
});
