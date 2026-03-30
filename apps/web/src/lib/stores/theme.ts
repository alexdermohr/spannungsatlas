/** Theme preference store — persists to localStorage, applies via <html data-theme>. */

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'spannungsatlas-theme';
const ATTRIBUTE = 'data-theme';

/** Read stored preference; default to 'system'. */
function stored(): ThemeMode {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') return 'system';
	const v = localStorage.getItem(STORAGE_KEY);
	if (v === 'light' || v === 'dark' || v === 'system') return v;
	return 'system';
}

/** Resolve effective theme ('light' | 'dark') from mode. */
function resolve(mode: ThemeMode): 'light' | 'dark' {
	if (mode === 'light' || mode === 'dark') return mode;
	if (typeof window === 'undefined' || typeof matchMedia === 'undefined') return 'light';
	return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(mode: ThemeMode): void {
	const effective = resolve(mode);
	document.documentElement.setAttribute(ATTRIBUTE, effective);

	// Update meta theme-color to match
	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta) {
		meta.setAttribute('content', effective === 'dark' ? '#1a1a2e' : '#2d5a9b');
	}
}

// ── Reactive state (Svelte 5 module-level) ──────────────────────────

let _mode: ThemeMode = $state('system');
let _mediaQuery: MediaQueryList | null = null;

function onSystemChange(): void {
	if (_mode === 'system') apply(_mode);
}

/** Initialise store — call once from root layout's onMount. */
export function initTheme(): void {
	_mode = stored();
	apply(_mode);

	_mediaQuery = matchMedia('(prefers-color-scheme: dark)');
	_mediaQuery.addEventListener('change', onSystemChange);
}

/** Current mode (reactive). */
export function themeMode(): ThemeMode {
	return _mode;
}

/** Set mode and persist. */
export function setThemeMode(mode: ThemeMode): void {
	_mode = mode;
	localStorage.setItem(STORAGE_KEY, mode);
	apply(mode);
}
