import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { installMatchMediaMock, resetMediaQueryMock } from '../utils/browser';
import { resetAppStore } from '../utils/store';

installMatchMediaMock();

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  resetMediaQueryMock();
  document.body.innerHTML = '';
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      randomUUID: vi.fn(() => 'test-uuid'),
    },
  });
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: vi.fn(async () => undefined),
    },
  });
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: vi.fn(() => true),
  });
  Object.defineProperty(window, 'requestAnimationFrame', {
    configurable: true,
    writable: true,
    value: (callback: FrameRequestCallback) => {
      return window.setTimeout(() => callback(0), 0);
    },
  });
  Object.defineProperty(window, 'cancelAnimationFrame', {
    configurable: true,
    writable: true,
    value: (handle: number) => {
      window.clearTimeout(handle);
    },
  });
  resetAppStore();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
  document.documentElement.className = '';
  resetMediaQueryMock();
  resetAppStore();
});
