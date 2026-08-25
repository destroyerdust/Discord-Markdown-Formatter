type MediaListener = (event: MediaQueryListEvent) => void;

const mediaQueryMatches = new Map<string, boolean>();
const mediaQueryListeners = new Map<string, Set<MediaListener>>();

function getListeners(query: string): Set<MediaListener> {
  let listeners = mediaQueryListeners.get(query);
  if (!listeners) {
    listeners = new Set<MediaListener>();
    mediaQueryListeners.set(query, listeners);
  }
  return listeners;
}

export function installMatchMediaMock(): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList => {
      const mediaQueryList = {
        media: query,
        onchange: null,
        addEventListener: (_type: string, listener: MediaListener) => {
          getListeners(query).add(listener);
        },
        removeEventListener: (_type: string, listener: MediaListener) => {
          getListeners(query).delete(listener);
        },
        addListener: (listener: MediaListener) => {
          getListeners(query).add(listener);
        },
        removeListener: (listener: MediaListener) => {
          getListeners(query).delete(listener);
        },
        dispatchEvent: (event: Event) => {
          getListeners(query).forEach((listener) => listener(event as MediaQueryListEvent));
          return true;
        },
      } as MediaQueryList;

      Object.defineProperty(mediaQueryList, 'matches', {
        get: () => mediaQueryMatches.get(query) ?? false,
      });

      return mediaQueryList;
    },
  });
}

export function setMediaQueryMatch(query: string, matches: boolean): void {
  mediaQueryMatches.set(query, matches);
  const event = { matches, media: query } as MediaQueryListEvent;
  getListeners(query).forEach((listener) => listener(event));
}

export function resetMediaQueryMock(): void {
  mediaQueryMatches.clear();
  mediaQueryListeners.clear();
}
