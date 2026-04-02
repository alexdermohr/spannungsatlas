import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { themeMode, setThemeMode, initTheme } from '../../apps/web/src/lib/stores/theme.js';
import { get } from 'svelte/store';

describe('theme store', () => {
	let matchMediaMock: ReturnType<typeof vi.fn>;
	let setAttributeMock: ReturnType<typeof vi.fn>;
	let getAttributeMock: ReturnType<typeof vi.fn>;
	let metaSetAttributeMock: ReturnType<typeof vi.fn>;
	let metaGetAttributeMock: ReturnType<typeof vi.fn>;

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

		setAttributeMock = vi.fn();
		getAttributeMock = vi.fn().mockReturnValue(null);
		metaSetAttributeMock = vi.fn();
		metaGetAttributeMock = vi.fn().mockReturnValue(null);

		Object.defineProperty(globalThis, 'document', {
			value: {
				documentElement: {
					setAttribute: setAttributeMock,
					getAttribute: getAttributeMock
				},
				querySelector: vi.fn().mockReturnValue({
					setAttribute: metaSetAttributeMock,
					getAttribute: metaGetAttributeMock
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
		expect(setAttributeMock).toHaveBeenCalledWith('data-theme', 'light');

		cleanup();
	});

	it('initializes with dark mode when localStorage has dark', () => {
		vi.mocked(globalThis.localStorage.getItem).mockReturnValue('dark');

		const cleanup = initTheme();
		expect(get(themeMode)).toBe('dark');
		expect(setAttributeMock).toHaveBeenCalledWith('data-theme', 'dark');

		cleanup();
	});

	it('treats invalid localStorage values as system default', () => {
		vi.mocked(globalThis.localStorage.getItem).mockReturnValue('invalid-mode');

		const cleanup = initTheme();
		expect(get(themeMode)).toBe('system');
		expect(setAttributeMock).toHaveBeenCalledWith('data-theme', 'light');

		cleanup();
	});

	it('sets theme mode and updates DOM and localStorage', () => {
		setThemeMode('light');

		expect(get(themeMode)).toBe('light');
		expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('spannungsatlas-theme', 'light');
		expect(setAttributeMock).toHaveBeenCalledWith('data-theme', 'light');
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
		getAttributeMock.mockReturnValue('dark');
		metaGetAttributeMock.mockReturnValue('#1a1a2e');

		const cleanup = initTheme();

		// DOM shouldn't be touched because getAttribute already matches
		expect(setAttributeMock).not.toHaveBeenCalled();
		expect(metaSetAttributeMock).not.toHaveBeenCalled();

		cleanup();
	});

	it('system mode reacts to matchMedia changes', () => {
		vi.mocked(globalThis.localStorage.getItem).mockReturnValue('system');
		const cleanup = initTheme();

		// Initial state is light (matches = false in our mock setup)
		expect(setAttributeMock).toHaveBeenCalledWith('data-theme', 'light');

		// Change OS to dark mode
		const mockMq = matchMediaMock();
		mockMq.__simulateChange(true);

		// Should have updated DOM to dark
		expect(setAttributeMock).toHaveBeenCalledWith('data-theme', 'dark');

		cleanup();
	});
});