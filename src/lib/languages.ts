/**
 * Language configuration for syntax highlighting
 * Supports lazy-loading of additional Prism languages
 */

export interface LanguageInfo {
  id: string;
  name: string;
  aliases: string[];
  loaded: boolean;
}

// Core languages (bundled, always available)
const CORE_LANGUAGES: LanguageInfo[] = [
  { id: 'javascript', name: 'JavaScript', aliases: ['js'], loaded: true },
  { id: 'typescript', name: 'TypeScript', aliases: ['ts'], loaded: true },
  { id: 'python', name: 'Python', aliases: ['py'], loaded: true },
  { id: 'json', name: 'JSON', aliases: [], loaded: true },
  { id: 'bash', name: 'Bash', aliases: ['sh', 'shell'], loaded: true },
  { id: 'css', name: 'CSS', aliases: [], loaded: true },
  { id: 'markdown', name: 'Markdown', aliases: ['md'], loaded: true },
];

// Additional languages (lazy-loaded on demand)
const ADDITIONAL_LANGUAGES: LanguageInfo[] = [
  { id: 'c', name: 'C', aliases: [], loaded: false },
  { id: 'cpp', name: 'C++', aliases: ['c++'], loaded: false },
  { id: 'csharp', name: 'C#', aliases: ['cs', 'c#'], loaded: false },
  { id: 'java', name: 'Java', aliases: [], loaded: false },
  { id: 'go', name: 'Go', aliases: ['golang'], loaded: false },
  { id: 'rust', name: 'Rust', aliases: ['rs'], loaded: false },
  { id: 'ruby', name: 'Ruby', aliases: ['rb'], loaded: false },
  { id: 'php', name: 'PHP', aliases: [], loaded: false },
  { id: 'swift', name: 'Swift', aliases: [], loaded: false },
  { id: 'kotlin', name: 'Kotlin', aliases: ['kt'], loaded: false },
  { id: 'sql', name: 'SQL', aliases: [], loaded: false },
  { id: 'yaml', name: 'YAML', aliases: ['yml'], loaded: false },
  { id: 'xml', name: 'XML', aliases: ['html', 'svg'], loaded: false },
  { id: 'jsx', name: 'JSX', aliases: ['react'], loaded: false },
  { id: 'tsx', name: 'TSX', aliases: [], loaded: false },
  { id: 'scss', name: 'SCSS', aliases: ['sass'], loaded: false },
  { id: 'diff', name: 'Diff', aliases: ['patch'], loaded: false },
  { id: 'docker', name: 'Dockerfile', aliases: ['dockerfile'], loaded: false },
  { id: 'graphql', name: 'GraphQL', aliases: ['gql'], loaded: false },
  { id: 'lua', name: 'Lua', aliases: [], loaded: false },
  { id: 'perl', name: 'Perl', aliases: ['pl'], loaded: false },
  { id: 'powershell', name: 'PowerShell', aliases: ['ps1', 'ps'], loaded: false },
  { id: 'r', name: 'R', aliases: [], loaded: false },
  { id: 'scala', name: 'Scala', aliases: [], loaded: false },
  { id: 'toml', name: 'TOML', aliases: [], loaded: false },
  { id: 'ini', name: 'INI', aliases: [], loaded: false },
];

// All languages combined
export const ALL_LANGUAGES: LanguageInfo[] = [...CORE_LANGUAGES, ...ADDITIONAL_LANGUAGES];

// Track loaded state
const loadedLanguages = new Set<string>(CORE_LANGUAGES.map((l) => l.id));

/**
 * Get all available languages for the picker
 */
export function getAvailableLanguages(): LanguageInfo[] {
  return ALL_LANGUAGES.map((lang) => ({
    ...lang,
    loaded: loadedLanguages.has(lang.id),
  }));
}

/**
 * Get core (pre-loaded) languages
 */
export function getCoreLanguages(): LanguageInfo[] {
  return CORE_LANGUAGES;
}

/**
 * Resolve a language alias to its canonical ID
 */
export function resolveLanguageAlias(input: string): string {
  const lower = input.toLowerCase().trim();

  // Check exact match first
  const exact = ALL_LANGUAGES.find((l) => l.id === lower);
  if (exact) return exact.id;

  // Check aliases
  const byAlias = ALL_LANGUAGES.find((l) => l.aliases.includes(lower));
  if (byAlias) return byAlias.id;

  // Return as-is if not found
  return lower;
}

/**
 * Get language info by ID or alias
 */
export function getLanguageInfo(input: string): LanguageInfo | undefined {
  const id = resolveLanguageAlias(input);
  return ALL_LANGUAGES.find((l) => l.id === id);
}

/**
 * Check if a language is loaded
 */
export function isLanguageLoaded(langId: string): boolean {
  const resolved = resolveLanguageAlias(langId);
  return loadedLanguages.has(resolved);
}

/**
 * Lazy-load a Prism language component
 */
export async function loadLanguage(langId: string): Promise<boolean> {
  const resolved = resolveLanguageAlias(langId);

  // Already loaded
  if (loadedLanguages.has(resolved)) {
    return true;
  }

  // Check if it's a known language
  const langInfo = ALL_LANGUAGES.find((l) => l.id === resolved);
  if (!langInfo) {
    console.warn(`Unknown language: ${langId}`);
    return false;
  }

  try {
    // Dynamic import of Prism language component
    await import(/* @vite-ignore */ `prismjs/components/prism-${resolved}.min.js`);
    loadedLanguages.add(resolved);
    langInfo.loaded = true;
    return true;
  } catch (error) {
    console.warn(`Failed to load language: ${resolved}`, error);
    return false;
  }
}

/**
 * Preload multiple languages
 */
export async function preloadLanguages(langIds: string[]): Promise<void> {
  await Promise.all(langIds.map((id) => loadLanguage(id)));
}

/**
 * Get popular/common languages for quick selection
 */
export function getPopularLanguages(): LanguageInfo[] {
  const popularIds = [
    'javascript',
    'typescript',
    'python',
    'json',
    'bash',
    'css',
    'java',
    'csharp',
    'go',
    'rust',
    'sql',
    'yaml',
  ];

  return popularIds
    .map((id) => ALL_LANGUAGES.find((l) => l.id === id))
    .filter((l): l is LanguageInfo => l !== undefined);
}
