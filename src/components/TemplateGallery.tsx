import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TEMPLATES, getTemplateCategories, type Template } from '../lib/templates';

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateGallery({ isOpen, onClose }: TemplateGalleryProps) {
  const setContent = useAppStore((state) => state.setContent);
  const content = useAppStore((state) => state.content);

  const [selectedCategory, setSelectedCategory] = useState<Template['category']>('announcement');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [insertMode, setInsertMode] = useState<'replace' | 'append' | 'prepend'>('replace');

  const panelRef = useRef<HTMLDivElement>(null);
  const categories = getTemplateCategories();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const filteredTemplates = TEMPLATES.filter((t) => t.category === selectedCategory);

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
    onClose();
  }, [selectedTemplate, insertMode, content, setContent, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-gallery-title"
    >
      <div
        ref={panelRef}
        className="w-full max-w-4xl max-h-[85vh] rounded-lg shadow-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2
            id="template-gallery-title"
            className="text-lg font-semibold text-[var(--fg-primary)]"
          >
            Template Gallery
          </h2>
          <button
            onClick={onClose}
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

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Categories */}
          <div className="w-48 shrink-0 border-r border-[var(--border)] p-2 overflow-y-auto">
            <nav className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedTemplate(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                             ${
                               selectedCategory === cat.id
                                 ? 'bg-[var(--accent)] text-white'
                                 : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                             }`}
                >
                  {cat.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Template List */}
          <div className="w-64 shrink-0 border-r border-[var(--border)] p-2 overflow-y-auto">
            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full text-left p-3 rounded-md transition-colors
                             ${
                               selectedTemplate?.id === template.id
                                 ? 'bg-[var(--accent)]/20 border border-[var(--accent)]'
                                 : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border)] border border-transparent'
                             }`}
                >
                  <div className="font-medium text-sm text-[var(--fg-primary)]">
                    {template.name}
                  </div>
                  <div className="text-xs text-[var(--fg-muted)] mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            {selectedTemplate ? (
              <>
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-[var(--fg-primary)]">
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-[var(--fg-muted)]">{selectedTemplate.description}</p>
                </div>

                <div className="flex-1 overflow-auto rounded-md bg-[var(--bg-tertiary)] p-3 border border-[var(--border)]">
                  <pre className="text-sm font-mono text-[var(--fg-primary)] whitespace-pre-wrap">
                    {selectedTemplate.content}
                  </pre>
                </div>

                {/* Insert Options */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[var(--fg-primary)] mb-2">
                      Insert Mode
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: 'replace', label: 'Replace' },
                        { value: 'append', label: 'Append' },
                        { value: 'prepend', label: 'Prepend' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setInsertMode(option.value as typeof insertMode)}
                          className={`px-3 py-1.5 text-sm rounded-md transition-colors
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
                    <p className="text-xs text-[var(--fg-muted)] mt-1">
                      {insertMode === 'replace' && 'Replace current editor content'}
                      {insertMode === 'append' && 'Add to the end of current content'}
                      {insertMode === 'prepend' && 'Add to the beginning of current content'}
                    </p>
                  </div>

                  <button onClick={handleInsert} className="btn btn-primary w-full">
                    Insert Template
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[var(--fg-muted)]">
                <p>Select a template to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
