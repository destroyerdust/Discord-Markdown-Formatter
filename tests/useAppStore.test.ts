import { describe, expect, it, vi } from 'vitest';
import { flushPendingContentSave, resolveTheme, useAppStore } from '../src/store/useAppStore';

describe('useAppStore', () => {
  it('resolves themes correctly', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });

  it('hydrates from storage', () => {
    localStorage.setItem('dmf.content:v1', JSON.stringify('saved content'));
    localStorage.setItem(
      'dmf.settings:v1',
      JSON.stringify({ theme: 'light', tz: 'UTC', analyticsEnabled: true })
    );
    localStorage.setItem(
      'dmf.drafts:v1',
      JSON.stringify([{ id: '1', title: 'Draft', content: 'Hello', updatedAt: 123 }])
    );

    useAppStore.getState().hydrate();

    expect(useAppStore.getState()).toEqual(
      expect.objectContaining({
        content: 'saved content',
        theme: 'light',
        tz: 'UTC',
        analyticsEnabled: true,
        drafts: [{ id: '1', title: 'Draft', content: 'Hello', updatedAt: 123 }],
      })
    );
  });

  it('debounces content persistence and flushes pending content', () => {
    vi.useFakeTimers();

    useAppStore.getState().setContent('first');
    useAppStore.getState().setContent('second');

    expect(localStorage.getItem('dmf.content:v1')).toBeNull();
    vi.advanceTimersByTime(249);
    expect(localStorage.getItem('dmf.content:v1')).toBeNull();

    flushPendingContentSave();
    expect(localStorage.getItem('dmf.content:v1')).toBe(JSON.stringify('second'));

    flushPendingContentSave();
    expect(localStorage.getItem('dmf.content:v1')).toBe(JSON.stringify('second'));
  });

  it('writes pending content when the debounce timer completes naturally', () => {
    vi.useFakeTimers();

    useAppStore.getState().setContent('timer save');
    vi.advanceTimersByTime(250);

    expect(localStorage.getItem('dmf.content:v1')).toBe(JSON.stringify('timer save'));
  });

  it('persists settings changes', () => {
    useAppStore.getState().setTheme('dark');
    expect(localStorage.getItem('dmf.settings:v1')).toBe(
      JSON.stringify({
        theme: 'dark',
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        analyticsEnabled: false,
      })
    );

    useAppStore.getState().setTimezone('UTC');
    expect(localStorage.getItem('dmf.settings:v1')).toBe(
      JSON.stringify({
        theme: 'dark',
        tz: 'UTC',
        analyticsEnabled: false,
      })
    );

    useAppStore.getState().setAnalyticsEnabled(true);
    expect(localStorage.getItem('dmf.settings:v1')).toBe(
      JSON.stringify({
        theme: 'dark',
        tz: 'UTC',
        analyticsEnabled: true,
      })
    );
  });

  it('saves, loads, and deletes drafts', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));

    useAppStore.getState().setContent('Draft body');
    useAppStore.getState().saveDraft('My Draft');

    const [draft] = useAppStore.getState().drafts;
    expect(draft).toEqual({
      id: 'test-uuid',
      title: 'My Draft',
      content: 'Draft body',
      updatedAt: 1_735_689_600_000,
    });
    expect(localStorage.getItem('dmf.drafts:v1')).toBe(JSON.stringify([draft]));

    useAppStore.getState().setContent('');
    useAppStore.getState().loadDraft(draft.id);
    expect(useAppStore.getState().content).toBe('Draft body');
    flushPendingContentSave();
    expect(localStorage.getItem('dmf.content:v1')).toBe(JSON.stringify('Draft body'));

    useAppStore.getState().deleteDraft(draft.id);
    expect(useAppStore.getState().drafts).toEqual([]);
    expect(localStorage.getItem('dmf.drafts:v1')).toBe(JSON.stringify([]));
  });

  it('falls back to Math.random when crypto.randomUUID is unavailable', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {},
    });
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

    useAppStore.getState().setContent('fallback id');
    useAppStore.getState().saveDraft('Fallback');

    expect(useAppStore.getState().drafts[0]?.id).toBe('4fzzzxjyl');
  });

  it('does nothing when loading a missing draft id', () => {
    useAppStore.getState().setContent('unchanged');
    useAppStore.getState().loadDraft('missing');

    expect(useAppStore.getState().content).toBe('unchanged');
  });

  it('updates selection, code language, resolved theme, preferred language, and ui toggles', () => {
    const store = useAppStore.getState();

    store.setSelection({ start: 1, end: 2 });
    store.setCodeLang('ts');
    store.setResolvedTheme('light');
    store.setPreferredCodeLang('python');
    store.toggleTimestampBuilder();
    store.toggleQuickReference();
    store.toggleSettings();
    store.toggleCodeBlockModal();
    store.toggleTemplateGallery();
    store.toggleDraftsManager();

    expect(useAppStore.getState()).toEqual(
      expect.objectContaining({
        selection: { start: 1, end: 2 },
        codeLang: 'ts',
        resolvedTheme: 'light',
        preferredCodeLang: 'python',
        isTimestampBuilderOpen: true,
        isQuickReferenceOpen: true,
        isSettingsOpen: true,
        isCodeBlockModalOpen: true,
        isTemplateGalleryOpen: true,
        isDraftsManagerOpen: true,
      })
    );
  });
});
