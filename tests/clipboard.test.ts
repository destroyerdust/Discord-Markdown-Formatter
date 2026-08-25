import { describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from '../src/lib/clipboard';

describe('clipboard', () => {
  it('uses the modern clipboard api when available', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await expect(copyToClipboard('hello')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand when clipboard.writeText fails', async () => {
    const writeText = vi.fn(async () => {
      throw new Error('denied');
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await expect(copyToClipboard('fallback')).resolves.toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('returns false when the fallback copy path throws', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    vi.spyOn(document, 'execCommand').mockImplementation(() => {
      throw new Error('boom');
    });

    await expect(copyToClipboard('nope')).resolves.toBe(false);
  });
});
