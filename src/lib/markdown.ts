/**
 * Discord-compatible Markdown parser using markdown-it
 * Configured to match Discord's subset and quirks
 */

import MarkdownIt from 'markdown-it';
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs';
import type Token from 'markdown-it/lib/token.mjs';
import Prism from 'prismjs';

// Load Prism languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markdown';

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
  md.inline.ruler.before('emphasis', 'discord_spoiler', (state: StateInline, silent: boolean) => {
    const start = state.pos;

    // Need ||
    if (state.src.charCodeAt(start) !== 0x7c /* | */) return false;
    if (state.src.charCodeAt(start + 1) !== 0x7c) return false;

    // Need at least ||x||
    if (start + 4 >= state.posMax) return false;

    // Find closing ||
    const content_start = start + 2;
    let pos = content_start;

    while (pos < state.posMax - 1) {
      if (state.src.charCodeAt(pos) === 0x7c && state.src.charCodeAt(pos + 1) === 0x7c) {
        // Found closing
        if (!silent) {
          const token_o = state.push('spoiler_open', 'span', 1);
          token_o.markup = '||';
          token_o.attrSet('class', 'spoiler');
          token_o.attrSet('tabindex', '0');
          token_o.attrSet('role', 'button');
          token_o.attrSet('aria-label', 'Spoiler (click to reveal)');

          const token_t = state.push('text', '', 0);
          token_t.content = state.src.slice(content_start, pos);

          const token_c = state.push('spoiler_close', 'span', -1);
          token_c.markup = '||';
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
      token.content = formatTimestamp(epoch, style);
    }

    state.pos = end + 1;
    return true;
  });

  md.renderer.rules.discord_timestamp = (tokens: Token[], idx: number): string => {
    const token = tokens[idx];
    const epoch = token.attrGet('data-epoch') || '0';
    const style = token.attrGet('data-style') || 'f';
    const formatted = formatTimestamp(parseInt(epoch, 10), style);
    return `<span class="discord-timestamp" data-epoch="${epoch}" data-style="${style}" title="${token.markup}">${formatted}</span>`;
  };
}

/**
 * Format a Unix timestamp according to Discord's style codes
 */
function formatTimestamp(epoch: number, style: string): string {
  const date = new Date(epoch * 1000);

  switch (style) {
    case 't': // Short time: 9:41 PM
      return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    case 'T': // Long time: 9:41:30 PM
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      });
    case 'd': // Short date: 11/28/2018
      return date.toLocaleDateString(undefined, {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      });
    case 'D': // Long date: November 28, 2018
      return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    case 'f': // Short date/time: November 28, 2018 9:41 PM
      return date.toLocaleString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    case 'F': // Long date/time: Wednesday, November 28, 2018 9:41 PM
      return date.toLocaleString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    case 'R': // Relative: 3 years ago
      return formatRelativeTime(epoch);
    default:
      return date.toLocaleString();
  }
}

/**
 * Format relative time (e.g., "3 hours ago", "in 5 minutes")
 */
function formatRelativeTime(epoch: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = epoch - now;
  const absDiff = Math.abs(diff);

  const units: [number, string, string][] = [
    [60, 'second', 'seconds'],
    [60 * 60, 'minute', 'minutes'],
    [60 * 60 * 24, 'hour', 'hours'],
    [60 * 60 * 24 * 30, 'day', 'days'],
    [60 * 60 * 24 * 365, 'month', 'months'],
    [Infinity, 'year', 'years'],
  ];

  let value = absDiff;
  let unit = 'seconds';

  for (let i = 0; i < units.length; i++) {
    const [threshold, singular, plural] = units[i];
    if (absDiff < threshold) {
      const prevThreshold = i > 0 ? units[i - 1][0] : 1;
      value = Math.floor(absDiff / prevThreshold);
      unit = value === 1 ? singular : plural;
      break;
    }
  }

  if (diff < 0) {
    return `${value} ${unit} ago`;
  } else if (diff > 0) {
    return `in ${value} ${unit}`;
  } else {
    return 'now';
  }
}

// Apply custom plugins
md.use(underlinePlugin);
md.use(spoilerPlugin);
md.use(timestampPlugin);

/**
 * Render markdown to HTML (unsanitized - must be sanitized before display)
 */
export function renderMarkdown(markdown: string): string {
  return md.render(markdown);
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
