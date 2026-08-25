/**
 * Text selection and formatting helpers for the editor
 */

export interface SelectionRange {
  start: number;
  end: number;
}

export interface WrapResult {
  text: string;
  selection: SelectionRange;
}

interface ExpandedLineSelection {
  before: string;
  after: string;
  lines: string[];
  lineStart: number;
}

/**
 * Toggle wrapping of selected text with symmetric tokens (e.g., **bold**)
 * If already wrapped, unwrap. Otherwise, wrap.
 */
export function toggleWrap(text: string, start: number, end: number, token: string): WrapResult {
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);

  // Check if selection is already wrapped
  const hasTokenBefore = before.endsWith(token);
  const hasTokenAfter = after.startsWith(token);

  if (hasTokenBefore && hasTokenAfter) {
    // Unwrap: remove tokens from both sides
    const newText = before.slice(0, -token.length) + selected + after.slice(token.length);
    return {
      text: newText,
      selection: {
        start: start - token.length,
        end: end - token.length,
      },
    };
  }

  // Check if selected text itself starts/ends with token
  const selectedHasTokenStart = selected.startsWith(token);
  const selectedHasTokenEnd = selected.endsWith(token);

  if (selectedHasTokenStart && selectedHasTokenEnd && selected.length >= token.length * 2) {
    // Unwrap: remove tokens from selection
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

  // Wrap: add tokens around selection
  const newText = before + token + selected + token + after;
  return {
    text: newText,
    selection: {
      start: start + token.length,
      end: end + token.length,
    },
  };
}

/**
 * Toggle wrapping with asymmetric tokens (e.g., [text](url))
 */
export function toggleWrapAsymmetric(
  text: string,
  start: number,
  end: number,
  startToken: string,
  endToken: string
): WrapResult {
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);

  // Check if already wrapped
  const hasTokenBefore = before.endsWith(startToken);
  const hasTokenAfter = after.startsWith(endToken);

  if (hasTokenBefore && hasTokenAfter) {
    // Unwrap
    const newText = before.slice(0, -startToken.length) + selected + after.slice(endToken.length);
    return {
      text: newText,
      selection: {
        start: start - startToken.length,
        end: end - startToken.length,
      },
    };
  }

  // Wrap
  const newText = before + startToken + selected + endToken + after;
  return {
    text: newText,
    selection: {
      start: start + startToken.length,
      end: end + startToken.length,
    },
  };
}

/**
 * Insert text at cursor position
 */
export function insertAt(text: string, position: number, toInsert: string): WrapResult {
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

/**
 * Toggle block prefix (e.g., > for quotes, - for lists)
 * Applies to all lines in selection
 */
export function toggleBlockPrefix(
  text: string,
  start: number,
  end: number,
  prefix: string
): WrapResult {
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

/**
 * Toggle a numbered list for the selected lines.
 */
export function toggleNumberedList(text: string, start: number, end: number): WrapResult {
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

/**
 * Toggle a top-level Discord header for the selected lines.
 */
export function toggleHeader(text: string, start: number, end: number): WrapResult {
  return toggleBlockPrefix(text, start, end, '#');
}

/**
 * Toggle Discord subtext lines using the -# prefix.
 */
export function toggleSubtext(text: string, start: number, end: number): WrapResult {
  return toggleBlockPrefix(text, start, end, '-#');
}

/**
 * Toggle Discord's multiline quote marker on the first selected line.
 */
export function toggleMultilineQuote(text: string, start: number, end: number): WrapResult {
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

/**
 * Toggle code block around selection
 */
export function toggleCodeBlock(
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

  // Check if selection is already in a code block
  const fencePattern = /```\w*\n/;
  const hasOpenBefore = fencePattern.test(before.slice(-20));
  const hasCloseAfter = after.trimStart().startsWith('```');

  if (hasOpenBefore && hasCloseAfter) {
    // This is complex - for now just wrap anyway
    // TODO: Implement proper unwrapping
  }

  // Wrap in code block
  const newText = before + openFence + selected + closeFence + after;
  return {
    text: newText,
    selection: {
      start: start + openFence.length,
      end: end + openFence.length,
    },
  };
}

/**
 * Insert a masked link [text](url)
 */
export function insertMaskedLink(
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

  // Position cursor at URL if using placeholder
  const urlStart = start + selected.length + 3; // [text](
  const urlEnd = urlStart + url.length;

  return {
    text: newText,
    selection: {
      start: url === 'url' ? urlStart : start,
      end: url === 'url' ? urlEnd : start + link.length,
    },
  };
}
