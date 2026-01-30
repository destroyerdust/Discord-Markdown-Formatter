import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  loadContent,
  saveContent,
  loadSettings,
  saveSettings,
  loadDrafts,
  saveDrafts,
  runMigrations,
} from '../lib/storage';

export type CodeLang = 'js' | 'ts' | 'py' | 'json' | 'bash' | 'md' | 'none';
export type Theme = 'dark' | 'light' | 'system';

export interface Draft {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface Selection {
  start: number;
  end: number;
}

export interface AppState {
  // Editor state
  content: string;
  selection: Selection | null;
  codeLang: CodeLang;

  // Settings
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  tz: string;
  analyticsEnabled: boolean;

  // Drafts
  drafts: Draft[];

  // UI state
  isTimestampBuilderOpen: boolean;
  isQuickReferenceOpen: boolean;
  isSettingsOpen: boolean;
  isCodeBlockModalOpen: boolean;
  isTemplateGalleryOpen: boolean;
  isDraftsManagerOpen: boolean;
  preferredCodeLang: string;

  // Actions
  setContent: (content: string) => void;
  setSelection: (selection: Selection | null) => void;
  setCodeLang: (lang: CodeLang) => void;
  setTheme: (theme: Theme) => void;
  setResolvedTheme: (theme: 'dark' | 'light') => void;
  setTimezone: (tz: string) => void;
  setAnalyticsEnabled: (enabled: boolean) => void;

  // Draft actions
  saveDraft: (title: string) => void;
  loadDraft: (id: string) => void;
  deleteDraft: (id: string) => void;

  // UI actions
  toggleTimestampBuilder: () => void;
  toggleQuickReference: () => void;
  toggleSettings: () => void;
  toggleCodeBlockModal: () => void;
  toggleTemplateGallery: () => void;
  toggleDraftsManager: () => void;
  setPreferredCodeLang: (lang: string) => void;

  // Initialization
  hydrate: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    content: '',
    selection: null,
    codeLang: 'none',

    theme: 'system',
    resolvedTheme: 'dark',
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    analyticsEnabled: false,

    drafts: [],

    isTimestampBuilderOpen: false,
    isQuickReferenceOpen: false,
    isSettingsOpen: false,
    isCodeBlockModalOpen: false,
    isTemplateGalleryOpen: false,
    isDraftsManagerOpen: false,
    preferredCodeLang: 'js',

    // Editor actions
    setContent: (content) => {
      set({ content });
      saveContent(content);
    },

    setSelection: (selection) => set({ selection }),

    setCodeLang: (codeLang) => set({ codeLang }),

    // Settings actions
    setTheme: (theme) => {
      set({ theme });
      const { tz, analyticsEnabled } = get();
      saveSettings({ theme, tz, analyticsEnabled });
    },

    setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),

    setTimezone: (tz) => {
      set({ tz });
      const { theme, analyticsEnabled } = get();
      saveSettings({ theme, tz, analyticsEnabled });
    },

    setAnalyticsEnabled: (analyticsEnabled) => {
      set({ analyticsEnabled });
      const { theme, tz } = get();
      saveSettings({ theme, tz, analyticsEnabled });
    },

    // Draft actions
    saveDraft: (title) => {
      const { content, drafts } = get();
      const newDraft: Draft = {
        id: generateId(),
        title,
        content,
        updatedAt: Date.now(),
      };
      const updatedDrafts = [...drafts, newDraft];
      set({ drafts: updatedDrafts });
      saveDrafts(updatedDrafts);
    },

    loadDraft: (id) => {
      const { drafts } = get();
      const draft = drafts.find((d) => d.id === id);
      if (draft) {
        set({ content: draft.content });
        saveContent(draft.content);
      }
    },

    deleteDraft: (id) => {
      const { drafts } = get();
      const updatedDrafts = drafts.filter((d) => d.id !== id);
      set({ drafts: updatedDrafts });
      saveDrafts(updatedDrafts);
    },

    // UI actions
    toggleTimestampBuilder: () =>
      set((state) => ({ isTimestampBuilderOpen: !state.isTimestampBuilderOpen })),

    toggleQuickReference: () =>
      set((state) => ({ isQuickReferenceOpen: !state.isQuickReferenceOpen })),

    toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

    toggleCodeBlockModal: () =>
      set((state) => ({ isCodeBlockModalOpen: !state.isCodeBlockModalOpen })),

    toggleTemplateGallery: () =>
      set((state) => ({ isTemplateGalleryOpen: !state.isTemplateGalleryOpen })),

    toggleDraftsManager: () =>
      set((state) => ({ isDraftsManagerOpen: !state.isDraftsManagerOpen })),

    setPreferredCodeLang: (preferredCodeLang) => set({ preferredCodeLang }),

    // Hydrate from localStorage
    hydrate: () => {
      runMigrations();

      const content = loadContent();
      const settings = loadSettings();
      const drafts = loadDrafts() as Draft[];

      set({
        content,
        theme: settings.theme,
        tz: settings.tz,
        analyticsEnabled: settings.analyticsEnabled,
        drafts,
      });
    },
  }))
);

// Theme resolution helper
export function resolveTheme(theme: Theme, systemPrefersDark: boolean): 'dark' | 'light' {
  if (theme === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return theme;
}
