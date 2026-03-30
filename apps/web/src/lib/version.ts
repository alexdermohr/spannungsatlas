export interface AppVersion {
	release: string;
	build: string;
	commit: string;
	builtAt: string;
}

/**
 * Pure function that assembles an AppVersion from its raw inputs.
 * Extracted so it can be unit-tested independently of the Vite/Node environment.
 *
 * @param release  Semver release string from package.json (e.g. "0.1.0")
 * @param commit   Short git SHA or "unknown" when git is unavailable
 * @param now      Timestamp to use for `builtAt`
 */
export function buildVersionFromInputs(release: string, commit: string, now: Date): AppVersion {
	return {
		release,
		// When git is unavailable fall back to a base-36 timestamp so each build
		// still gets a unique, non-empty identifier for update detection.
		build: commit !== 'unknown' ? commit : now.getTime().toString(36),
		commit,
		builtAt: now.toISOString()
	};
}

/**
 * Returns true when `remote` carries a different build ID than `currentBuild`,
 * indicating that a newer version has been deployed.
 *
 * Returns false when either value is empty/missing – this prevents spurious
 * update prompts in environments where version.json is not available.
 */
export function isUpdateAvailable(
	currentBuild: string,
	remote: Partial<AppVersion>
): boolean {
	return Boolean(currentBuild && remote.build && remote.build !== currentBuild);
}
