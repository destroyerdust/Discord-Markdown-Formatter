import { useMemo, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { renderMarkdown } from '../lib/markdown';
import { sanitizeHtml } from '../lib/sanitize';
import { CopyButton } from './CopyButton';

export function Preview() {
  const content = useAppStore((state) => state.content);

  // Render and sanitize markdown
  const renderedHtml = useMemo(() => {
    if (!content.trim()) {
      return '';
    }
    const rawHtml = renderMarkdown(content);
    return sanitizeHtml(rawHtml);
  }, [content]);

  // Handle spoiler click to reveal
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('spoiler')) {
      target.classList.toggle('revealed');
    }
  }, []);

  // Handle keyboard for spoiler reveal (accessibility)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const target = e.target as HTMLElement;
      if (target.classList.contains('spoiler')) {
        e.preventDefault();
        target.classList.toggle('revealed');
      }
    }
  }, []);

  return (
    <section
      className="flex-1 flex flex-col min-h-[300px] lg:min-h-0 lg:w-1/2"
      aria-label="Preview"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2
                   bg-[var(--bg-secondary)] border-b border-[var(--border)]"
      >
        <h2 className="text-sm font-medium text-[var(--fg-secondary)]">Preview</h2>
        <CopyButton text={content} label="Copy Raw" className="shrink-0" />
      </div>

      {/* Preview Content */}
      <div className="flex-1 p-4 overflow-auto" onClick={handleClick} onKeyDown={handleKeyDown}>
        {renderedHtml ? (
          <div className="discord-preview" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        ) : (
          <p className="text-[var(--fg-muted)] italic text-sm">
            Preview will appear here as you type...
          </p>
        )}
      </div>
    </section>
  );
}
