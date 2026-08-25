import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CodeBlockModal } from '../src/components/CodeBlockModal';
import { Editor } from '../src/components/Editor';
import { useAppStore } from '../src/store/useAppStore';

function selectTextareaRange(textarea: HTMLTextAreaElement, start: number, end: number): void {
  textarea.focus();
  textarea.setSelectionRange(start, end);
  fireEvent.select(textarea, {
    target: { selectionStart: start, selectionEnd: end },
  });
  fireEvent.mouseUp(textarea);
}

describe('editor and code block modal', () => {
  it('returns null when the code block modal is closed', () => {
    const { container } = render(
      <CodeBlockModal isOpen={false} onClose={vi.fn()} onInsert={vi.fn()} initialLanguage="js" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('filters, inserts, and closes the code block modal', async () => {
    const onClose = vi.fn();
    const onInsert = vi.fn();

    render(
      <CodeBlockModal isOpen onClose={onClose} onInsert={onInsert} initialLanguage="react" />
    );

    const input = screen.getByRole('textbox', { name: 'Search languages' });
    await waitFor(() => expect(input).toHaveFocus());

    fireEvent.change(input, { target: { value: 'zzzz' } });
    expect(screen.getByText('No languages found matching "zzzz"')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Show all languages' }));
    expect(screen.getByRole('button', { name: 'Show popular only' })).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onInsert).toHaveBeenCalledWith('jsx');
    expect(onClose).toHaveBeenCalled();
  });

  it('supports alias search, ignores shift-enter, and closes from action buttons', async () => {
    const onClose = vi.fn();
    const onInsert = vi.fn();

    const { rerender } = render(
      <CodeBlockModal isOpen onClose={onClose} onInsert={onInsert} initialLanguage="js" />
    );

    expect(screen.getByRole('button', { name: /JavaScript/i })).toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: 'Search languages' });
    fireEvent.change(input, { target: { value: 'shell' } });
    expect(screen.getByRole('button', { name: /Bash/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Bash/i }));
    expect(screen.getAllByText('bash')[0]).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(onInsert).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByRole('dialog').firstElementChild as Element);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<CodeBlockModal isOpen onClose={onClose} onInsert={onInsert} initialLanguage="js" />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('closes the code block modal with escape and outside click', () => {
    const onClose = vi.fn();

    const { rerender } = render(
      <CodeBlockModal isOpen onClose={onClose} onInsert={vi.fn()} initialLanguage="js" />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<CodeBlockModal isOpen onClose={onClose} onInsert={vi.fn()} initialLanguage="js" />);
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('updates content, selection, and formatting actions from the editor toolbar', async () => {
    render(<Editor />);
    const textarea = screen.getByRole('textbox', { name: 'Message content' }) as HTMLTextAreaElement;

    const runFormat = async (
      content: string,
      buttonLabel: string,
      expectedContent: string,
      selectionStart = 0,
      selectionEnd = content.length
    ) => {
      fireEvent.change(textarea, { target: { value: content } });
      await waitFor(() => expect(textarea).toHaveValue(content));
      selectTextareaRange(textarea, selectionStart, selectionEnd);
      fireEvent.click(screen.getByRole('button', { name: buttonLabel }));
      await waitFor(() => expect(useAppStore.getState().content).toBe(expectedContent));
    };

    fireEvent.change(textarea, { target: { value: 'Plain' } });
    expect(useAppStore.getState().content).toBe('Plain');
    selectTextareaRange(textarea, 1, 3);
    await waitFor(() => expect(textarea.selectionStart).toBe(1));
    await waitFor(() => expect(textarea.selectionEnd).toBe(3));

    await runFormat('Hello', 'Bold', '**Hello**');
    await runFormat('Hello', 'Italic', '*Hello*');
    await runFormat('Hello', 'Underline', '__Hello__');
    await runFormat('Hello', 'Strikethrough', '~~Hello~~');
    await runFormat('Hello', 'Header', '# Hello');
    await runFormat('Hello', 'Inline Code', '`Hello`');
    await runFormat('Hello', 'Spoiler', '||Hello||');
    await runFormat('Hello', 'Subtext', '-# Hello');
    await runFormat('Hello', 'Block Quote', '> Hello');
    await runFormat('Hello', 'Multiline Quote', '>>> Hello');
    await runFormat('Hello', 'Bullet List', '- Hello');
    await runFormat('Hello', 'Numbered List', '1. Hello');
    await runFormat('Hello', 'Masked Link', '[Hello](url)');

    fireEvent.click(screen.getByRole('button', { name: 'Insert Timestamp' }));
    expect(useAppStore.getState().isTimestampBuilderOpen).toBe(true);
  });

  it('opens the language picker and inserts a code block with the chosen language', async () => {
    render(<Editor />);
    const textarea = screen.getByRole('textbox', { name: 'Message content' }) as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: 'console.log(1);' } });
    await waitFor(() => expect(textarea).toHaveValue('console.log(1);'));
    selectTextareaRange(textarea, 0, 'console.log(1);'.length);
    fireEvent.click(screen.getByRole('button', { name: 'Code Block' }));

    expect(await screen.findByRole('dialog', { name: 'Insert Code Block' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show all languages' }));
    fireEvent.click(screen.getByRole('button', { name: /TypeScript/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Insert Code Block' }));

    await waitFor(() => {
      expect(useAppStore.getState().content).toBe('```typescript\nconsole.log(1);\n```');
      expect(useAppStore.getState().preferredCodeLang).toBe('typescript');
      expect(useAppStore.getState().isCodeBlockModalOpen).toBe(false);
    });
  });

  it('supports keyboard shortcuts for inline formatting and quick code blocks', async () => {
    render(<Editor />);
    const textarea = screen.getByRole('textbox', { name: 'Message content' }) as HTMLTextAreaElement;

    const runShortcut = async (
      content: string,
      event: Record<string, unknown>,
      expectedContent: string
    ) => {
      fireEvent.change(textarea, { target: { value: content } });
      await waitFor(() => expect(textarea).toHaveValue(content));
      selectTextareaRange(textarea, 0, content.length);
      fireEvent.keyDown(textarea, event);
      await waitFor(() => expect(useAppStore.getState().content).toBe(expectedContent));
    };

    await runShortcut('Hello', { key: 'b', ctrlKey: true }, '**Hello**');
    await runShortcut('Hello', { key: 'i', ctrlKey: true }, '*Hello*');
    await runShortcut('Hello', { key: 'u', ctrlKey: true }, '__Hello__');
    await runShortcut('Hello', { key: 'S', ctrlKey: true, shiftKey: true }, '~~Hello~~');
    await runShortcut('Hello', { key: '`', ctrlKey: true }, '`Hello`');

    useAppStore.getState().setPreferredCodeLang('js');
    await runShortcut('Hello', { key: 'C', ctrlKey: true, shiftKey: true }, '```js\nHello\n```');

    await runShortcut('Hello', { key: 'b', metaKey: true }, '**Hello**');
  });

  it('handles the native quick code block shortcut listener', async () => {
    render(<Editor />);
    const textarea = screen.getByRole('textbox', { name: 'Message content' }) as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: 'Hello' } });
    await waitFor(() => expect(textarea).toHaveValue('Hello'));
    selectTextareaRange(textarea, 0, 5);
    useAppStore.getState().setPreferredCodeLang('js');

    textarea.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'C',
        code: 'KeyC',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      })
    );

    await waitFor(() => expect(useAppStore.getState().content).toBe('```js\nHello\n```'));

    fireEvent.change(textarea, { target: { value: 'Still here' } });
    await waitFor(() => expect(textarea).toHaveValue('Still here'));
    selectTextareaRange(textarea, 0, 'Still here'.length);
    textarea.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'x',
        code: 'KeyX',
        ctrlKey: true,
        bubbles: true,
      })
    );
    expect(useAppStore.getState().content).toBe('Still here');
  });
});
