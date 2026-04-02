/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { themeMode, setThemeMode, initTheme } from '$lib/stores/theme';

describe('Theme Store (DOM Interop & Edge Cases)', () => {
  let cleanup: (() => void) | undefined;
  let mockMatchMedia: any;
  let systemListeners: Set<Function>;
  let legacyListeners: Set<Function>;

  beforeEach(() => {
    // Reset DOM
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);

    systemListeners = new Set();
    legacyListeners = new Set();

    mockMatchMedia = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: vi.fn((event, cb) => {
        if (event === 'change') systemListeners.add(cb);
      }),
      removeEventListener: vi.fn((event, cb) => {
        if (event === 'change') systemListeners.delete(cb);
      }),
      // Legacy Safari mocks
      addListener: vi.fn((cb) => legacyListeners.add(cb)),
      removeListener: vi.fn((cb) => legacyListeners.delete(cb)),
      dispatchEvent: vi.fn(),
    };

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn(() => mockMatchMedia),
    });
  });

  afterEach(() => {
    if (cleanup) cleanup();
    document.head.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('initialises with system theme if nothing is in localStorage', () => {
    cleanup = initTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light'); // Mock matches: false

    let mode;
    themeMode.subscribe(v => mode = v)();
    expect(mode).toBe('system');
  });

  it('respects stored theme and applies it to DOM', () => {
    localStorage.setItem('spannungsatlas-theme', 'dark');
    cleanup = initTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('resets to system on invalid localStorage values', () => {
    localStorage.setItem('spannungsatlas-theme', 'hacker-green');
    cleanup = initTheme();

    let mode;
    themeMode.subscribe(v => mode = v)();
    expect(mode).toBe('system');
    // since system resolves to light here:
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('updates DOM when setThemeMode is called', () => {
    cleanup = initTheme();

    setThemeMode('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('spannungsatlas-theme')).toBe('dark');

    setThemeMode('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('spannungsatlas-theme')).toBe('light');
  });

  it('updates meta theme-color along with data-theme', () => {
    cleanup = initTheme();
    const meta = document.querySelector('meta[name="theme-color"]');

    setThemeMode('dark');
    expect(meta?.getAttribute('content')).toBe('#1a1a2e');

    setThemeMode('light');
    expect(meta?.getAttribute('content')).toBe('#2d5a9b');
  });

  it('is idempotent when DOM and meta are already correct', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', '#1a1a2e');
    localStorage.setItem('spannungsatlas-theme', 'dark');

    const setAttrSpy = vi.spyOn(document.documentElement, 'setAttribute');
    const metaSetSpy = vi.spyOn(meta as HTMLElement, 'setAttribute');

    cleanup = initTheme();

    expect(setAttrSpy).not.toHaveBeenCalled();
    expect(metaSetSpy).not.toHaveBeenCalled();
  });

  it('uses Safari/WebKit legacy addListener fallback if addEventListener is missing', () => {
    // Remove standard method to force fallback
    mockMatchMedia.addEventListener = undefined;
    mockMatchMedia.removeEventListener = undefined;

    cleanup = initTheme();

    expect(mockMatchMedia.addListener).toHaveBeenCalled();

    cleanup();
    expect(mockMatchMedia.removeListener).toHaveBeenCalled();
  });

  it('updates theme correctly when system prefer-color-scheme changes', () => {
    cleanup = initTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    // Simulate user OS changing to dark mode
    mockMatchMedia.matches = true;
    for (const listener of systemListeners) {
      listener({ matches: true });
    }

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    // Change back to light
    mockMatchMedia.matches = false;
    for (const listener of systemListeners) {
      listener({ matches: false });
    }

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
