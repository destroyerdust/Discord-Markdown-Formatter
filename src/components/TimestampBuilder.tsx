import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CopyButton } from './CopyButton';
import {
  TIMESTAMP_STYLES,
  TIMESTAMP_PRESETS,
  getPopularTimezones,
  toEpochSeconds,
  generateTimestampToken,
  formatTimestampPreview,
  getCurrentDate,
  getCurrentTime,
  type TimestampStyle,
} from '../lib/time';

export function TimestampBuilder() {
  const isOpen = useAppStore((state) => state.isTimestampBuilderOpen);
  const toggleTimestampBuilder = useAppStore((state) => state.toggleTimestampBuilder);
  const tz = useAppStore((state) => state.tz);
  const content = useAppStore((state) => state.content);
  const setContent = useAppStore((state) => state.setContent);
  const selection = useAppStore((state) => state.selection);

  const [date, setDate] = useState(() => getCurrentDate(tz));
  const [time, setTime] = useState(() => getCurrentTime(tz));
  const [timezone, setTimezone] = useState(tz);
  const [style, setStyle] = useState<TimestampStyle>('f');

  const panelRef = useRef<HTMLDivElement>(null);

  // Update defaults when timezone changes in settings
  useEffect(() => {
    if (tz !== timezone) {
      setTimezone(tz);
    }
  }, [tz]);

  // Reset to current time when opening
  useEffect(() => {
    if (isOpen) {
      setDate(getCurrentDate(timezone));
      setTime(getCurrentTime(timezone));
    }
  }, [isOpen, timezone]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        toggleTimestampBuilder();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleTimestampBuilder]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        toggleTimestampBuilder();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, toggleTimestampBuilder]);

  // Calculate epoch and token
  const epoch = useMemo(() => {
    return toEpochSeconds(date, time, timezone);
  }, [date, time, timezone]);

  const token = useMemo(() => {
    return generateTimestampToken(epoch, style);
  }, [epoch, style]);

  const preview = useMemo(() => {
    return formatTimestampPreview(epoch, style);
  }, [epoch, style]);

  // Handle preset selection
  const handlePreset = useCallback(
    (presetId: string) => {
      const preset = TIMESTAMP_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        const dt = preset.getDateTime(timezone);
        setDate(dt.toFormat('yyyy-MM-dd'));
        setTime(dt.toFormat('HH:mm'));
      }
    },
    [timezone]
  );

  // Insert timestamp into editor
  const handleInsert = useCallback(() => {
    const insertPos = selection?.end ?? content.length;
    const before = content.slice(0, insertPos);
    const after = content.slice(insertPos);
    const newContent = before + token + after;
    setContent(newContent);
    toggleTimestampBuilder();
  }, [content, setContent, selection, token, toggleTimestampBuilder]);

  const popularTimezones = useMemo(() => getPopularTimezones(), []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="timestamp-builder-title"
    >
      <div
        ref={panelRef}
        className="w-full max-w-lg rounded-lg shadow-xl bg-[var(--bg-secondary)] border border-[var(--border)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2
            id="timestamp-builder-title"
            className="text-lg font-semibold text-[var(--fg-primary)]"
          >
            Timestamp Builder
          </h2>
          <button
            onClick={toggleTimestampBuilder}
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
          {/* Presets */}
          <div>
            <label className="block text-sm font-medium text-[var(--fg-primary)] mb-2">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {TIMESTAMP_PRESETS.slice(0, 8).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePreset(preset.id)}
                  className="px-2 py-1 text-xs rounded bg-[var(--bg-tertiary)]
                             text-[var(--fg-secondary)] hover:bg-[var(--border)]
                             hover:text-[var(--fg-primary)] transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="ts-date"
                className="block text-sm font-medium text-[var(--fg-primary)] mb-1"
              >
                Date
              </label>
              <input
                id="ts-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label
                htmlFor="ts-time"
                className="block text-sm font-medium text-[var(--fg-primary)] mb-1"
              >
                Time
              </label>
              <input
                id="ts-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input w-full"
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label
              htmlFor="ts-timezone"
              className="block text-sm font-medium text-[var(--fg-primary)] mb-1"
            >
              Timezone
            </label>
            <select
              id="ts-timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="input w-full"
            >
              {popularTimezones.map((tz) => (
                <option key={tz.name} value={tz.name}>
                  {tz.label} ({tz.offset})
                </option>
              ))}
            </select>
          </div>

          {/* Style Selector */}
          <div>
            <label className="block text-sm font-medium text-[var(--fg-primary)] mb-2">
              Display Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIMESTAMP_STYLES.map((s) => (
                <button
                  key={s.style}
                  onClick={() => setStyle(s.style)}
                  className={`p-2 rounded text-left transition-colors
                             ${
                               style === s.style
                                 ? 'bg-[var(--accent)] text-white'
                                 : 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)] hover:bg-[var(--border)]'
                             }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{s.name}</span>
                    <code
                      className={`text-xs px-1 rounded ${
                        style === s.style ? 'bg-white/20' : 'bg-[var(--bg-code)]'
                      }`}
                    >
                      :{s.style}
                    </code>
                  </div>
                  <span
                    className={`text-xs ${style === s.style ? 'text-white/70' : 'text-[var(--fg-muted)]'}`}
                  >
                    {s.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 rounded-md bg-[var(--bg-tertiary)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--fg-muted)]">Preview:</span>
              <span className="text-sm font-medium text-[var(--fg-primary)]">{preview}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--fg-muted)]">Token:</span>
              <div className="flex items-center gap-2">
                <code className="text-sm px-2 py-0.5 rounded bg-[var(--bg-code)] text-[var(--fg-primary)]">
                  {token}
                </code>
                <CopyButton text={token} label="Copy" className="!p-1 !text-xs" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--fg-muted)]">Unix Epoch:</span>
              <code className="text-sm text-[var(--fg-secondary)]">{epoch}</code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-[var(--border)]">
          <button onClick={toggleTimestampBuilder} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleInsert} className="btn btn-primary">
            Insert Timestamp
          </button>
        </div>
      </div>
    </div>
  );
}
