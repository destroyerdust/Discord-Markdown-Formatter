import assert from 'node:assert/strict';
import test from 'node:test';
import { renderMarkdown } from '../src/lib/markdown.ts';

test('renders Discord subtext with a dedicated class', () => {
  const html = renderMarkdown('-# note');

  assert.match(html, /<p class="discord-subtext">note<\/p>/);
});

test('does not treat list syntax as subtext', () => {
  const html = renderMarkdown('- # note');

  assert.doesNotMatch(html, /discord-subtext/);
  assert.match(html, /<ul>/);
});

test('preserves inline markdown inside subtext', () => {
  const html = renderMarkdown('-# **bold**');

  assert.match(html, /<p class="discord-subtext"><strong>bold<\/strong><\/p>/);
});

test('renders multi-line subtext as a single subtext paragraph', () => {
  const html = renderMarkdown('-# first\n-# second');

  assert.match(html, /<p class="discord-subtext">first\nsecond<\/p>/);
  assert.doesNotMatch(html, /-# second/);
});

test('preserves inline markdown in multi-line subtext', () => {
  const html = renderMarkdown('-# **first**\n-# second');

  assert.match(html, /<p class="discord-subtext"><strong>first<\/strong>\nsecond<\/p>/);
});

test('does not partially convert mixed subtext paragraphs', () => {
  const html = renderMarkdown('-# first\nsecond');

  assert.doesNotMatch(html, /discord-subtext/);
  assert.match(html, /<p>-# first\nsecond<\/p>/);
});

test('renders >>> multiline quote as a single blockquote', () => {
  const html = renderMarkdown('>>> line one\nline two');
  const blockquotes = html.match(/<blockquote>/g) ?? [];

  assert.equal(blockquotes.length, 1);
  assert.match(html, /<p>line one\nline two<\/p>/);
});

test('does not normalize >>> inside fenced code blocks', () => {
  const html = renderMarkdown('```txt\n>>> not a quote\n```');

  assert.doesNotMatch(html, /<blockquote>/);
  assert.match(html, />>> not a quote/);
});

test('keeps existing markdown features intact', () => {
  const html = renderMarkdown(
    '# Heading\n\n[text](https://example.com)\n\n1. First\n2. Second\n\n- Bullet'
  );

  assert.match(html, /<h1>Heading<\/h1>/);
  assert.match(html, /<a href="https:\/\/example.com">text<\/a>/);
  assert.match(html, /<ol>/);
  assert.match(html, /<ul>/);
});

test('renders exact-current relative timestamps as now', () => {
  const realNow = Date.now;
  Date.now = () => 1_700_000_000_000;

  try {
    const html = renderMarkdown('<t:1700000000:R>');
    assert.match(html, /data-style="R"/);
    assert.match(html, />now<\/span>/);
  } finally {
    Date.now = realNow;
  }
});
