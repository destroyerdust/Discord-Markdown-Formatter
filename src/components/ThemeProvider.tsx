import { useEffect } from 'react';
import { useAppStore, resolveTheme } from '../store/useAppStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((state) => state.theme);
  const setResolvedTheme = useAppStore((state) => state.setResolvedTheme);

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      const resolved = resolveTheme(theme, mediaQuery.matches);
      setResolvedTheme(resolved);

      // Update document class for Tailwind dark mode
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Initial update
    updateTheme();

    // Listen for system theme changes
    mediaQuery.addEventListener('change', updateTheme);

    return () => {
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, [theme, setResolvedTheme]);

  return <>{children}</>;
}
