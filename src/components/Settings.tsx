import { useEffect, useRef } from 'react';
import { useAppStore, type Theme } from '../store/useAppStore';

const themeOptions: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function Settings() {
  const isOpen = useAppStore((state) => state.isSettingsOpen);
  const toggleSettings = useAppStore((state) => state.toggleSettings);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const tz = useAppStore((state) => state.tz);
  const setTimezone = useAppStore((state) => state.setTimezone);
  const analyticsEnabled = useAppStore((state) => state.analyticsEnabled);
  const setAnalyticsEnabled = useAppStore((state) => state.setAnalyticsEnabled);

  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        toggleSettings();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleSettings]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        toggleSettings();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, toggleSettings]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative mt-12 w-full max-w-sm rounded-lg shadow-xl
                   bg-[var(--bg-secondary)] border border-[var(--border)]"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 id="settings-title" className="text-lg font-semibold text-[var(--fg-primary)]">
            Settings
          </h2>
          <button
            onClick={toggleSettings}
            className="p-1 rounded text-[var(--fg-muted)] hover:text-[var(--fg-primary)]
                       hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label="Close settings"
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

        <div className="p-4 space-y-6">
          {/* Theme */}
          <div className="space-y-2">
            <label
              htmlFor="theme-select"
              className="block text-sm font-medium text-[var(--fg-primary)]"
            >
              Theme
            </label>
            <select
              id="theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
              className="input w-full"
            >
              {themeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--fg-muted)]">
              System follows your device preferences.
            </p>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <label
              htmlFor="tz-input"
              className="block text-sm font-medium text-[var(--fg-primary)]"
            >
              Default Timezone
            </label>
            <input
              id="tz-input"
              type="text"
              value={tz}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="America/New_York"
              className="input w-full font-mono text-sm"
            />
            <p className="text-xs text-[var(--fg-muted)]">
              IANA timezone for timestamp builder (e.g., America/New_York).
            </p>
          </div>

          {/* Analytics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="analytics-toggle"
                className="text-sm font-medium text-[var(--fg-primary)]"
              >
                Anonymous Analytics
              </label>
              <button
                id="analytics-toggle"
                role="switch"
                aria-checked={analyticsEnabled}
                onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full
                           transition-colors focus:outline-none focus:ring-2
                           focus:ring-[var(--accent)] focus:ring-offset-2
                           focus:ring-offset-[var(--bg-secondary)]
                           ${analyticsEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white
                             transition-transform ${analyticsEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <p className="text-xs text-[var(--fg-muted)]">
              Help improve this app with privacy-preserving analytics. No cookies, no personal data.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--fg-muted)] text-center">
            All settings are stored locally in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
