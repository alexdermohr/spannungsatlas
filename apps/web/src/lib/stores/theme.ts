/** Theme preference store — persists to localStorage, applies via <html data-theme>. */

import { writable } from 'svelte/store';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'spannungsatlas-theme';
const ATTRIBUTE = 'data-theme';

/** Read stored preference; default to 'system'. */
function stored(): ThemeMode {
	if (typeof window === 'undefined') return 'system';
	try {
		const v = localStorage.getItem(STORAGE_KEY);
		if (v === 'light' || v === 'dark' || v === 'system') return v;
	} catch {
		// storage not accessible
	}
	return 'system';
}

/** Resolve effective theme ('light' | 'dark') from mode. */
function resolve(mode: ThemeMode): 'light' | 'dark' {
	if (mode === 'light' || mode === 'dark') return mode;
	if (typeof window === 'undefined') return 'light';
	try {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	} catch {
		return 'light';
	}
}

function apply(mode: ThemeMode): void {
	const effective = resolve(mode);
	const currentTheme = document.documentElement.getAttribute(ATTRIBUTE);

if (currentTheme !== effective) {
		document.documentElement.setAttribute(ATTRIBUTE, effective);
	}

	if (document.body) {
		document.body.classList.toggle('light-mode', effective === 'light');
		document.body.classList.toggle('dark-mode', effective === 'dark');
	}

	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta) {
		const expectedColor = effective === 'dark' ? '#1a1a2e' : '#2d5a9b';
		const currentColor = meta.getAttribute('content');
		if (currentColor !== expectedColor) {
			meta.setAttribute('content', expectedColor);
		}
	}
}

/** Reactive store for the current theme mode. */
export const themeMode = writable<ThemeMode>('system');

/** Set mode, persist to localStorage, and apply to DOM. */
export function setThemeMode(mode: ThemeMode): void {
	themeMode.set(mode);
	try {
		localStorage.setItem(STORAGE_KEY, mode);
	} catch {
		// storage not accessible
	}
	apply(mode);
}

/**
 * Initialise theme — call once from root layout's onMount.
 * Returns a cleanup function that removes the OS-preference listener.
 */
export function initTheme(): () => void {
	const initial = stored();
	themeMode.set(initial);

	// Ensure DOM matches store, but avoid redundant updates if app.html already set it perfectly.
	apply(initial);

	function onSystemChange(): void {
		themeMode.update((mode) => {
			if (mode === 'system') apply(mode);
			return mode;
		});
	}

	let mq: MediaQueryList | null = null;
	try {
		mq = window.matchMedia('(prefers-color-scheme: dark)');
		if (mq.addEventListener) {
			mq.addEventListener('change', onSystemChange);
		} else if (mq.addListener) {
			// Safari/WebKit fallback
			mq.addListener(onSystemChange);
		}
	} catch {
		// matchMedia not available
	}

	return () => {
		try {
			if (mq?.removeEventListener) {
				mq.removeEventListener('change', onSystemChange);
			} else if (mq?.removeListener) {
				mq.removeListener(onSystemChange);
			}
		} catch {
			// ignore
		}
	};
}
