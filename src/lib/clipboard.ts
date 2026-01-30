/**
 * Clipboard utilities with fallback support
 */

/**
 * Copy text to clipboard
 * Uses modern Clipboard API with fallback to execCommand
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern Clipboard API first
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: create temporary textarea
  return copyWithFallback(text);
}

/**
 * Fallback copy method using hidden textarea
 */
function copyWithFallback(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;

  // Make it invisible but still accessible
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  textarea.style.opacity = '0';
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');

  document.body.appendChild(textarea);

  try {
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    const success = document.execCommand('copy');
    return success;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
