import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuickReference } from '../src/components/QuickReference';
import { Settings } from '../src/components/Settings';
import { TimestampBuilder } from '../src/components/TimestampBuilder';
import { useAppStore } from '../src/store/useAppStore';

describe('settings, quick reference, and timestamp builder', () => {
  it('returns null for closed settings and quick reference panels', () => {
    const { container, rerender } = render(<Settings />);
    expect(container).toBeEmptyDOMElement();

    rerender(<QuickReference />);
    expect(container).toBeEmptyDOMElement();
  });

  it('updates settings values and closes with escape and outside click', async () => {
    useAppStore.setState({ isSettingsOpen: true });
    const { rerender } = render(<Settings />);

    fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'dark' } });
    expect(useAppStore.getState().theme).toBe('dark');

    fireEvent.change(screen.getByLabelText('Default Timezone'), {
      target: { value: 'UTC' },
    });
    expect(useAppStore.getState().tz).toBe('UTC');

    fireEvent.click(screen.getByRole('switch', { name: 'Anonymous Analytics' }));
    expect(useAppStore.getState().analyticsEnabled).toBe(true);

    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.mouseDown(screen.getByRole('heading', { name: 'Settings' }));
    expect(useAppStore.getState().isSettingsOpen).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(useAppStore.getState().isSettingsOpen).toBe(false);

    useAppStore.setState({ isSettingsOpen: true });
    rerender(<Settings />);
    const backdrop = screen.getByRole('dialog').querySelector('[aria-hidden="true"]') as Element;
    fireEvent.mouseDown(backdrop);
    await waitFor(() => expect(useAppStore.getState().isSettingsOpen).toBe(false));
  });

  it('closes settings from the header button', () => {
    useAppStore.setState({ isSettingsOpen: true });
    render(<Settings />);

    fireEvent.click(screen.getByRole('button', { name: 'Close settings' }));
    expect(useAppStore.getState().isSettingsOpen).toBe(false);
  });

  it('switches quick reference tabs and closes the dialog', async () => {
    useAppStore.setState({ isQuickReferenceOpen: true });
    render(<QuickReference />);

    expect(screen.getByText('Basic Formatting')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.mouseDown(screen.getByRole('heading', { name: 'Quick Reference' }));
    expect(useAppStore.getState().isQuickReferenceOpen).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Timestamps' }));
    expect(screen.getByText('Timestamp Format')).toBeInTheDocument();
    expect(screen.getByText('Live Example')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Markdown Syntax' }));
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    await waitFor(() => expect(useAppStore.getState().isQuickReferenceOpen).toBe(false));
  });

  it('closes quick reference with escape and the close button', () => {
    useAppStore.setState({ isQuickReferenceOpen: true });
    const { rerender } = render(<QuickReference />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(useAppStore.getState().isQuickReferenceOpen).toBe(false);

    useAppStore.setState({ isQuickReferenceOpen: true });
    rerender(<QuickReference />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(useAppStore.getState().isQuickReferenceOpen).toBe(false);
  });

  it('renders and interacts with the timestamp builder', async () => {
    useAppStore.setState({
      isTimestampBuilderOpen: true,
      content: 'Meet at ',
      selection: { start: 8, end: 8 },
      tz: 'UTC',
    });

    render(<TimestampBuilder />);

    expect(screen.getByRole('dialog', { name: 'Timestamp Builder' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'In 5 minutes' }));
    fireEvent.click(screen.getByRole('button', { name: /Long Date\/Time/i }));
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2025-01-03' } });
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '18:45' } });
    fireEvent.change(screen.getByLabelText('Timezone'), { target: { value: 'America/New_York' } });
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.mouseDown(screen.getByRole('heading', { name: 'Timestamp Builder' }));
    expect(useAppStore.getState().isTimestampBuilderOpen).toBe(true);

    expect(screen.getByText('Preview:')).toBeInTheDocument();
    expect(screen.getByText('Unix Epoch:')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.click(screen.getByRole('button', { name: 'Insert Timestamp' }));

    await waitFor(() => {
      expect(useAppStore.getState().content).toMatch(/^Meet at <t:\d+>$/);
      expect(useAppStore.getState().isTimestampBuilderOpen).toBe(false);
    });
  });

  it('closes the timestamp builder via cancel, escape, and outside click', async () => {
    useAppStore.setState({ isTimestampBuilderOpen: true, content: '' });
    const { rerender } = render(<TimestampBuilder />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(useAppStore.getState().isTimestampBuilderOpen).toBe(false);

    useAppStore.setState({ isTimestampBuilderOpen: true });
    rerender(<TimestampBuilder />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(useAppStore.getState().isTimestampBuilderOpen).toBe(false);

    useAppStore.setState({ isTimestampBuilderOpen: true });
    rerender(<TimestampBuilder />);
    fireEvent.mouseDown(document.body);
    await waitFor(() => expect(useAppStore.getState().isTimestampBuilderOpen).toBe(false));
  });

  it('inserts a timestamp at the end when no selection exists', async () => {
    useAppStore.setState({
      isTimestampBuilderOpen: true,
      content: 'Ends here',
      selection: null,
      tz: 'UTC',
    });

    render(<TimestampBuilder />);

    fireEvent.click(screen.getByRole('button', { name: /Relative/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Insert Timestamp' }));

    await waitFor(() => expect(useAppStore.getState().content).toMatch(/^Ends here<t:\d+:R>$/));
  });
});
