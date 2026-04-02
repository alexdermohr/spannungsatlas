import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { themeMode, setThemeMode, initTheme } from '../../apps/web/src/lib/stores/theme.js';
import { get } from 'svelte/store';

// Type helper for testing DOM element mocks
type DummyElement = {
	getAttribute: (name: string) => string | null;
	setAttribute: (name: string, value: string) => void;
	__attributes: Map<string, string>;
};

describe('theme store', () => {
	let matchMediaMock: ReturnType<typeof vi.fn>;
	let metaSetAttributeSpy: ReturnType<typeof vi.fn>;
	let rootSetAttributeSpy: ReturnType<typeof vi.fn>;

	let dummyRoot: DummyElement;
	let dummyMeta: DummyElement;

	const originalWindow = globalThis.window;
	const originalDocument = globalThis.document;
	const originalLocalStorage = globalThis.localStorage;

	beforeEach(() => {
		const listeners = new Set<Function>();
		const mockMq = {
			matches: false,
			addEventListener: vi.fn((event, callback) => listeners.add(callback)),
			removeEventListener: vi.fn((event, callback) => listeners.delete(callback)),
			addListener: vi.fn((callback) => listeners.add(callback)),
			removeListener: vi.fn((callback) => listeners.delete(callback)),
			__simulateChange: (matches: boolean) => {
				mockMq.matches = matches;
				listeners.forEach(cb => cb());
			}
		};

		matchMediaMock = vi.fn().mockReturnValue(mockMq);

		Object.defineProperty(globalThis, 'window', {
			value: { matchMedia: matchMediaMock },
			writable: true,
			configurable: true
		});

		Object.defineProperty(globalThis, 'localStorage', {
			value: {
				getItem: vi.fn(),
				setItem: vi.fn(),
				removeItem: vi.fn(),
				clear: vi.fn(),
				length: 0,
				key: vi.fn()
			},
			writable: true,
			configurable: true
		});

		// Create stateful dummy elements for DOM assertions
		const createDummyElement = (initialAttrs: Record<string, string> = {}): DummyElement => {
			const attributes = new Map(Object.entries(initialAttrs));
			return {
				getAttribute: vi.fn((name) => attributes.has(name) ? attributes.get(name) : null),
				setAttribute: vi.fn((name, value) => attributes.set(name, value)),
				__attributes: attributes
			};
		};

		dummyRoot = createDummyElement();
		dummyMeta = createDummyElement();

		rootSetAttributeSpy = dummyRoot.setAttribute as ReturnType<typeof vi.fn>;
		metaSetAttributeSpy = dummyMeta.setAttribute as ReturnType<typeof vi.fn>;

		Object.defineProperty(globalThis, 'document', {
			value: {
				documentElement: dummyRoot,
				querySelector: vi.fn().mockImplementation((sel) => {
					if (sel === 'meta[name="theme-color"]') return dummyMeta;
					return null;
				})
			},
			writable: true,
			configurable: true
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();

		Object.defineProperty(globalThis, 'window', {
			value: originalWindow,
			writable: true,
			configurable: true
		});
		Object.defineProperty(globalThis, 'document', {
			value: originalDocument,
			writable: true,
			configurable: true
		});
		Object.defineProperty(globalThis, 'localStorage', {
			value: originalLocalStorage,
			writable: true,
			configurable: true
		});
	});

	it('initializes with system default when no localStorage value exists', () => {
		vi.mocked(globalThis.localStorage.getItem).mockReturnValue(null);

		const cleanup = initTheme();
		expect(get(themeMode)).toBe('system');
		expect(globalThis.document.documentElement.getAttribute('data-theme')).toBe('light');
		expect(globalThis.document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#2d5a9b');

		cleanup();
	});

	it('initializes with dark mode when localStorage has dark', () => {
		vi.mocked(globalThis.localStorage.getItem).mockReturnValue('dark');

		const cleanup = initTheme();
		expect(get(themeMode)).toBe('dark');
		expect(globalThis.document.documentElement.getAttribute('data-theme')).toBe('dark');
		expect(globalThis.document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#1a1a2e');

		cleanup();
	});

	it('treats invalid localStorage values as system default', () => {
		vi.mocked(globalThis.localStorage.getItem).mockReturnValue('invalid-mode');

		const cleanup = initTheme();
		expect(get(themeMode)).toBe('system');
		expect(globalThis.document.documentElement.getAttribute('data-theme')).toBe('light');
		expect(globalThis.document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#2d5a9b');

		cleanup();
	});

	it('sets theme mode and updates DOM and localStorage', () => {
		setThemeMode('light');

		expect(get(themeMode)).toBe('light');
		expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('spannungsatlas-theme', 'light');
		expect(globalThis.document.documentElement.getAttribute('data-theme')).toBe('light');
		expect(globalThis.document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#2d5a9b');
	});

	it('uses Safari fallback addListener if addEventListener is not available', () => {
		const mockMqSafari = {
			matches: true,
			addListener: vi.fn(),
			removeListener: vi.fn(),
		};
		matchMediaMock.mockReturnValue(mockMqSafari);

		const cleanup = initTheme();
		expect(mockMqSafari.addListener).toHaveBeenCalled();

		cleanup();
		expect(mockMqSafari.removeListener).toHaveBeenCalled();
	});

	it('does not re-apply DOM attributes if they are already correct (idempotency)', () => {
		vi.mocked(globalThis.localStorage.getItem).mockReturnValue('dark');
		// pre-populate dummy elements cleanly
		dummyRoot.__attributes.set('data-theme', 'dark');
		dummyMeta.__attributes.set('content', '#1a1a2e');

		const cleanup = initTheme();

		// Check idempotency through setter spies
		expect(rootSetAttributeSpy).not.toHaveBeenCalled();
		expect(metaSetAttributeSpy).not.toHaveBeenCalled();

		expect(globalThis.document.documentElement.getAttribute('data-theme')).toBe('dark');
		expect(globalThis.document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#1a1a2e');

		cleanup();
	});

	it('system mode reacts to matchMedia changes', () => {
		vi.mocked(globalThis.localStorage.getItem).mockReturnValue('system');
		const cleanup = initTheme();

		expect(globalThis.document.documentElement.getAttribute('data-theme')).toBe('light');

		const mockMq = matchMediaMock();
		mockMq.__simulateChange(true);

		expect(globalThis.document.documentElement.getAttribute('data-theme')).toBe('dark');
		expect(globalThis.document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#1a1a2e');

		cleanup();
	});
});
