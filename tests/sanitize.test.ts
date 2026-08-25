import { describe, expect, it } from 'vitest';
import { sanitizeHtml, sanitizeUrl } from '../src/lib/sanitize';

describe('sanitize', () => {
  it('keeps allowed markup and strips dangerous content', () => {
    const clean = sanitizeHtml(
      '<p onclick="bad()">safe <a href="https://example.com" target="_blank" rel="noreferrer">link</a></p><script>alert(1)</script><img src="x" onerror="bad()">'
    );

    expect(clean).toContain('<p>safe ');
    expect(clean).toContain('<a href="https://example.com">link</a>');
    expect(clean).not.toContain('script');
    expect(clean).not.toContain('img');
    expect(clean).not.toContain('onclick');
  });

  it('sanitizes urls according to the allowlist', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    expect(sanitizeUrl('/relative')).toBe('/relative');
    expect(sanitizeUrl('#anchor')).toBe('#anchor');
    expect(sanitizeUrl('example.com')).toBe('https://example.com');
    expect(sanitizeUrl(' javascript:alert(1)')).toBe('');
    expect(sanitizeUrl('data:text/plain,hello')).toBe('');
    expect(sanitizeUrl('ftp://example.com')).toBe('');
  });
});
