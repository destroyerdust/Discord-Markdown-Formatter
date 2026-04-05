import { describe, expect, it, vi } from 'vitest';
import {
  clearAllData,
  loadContent,
  loadDrafts,
  loadSettings,
  runMigrations,
  saveContent,
  saveDrafts,
  saveSettings,
} from '../src/lib/storage';

describe('storage', () => {
  it('loads and saves content, settings, and drafts', () => {
    saveContent('hello');
    saveSettings({ theme: 'dark', tz: 'UTC', analyticsEnabled: true });
    saveDrafts([{ id: '1', title: 'Draft', content: 'Hi', updatedAt: 123 }]);

    expect(loadContent()).toBe('hello');
    expect(loadSettings()).toEqual({ theme: 'dark', tz: 'UTC', analyticsEnabled: true });
    expect(loadDrafts()).toEqual([{ id: '1', title: 'Draft', content: 'Hi', updatedAt: 123 }]);
  });

  it('falls back when storage is empty or contains invalid JSON', () => {
    localStorage.setItem('dmf.content:v1', 'not-json');
    localStorage.setItem('dmf.settings:v1', 'not-json');
    localStorage.setItem('dmf.drafts:v1', 'not-json');

    expect(loadContent()).toBe('');
    expect(loadSettings()).toEqual({
      theme: 'system',
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      analyticsEnabled: false,
    });
    expect(loadDrafts()).toEqual([]);
  });

  it('runs migrations only when the schema version is outdated', () => {
    runMigrations();
    expect(localStorage.getItem('dmf.mig:v1')).toBe('1');

    localStorage.setItem('dmf.mig:v1', JSON.stringify(1));
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    runMigrations();
    expect(setItemSpy).not.toHaveBeenCalledWith('dmf.mig:v1', JSON.stringify(1));
  });

  it('warns when writes fail and tolerates remove failures', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    saveContent('hello');
    saveSettings({ theme: 'light', tz: 'UTC', analyticsEnabled: false });
    saveDrafts([]);
    clearAllData();

    expect(warnSpy).toHaveBeenCalledTimes(3);

    setItemSpy.mockRestore();
    removeItemSpy.mockRestore();
  });
});
