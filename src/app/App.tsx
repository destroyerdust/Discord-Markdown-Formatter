import { Suspense, lazy, useEffect } from 'react';
import { Header } from '../components/Header';
import { ThemeProvider } from '../components/ThemeProvider';
import { Editor } from '../components/Editor';
import { Preview } from '../components/Preview';
import { flushPendingContentSave, useAppStore } from '../store/useAppStore';

const LazySettings = lazy(async () => {
  const module = await import('../components/Settings');
  return { default: module.Settings };
});

const LazyTimestampBuilder = lazy(async () => {
  const module = await import('../components/TimestampBuilder');
  return { default: module.TimestampBuilder };
});

const LazyQuickReference = lazy(async () => {
  const module = await import('../components/QuickReference');
  return { default: module.QuickReference };
});

const LazyTemplateGallery = lazy(async () => {
  const module = await import('../components/TemplateGallery');
  return { default: module.TemplateGallery };
});

const LazyDraftsManager = lazy(async () => {
  const module = await import('../components/DraftsManager');
  return { default: module.DraftsManager };
});

export function App() {
  const hydrate = useAppStore((state) => state.hydrate);
  const isSettingsOpen = useAppStore((state) => state.isSettingsOpen);
  const isTimestampBuilderOpen = useAppStore((state) => state.isTimestampBuilderOpen);
  const isQuickReferenceOpen = useAppStore((state) => state.isQuickReferenceOpen);
  const isTemplateGalleryOpen = useAppStore((state) => state.isTemplateGalleryOpen);
  const toggleTemplateGallery = useAppStore((state) => state.toggleTemplateGallery);
  const isDraftsManagerOpen = useAppStore((state) => state.isDraftsManagerOpen);
  const toggleDraftsManager = useAppStore((state) => state.toggleDraftsManager);

  // Hydrate state from localStorage on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    window.addEventListener('beforeunload', flushPendingContentSave);
    return () => window.removeEventListener('beforeunload', flushPendingContentSave);
  }, []);

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
        <Suspense fallback={null}>
          {isSettingsOpen ? <LazySettings /> : null}
          {isTimestampBuilderOpen ? <LazyTimestampBuilder /> : null}
          {isQuickReferenceOpen ? <LazyQuickReference /> : null}
          {isTemplateGalleryOpen ? (
            <LazyTemplateGallery isOpen={isTemplateGalleryOpen} onClose={toggleTemplateGallery} />
          ) : null}
          {isDraftsManagerOpen ? (
            <LazyDraftsManager isOpen={isDraftsManagerOpen} onClose={toggleDraftsManager} />
          ) : null}
        </Suspense>
      </div>
    </ThemeProvider>
  );
}
