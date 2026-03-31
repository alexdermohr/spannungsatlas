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
	document.documentElement.setAttribute(ATTRIBUTE, effective);

	// Update meta theme-color to match
	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta) {
		meta.setAttribute('content', effective === 'dark' ? '#1a1a2e' : '#2d5a9b');
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
		mq.addEventListener('change', onSystemChange);
	} catch {
		// matchMedia not available
	}

	return () => {
		try {
			mq?.removeEventListener('change', onSystemChange);
		} catch {
			// ignore
		}
	};
}
