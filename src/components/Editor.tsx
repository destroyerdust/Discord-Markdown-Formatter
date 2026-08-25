import { useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Toolbar } from './Toolbar';
import { CopyButton } from './CopyButton';
import { CodeBlockModal } from './CodeBlockModal';
import { applyMessageFormatting, type MessageFormattingIntent } from '../lib/messageFormatting';

export function Editor() {
  const content = useAppStore((state) => state.content);
  const setContent = useAppStore((state) => state.setContent);
  const setSelection = useAppStore((state) => state.setSelection);
  const toggleTimestampBuilder = useAppStore((state) => state.toggleTimestampBuilder);
  const isCodeBlockModalOpen = useAppStore((state) => state.isCodeBlockModalOpen);
  const toggleCodeBlockModal = useAppStore((state) => state.toggleCodeBlockModal);
  const preferredCodeLang = useAppStore((state) => state.preferredCodeLang);
  const setPreferredCodeLang = useAppStore((state) => state.setPreferredCodeLang);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get current selection from textarea
  const getSelection = useCallback(() => {
    const textarea = textareaRef.current!;
    return {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
  }, []);

  // Set selection in textarea
  const setTextareaSelection = useCallback((start: number, end: number) => {
    const textarea = textareaRef.current!;

    // Need to do this after React updates the value
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, end);
    });
  }, []);

  // Apply formatting action
  const applyFormat = useCallback(
    (intent: MessageFormattingIntent) => {
      const selection = getSelection();
      const result = applyMessageFormatting(content, selection, intent);

      if (result.type === 'needsCodeLanguage') {
        toggleCodeBlockModal();
        return;
      }

      setContent(result.message);
      setTextareaSelection(result.selection.start, result.selection.end);
    },
    [content, getSelection, setContent, setTextareaSelection, toggleCodeBlockModal]
  );

  // Formatting handlers
  const handleBold = useCallback(() => {
    applyFormat({ type: 'bold' });
  }, [applyFormat]);

  const handleItalic = useCallback(() => {
    applyFormat({ type: 'italic' });
  }, [applyFormat]);

  const handleUnderline = useCallback(() => {
    applyFormat({ type: 'underline' });
  }, [applyFormat]);

  const handleStrikethrough = useCallback(() => {
    applyFormat({ type: 'strikethrough' });
  }, [applyFormat]);

  const handleHeader = useCallback(() => {
    applyFormat({ type: 'header' });
  }, [applyFormat]);

  const handleCode = useCallback(() => {
    applyFormat({ type: 'inlineCode' });
  }, [applyFormat]);

  const handleCodeBlock = useCallback(() => {
    applyFormat({ type: 'codeBlock' });
  }, [applyFormat]);

  const handleCodeBlockInsert = useCallback(
    (language: string) => {
      setPreferredCodeLang(language);
      applyFormat({ type: 'codeBlockWithLanguage', language });
    },
    [applyFormat, setPreferredCodeLang]
  );

  const handleSpoiler = useCallback(() => {
    applyFormat({ type: 'spoiler' });
  }, [applyFormat]);

  const handleSubtext = useCallback(() => {
    applyFormat({ type: 'subtext' });
  }, [applyFormat]);

  const handleQuote = useCallback(() => {
    applyFormat({ type: 'blockQuote' });
  }, [applyFormat]);

  const handleMultilineQuote = useCallback(() => {
    applyFormat({ type: 'multilineQuote' });
  }, [applyFormat]);

  const handleList = useCallback(() => {
    applyFormat({ type: 'bulletList' });
  }, [applyFormat]);

  const handleNumberedList = useCallback(() => {
    applyFormat({ type: 'numberedList' });
  }, [applyFormat]);

  const handleLink = useCallback(() => {
    applyFormat({ type: 'maskedLink' });
  }, [applyFormat]);

  const handleTimestamp = useCallback(() => {
    toggleTimestampBuilder();
  }, [toggleTimestampBuilder]);

  // Handle text changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);
    },
    [setContent]
  );

  // Track selection changes
  const handleSelect = useCallback(() => {
    const { start, end } = getSelection();
    setSelection({ start, end });
  }, [getSelection, setSelection]);

  // Keyboard shortcuts
  useEffect(() => {
    const textarea = textareaRef.current!;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === 'b') {
        e.preventDefault();
        handleBold();
      } else if (isMod && e.key === 'i') {
        e.preventDefault();
        handleItalic();
      } else if (isMod && e.key === 'u') {
        e.preventDefault();
        handleUnderline();
      } else if (isMod && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handleStrikethrough();
      } else if (isMod && e.key === '`') {
        e.preventDefault();
        handleCode();
      } else if (isMod && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        // Quick insert with preferred language
        applyFormat({ type: 'codeBlockWithLanguage', language: preferredCodeLang });
      }
    };

    textarea.addEventListener('keydown', handleKeyDown);
    return () => textarea.removeEventListener('keydown', handleKeyDown);
  }, [
    handleBold,
    handleItalic,
    handleUnderline,
    handleStrikethrough,
    handleCode,
    applyFormat,
    preferredCodeLang,
  ]);

  return (
    <>
      <section
        className="flex-1 flex flex-col min-h-[300px] lg:min-h-0 lg:w-1/2
                   border-b lg:border-b-0 lg:border-r border-[var(--border)]"
        aria-label="Editor"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-2 px-3 py-2
                     bg-[var(--bg-secondary)] border-b border-[var(--border)]"
        >
          <div className="flex items-center gap-3 overflow-x-auto">
            <h2 className="text-sm font-medium text-[var(--fg-secondary)] shrink-0">Editor</h2>
            <Toolbar
              onBold={handleBold}
              onItalic={handleItalic}
              onUnderline={handleUnderline}
              onStrikethrough={handleStrikethrough}
              onHeader={handleHeader}
              onCode={handleCode}
              onCodeBlock={handleCodeBlock}
              onSpoiler={handleSpoiler}
              onSubtext={handleSubtext}
              onQuote={handleQuote}
              onMultilineQuote={handleMultilineQuote}
              onList={handleList}
              onNumberedList={handleNumberedList}
              onLink={handleLink}
              onTimestamp={handleTimestamp}
            />
          </div>
          <CopyButton text={content} label="Copy" className="shrink-0" />
        </div>

        {/* Textarea */}
        <div className="flex-1 flex flex-col min-h-0 p-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onSelect={handleSelect}
            onKeyUp={handleSelect}
            onMouseUp={handleSelect}
            className="input w-full flex-1 min-h-0 font-mono text-sm resize-none leading-relaxed"
            placeholder="Type your Discord message here...

Try some Markdown:
**bold** *italic* __underline__ ~~strikethrough~~
||spoiler|| `inline code`
# Header
-# Subtext

>>> Multiline quote
Still quoted here

```js
// Code block
console.log('Hello, Discord!');
```

> Block quote
- List item
1. Numbered item

[masked link](https://example.com)

Timestamps: <t:1234567890:R>"
            aria-label="Message content"
            spellCheck="true"
          />
        </div>
      </section>

      {/* Code Block Language Picker Modal */}
      <CodeBlockModal
        isOpen={isCodeBlockModalOpen}
        onClose={toggleCodeBlockModal}
        onInsert={handleCodeBlockInsert}
        initialLanguage={preferredCodeLang}
      />
    </>
  );
}
