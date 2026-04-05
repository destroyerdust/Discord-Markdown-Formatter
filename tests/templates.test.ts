import { describe, expect, it, vi } from 'vitest';

describe('templates', () => {
  it('returns templates, categories, and template lookups deterministically', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    vi.resetModules();

    const templatesModule = await import('../src/lib/templates');
    const { TEMPLATES, getTemplateById, getTemplateCategories, getTemplatesByCategory } =
      templatesModule;

    expect(TEMPLATES.length).toBeGreaterThan(5);
    expect(getTemplateCategories()).toEqual([
      { id: 'announcement', name: 'Announcements' },
      { id: 'rules', name: 'Rules & Guidelines' },
      { id: 'interactive', name: 'Interactive' },
      { id: 'formatting', name: 'Formatting Examples' },
    ]);
    expect(getTemplatesByCategory('announcement')).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'announcement-basic' })])
    );
    expect(getTemplateById('announcement-event')?.content).toContain('<t:1735776000:F>');
    expect(getTemplateById('announcement-update')?.content).toContain('<t:1735689600:D>');
    expect(getTemplateById('poll-simple')?.content).toContain('<t:1735776000:R>');
    expect(getTemplateById('missing')).toBeUndefined();
  });
});
