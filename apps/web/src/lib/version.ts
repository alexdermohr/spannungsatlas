export interface AppVersion {
	release: string;
	build: string;
	commit: string;
	builtAt: string;
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
