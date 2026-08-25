import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DraftsManager } from '../src/components/DraftsManager';
import { TemplateGallery } from '../src/components/TemplateGallery';
import { useAppStore } from '../src/store/useAppStore';
import { setMediaQueryMatch } from './utils/browser';

describe('template gallery and drafts manager', () => {
  it('returns null for closed template gallery and drafts manager', () => {
    const { container, rerender } = render(
      <TemplateGallery isOpen={false} onClose={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();

    rerender(<DraftsManager isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('supports mobile template browsing, detail view, and append insert mode', async () => {
    setMediaQueryMatch('(min-width: 1024px)', false);
    useAppStore.setState({ content: 'Existing' });
    const onClose = vi.fn();

    render(<TemplateGallery isOpen onClose={onClose} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Interactive' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /Simple Poll/i })[0]);
    expect(screen.getByRole('button', { name: 'Back to template list' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to template list' }));
    expect(screen.getAllByRole('button', { name: /Simple Poll/i })[0]).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /Simple Poll/i })[0]);

    fireEvent.click(screen.getAllByRole('button', { name: 'Append' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Insert Template' })[0]);

    await waitFor(() => {
      expect(useAppStore.getState().content).toContain('Existing\n\n# Poll: Your Question Here?');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('supports desktop template browsing, selection reset, and prepend/replace modes', async () => {
    setMediaQueryMatch('(min-width: 1024px)', true);
    useAppStore.setState({ content: 'Body' });
    const onClose = vi.fn();

    render(<TemplateGallery isOpen onClose={onClose} />);

    expect(screen.getAllByText('Select a template to preview')[0]).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Formatting Examples' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /Formatting Showcase/i })[1]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Prepend' })[1]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Insert Template' })[1]);

    await waitFor(() =>
      expect(useAppStore.getState().content).toMatch(/^# Text Formatting Demo[\s\S]+Body$/)
    );

    useAppStore.setState({ content: 'Replace me' });
    fireEvent.click(screen.getAllByRole('button', { name: 'Rules & Guidelines' })[1]);
    fireEvent.click(screen.getAllByRole('button', { name: /Server Rules/i })[1]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Replace' })[1]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Insert Template' })[1]);

    await waitFor(() => expect(useAppStore.getState().content).toContain('# Server Rules'));
    expect(onClose).toHaveBeenCalled();
  });

  it('handles template gallery close flows, media changes, and empty-content insert modes', async () => {
    setMediaQueryMatch('(min-width: 1024px)', false);
    useAppStore.setState({ content: '' });
    const onClose = vi.fn();

    const { rerender } = render(<TemplateGallery isOpen onClose={onClose} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Rules & Guidelines' })[0]);
    expect(screen.getAllByText('Compact numbered rules list')[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Community Guidelines/)[0]).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Formatting Examples' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /Welcome Message/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Prepend' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Insert Template' })[0]);
    await waitFor(() => expect(useAppStore.getState().content).toMatch(/^# Welcome to the Server!/));

    act(() => {
      useAppStore.setState({ content: '' });
      rerender(<TemplateGallery isOpen onClose={onClose} />);
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Formatting Examples' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /Welcome Message/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Append' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Insert Template' })[0]);
    await waitFor(() => expect(useAppStore.getState().content).toMatch(/^# Welcome to the Server!/));

    act(() => {
      useAppStore.setState({ content: 'Body' });
      rerender(<TemplateGallery isOpen onClose={onClose} />);
    });
    act(() => {
      setMediaQueryMatch('(min-width: 1024px)', true);
    });
    expect(screen.getAllByRole('button', { name: 'Rules & Guidelines' })[1]).toBeInTheDocument();
    onClose.mockClear();
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.mouseDown(screen.getAllByText('Formatting Showcase')[0]);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<TemplateGallery isOpen onClose={onClose} />);
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(<TemplateGallery isOpen onClose={onClose} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Close template gallery' })[0]);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('saves, loads, and deletes drafts with confirmation flows', async () => {
    useAppStore.setState({ content: 'Draft body', drafts: [] });
    const onClose = vi.fn();

    render(<DraftsManager isOpen onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Save Current Content as Draft'), {
      target: { value: '   ' },
    });
    fireEvent.keyDown(screen.getByLabelText('Save Current Content as Draft'), { key: 'Enter' });
    expect(useAppStore.getState().drafts).toHaveLength(0);

    fireEvent.change(screen.getByLabelText('Save Current Content as Draft'), {
      target: { value: 'Draft One' },
    });
    fireEvent.keyDown(screen.getByLabelText('Save Current Content as Draft'), { key: 'Enter' });

    expect(useAppStore.getState().drafts).toHaveLength(1);
    expect(screen.getByText('1 draft saved locally')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Load draft'));
    expect(onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Delete draft'));
    expect(screen.getByText('Delete "Draft One"?')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Delete "Draft One"?')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Delete draft'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(useAppStore.getState().drafts).toEqual([]);
  });

  it('sorts drafts, clears selected draft on delete, and covers cancel/close flows', async () => {
    useAppStore.setState({
      content: 'Current draft body',
      drafts: [
        {
          id: 'older',
          title: 'Older Draft',
          content: 'short',
          updatedAt: 1,
        },
        {
          id: 'newer',
          title: 'Newer Draft',
          content: 'x'.repeat(151),
          updatedAt: 2,
        },
      ],
    });
    const onClose = vi.fn();

    const { rerender } = render(<DraftsManager isOpen onClose={onClose} />);

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings[0]).toHaveTextContent('Newer Draft');
    expect(headings[1]).toHaveTextContent('Older Draft');
    expect(screen.getByText(/\.\.\./)).toBeInTheDocument();

    fireEvent.keyDown(screen.getByLabelText('Save Current Content as Draft'), { key: 'Tab' });
    fireEvent.mouseDown(screen.getByRole('heading', { name: 'Drafts' }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Newer Draft'));
    fireEvent.click(screen.getAllByTitle('Delete draft')[0]);
    expect(screen.getByText('Delete "Newer Draft"?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Delete "Newer Draft"?')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Newer Draft'));
    fireEvent.click(screen.getAllByTitle('Delete draft')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.queryByText('Delete "Newer Draft"?')).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<DraftsManager isOpen onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('shows the empty drafts state and closes from outside clicks', async () => {
    useAppStore.setState({ content: '', drafts: [] });
    const onClose = vi.fn();

    render(<DraftsManager isOpen onClose={onClose} />);

    expect(screen.getByText('No saved drafts yet')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Save Current Content as Draft' })).toBeDisabled();

    fireEvent.mouseDown(document.body);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
