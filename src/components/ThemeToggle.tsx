import { useAppStore, type Theme } from '../store/useAppStore';

const themeOptions: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

export function ThemeToggle() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  const cycleTheme = () => {
    const currentIndex = themeOptions.findIndex((opt) => opt.value === theme);
    const nextIndex = (currentIndex + 1) % themeOptions.length;
    setTheme(themeOptions[nextIndex].value);
  };

  const currentOption = themeOptions.find((opt) => opt.value === theme);

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md
                 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]
                 text-[var(--fg-primary)] border border-[var(--border)]
                 transition-colors focus:outline-none focus:ring-2
                 focus:ring-[var(--accent)] focus:ring-offset-2
                 focus:ring-offset-[var(--bg-primary)]"
      aria-label={`Current theme: ${currentOption?.label}. Click to change.`}
      title={`Theme: ${currentOption?.label}`}
    >
      <span aria-hidden="true">{currentOption?.icon}</span>
      <span className="hidden sm:inline">{currentOption?.label}</span>
    </button>
  );
}
