import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore, type Draft } from '../store/useAppStore';

interface DraftsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DraftsManager({ isOpen, onClose }: DraftsManagerProps) {
  const drafts = useAppStore((state) => state.drafts);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const loadDraft = useAppStore((state) => state.loadDraft);
  const deleteDraft = useAppStore((state) => state.deleteDraft);
  const content = useAppStore((state) => state.content);

  const [newDraftTitle, setNewDraftTitle] = useState('');
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus title input when opening
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showDeleteConfirm]);

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

  const handleSaveDraft = useCallback(() => {
    if (!newDraftTitle.trim()) return;
    saveDraft(newDraftTitle.trim());
    setNewDraftTitle('');
  }, [newDraftTitle, saveDraft]);

  const handleLoadDraft = useCallback(
    (draft: Draft) => {
      loadDraft(draft.id);
      onClose();
    },
    [loadDraft, onClose]
  );

  const handleDeleteDraft = useCallback(
    (id: string) => {
      deleteDraft(id);
      setShowDeleteConfirm(null);
      if (selectedDraft?.id === id) {
        setSelectedDraft(null);
      }
    },
    [deleteDraft, selectedDraft]
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drafts-manager-title"
    >
      <div
        ref={panelRef}
        className="w-full max-w-2xl max-h-[80vh] rounded-lg shadow-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 id="drafts-manager-title" className="text-lg font-semibold text-[var(--fg-primary)]">
            Drafts
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

        {/* Save New Draft */}
        <div className="p-4 border-b border-[var(--border)]">
          <label
            htmlFor="draft-title"
            className="block text-sm font-medium text-[var(--fg-primary)] mb-2"
          >
            Save Current Content as Draft
          </label>
          <div className="flex gap-2">
            <input
              ref={titleInputRef}
              id="draft-title"
              type="text"
              value={newDraftTitle}
              onChange={(e) => setNewDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveDraft();
                }
              }}
              placeholder="Enter draft name..."
              className="input flex-1"
              disabled={!content.trim()}
            />
            <button
              onClick={handleSaveDraft}
              disabled={!newDraftTitle.trim() || !content.trim()}
              className="btn btn-primary"
            >
              Save
            </button>
          </div>
          {!content.trim() && (
            <p className="text-xs text-[var(--fg-muted)] mt-1">
              Write something in the editor first to save a draft.
            </p>
          )}
        </div>

        {/* Drafts List */}
        <div className="flex-1 overflow-y-auto p-4">
          {drafts.length === 0 ? (
            <div className="text-center py-8 text-[var(--fg-muted)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-3 opacity-50"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p>No saved drafts yet</p>
              <p className="text-sm mt-1">Save your work to access it later</p>
            </div>
          ) : (
            <div className="space-y-2">
              {drafts
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((draft) => (
                  <div
                    key={draft.id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer
                               ${
                                 selectedDraft?.id === draft.id
                                   ? 'bg-[var(--accent)]/10 border-[var(--accent)]'
                                   : 'bg-[var(--bg-tertiary)] border-transparent hover:border-[var(--border)]'
                               }`}
                    onClick={() => setSelectedDraft(draft)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[var(--fg-primary)] truncate">
                          {draft.title}
                        </h3>
                        <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                          {formatDate(draft.updatedAt)}
                        </p>
                        <p className="text-sm text-[var(--fg-secondary)] mt-1 line-clamp-2">
                          {draft.content.slice(0, 150)}
                          {draft.content.length > 150 && '...'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadDraft(draft);
                          }}
                          className="p-1.5 rounded text-[var(--fg-muted)] hover:text-[var(--accent)]
                                     hover:bg-[var(--bg-secondary)] transition-colors"
                          title="Load draft"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" x2="12" y1="15" y2="3" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(draft.id);
                          }}
                          className="p-1.5 rounded text-[var(--fg-muted)] hover:text-[var(--error)]
                                     hover:bg-[var(--bg-secondary)] transition-colors"
                          title="Delete draft"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Delete Confirmation */}
                    {showDeleteConfirm === draft.id && (
                      <div
                        className="mt-3 p-2 rounded bg-[var(--error)]/10 border border-[var(--error)]/30"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="text-sm text-[var(--fg-primary)] mb-2">
                          Delete "{draft.title}"?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteDraft(draft.id)}
                            className="px-3 py-1 text-sm rounded bg-[var(--error)] text-white
                                       hover:bg-[var(--error)]/80 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="px-3 py-1 text-sm rounded bg-[var(--bg-secondary)]
                                       text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] text-center">
          <p className="text-xs text-[var(--fg-muted)]">
            {drafts.length} draft{drafts.length !== 1 ? 's' : ''} saved locally
          </p>
        </div>
      </div>
    </div>
  );
}
