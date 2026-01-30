/**
 * HTML sanitization using DOMPurify
 * Configured with a tight allowlist for security
 */

import DOMPurify from 'dompurify';

// Configure DOMPurify with a strict allowlist
const ALLOWED_TAGS = [
  'a',
  'strong',
  'b',
  'em',
  'i',
  's',
  'del',
  'u',
  'code',
  'pre',
  'span',
  'ul',
  'ol',
  'li',
  'blockquote',
  'p',
  'br',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
];

const ALLOWED_ATTR = [
  'class',
  'href',
  'rel',
  'target',
  'data-epoch',
  'data-style',
  'data-language',
  'title',
  'tabindex',
  'role',
  'aria-label',
];

// Protocols allowed in href attributes
const ALLOWED_URI_REGEXP = /^(?:https?|mailto):/i;

/**
 * Sanitize HTML for safe rendering
 * Removes any potentially dangerous content
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOWED_URI_REGEXP,
    // Forbid dangerous elements explicitly
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'img'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
    // Return string, not DOM node
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
}

/**
 * Sanitize a URL for use in links
 * Returns empty string if URL is potentially dangerous
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();

  // Block javascript: and data: URIs
  if (/^(?:javascript|data|vbscript):/i.test(trimmed)) {
    return '';
  }

  // Allow http, https, mailto, and relative URLs
  if (ALLOWED_URI_REGEXP.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }

  // If no protocol, assume https
  if (!trimmed.includes('://')) {
    return `https://${trimmed}`;
  }

  return '';
}
