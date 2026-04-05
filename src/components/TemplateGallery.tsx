import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TEMPLATES, getTemplateCategories, type Template } from '../lib/templates';

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

type InsertMode = 'replace' | 'append' | 'prepend';
type GalleryView = 'browse' | 'detail';

const INSERT_MODE_OPTIONS: { value: InsertMode; label: string }[] = [
  { value: 'replace', label: 'Replace' },
  { value: 'append', label: 'Append' },
  { value: 'prepend', label: 'Prepend' },
];

export function TemplateGallery({ isOpen, onClose }: TemplateGalleryProps) {
  const setContent = useAppStore((state) => state.setContent);
  const content = useAppStore((state) => state.content);

  const [selectedCategory, setSelectedCategory] = useState<Template['category']>('announcement');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [insertMode, setInsertMode] = useState<InsertMode>('replace');
  const [view, setView] = useState<GalleryView>('browse');
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const titleIdBase = useId();
  const categories = getTemplateCategories();
  const filteredTemplates = TEMPLATES.filter((template) => template.category === selectedCategory);
  const mobileBrowseTitleId = `${titleIdBase}-mobile-browse`;
  const mobileDetailTitleId = `${titleIdBase}-mobile-detail`;
  const desktopTitleId = `${titleIdBase}-desktop`;
  const activeTitleId = isDesktop
    ? desktopTitleId
    : view === 'detail'
      ? mobileDetailTitleId
      : mobileBrowseTitleId;

  const handleClose = useCallback(() => {
    setView('browse');
    onClose();
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleMediaChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClose]);

  const handleCategorySelect = useCallback(
    (category: Template['category']) => {
      setSelectedCategory(category);
      if (selectedTemplate?.category !== category) {
        setSelectedTemplate(null);
      }
    },
    [selectedTemplate]
  );

  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setView('detail');
  }, []);

  const handleInsert = useCallback(() => {
    if (!selectedTemplate) return;

    let newContent: string;
    switch (insertMode) {
      case 'append':
        newContent = content + (content ? '\n\n' : '') + selectedTemplate.content;
        break;
      case 'prepend':
        newContent = selectedTemplate.content + (content ? '\n\n' : '') + content;
        break;
      case 'replace':
      default:
        newContent = selectedTemplate.content;
        break;
    }

    setContent(newContent);
    handleClose();
  }, [selectedTemplate, insertMode, content, setContent, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={activeTitleId}
    >
      <div className="flex h-full items-end justify-center sm:items-center">
        <div
          ref={panelRef}
          className="flex h-[min(calc(100dvh_-_1rem),56rem)] w-full max-w-4xl flex-col overflow-hidden
                     rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-xl
                     lg:max-h-[85vh] lg:h-auto lg:rounded-lg"
        >
          <div className="flex min-h-0 flex-1 flex-col lg:hidden">
            <section className={`${view === 'browse' ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col`}>
              <div className="border-b border-[var(--border)]">
                <div className="flex items-center justify-between px-4 py-4">
                  <h2
                    id={mobileBrowseTitleId}
                    className="text-lg font-semibold text-[var(--fg-primary)]"
                  >
                    Template Gallery
                  </h2>
                  <IconButton onClick={handleClose} ariaLabel="Close template gallery">
                    <CloseIcon />
                  </IconButton>
                </div>

                <div className="overflow-x-auto px-4 pb-4">
                  <nav className="flex min-w-max gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition-colors
                                   ${
                                     selectedCategory === category.id
                                       ? 'bg-[var(--accent)] text-white'
                                       : 'bg-[var(--bg-tertiary)] text-[var(--fg-secondary)] hover:bg-[var(--border)] hover:text-[var(--fg-primary)]'
                                   }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full rounded-xl border p-4 text-left transition-colors
                                 ${
                                   selectedTemplate?.id === template.id
                                     ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                                     : 'border-[var(--border)] bg-[var(--bg-tertiary)] hover:bg-[var(--border)]'
                                 }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-[var(--fg-primary)]">
                            {template.name}
                          </div>
                          <p className="mt-1 text-xs text-[var(--fg-muted)]">
                            {template.description}
                          </p>
                          <p className="mt-3 text-sm text-[var(--fg-secondary)]">
                            {getTemplateExcerpt(template.content)}
                          </p>
                        </div>
                        <span
                          className="mt-0.5 shrink-0 text-xs font-medium text-[var(--accent)]"
                          aria-hidden="true"
                        >
                          Preview
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className={`${view === 'detail' ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col`}>
              <div className="border-b border-[var(--border)] px-4 py-4">
                <div className="flex items-center gap-3">
                  <IconButton
                    onClick={() => setView('browse')}
                    ariaLabel="Back to template list"
                    className="shrink-0"
                  >
                    <BackIcon />
                  </IconButton>
                  <div className="min-w-0 flex-1">
                    <h2
                      id={mobileDetailTitleId}
                      className="truncate text-lg font-semibold text-[var(--fg-primary)]"
                    >
                      {selectedTemplate?.name ?? 'Template Preview'}
                    </h2>
                    {selectedTemplate && (
                      <p className="truncate text-sm text-[var(--fg-muted)]">
                        {selectedTemplate.description}
                      </p>
                    )}
                  </div>
                  <IconButton onClick={handleClose} ariaLabel="Close template gallery">
                    <CloseIcon />
                  </IconButton>
                </div>
              </div>

              {selectedTemplate ? (
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                      <div className="rounded-md border border-[var(--border)] bg-[var(--bg-tertiary)] p-3">
                        <pre className="whitespace-pre-wrap text-sm text-[var(--fg-primary)]">
                          {selectedTemplate.content}
                        </pre>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--fg-primary)]">
                          Insert Mode
                        </label>
                        <InsertModeSelector insertMode={insertMode} onChange={setInsertMode} />
                        <p className="mt-2 text-xs text-[var(--fg-muted)]">
                          {getInsertModeDescription(insertMode)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                    <button onClick={handleInsert} className="btn btn-primary w-full">
                      Insert Template
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-4 text-[var(--fg-muted)]">
                  <p>Select a template to preview</p>
                </div>
              )}
            </section>
          </div>

          <div className="hidden min-h-0 flex-1 flex-col lg:flex">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
              <h2
                id={desktopTitleId}
                className="text-lg font-semibold text-[var(--fg-primary)]"
              >
                Template Gallery
              </h2>
              <IconButton onClick={handleClose} ariaLabel="Close template gallery">
                <CloseIcon />
              </IconButton>
            </div>

            <div className="flex min-h-0 flex-1 overflow-hidden">
              <div className="w-48 shrink-0 overflow-y-auto border-r border-[var(--border)] p-2">
                <nav className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors
                                 ${
                                   selectedCategory === category.id
                                     ? 'bg-[var(--accent)] text-white'
                                     : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                                 }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="w-64 shrink-0 overflow-y-auto border-r border-[var(--border)] p-2">
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`w-full rounded-md border p-3 text-left transition-colors
                                 ${
                                   selectedTemplate?.id === template.id
                                     ? 'border-[var(--accent)] bg-[var(--accent)]/20'
                                     : 'border-transparent bg-[var(--bg-tertiary)] hover:bg-[var(--border)]'
                                 }`}
                    >
                      <div className="text-sm font-medium text-[var(--fg-primary)]">
                        {template.name}
                      </div>
                      <div className="mt-1 text-xs text-[var(--fg-muted)]">
                        {template.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
                {selectedTemplate ? (
                  <>
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-[var(--fg-primary)]">
                        {selectedTemplate.name}
                      </h3>
                      <p className="text-sm text-[var(--fg-muted)]">
                        {selectedTemplate.description}
                      </p>
                    </div>

                    <div className="flex-1 overflow-auto rounded-md border border-[var(--border)] bg-[var(--bg-tertiary)] p-3">
                      <pre className="whitespace-pre-wrap text-sm text-[var(--fg-primary)]">
                        {selectedTemplate.content}
                      </pre>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--fg-primary)]">
                          Insert Mode
                        </label>
                        <InsertModeSelector insertMode={insertMode} onChange={setInsertMode} />
                        <p className="mt-2 text-xs text-[var(--fg-muted)]">
                          {getInsertModeDescription(insertMode)}
                        </p>
                      </div>

                      <button onClick={handleInsert} className="btn btn-primary w-full">
                        Insert Template
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-[var(--fg-muted)]">
                    <p>Select a template to preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsertModeSelector({
  insertMode,
  onChange,
}: {
  insertMode: InsertMode;
  onChange: (value: InsertMode) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {INSERT_MODE_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-2 text-sm transition-colors
                     ${
                       insertMode === option.value
                         ? 'bg-[var(--accent)] text-white'
                         : 'bg-[var(--bg-tertiary)] text-[var(--fg-secondary)] hover:bg-[var(--border)]'
                     }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function IconButton({
  children,
  onClick,
  ariaLabel,
  className = '',
}: {
  children: ReactNode;
  onClick: () => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md p-2 text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] ${className}`.trim()}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

function CloseIcon() {
  return (
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
  );
}

function BackIcon() {
  return (
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function getTemplateExcerpt(content: string) {
  const normalizedContent = content.replace(/\s+/g, ' ').trim();
  return normalizedContent.length > 120
    ? `${normalizedContent.slice(0, 117).trimEnd()}...`
    : normalizedContent;
}

function getInsertModeDescription(insertMode: InsertMode) {
  switch (insertMode) {
    case 'append':
      return 'Add to the end of current content';
    case 'prepend':
      return 'Add to the beginning of current content';
    case 'replace':
    default:
      return 'Replace current editor content';
  }
}
