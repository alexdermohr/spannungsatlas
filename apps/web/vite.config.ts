import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildVersionFromInputs, type AppVersion } from './src/lib/version.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
	return buildVersionFromInputs(pkg.version, commit, new Date());
}

function generateVersionJsonPlugin(version: AppVersion): Plugin[] {
	const versionJson = JSON.stringify(version, null, 2) + '\n';
	return [
		{
			// Build only: write static/version.json so it is included in the production output.
			name: 'write-version-json',
			apply: 'build',
			buildStart() {
				const staticDir = join(__dirname, 'static');
				mkdirSync(staticDir, { recursive: true });
				writeFileSync(join(staticDir, 'version.json'), versionJson);
			}
		},
		{
			// Dev only: serve /version.json from memory so it always matches __APP_VERSION__
			// without touching the source tree.
			name: 'dev-version-json',
			apply: 'serve',
			configureServer(server) {
				server.middlewares.use('/version.json', (_req, res) => {
					res.setHeader('Content-Type', 'application/json');
					res.setHeader('Cache-Control', 'no-store, max-age=0');
					res.end(versionJson);
				});
			}
		}
	];
}

const appVersion = getBuildVersion();

export default defineConfig({
	plugins: [generateVersionJsonPlugin(appVersion), sveltekit()],
	define: {
		__APP_VERSION__: JSON.stringify(appVersion)
	}
});
