import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { themeMode, setThemeMode, initTheme } from '../../apps/web/src/lib/stores/theme.ts';
import { get } from 'svelte/store';

describe('theme store', () => {
	let originalWindow: typeof window | undefined;
	let originalDocument: typeof document | undefined;
	let matchMediaMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Setup mock DOM environment
		const listeners = new Set<Function>();
		const mockMq = {
			matches: false,
			addEventListener: vi.fn((event, callback) => listeners.add(callback)),
			removeEventListener: vi.fn((event, callback) => listeners.delete(callback)),
			addListener: vi.fn((callback) => listeners.add(callback)),
			removeListener: vi.fn((callback) => listeners.delete(callback)),
			__simulateChange: () => {
				listeners.forEach(cb => cb());
			}
		};

		matchMediaMock = vi.fn().mockReturnValue(mockMq);

		global.window = {
			matchMedia: matchMediaMock,
		} as unknown as Window & typeof globalThis;

		global.localStorage = {
			getItem: vi.fn(),
			setItem: vi.fn(),
			removeItem: vi.fn(),
			clear: vi.fn(),
			length: 0,
			key: vi.fn()
		} as unknown as Storage;

		const setAttributeMock = vi.fn();
		global.document = {
			documentElement: {
				setAttribute: setAttributeMock
			},
			querySelector: vi.fn().mockReturnValue({
				setAttribute: setAttributeMock
			})
		} as unknown as Document;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('initializes with system default when no localStorage value exists', () => {
		vi.mocked(global.localStorage.getItem).mockReturnValue(null);

		const cleanup = initTheme();
		expect(get(themeMode)).toBe('system');
		expect(global.document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');

		cleanup();
	});

	it('initializes with dark mode when localStorage has dark', () => {
		vi.mocked(global.localStorage.getItem).mockReturnValue('dark');

		const cleanup = initTheme();
		expect(get(themeMode)).toBe('dark');
		expect(global.document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');

		cleanup();
	});

	it('sets theme mode and updates DOM and localStorage', () => {
		setThemeMode('light');

		expect(get(themeMode)).toBe('light');
		expect(global.localStorage.setItem).toHaveBeenCalledWith('spannungsatlas-theme', 'light');
		expect(global.document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
	});

	it('uses Safari fallback addListener if addEventListener is not available', () => {
		// Mock matchMedia returning object WITHOUT addEventListener
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
});
