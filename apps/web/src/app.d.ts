/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {}

	interface AppVersion {
		release: string;
		build: string;
		commit: string;
		builtAt: string;
	}

	// Injected by Vite at build time (see vite.config.ts)
	const __APP_VERSION__: AppVersion;
}

export {};
