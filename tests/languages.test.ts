import { describe, expect, it, vi } from 'vitest';

describe('languages', () => {
  it('exposes core and available language metadata', async () => {
    const languages = await import('../src/lib/languages');
    const available = languages.getAvailableLanguages();

    expect(languages.getCoreLanguages()).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'javascript', loaded: true })])
    );
    expect(available).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'javascript', loaded: true }),
        expect.objectContaining({ id: 'java', loaded: false }),
      ])
    );
    expect(languages.getPopularLanguages()).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'yaml' })])
    );
  });

  it('resolves ids and aliases correctly', async () => {
    const languages = await import('../src/lib/languages');
    expect(languages.resolveLanguageAlias(' ts ')).toBe('typescript');
    expect(languages.resolveLanguageAlias('golang')).toBe('go');
    expect(languages.resolveLanguageAlias('unknown')).toBe('unknown');
    expect(languages.getLanguageInfo('react')).toEqual(
      expect.objectContaining({ id: 'jsx', name: 'JSX' })
    );
    expect(languages.getLanguageInfo('unknown')).toBeUndefined();
    expect(languages.isLanguageLoaded('ts')).toBe(true);
    expect(languages.isLanguageLoaded('java')).toBe(false);
  });

  it('returns false when a known language component fails to load', async () => {
    vi.resetModules();
    vi.doMock('prismjs/components/prism-java.min.js', () => {
      throw new Error('boom');
    });
    const languages = await import('../src/lib/languages');

    await expect(languages.loadLanguage('java')).resolves.toBe(false);
    vi.doUnmock('prismjs/components/prism-java.min.js');
  });

  it('loads known languages, skips already-loaded ones, and warns on unknown ones', async () => {
    vi.resetModules();
    const languages = await import('../src/lib/languages');

    await expect(languages.loadLanguage('java')).resolves.toBe(true);
    expect(languages.isLanguageLoaded('java')).toBe(true);
    await expect(languages.loadLanguage('java')).resolves.toBe(true);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(languages.loadLanguage('nope')).resolves.toBe(false);
    expect(warnSpy).toHaveBeenCalledWith('Unknown language: nope');
  });

  it('preloads multiple languages', async () => {
    vi.resetModules();
    const languages = await import('../src/lib/languages');

    await languages.preloadLanguages(['csharp', 'go']);

    expect(languages.isLanguageLoaded('csharp')).toBe(true);
    expect(languages.isLanguageLoaded('go')).toBe(true);
  });
});
