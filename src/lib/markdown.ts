/**
 * Discord-compatible Markdown parser using markdown-it
 * Configured to match Discord's subset and quirks
 */

import MarkdownIt from 'markdown-it';
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs';
import Token from 'markdown-it/lib/token.mjs';
import Prism from 'prismjs';
import { formatDiscordTimestamp } from './discordTimestamp.ts';

// Load Prism languages
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-markdown.js';

// Language aliases (Discord uses some different names)
const LANG_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  md: 'markdown',
};

function normalizeLanguage(lang: string): string {
  const lower = lang.toLowerCase();
  return LANG_ALIASES[lower] || lower;
}

// Create markdown-it instance
export const md = new MarkdownIt({
  html: false, // Disable HTML for security
  linkify: true, // Auto-convert URLs to links
  typographer: false, // Don't convert quotes/dashes
  breaks: false, // Don't convert \n to <br>
  highlight: (code: string, lang: string): string => {
    const normalizedLang = normalizeLanguage(lang);
    try {
      if (normalizedLang && Prism.languages[normalizedLang]) {
        const highlighted = Prism.highlight(code, Prism.languages[normalizedLang], normalizedLang);
        return `<pre class="language-${normalizedLang}"><code class="language-${normalizedLang}">${highlighted}</code></pre>`;
      }
    } catch {
      // Fall through to default
    }
    // Escape and return without highlighting
    return `<pre class="language-none"><code>${escapeHtml(code)}</code></pre>`;
  },
});

// Helper to escape HTML
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Normalize Discord's >>> multiline quote syntax so markdown-it renders it as a single quote block.
 * Discord applies the quote to the rest of the message, so every remaining line is quoted.
 */
function normalizeDiscordMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  const normalized: string[] = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      normalized.push(line);
      continue;
    }

    if (!inFence && /^>>>(?: |$)/.test(line)) {
      const firstLineContent = line === '>>>' ? '' : line.slice(4);
      normalized.push(`> ${firstLineContent}`);

      for (let nextIndex = i + 1; nextIndex < lines.length; nextIndex++) {
        normalized.push(`> ${lines[nextIndex]}`);
      }

      break;
    }

    normalized.push(line);
  }

  return normalized.join('\n');
}

/**
 * Custom inline rule for Discord underline: __text__
 * Discord uses __ for underline, not bold (which is **)
 */
function underlinePlugin(md: MarkdownIt): void {
  // Override the emphasis rule to handle __ as underline
  md.inline.ruler.before('emphasis', 'discord_underline', (state: StateInline, silent: boolean) => {
    const start = state.pos;
    const marker = state.src.charCodeAt(start);

    // Only process underscore
    if (marker !== 0x5f /* _ */) return false;

    // Need at least __x__
    if (start + 4 >= state.posMax) return false;
    if (state.src.charCodeAt(start + 1) !== 0x5f) return false;

    // Find closing __
    const content_start = start + 2;
    let pos = content_start;

    while (pos < state.posMax - 1) {
      if (state.src.charCodeAt(pos) === 0x5f && state.src.charCodeAt(pos + 1) === 0x5f) {
        // Found closing
        if (!silent) {
          const token_o = state.push('underline_open', 'u', 1);
          token_o.markup = '__';

          const token_t = state.push('text', '', 0);
          token_t.content = state.src.slice(content_start, pos);

          const token_c = state.push('underline_close', 'u', -1);
          token_c.markup = '__';
        }
        state.pos = pos + 2;
        return true;
      }
      pos++;
    }

    return false;
  });
}

/**
 * Custom inline rule for Discord spoiler: ||text||
 */
function spoilerPlugin(md: MarkdownIt): void {
  const parseInlineFragment = (
    content: string,
    state: { md: MarkdownIt; env: unknown },
    output: Token[]
  ): void => {
    if (!content) {
      return;
    }
    state.md.inline.parse(content, state.md, state.env, output);
  };

  const createSpoilerOpen = (): Token => {
    const spoilerOpen = new Token('spoiler_open', 'span', 1);
    spoilerOpen.markup = '||';
    spoilerOpen.attrSet('class', 'spoiler');
    spoilerOpen.attrSet('tabindex', '0');
    spoilerOpen.attrSet('role', 'button');
    spoilerOpen.attrSet('aria-label', 'Spoiler (click to reveal)');
    return spoilerOpen;
  };

  const createSpoilerClose = (): Token => {
    const spoilerClose = new Token('spoiler_close', 'span', -1);
    spoilerClose.markup = '||';
    return spoilerClose;
  };

  const isEscaped = (content: string, index: number): boolean => {
    let backslashCount = 0;

    for (let cursor = index - 1; cursor >= 0 && content[cursor] === '\\'; cursor--) {
      backslashCount++;
    }

    return backslashCount % 2 === 1;
  };

  const findNextUnescapedDelimiter = (
    content: string,
    start: number,
    reservedDelimiters: Set<number>
  ): number => {
    for (let cursor = start; cursor < content.length - 1; cursor++) {
      if (
        content[cursor] === '|' &&
        content[cursor + 1] === '|' &&
        !isEscaped(content, cursor) &&
        !reservedDelimiters.has(cursor)
      ) {
        return cursor;
      }
    }

    return -1;
  };

  md.core.ruler.after('inline', 'discord_spoiler', (state) => {
    for (const blockToken of state.tokens) {
      if (blockToken.type !== 'inline' || !blockToken.children || !blockToken.content.includes('||')) {
        continue;
      }

      const transformedChildren: Token[] = [];
      const reservedLiteralDelimiters = new Set<number>();
      let cursor = 0;
      let foundSpoiler = false;

      for (let index = 0; index < blockToken.content.length - 1; index++) {
        if (
          blockToken.content[index] === '|' &&
          blockToken.content[index + 1] === '|' &&
          isEscaped(blockToken.content, index)
        ) {
          reservedLiteralDelimiters.add(index);
          const closingLiteralIndex = findNextUnescapedDelimiter(
            blockToken.content,
            index + 2,
            reservedLiteralDelimiters
          );

          if (closingLiteralIndex !== -1) {
            reservedLiteralDelimiters.add(closingLiteralIndex);
            index = closingLiteralIndex + 1;
          }
        }
      }

      while (cursor < blockToken.content.length) {
        const openIndex = findNextUnescapedDelimiter(
          blockToken.content,
          cursor,
          reservedLiteralDelimiters
        );

        if (openIndex === -1) {
          parseInlineFragment(blockToken.content.slice(cursor), state, transformedChildren);
          break;
        }

        const closeIndex = findNextUnescapedDelimiter(
          blockToken.content,
          openIndex + 2,
          reservedLiteralDelimiters
        );

        if (closeIndex === -1 || closeIndex === openIndex + 2) {
          parseInlineFragment(blockToken.content.slice(cursor), state, transformedChildren);
          break;
        }

        parseInlineFragment(blockToken.content.slice(cursor, openIndex), state, transformedChildren);

        transformedChildren.push(createSpoilerOpen());
        parseInlineFragment(blockToken.content.slice(openIndex + 2, closeIndex), state, transformedChildren);
        transformedChildren.push(createSpoilerClose());

        foundSpoiler = true;
        cursor = closeIndex + 2;
      }

      if (foundSpoiler) {
        blockToken.children = transformedChildren;
      }
    }
  });
}

/**
 * Discord subtext is rendered as a normal paragraph with a special prefix.
 * Re-tag matching paragraphs after inline parsing so the preview keeps normal markdown behavior.
 */
function subtextPlugin(md: MarkdownIt): void {
  md.core.ruler.after('inline', 'discord_subtext', (state) => {
    for (let i = 0; i < state.tokens.length - 2; i++) {
      const open = state.tokens[i];
      const inline = state.tokens[i + 1];
      const close = state.tokens[i + 2];

      if (
        open.type !== 'paragraph_open' ||
        inline.type !== 'inline' ||
        close.type !== 'paragraph_close' ||
        !inline.content.startsWith('-# ')
      ) {
        continue;
      }

      const lines = inline.content.split('\n');
      const allNonEmptyLinesAreSubtext = lines.every(
        (line) => line.trim() === '' || line.startsWith('-# ')
      );

      if (!allNonEmptyLinesAreSubtext) {
        continue;
      }

      open.attrJoin('class', 'discord-subtext');
      inline.content = lines.map((line) => line.slice(3)).join('\n');
      inline.children = [];
      state.md.inline.parse(inline.content, state.md, state.env, inline.children);
    }
  });
}

/**
 * Custom rule to render Discord timestamps as visual preview
 * Format: <t:EPOCH> or <t:EPOCH:STYLE>
 */
function timestampPlugin(md: MarkdownIt): void {
  md.inline.ruler.push('discord_timestamp', (state: StateInline, silent: boolean) => {
    const start = state.pos;

    // Must start with <t:
    if (state.src.slice(start, start + 3) !== '<t:') return false;

    // Find closing >
    const end = state.src.indexOf('>', start + 3);
    if (end === -1) return false;

    const content = state.src.slice(start + 3, end);
    const parts = content.split(':');
    const epoch = parseInt(parts[0], 10);

    if (isNaN(epoch)) return false;

    const style = parts[1] || 'f';

    if (!silent) {
      const token = state.push('discord_timestamp', 'span', 0);
      token.markup = state.src.slice(start, end + 1);
      token.attrSet('class', 'discord-timestamp');
      token.attrSet('data-epoch', String(epoch));
      token.attrSet('data-style', style);
      token.content = formatDiscordTimestamp(epoch, style);
    }

    state.pos = end + 1;
    return true;
  });

  md.renderer.rules.discord_timestamp = (tokens: Token[], idx: number): string => {
    const token = tokens[idx];
    const epoch = token.attrGet('data-epoch') || '0';
    const style = token.attrGet('data-style') || 'f';
    const formatted = formatDiscordTimestamp(parseInt(epoch, 10), style);
    return `<span class="discord-timestamp" data-epoch="${epoch}" data-style="${style}" title="${token.markup}">${formatted}</span>`;
  };
}

// Apply custom plugins
md.use(underlinePlugin);
md.use(spoilerPlugin);
md.use(subtextPlugin);
md.use(timestampPlugin);

/**
 * Render markdown to HTML (unsanitized - must be sanitized before display)
 */
export function renderMarkdown(markdown: string): string {
  return md.render(normalizeDiscordMarkdown(markdown));
}

/**
 * Get list of supported languages for syntax highlighting
 */
export function getSupportedLanguages(): string[] {
  return ['javascript', 'typescript', 'python', 'json', 'bash', 'css', 'markdown'];
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(lang: string): boolean {
  const normalized = normalizeLanguage(lang);
  return normalized in Prism.languages;
}
