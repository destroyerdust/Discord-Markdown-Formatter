import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as components from '../src/components';
import { App } from '../src/app/App';
import { CopyButton } from '../src/components/CopyButton';
import { Header } from '../src/components/Header';
import { Preview } from '../src/components/Preview';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { ThemeToggle } from '../src/components/ThemeToggle';
import { Toolbar } from '../src/components/Toolbar';
import { useAppStore } from '../src/store/useAppStore';
import { setMediaQueryMatch } from './utils/browser';

const copyToClipboardMock = vi.fn<(text: string) => Promise<boolean>>();

vi.mock('../src/lib/clipboard', () => ({
  copyToClipboard: (text: string) => copyToClipboardMock(text),
}));

describe('shell components', () => {
  beforeEach(() => {
    copyToClipboardMock.mockReset();
  });

  it('re-exports component modules from the barrel file', () => {
    expect(components.Header).toBeTypeOf('function');
    expect(components.Settings).toBeTypeOf('function');
    expect(components.ThemeProvider).toBeTypeOf('function');
    expect(components.ThemeToggle).toBeTypeOf('function');
    expect(components.Editor).toBeTypeOf('function');
    expect(components.Preview).toBeTypeOf('function');
    expect(components.Toolbar).toBeTypeOf('function');
    expect(components.CopyButton).toBeTypeOf('function');
    expect(components.CodeBlockModal).toBeTypeOf('function');
    expect(components.TimestampBuilder).toBeTypeOf('function');
    expect(components.QuickReference).toBeTypeOf('function');
    expect(components.TemplateGallery).toBeTypeOf('function');
    expect(components.DraftsManager).toBeTypeOf('function');
  });

  it('shows copied feedback when copy succeeds and stays idle on failure', async () => {
    vi.useFakeTimers();
    copyToClipboardMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const { rerender } = render(<CopyButton text="hello" label="Raw" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy Raw' }));
      await Promise.resolve();
    });
    expect(copyToClipboardMock).toHaveBeenCalledWith('hello');
    expect(screen.getByText('Copied!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(screen.getByRole('button', { name: 'Copy Raw' })).toBeInTheDocument();

    rerender(<CopyButton text="goodbye" label="Raw" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy Raw' }));
      await Promise.resolve();
    });
    expect(copyToClipboardMock).toHaveBeenCalledWith('goodbye');
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
  });

  it('renders preview states and reveals spoilers with mouse and keyboard', async () => {
    act(() => {
      useAppStore.setState({ content: '' });
    });
    const { rerender } = render(<Preview />);

    const emptyState = screen.getByText('Preview will appear here as you type...');
    expect(emptyState).toBeInTheDocument();
    fireEvent.click(emptyState);
    fireEvent.keyDown(emptyState, { key: 'Enter' });

    act(() => {
      useAppStore.setState({ content: '||secret||' });
      rerender(<Preview />);
    });

    const spoiler = await screen.findByRole('button', { name: 'Spoiler (click to reveal)' });
    expect(spoiler).not.toHaveClass('revealed');

    fireEvent.click(spoiler);
    expect(spoiler).toHaveClass('revealed');

    fireEvent.keyDown(spoiler, { key: 'Space' });
    expect(spoiler).toHaveClass('revealed');

    fireEvent.keyDown(spoiler, { key: 'Enter' });
    expect(spoiler).not.toHaveClass('revealed');

    fireEvent.keyDown(spoiler, { key: 'Escape' });
    expect(spoiler).not.toHaveClass('revealed');

    act(() => {
      useAppStore.setState({ content: 'plain' });
      rerender(<Preview />);
    });
    const plainText = screen.getByText('plain');
    fireEvent.click(plainText);
    fireEvent.keyDown(plainText, { key: ' ' });
    expect(screen.getByText('plain')).toBeInTheDocument();
  });

  it('cycles themes and reacts to system theme changes', async () => {
    setMediaQueryMatch('(prefers-color-scheme: dark)', true);
    useAppStore.setState({ theme: 'system' });

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(document.documentElement).toHaveClass('dark');
    expect(useAppStore.getState().resolvedTheme).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: /Current theme: System/i }));
    expect(useAppStore.getState().theme).toBe('light');

    fireEvent.click(screen.getByRole('button', { name: /Current theme: Light/i }));
    expect(useAppStore.getState().theme).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: /Current theme: Dark/i }));
    expect(useAppStore.getState().theme).toBe('system');

    setMediaQueryMatch('(prefers-color-scheme: dark)', false);
    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass('dark');
      expect(useAppStore.getState().resolvedTheme).toBe('light');
    });
  });

  it('renders header actions and badge counts', () => {
    useAppStore.setState({
      drafts: [{ id: '1', title: 'Draft', content: 'Body', updatedAt: 1 }],
    });

    render(<Header />);

    expect(screen.getByText('Discord Markdown Formatter')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open templates' }));
    expect(useAppStore.getState().isTemplateGalleryOpen).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Open drafts' }));
    expect(useAppStore.getState().isDraftsManagerOpen).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Open quick reference' }));
    expect(useAppStore.getState().isQuickReferenceOpen).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(useAppStore.getState().isSettingsOpen).toBe(true);
  });

  it('fires every toolbar action', async () => {
    const user = userEvent.setup();
    const handlers = {
      onBold: vi.fn(),
      onItalic: vi.fn(),
      onUnderline: vi.fn(),
      onStrikethrough: vi.fn(),
      onHeader: vi.fn(),
      onCode: vi.fn(),
      onCodeBlock: vi.fn(),
      onSpoiler: vi.fn(),
      onSubtext: vi.fn(),
      onQuote: vi.fn(),
      onMultilineQuote: vi.fn(),
      onList: vi.fn(),
      onNumberedList: vi.fn(),
      onLink: vi.fn(),
      onTimestamp: vi.fn(),
    };

    render(<Toolbar {...handlers} />);

    for (const label of [
      'Bold',
      'Italic',
      'Underline',
      'Strikethrough',
      'Header',
      'Inline Code',
      'Code Block',
      'Spoiler',
      'Subtext',
      'Block Quote',
      'Multiline Quote',
      'Bullet List',
      'Numbered List',
      'Masked Link',
      'Insert Timestamp',
    ]) {
      await user.click(screen.getByRole('button', { name: label }));
    }

    expect(handlers.onBold).toHaveBeenCalled();
    expect(handlers.onItalic).toHaveBeenCalled();
    expect(handlers.onUnderline).toHaveBeenCalled();
    expect(handlers.onStrikethrough).toHaveBeenCalled();
    expect(handlers.onHeader).toHaveBeenCalled();
    expect(handlers.onCode).toHaveBeenCalled();
    expect(handlers.onCodeBlock).toHaveBeenCalled();
    expect(handlers.onSpoiler).toHaveBeenCalled();
    expect(handlers.onSubtext).toHaveBeenCalled();
    expect(handlers.onQuote).toHaveBeenCalled();
    expect(handlers.onMultilineQuote).toHaveBeenCalled();
    expect(handlers.onList).toHaveBeenCalled();
    expect(handlers.onNumberedList).toHaveBeenCalled();
    expect(handlers.onLink).toHaveBeenCalled();
    expect(handlers.onTimestamp).toHaveBeenCalled();
  });

  it('hydrates the app, flushes pending content on unload, and lazy-loads modal surfaces', async () => {
    localStorage.setItem('dmf.content:v1', JSON.stringify('Hydrated content'));
    setMediaQueryMatch('(prefers-color-scheme: dark)', false);

    render(<App />);

    expect(await screen.findByDisplayValue('Hydrated content')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Message content' }), {
      target: { value: 'Pending save' },
    });
    fireEvent(window, new Event('beforeunload'));
    expect(localStorage.getItem('dmf.content:v1')).toBe(JSON.stringify('Pending save'));

    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(await screen.findByRole('dialog', { name: 'Settings' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open quick reference' }));
    expect(await screen.findByRole('dialog', { name: 'Quick Reference' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open templates' }));
    expect(await screen.findByRole('dialog', { name: 'Template Gallery' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open drafts' }));
    expect(await screen.findByRole('dialog', { name: 'Drafts' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Insert Timestamp' }));
    expect(await screen.findByRole('dialog', { name: 'Timestamp Builder' })).toBeInTheDocument();
  });
});
