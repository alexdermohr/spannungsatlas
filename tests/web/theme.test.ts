import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { themeMode, setThemeMode, initTheme } from '$lib/stores/theme';

describe('Theme Store (DOM Interop)', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    // Reset DOM
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);

    // Provide a basic mock for matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {}, // Deprecated
        removeListener: () => {}, // Deprecated
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  afterEach(() => {
    if (cleanup) cleanup();
    document.head.innerHTML = '';
  });

  it('initialises with system theme if nothing is in localStorage', () => {
    cleanup = initTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light'); // system resolves to light because matchMedia is mocked to false

    let mode;
    themeMode.subscribe(v => mode = v)();
    expect(mode).toBe('system');
  });

  it('respects stored theme and applies it to DOM', () => {
    localStorage.setItem('spannungsatlas-theme', 'dark');
    cleanup = initTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('updates DOM when setThemeMode is called', () => {
    cleanup = initTheme();

    setThemeMode('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    setThemeMode('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('updates meta theme-color along with data-theme', () => {
    cleanup = initTheme();

    setThemeMode('dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    expect(meta?.getAttribute('content')).toBe('#1a1a2e');

    setThemeMode('light');
    expect(meta?.getAttribute('content')).toBe('#2d5a9b');
  });
});
