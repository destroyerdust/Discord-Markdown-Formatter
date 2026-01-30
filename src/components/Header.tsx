import { ThemeToggle } from './ThemeToggle';
import { useAppStore } from '../store/useAppStore';

export function Header() {
  const toggleSettings = useAppStore((state) => state.toggleSettings);
  const toggleQuickReference = useAppStore((state) => state.toggleQuickReference);
  const toggleTemplateGallery = useAppStore((state) => state.toggleTemplateGallery);
  const toggleDraftsManager = useAppStore((state) => state.toggleDraftsManager);
  const draftsCount = useAppStore((state) => state.drafts.length);

  return (
    <header
      className="flex items-center justify-between px-4 py-3
                 bg-[var(--bg-secondary)] border-b border-[var(--border)]"
    >
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-[var(--fg-primary)]">
          Discord Markdown Formatter
        </h1>
        <span
          className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium
                     rounded-full bg-[var(--accent)] text-white"
        >
          Beta
        </span>
      </div>

      <nav className="flex items-center gap-1">
        {/* Templates Button */}
        <button
          onClick={toggleTemplateGallery}
          className="p-2 rounded-md text-[var(--fg-secondary)]
                     hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]
                     transition-colors focus:outline-none focus:ring-2
                     focus:ring-[var(--accent)] focus:ring-offset-2
                     focus:ring-offset-[var(--bg-secondary)]"
          aria-label="Open templates"
          title="Templates"
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
            aria-hidden="true"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </button>

        {/* Drafts Button */}
        <button
          onClick={toggleDraftsManager}
          className="relative p-2 rounded-md text-[var(--fg-secondary)]
                     hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]
                     transition-colors focus:outline-none focus:ring-2
                     focus:ring-[var(--accent)] focus:ring-offset-2
                     focus:ring-offset-[var(--bg-secondary)]"
          aria-label="Open drafts"
          title="Drafts"
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
            aria-hidden="true"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {draftsCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center
                         text-[10px] font-medium rounded-full bg-[var(--accent)] text-white"
            >
              {draftsCount}
            </span>
          )}
        </button>

        {/* Quick Reference Button */}
        <button
          onClick={toggleQuickReference}
          className="p-2 rounded-md text-[var(--fg-secondary)]
                     hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]
                     transition-colors focus:outline-none focus:ring-2
                     focus:ring-[var(--accent)] focus:ring-offset-2
                     focus:ring-offset-[var(--bg-secondary)]"
          aria-label="Open quick reference"
          title="Quick Reference"
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
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </button>

        <ThemeToggle />

        {/* Settings Button */}
        <button
          onClick={toggleSettings}
          className="p-2 rounded-md text-[var(--fg-secondary)]
                     hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]
                     transition-colors focus:outline-none focus:ring-2
                     focus:ring-[var(--accent)] focus:ring-offset-2
                     focus:ring-offset-[var(--bg-secondary)]"
          aria-label="Open settings"
          title="Settings"
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
            aria-hidden="true"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </nav>
    </header>
  );
}
