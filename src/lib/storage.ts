/**
 * localStorage API with versioned keys and migration support
 */

const STORAGE_KEYS = {
  content: 'dmf.content:v1',
  settings: 'dmf.settings:v1',
  drafts: 'dmf.drafts:v1',
  migration: 'dmf.mig:v1',
} as const;

const CURRENT_SCHEMA_VERSION = 1;

export interface StoredSettings {
  theme: 'dark' | 'light' | 'system';
  tz: string;
  analyticsEnabled: boolean;
}

export interface StoredDraft {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

const defaultSettings: StoredSettings = {
  theme: 'system',
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  analyticsEnabled: false,
};

function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

function safeSetItem(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

export function runMigrations(): void {
  const currentVersion = safeGetItem<number>(STORAGE_KEYS.migration, 0);

  if (currentVersion < CURRENT_SCHEMA_VERSION) {
    // Future migrations would go here
    // if (currentVersion < 2) { migrateV1toV2(); }

    safeSetItem(STORAGE_KEYS.migration, CURRENT_SCHEMA_VERSION);
  }
}

export function loadContent(): string {
  return safeGetItem<string>(STORAGE_KEYS.content, '');
}

export function saveContent(content: string): void {
  safeSetItem(STORAGE_KEYS.content, content);
}

export function loadSettings(): StoredSettings {
  return safeGetItem<StoredSettings>(STORAGE_KEYS.settings, defaultSettings);
}

export function saveSettings(settings: StoredSettings): void {
  safeSetItem(STORAGE_KEYS.settings, settings);
}

export function loadDrafts(): StoredDraft[] {
  return safeGetItem<StoredDraft[]>(STORAGE_KEYS.drafts, []);
}

export function saveDrafts(drafts: StoredDraft[]): void {
  safeSetItem(STORAGE_KEYS.drafts, drafts);
}

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  });
}
