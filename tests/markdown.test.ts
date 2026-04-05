import Prism from 'prismjs';
import StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs';
import Token from 'markdown-it/lib/token.mjs';
import { describe, expect, it, vi } from 'vitest';
import { getSupportedLanguages, isLanguageSupported, md, renderMarkdown } from '../src/lib/markdown';

describe('markdown', () => {
  it('renders Discord subtext with a dedicated class', () => {
    const html = renderMarkdown('-# note');

    expect(html).toMatch(/<p class="discord-subtext">note<\/p>/);
  });

  it('does not treat list syntax as subtext', () => {
    const html = renderMarkdown('- # note');

    expect(html).not.toMatch(/discord-subtext/);
    expect(html).toMatch(/<ul>/);
  });

  it('preserves inline markdown inside subtext', () => {
    const html = renderMarkdown('-# **bold**');

    expect(html).toMatch(/<p class="discord-subtext"><strong>bold<\/strong><\/p>/);
  });

  it('renders multi-line subtext as a single subtext paragraph', () => {
    const html = renderMarkdown('-# first\n-# second');

    expect(html).toMatch(/<p class="discord-subtext">first\nsecond<\/p>/);
    expect(html).not.toMatch(/-# second/);
  });

  it('keeps subtext formatting stable with a trailing newline', () => {
    const html = renderMarkdown('-# first\n-# second\n');

    expect(html).toMatch(/<p class="discord-subtext">first\nsecond<\/p>/);
  });

  it('does not partially convert mixed subtext paragraphs', () => {
    const html = renderMarkdown('-# first\nsecond');

    expect(html).not.toMatch(/discord-subtext/);
    expect(html).toMatch(/<p>-# first\nsecond<\/p>/);
  });

  it('normalizes multiline quote syntax outside fenced code blocks', () => {
    const html = renderMarkdown('>>> line one\nline two');
    const blockquotes = html.match(/<blockquote>/g) ?? [];

    expect(blockquotes).toHaveLength(1);
    expect(html).toMatch(/<p>line one\nline two<\/p>/);
  });

  it('normalizes an empty multiline quote opener', () => {
    const html = renderMarkdown('>>>\nline two');

    expect(html).toContain('<blockquote>');
    expect(html).toContain('<p>line two</p>');
  });

  it('does not normalize multiline quotes inside fenced code blocks', () => {
    const html = renderMarkdown('```txt\n>>> not a quote\n```');

    expect(html).not.toMatch(/<blockquote>/);
    expect(html).toContain('>>> not a quote');
  });

  it('renders underline, spoiler, and timestamp plugins', () => {
    const epoch = 1_735_693_200;
    const expectedTimestamp = new Date(epoch * 1000).toLocaleString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const html = renderMarkdown('__under__ ||hide|| <t:1735693200:f>');

    expect(html).toContain('<u>under</u>');
    expect(html).toContain('class="spoiler"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('title="<t:1735693200:f>"');
    expect(html).toContain(expectedTimestamp);
  });

  it('renders formatted content inside spoilers', () => {
    const html = renderMarkdown('||**secret**||');

    expect(html).toContain('<span class="spoiler"');
    expect(html).toContain('<strong>secret</strong>');
    expect(html).not.toContain('||');
  });

  it('renders spoilers correctly when surrounded by plain text', () => {
    const html = renderMarkdown('before ||**secret**|| after');

    expect(html).toContain('before ');
    expect(html).toContain('<span class="spoiler"');
    expect(html).toContain('<strong>secret</strong>');
    expect(html).toContain(' after');
    expect(html).not.toContain('||');
  });

  it('keeps escaped spoiler delimiters literal', () => {
    const html = renderMarkdown('\\||secret||');

    expect(html).toContain('<p>||secret||</p>');
    expect(html).not.toContain('class="spoiler"');
  });

  it('does not let escaped spoiler delimiters consume later real spoilers', () => {
    const html = renderMarkdown('\\||a|| and ||b||');

    expect(html).toContain('||a|| and ');
    expect(html).toContain('<span class="spoiler"');
    expect(html).toContain('>b</span>');
  });

  it('keeps escaped spoiler openers literal when no matching literal closer exists', () => {
    const html = renderMarkdown('\\||open only');

    expect(html).toContain('<p>||open only</p>');
    expect(html).not.toContain('class="spoiler"');
  });

  it('renders default timestamp styles and direct renderer fallbacks', () => {
    const html = renderMarkdown('<t:123>');
    expect(html).toContain('data-style="f"');

    const bareToken = new Token('discord_timestamp', 'span', 0);
    const rendered = md.renderer.rules.discord_timestamp?.([bareToken], 0) ?? '';

    expect(rendered).toContain('data-epoch="0"');
    expect(rendered).toContain('data-style="f"');
  });

  it('leaves unmatched underline and empty spoiler segments alone', () => {
    const html = renderMarkdown('__unterminated ||||');

    expect(html).toContain('__unterminated');
    expect(html).toContain('||||');
  });

  it('treats incomplete underline and invalid timestamps as plain text', () => {
    expect(renderMarkdown('__x')).toContain('__x');
    expect(renderMarkdown('_word_')).toContain('<em>word</em>');
    expect(renderMarkdown('<t:123')).toContain('&lt;t:123');
    expect(renderMarkdown('<t:abc:f>')).toContain('&lt;t:abc:f&gt;');
  });

  it('supports the underline rule in silent mode', () => {
    const underlineRule = (md.inline.ruler as unknown as { __rules__: Array<{ name: string; fn: Function }> })
      .__rules__.find((rule) => rule.name === 'discord_underline')?.fn;
    const state = new StateInline('__word__', md, {}, []);

    expect(underlineRule?.(state, true)).toBe(true);
    expect(state.tokens).toEqual([]);
  });

  it('highlights supported languages and falls back for unsupported ones', () => {
    const highlighted = md.options.highlight?.('const x = 1;', 'ts') ?? '';
    const fallback = md.options.highlight?.('<b>x</b>', 'unknown') ?? '';

    expect(highlighted).toContain('language-typescript');
    expect(fallback).toContain('language-none');
    expect(fallback).toContain('&lt;b&gt;x&lt;/b&gt;');
  });

  it('falls back safely when Prism throws', () => {
    const highlightSpy = vi.spyOn(Prism, 'highlight').mockImplementation(() => {
      throw new Error('boom');
    });

    const html = md.options.highlight?.('<script>alert(1)</script>', 'js') ?? '';

    expect(html).toContain('language-none');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');

    highlightSpy.mockRestore();
  });

  it('reports supported languages accurately', () => {
    expect(getSupportedLanguages()).toEqual([
      'javascript',
      'typescript',
      'python',
      'json',
      'bash',
      'css',
      'markdown',
    ]);
    expect(isLanguageSupported('ts')).toBe(true);
    expect(isLanguageSupported('shell')).toBe(true);
    expect(isLanguageSupported('madeup')).toBe(false);
  });

  it('keeps existing markdown features intact', () => {
    const html = renderMarkdown(
      '# Heading\n\n[text](https://example.com)\n\n1. First\n2. Second\n\n- Bullet'
    );

    expect(html).toContain('<h1>Heading</h1>');
    expect(html).toContain('<a href="https://example.com">text</a>');
    expect(html).toContain('<ol>');
    expect(html).toContain('<ul>');
  });
});
