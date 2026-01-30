import { useState, useEffect, useRef, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TIMESTAMP_STYLES, formatTimestampPreview, type TimestampStyle } from '../lib/time';

interface SyntaxExample {
  syntax: string;
  description: string;
  rendered?: string;
}

const MARKDOWN_SYNTAX: SyntaxExample[] = [
  { syntax: '**text**', description: 'Bold', rendered: '<strong>text</strong>' },
  { syntax: '*text*', description: 'Italic', rendered: '<em>text</em>' },
  { syntax: '__text__', description: 'Underline', rendered: '<u>text</u>' },
  { syntax: '~~text~~', description: 'Strikethrough', rendered: '<s>text</s>' },
  { syntax: '||text||', description: 'Spoiler', rendered: '<span class="spoiler">text</span>' },
  { syntax: '`code`', description: 'Inline Code', rendered: '<code>code</code>' },
  { syntax: '```lang\\ncode\\n```', description: 'Code Block' },
  { syntax: '> quote', description: 'Block Quote' },
  { syntax: '- item', description: 'Bullet List' },
  { syntax: '[text](url)', description: 'Masked Link', rendered: '<a href="#">text</a>' },
  { syntax: '# Header', description: 'Header (h1-h6)' },
];

const COMBINATION_EXAMPLES: SyntaxExample[] = [
  { syntax: '***bold italic***', description: 'Bold + Italic' },
  { syntax: '__**underline bold**__', description: 'Underline + Bold' },
  { syntax: '~~**strikethrough bold**~~', description: 'Strikethrough + Bold' },
  { syntax: '||**spoiler bold**||', description: 'Spoiler + Bold' },
];

export function QuickReference() {
  const isOpen = useAppStore((state) => state.isQuickReferenceOpen);
  const toggleQuickReference = useAppStore((state) => state.toggleQuickReference);
  const [activeTab, setActiveTab] = useState<'markdown' | 'timestamps'>('markdown');
  const panelRef = useRef<HTMLDivElement>(null);

  // Example epoch (changes every minute to show relative time updates)
  const exampleEpoch = useMemo(() => {
    return Math.floor(Date.now() / 1000) + 300; // 5 minutes in future
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        toggleQuickReference();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleQuickReference]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        toggleQuickReference();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, toggleQuickReference]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-reference-title"
    >
      <div
        ref={panelRef}
        className="w-full max-w-2xl max-h-[80vh] rounded-lg shadow-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 id="quick-reference-title" className="text-lg font-semibold text-[var(--fg-primary)]">
            Quick Reference
          </h2>
          <button
            onClick={toggleQuickReference}
            className="p-1 rounded text-[var(--fg-muted)] hover:text-[var(--fg-primary)]
                       hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab('markdown')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors
                       ${
                         activeTab === 'markdown'
                           ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                           : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'
                       }`}
          >
            Markdown Syntax
          </button>
          <button
            onClick={() => setActiveTab('timestamps')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors
                       ${
                         activeTab === 'timestamps'
                           ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                           : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'
                       }`}
          >
            Timestamps
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'markdown' ? (
            <div className="space-y-6">
              {/* Basic Syntax */}
              <section>
                <h3 className="text-sm font-semibold text-[var(--fg-primary)] mb-3">
                  Basic Formatting
                </h3>
                <div className="space-y-2">
                  {MARKDOWN_SYNTAX.map((item, index) => (
                    <SyntaxRow key={index} {...item} />
                  ))}
                </div>
              </section>

              {/* Combinations */}
              <section>
                <h3 className="text-sm font-semibold text-[var(--fg-primary)] mb-3">
                  Combinations
                </h3>
                <div className="space-y-2">
                  {COMBINATION_EXAMPLES.map((item, index) => (
                    <SyntaxRow key={index} {...item} />
                  ))}
                </div>
              </section>

              {/* Keyboard Shortcuts */}
              <section>
                <h3 className="text-sm font-semibold text-[var(--fg-primary)] mb-3">
                  Keyboard Shortcuts
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <ShortcutRow keys={['Ctrl', 'B']} action="Bold" />
                  <ShortcutRow keys={['Ctrl', 'I']} action="Italic" />
                  <ShortcutRow keys={['Ctrl', 'U']} action="Underline" />
                  <ShortcutRow keys={['Ctrl', 'Shift', 'S']} action="Strikethrough" />
                  <ShortcutRow keys={['Ctrl', '`']} action="Inline Code" />
                  <ShortcutRow keys={['Ctrl', 'Shift', 'C']} action="Code Block" />
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Timestamp Syntax */}
              <section>
                <h3 className="text-sm font-semibold text-[var(--fg-primary)] mb-3">
                  Timestamp Format
                </h3>
                <div className="p-3 rounded-md bg-[var(--bg-tertiary)] space-y-2">
                  <p className="text-sm text-[var(--fg-secondary)]">
                    Discord timestamps use Unix epoch seconds:
                  </p>
                  <code className="block text-sm text-[var(--fg-primary)]">
                    {'<t:EPOCH>'} or {'<t:EPOCH:STYLE>'}
                  </code>
                  <p className="text-xs text-[var(--fg-muted)]">
                    Example: {'<t:1234567890:R>'} displays as relative time
                  </p>
                </div>
              </section>

              {/* Style Options */}
              <section>
                <h3 className="text-sm font-semibold text-[var(--fg-primary)] mb-3">
                  Display Styles
                </h3>
                <div className="space-y-2">
                  {TIMESTAMP_STYLES.map((s) => (
                    <TimestampStyleRow
                      key={s.style}
                      style={s.style}
                      name={s.name}
                      example={formatTimestampPreview(exampleEpoch, s.style)}
                    />
                  ))}
                </div>
              </section>

              {/* Example */}
              <section>
                <h3 className="text-sm font-semibold text-[var(--fg-primary)] mb-3">
                  Live Example
                </h3>
                <div className="p-3 rounded-md bg-[var(--bg-tertiary)]">
                  <p className="text-sm text-[var(--fg-secondary)] mb-2">
                    This timestamp (5 minutes from now):
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <code className="text-[var(--fg-muted)]">{`<t:${exampleEpoch}:R>`}</code>
                      <span className="text-[var(--fg-primary)]">
                        {formatTimestampPreview(exampleEpoch, 'R')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <code className="text-[var(--fg-muted)]">{`<t:${exampleEpoch}:f>`}</code>
                      <span className="text-[var(--fg-primary)]">
                        {formatTimestampPreview(exampleEpoch, 'f')}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Tips */}
              <section>
                <h3 className="text-sm font-semibold text-[var(--fg-primary)] mb-3">Tips</h3>
                <ul className="space-y-2 text-sm text-[var(--fg-secondary)]">
                  <li className="flex gap-2">
                    <span className="text-[var(--accent)]">*</span>
                    Timestamps automatically adjust to each viewer's timezone
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--accent)]">*</span>
                    Relative times (R) update in real-time
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--accent)]">*</span>
                    Default style (no suffix) shows short date/time
                  </li>
                </ul>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] text-center">
          <p className="text-xs text-[var(--fg-muted)]">
            Press <kbd className="px-1 py-0.5 rounded bg-[var(--bg-tertiary)]">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}

function SyntaxRow({ syntax, description, rendered }: SyntaxExample) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-tertiary)]">
      <code className="text-sm text-[var(--fg-primary)] font-mono">{syntax}</code>
      <div className="flex items-center gap-3">
        {rendered && (
          <span
            className="text-sm text-[var(--fg-secondary)]"
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        )}
        <span className="text-xs text-[var(--fg-muted)]">{description}</span>
      </div>
    </div>
  );
}

function ShortcutRow({ keys, action }: { keys: string[]; action: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-tertiary)]">
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={index}>
            <kbd className="px-1.5 py-0.5 text-xs rounded bg-[var(--bg-code)] text-[var(--fg-primary)]">
              {key}
            </kbd>
            {index < keys.length - 1 && <span className="text-[var(--fg-muted)] mx-0.5">+</span>}
          </span>
        ))}
      </div>
      <span className="text-sm text-[var(--fg-secondary)]">{action}</span>
    </div>
  );
}

function TimestampStyleRow({
  style,
  name,
  example,
}: {
  style: TimestampStyle;
  name: string;
  example: string;
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-tertiary)]">
      <div className="flex items-center gap-2">
        <code className="text-sm text-[var(--accent)] font-mono">:{style}</code>
        <span className="text-sm text-[var(--fg-primary)]">{name}</span>
      </div>
      <span className="text-sm text-[var(--fg-secondary)]">{example}</span>
    </div>
  );
}
