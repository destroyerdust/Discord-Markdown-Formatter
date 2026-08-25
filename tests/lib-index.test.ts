import { describe, expect, it, vi } from 'vitest';
import * as lib from '../src/lib';

describe('lib barrel', () => {
  it('re-exports the public utility surface', () => {
    expect(lib.renderMarkdown).toBeTypeOf('function');
    expect(lib.sanitizeHtml).toBeTypeOf('function');
    expect(lib.toggleWrap).toBeTypeOf('function');
    expect(lib.copyToClipboard).toBeTypeOf('function');
    expect(lib.loadContent).toBeTypeOf('function');
    expect(lib.getAvailableLanguages).toBeTypeOf('function');
    expect(lib.getCurrentDate).toBeTypeOf('function');
    expect(lib.getTemplateById).toBeTypeOf('function');
  });

  it('renders the main entrypoint through react-dom', async () => {
    const render = vi.fn();
    const createRoot = vi.fn(() => ({ render }));

    vi.doMock('react-dom/client', () => ({ createRoot }));
    document.body.innerHTML = '<div id="root"></div>';

    await import('../src/main');

    expect(createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(render).toHaveBeenCalled();
  });
});
