import { describe, expect, it } from 'vitest';
import {
  applyMessageFormatting,
  type MessageFormattingIntent,
  type MessageFormattingResult,
} from '../src/lib/messageFormatting';

function format(
  message: string,
  start: number,
  end: number,
  intent: MessageFormattingIntent
): MessageFormattingResult {
  return applyMessageFormatting(message, { start, end }, intent);
}

describe('message formatting module', () => {
  it('wraps and unwraps bold formatting from surrounding text', () => {
    expect(format('Title', 0, 5, { type: 'bold' })).toEqual({
      type: 'applied',
      message: '**Title**',
      selection: { start: 2, end: 7 },
    });

    expect(format('**Title**', 2, 7, { type: 'bold' })).toEqual({
      type: 'applied',
      message: 'Title',
      selection: { start: 0, end: 5 },
    });
  });

  it('unwraps bold formatting when the tokens are part of the selection', () => {
    expect(format('**Title**', 0, 9, { type: 'bold' })).toEqual({
      type: 'applied',
      message: 'Title',
      selection: { start: 0, end: 5 },
    });
  });

  it('wraps Discord inline formatting intents', () => {
    expect(format('Title', 0, 5, { type: 'italic' })).toMatchObject({
      type: 'applied',
      message: '*Title*',
      selection: { start: 1, end: 6 },
    });

    expect(format('Title', 0, 5, { type: 'underline' })).toMatchObject({
      type: 'applied',
      message: '__Title__',
      selection: { start: 2, end: 7 },
    });

    expect(format('Title', 0, 5, { type: 'strikethrough' })).toMatchObject({
      type: 'applied',
      message: '~~Title~~',
      selection: { start: 2, end: 7 },
    });

    expect(format('Title', 0, 5, { type: 'inlineCode' })).toMatchObject({
      type: 'applied',
      message: '`Title`',
      selection: { start: 1, end: 6 },
    });

    expect(format('Title', 0, 5, { type: 'spoiler' })).toMatchObject({
      type: 'applied',
      message: '||Title||',
      selection: { start: 2, end: 7 },
    });
  });

  it('inserts text at the end of the selection', () => {
    expect(format('Hello world', 5, 5, { type: 'insertText', text: ',' })).toEqual({
      type: 'applied',
      message: 'Hello, world',
      selection: { start: 6, end: 6 },
    });

    expect(format('Hello world', 0, 5, { type: 'insertText', text: '!' })).toEqual({
      type: 'applied',
      message: 'Hello! world',
      selection: { start: 6, end: 6 },
    });
  });

  it('toggles block quote prefixes while preserving blank lines', () => {
    const wrapped = format('one\n\ntwo', 0, 8, { type: 'blockQuote' });
    expect(wrapped).toMatchObject({
      type: 'applied',
      message: '> one\n\n> two',
    });

    if (wrapped.type !== 'applied') throw new Error('expected formatting to apply');

    expect(
      format(wrapped.message, 0, wrapped.message.length, { type: 'blockQuote' })
    ).toMatchObject({
      type: 'applied',
      message: 'one\n\ntwo',
    });
  });

  it('toggles numbered lists with sequential numbering', () => {
    const wrapped = format('first\nsecond', 0, 12, { type: 'numberedList' });
    expect(wrapped).toMatchObject({
      type: 'applied',
      message: '1. first\n2. second',
    });

    expect(format('1. first\nsecond', 0, 15, { type: 'numberedList' })).toMatchObject({
      type: 'applied',
      message: '1. first\n2. second',
    });

    if (wrapped.type !== 'applied') throw new Error('expected formatting to apply');

    expect(
      format(wrapped.message, 0, wrapped.message.length, { type: 'numberedList' })
    ).toMatchObject({
      type: 'applied',
      message: 'first\nsecond',
    });
  });

  it('preserves blank lines when normalizing mixed numbered selections', () => {
    expect(format('1. first\n\nthird', 0, 15, { type: 'numberedList' })).toMatchObject({
      type: 'applied',
      message: '1. first\n\n2. third',
    });
  });

  it('toggles header and subtext prefixes', () => {
    expect(format('Title', 0, 5, { type: 'header' })).toMatchObject({
      type: 'applied',
      message: '# Title',
    });

    expect(format('note', 0, 4, { type: 'subtext' })).toMatchObject({
      type: 'applied',
      message: '-# note',
    });

    const multi = format('first\nsecond', 0, 12, { type: 'subtext' });
    expect(multi).toMatchObject({
      type: 'applied',
      message: '-# first\n-# second',
    });

    if (multi.type !== 'applied') throw new Error('expected formatting to apply');

    expect(format(multi.message, 0, multi.message.length, { type: 'subtext' })).toMatchObject({
      type: 'applied',
      message: 'first\nsecond',
    });
  });

  it('toggles multiline quote marker on the first selected line only', () => {
    const wrapped = format('line one\nline two', 0, 17, { type: 'multilineQuote' });
    expect(wrapped).toMatchObject({
      type: 'applied',
      message: '>>> line one\nline two',
    });

    if (wrapped.type !== 'applied') throw new Error('expected formatting to apply');

    expect(
      format(wrapped.message, 0, wrapped.message.length, { type: 'multilineQuote' })
    ).toMatchObject({
      type: 'applied',
      message: 'line one\nline two',
    });
  });

  it('unwraps a bare multiline quote marker and expands selection to the end of the text', () => {
    expect(format('>>>\nrest', 0, 3, { type: 'multilineQuote' })).toEqual({
      type: 'applied',
      message: '\nrest',
      selection: { start: 0, end: 0 },
    });

    expect(format('tail', 0, 4, { type: 'blockQuote' })).toMatchObject({
      type: 'applied',
      selection: { start: 0, end: 6 },
    });
  });

  it('requests a code language before applying code block formatting', () => {
    expect(format('const x = 1;', 0, 12, { type: 'codeBlock' })).toEqual({
      type: 'needsCodeLanguage',
    });
  });

  it('wraps code blocks with the selected language and preserves existing-fence behavior', () => {
    expect(
      format('const x = 1;', 0, 12, { type: 'codeBlockWithLanguage', language: 'ts' })
    ).toEqual({
      type: 'applied',
      message: '```ts\nconst x = 1;\n```',
      selection: { start: 6, end: 18 },
    });

    const nested = format('```js\ncode\n```tail', 6, 10, {
      type: 'codeBlockWithLanguage',
      language: 'js',
    });
    expect(nested).toMatchObject({ type: 'applied' });
    if (nested.type !== 'applied') throw new Error('expected formatting to apply');
    expect(nested.message).toContain('```js\ncode\n```');
  });

  it('inserts masked links with placeholder and explicit URLs', () => {
    expect(format('hello', 0, 5, { type: 'maskedLink' })).toEqual({
      type: 'applied',
      message: '[hello](url)',
      selection: { start: 8, end: 11 },
    });

    expect(format('hello', 0, 0, { type: 'maskedLink', url: 'https://example.com' })).toEqual({
      type: 'applied',
      message: '[link text](https://example.com)hello',
      selection: { start: 0, end: 32 },
    });
  });
});
