import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getAvailableLanguages,
  getPopularLanguages,
  resolveLanguageAlias,
  type LanguageInfo,
} from '../lib/languages';

interface CodeBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (language: string) => void;
  initialLanguage?: string;
}

export function CodeBlockModal({
  isOpen,
  onClose,
  onInsert,
  initialLanguage = 'js',
}: CodeBlockModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

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
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleInsert = useCallback(() => {
    const resolved = resolveLanguageAlias(selectedLanguage);
    onInsert(resolved);
    onClose();
  }, [selectedLanguage, onInsert, onClose]);

  // Handle Enter key to insert
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleInsert();
      }
    },
    [handleInsert]
  );

  if (!isOpen) return null;

  const popularLanguages = getPopularLanguages();
  const allLanguages = getAvailableLanguages();

  // Filter languages based on search
  const filteredLanguages = searchQuery
    ? allLanguages.filter(
        (lang) =>
          lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lang.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lang.aliases.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : showAllLanguages
      ? allLanguages
      : popularLanguages;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="codeblock-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-lg shadow-xl bg-[var(--bg-secondary)] border border-[var(--border)]"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 id="codeblock-modal-title" className="text-lg font-semibold text-[var(--fg-primary)]">
            Insert Code Block
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
        <div className="p-4 space-y-4">
          {/* Search */}
          <div>
            <label htmlFor="lang-search" className="sr-only">
              Search languages
            </label>
            <input
              ref={searchInputRef}
              id="lang-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search languages..."
              className="input w-full"
            />
          </div>

          {/* Language Grid */}
          <div className="max-h-64 overflow-y-auto">
            <div className="grid grid-cols-3 gap-2">
              {filteredLanguages.map((lang) => (
                <LanguageButton
                  key={lang.id}
                  language={lang}
                  isSelected={selectedLanguage === lang.id}
                  onClick={() => setSelectedLanguage(lang.id)}
                />
              ))}
            </div>

            {filteredLanguages.length === 0 && (
              <p className="text-center text-[var(--fg-muted)] py-4">
                No languages found matching "{searchQuery}"
              </p>
            )}
          </div>

          {/* Show all toggle */}
          {!searchQuery && (
            <button
              onClick={() => setShowAllLanguages(!showAllLanguages)}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              {showAllLanguages ? 'Show popular only' : 'Show all languages'}
            </button>
          )}

          {/* Selected language display */}
          <div className="flex items-center justify-between p-3 rounded-md bg-[var(--bg-tertiary)]">
            <div>
              <span className="text-sm text-[var(--fg-muted)]">Selected: </span>
              <span className="font-mono text-[var(--fg-primary)]">{selectedLanguage}</span>
            </div>
            <div className="text-xs text-[var(--fg-muted)]">
              <code className="px-1.5 py-0.5 rounded bg-[var(--bg-code)]">
                ```{selectedLanguage}
              </code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleInsert} className="btn btn-primary">
            Insert Code Block
          </button>
        </div>
      </div>
    </div>
  );
}

function LanguageButton({
  language,
  isSelected,
  onClick,
}: {
  language: LanguageInfo;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm rounded-md text-left transition-colors
                 ${
                   isSelected
                     ? 'bg-[var(--accent)] text-white'
                     : 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)] hover:bg-[var(--border)]'
                 }`}
      title={language.aliases.length > 0 ? `Aliases: ${language.aliases.join(', ')}` : undefined}
    >
      <span className="block font-medium truncate">{language.name}</span>
      <span
        className={`block text-xs truncate ${isSelected ? 'text-white/70' : 'text-[var(--fg-muted)]'}`}
      >
        {language.id}
      </span>
    </button>
  );
}
