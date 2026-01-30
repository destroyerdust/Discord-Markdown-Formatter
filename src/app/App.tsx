import { useEffect } from 'react';
import {
  Header,
  Settings,
  ThemeProvider,
  Editor,
  Preview,
  TimestampBuilder,
  QuickReference,
  TemplateGallery,
  DraftsManager,
} from '../components';
import { useAppStore } from '../store/useAppStore';

export function App() {
  const hydrate = useAppStore((state) => state.hydrate);
  const isTemplateGalleryOpen = useAppStore((state) => state.isTemplateGalleryOpen);
  const toggleTemplateGallery = useAppStore((state) => state.toggleTemplateGallery);
  const isDraftsManagerOpen = useAppStore((state) => state.isDraftsManagerOpen);
  const toggleDraftsManager = useAppStore((state) => state.toggleDraftsManager);

  // Hydrate state from localStorage on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen bg-[var(--bg-primary)]">
        <Header />

        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <Editor />
          <Preview />
        </main>

        {/* Footer */}
        <footer
          className="px-4 py-2 text-center text-xs text-[var(--fg-muted)]
                     bg-[var(--bg-secondary)] border-t border-[var(--border)]"
        >
          <p>
            Discord Markdown Formatter — No data is sent to any server. All processing happens in
            your browser.
          </p>
        </footer>

        {/* Modals & Panels */}
        <Settings />
        <TimestampBuilder />
        <QuickReference />
        <TemplateGallery isOpen={isTemplateGalleryOpen} onClose={toggleTemplateGallery} />
        <DraftsManager isOpen={isDraftsManagerOpen} onClose={toggleDraftsManager} />
      </div>
    </ThemeProvider>
  );
}
