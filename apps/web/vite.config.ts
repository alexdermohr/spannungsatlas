import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface AppVersion {
	release: string;
	build: string;
	commit: string;
	builtAt: string;
}

function getBuildVersion(): AppVersion {
	const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8')) as {
		version: string;
	};
	let commit = 'unknown';
	try {
		commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8', cwd: __dirname }).trim();
	} catch {
		// git not available or not a git repository
	}
	return {
		release: pkg.version,
		// In non-git environments (e.g. zip downloads), fall back to a base-36 timestamp.
		// This ensures each build still gets a unique identifier for update detection.
		build: commit !== 'unknown' ? commit : Date.now().toString(36),
		commit,
		builtAt: new Date().toISOString()
	};
}

function generateVersionJsonPlugin(version: AppVersion): Plugin {
	return {
		name: 'generate-version-json',
		buildStart() {
			const staticDir = join(__dirname, 'static');
			mkdirSync(staticDir, { recursive: true });
			writeFileSync(
				join(staticDir, 'version.json'),
				JSON.stringify(version, null, 2) + '\n'
			);
		}
	};
}

const appVersion = getBuildVersion();

export default defineConfig({
	plugins: [generateVersionJsonPlugin(appVersion), sveltekit()],
	define: {
		__APP_VERSION__: JSON.stringify(appVersion)
	}
});
