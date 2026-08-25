/**
 * Message formatting module for Discord-compatible editor operations.
 *
 * Callers provide a Message, the current selection, and a formatting intent.
 * The implementation owns Discord Markdown syntax and cursor math behind this seam.
 */

export interface SelectionRange {
  start: number;
  end: number;
}

export type MessageFormattingIntent =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'underline' }
  | { type: 'strikethrough' }
  | { type: 'header' }
  | { type: 'inlineCode' }
  | { type: 'codeBlock' }
  | { type: 'codeBlockWithLanguage'; language: string }
  | { type: 'spoiler' }
  | { type: 'subtext' }
  | { type: 'blockQuote' }
  | { type: 'multilineQuote' }
  | { type: 'bulletList' }
  | { type: 'numberedList' }
  | { type: 'maskedLink'; url?: string }
  | { type: 'insertText'; text: string };

export type MessageFormattingResult =
  { type: 'applied'; message: string; selection: SelectionRange } | { type: 'needsCodeLanguage' };

interface ExpandedLineSelection {
  before: string;
  after: string;
  lines: string[];
  lineStart: number;
}

interface WrapResult {
  text: string;
  selection: SelectionRange;
}

export function applyMessageFormatting(
  message: string,
  selection: SelectionRange,
  intent: MessageFormattingIntent
): MessageFormattingResult {
  if (intent.type === 'codeBlock') {
    return { type: 'needsCodeLanguage' };
  }

  const result = applyFormattingIntent(message, selection, intent);
  return {
    type: 'applied',
    message: result.text,
    selection: result.selection,
  };
}

function applyFormattingIntent(
  message: string,
  selection: SelectionRange,
  intent: Exclude<MessageFormattingIntent, { type: 'codeBlock' }>
): WrapResult {
  const { start, end } = selection;

  switch (intent.type) {
    case 'bold':
      return toggleWrap(message, start, end, '**');
    case 'italic':
      return toggleWrap(message, start, end, '*');
    case 'underline':
      return toggleWrap(message, start, end, '__');
    case 'strikethrough':
      return toggleWrap(message, start, end, '~~');
    case 'header':
      return toggleBlockPrefix(message, start, end, '#');
    case 'inlineCode':
      return toggleWrap(message, start, end, '`');
    case 'codeBlockWithLanguage':
      return toggleCodeBlock(message, start, end, intent.language);
    case 'spoiler':
      return toggleWrap(message, start, end, '||');
    case 'subtext':
      return toggleBlockPrefix(message, start, end, '-#');
    case 'blockQuote':
      return toggleBlockPrefix(message, start, end, '>');
    case 'multilineQuote':
      return toggleMultilineQuote(message, start, end);
    case 'bulletList':
      return toggleBlockPrefix(message, start, end, '-');
    case 'numberedList':
      return toggleNumberedList(message, start, end);
    case 'maskedLink':
      return insertMaskedLink(message, start, end, intent.url);
    case 'insertText':
      return insertAt(message, end, intent.text);
  }
}

function toggleWrap(text: string, start: number, end: number, token: string): WrapResult {
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);

  const hasTokenBefore = before.endsWith(token);
  const hasTokenAfter = after.startsWith(token);

  if (hasTokenBefore && hasTokenAfter) {
    const newText = before.slice(0, -token.length) + selected + after.slice(token.length);
    return {
      text: newText,
      selection: {
        start: start - token.length,
        end: end - token.length,
      },
    };
  }

  const selectedHasTokenStart = selected.startsWith(token);
  const selectedHasTokenEnd = selected.endsWith(token);

  if (selectedHasTokenStart && selectedHasTokenEnd && selected.length >= token.length * 2) {
    const unwrapped = selected.slice(token.length, -token.length);
    const newText = before + unwrapped + after;
    return {
      text: newText,
      selection: {
        start,
        end: end - token.length * 2,
      },
    };
  }

  const newText = before + token + selected + token + after;
  return {
    text: newText,
    selection: {
      start: start + token.length,
      end: end + token.length,
    },
  };
}

function insertAt(text: string, position: number, toInsert: string): WrapResult {
  const newText = text.slice(0, position) + toInsert + text.slice(position);
  return {
    text: newText,
    selection: {
      start: position + toInsert.length,
      end: position + toInsert.length,
    },
  };
}

function expandSelectionToLines(text: string, start: number, end: number): ExpandedLineSelection {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = text.indexOf('\n', end);
  const actualEnd = lineEnd === -1 ? text.length : lineEnd;

  return {
    before: text.slice(0, lineStart),
    after: text.slice(actualEnd),
    lines: text.slice(lineStart, actualEnd).split('\n'),
    lineStart,
  };
}

function buildLineWrapResult(
  originalText: string,
  start: number,
  end: number,
  transform: (lines: string[]) => string[]
): WrapResult {
  const { before, after, lines, lineStart } = expandSelectionToLines(originalText, start, end);
  const newSelected = transform(lines).join('\n');
  const text = before + newSelected + after;

  return {
    text,
    selection: {
      start: lineStart,
      end: lineStart + newSelected.length,
    },
  };
}

function toggleBlockPrefix(text: string, start: number, end: number, prefix: string): WrapResult {
  const prefixWithSpace = prefix + ' ';

  return buildLineWrapResult(text, start, end, (lines) => {
    const allHavePrefix = lines.every(
      (line) => line.startsWith(prefixWithSpace) || line.trim() === ''
    );

    if (allHavePrefix) {
      return lines.map((line) =>
        line.startsWith(prefixWithSpace) ? line.slice(prefixWithSpace.length) : line
      );
    }

    return lines.map((line) => (line.trim() ? prefixWithSpace + line : line));
  });
}

function toggleNumberedList(text: string, start: number, end: number): WrapResult {
  return buildLineWrapResult(text, start, end, (lines) => {
    const numberedPattern = /^\d+\.\s/;
    const allNumbered = lines.every((line) => numberedPattern.test(line) || line.trim() === '');

    if (allNumbered) {
      return lines.map((line) => line.replace(numberedPattern, ''));
    }

    let nextNumber = 1;
    return lines.map((line) => {
      if (!line.trim()) return line;
      const numberedLine = `${nextNumber}. ${line.replace(numberedPattern, '')}`;
      nextNumber += 1;
      return numberedLine;
    });
  });
}

function toggleMultilineQuote(text: string, start: number, end: number): WrapResult {
  return buildLineWrapResult(text, start, end, (lines) => {
    const [firstLine, ...rest] = lines;
    const hasMarker = firstLine === '>>>' || firstLine.startsWith('>>> ');

    if (hasMarker) {
      const unquoted = firstLine === '>>>' ? '' : firstLine.slice(4);
      return [unquoted, ...rest];
    }

    return [`>>> ${firstLine}`, ...rest];
  });
}

function toggleCodeBlock(
  text: string,
  start: number,
  end: number,
  language: string = ''
): WrapResult {
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);

  const openFence = '```' + language + '\n';
  const closeFence = '\n```';

  const fencePattern = /```\w*\n/;
  const hasOpenBefore = fencePattern.test(before.slice(-20));
  const hasCloseAfter = after.trimStart().startsWith('```');

  if (hasOpenBefore && hasCloseAfter) {
    // Preserve existing behavior: wrapping still happens.
  }

  const newText = before + openFence + selected + closeFence + after;
  return {
    text: newText,
    selection: {
      start: start + openFence.length,
      end: end + openFence.length,
    },
  };
}

function insertMaskedLink(
  text: string,
  start: number,
  end: number,
  url: string = 'url'
): WrapResult {
  const before = text.slice(0, start);
  const selected = text.slice(start, end) || 'link text';
  const after = text.slice(end);

  const link = `[${selected}](${url})`;
  const newText = before + link + after;

  const urlStart = start + selected.length + 3;
  const urlEnd = urlStart + url.length;

  return {
    text: newText,
    selection: {
      start: url === 'url' ? urlStart : start,
      end: url === 'url' ? urlEnd : start + link.length,
    },
  };
}
