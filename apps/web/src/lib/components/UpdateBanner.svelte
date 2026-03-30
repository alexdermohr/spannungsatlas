<script lang="ts">
	import { onMount } from 'svelte';
	import { isUpdateAvailable, type AppVersion } from '$lib/version.js';

	// Injected by Vite at build time. In tests or SSR this falls back to an empty build token.
	const currentBuild: string =
		typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__.build : '';

	let updateAvailable = $state(false);
	let updating = $state(false);

	async function checkForUpdate(): Promise<void> {
		if (!currentBuild) return;
		try {
			const res = await fetch('/version.json', { cache: 'no-store' });
			if (!res.ok) return;
			const remote: Partial<AppVersion> = await res.json();
			const newVersionFound = isUpdateAvailable(currentBuild, remote);
			if (import.meta.env.DEV) {
				console.debug('[spannungsatlas] version check', {
					current: currentBuild,
					remote: remote.build ?? '(missing)',
					updateAvailable: newVersionFound
				});
			}
			if (newVersionFound) {
				updateAvailable = true;
			}
		} catch {
			// Network unavailable – silent, try again later.
		}
	}

	async function activateUpdate(): Promise<void> {
		updating = true;
		if ('serviceWorker' in navigator) {
			try {
				const reg = await navigator.serviceWorker.getRegistration();
				if (reg?.waiting) {
					// Declare safetyTimer before the handler so the handler can clear it.
					let safetyTimer: ReturnType<typeof setTimeout> | undefined;

					// Reload only after the new SW has actually taken control.
					// controllerchange fires exactly when the new SW becomes the active
					// controller — this is the correct, race-free moment to reload.
					const reloadOnControllerChange = () => {
						clearTimeout(safetyTimer);
						window.location.reload();
					};
					navigator.serviceWorker.addEventListener('controllerchange', reloadOnControllerChange, {
						once: true
					});

					// Safety timeout: if controllerchange doesn't fire within 1.5 s
					// (e.g. no existing clients to claim), reload anyway.
					safetyTimer = setTimeout(() => {
						navigator.serviceWorker.removeEventListener(
							'controllerchange',
							reloadOnControllerChange
						);
						window.location.reload();
					}, 1500);

					reg.waiting.postMessage({ type: 'SKIP_WAITING' });
					return;
				}
			} catch {
				// SW not available, proceed with plain reload.
			}
		}
		window.location.reload();
	}

	onMount(() => {
		checkForUpdate();

		// Log SW state once for debuggability (dev only).
		if ('serviceWorker' in navigator && import.meta.env.DEV) {
			navigator.serviceWorker.getRegistration().then((reg) => {
				console.debug('[spannungsatlas] SW state', {
					active: reg?.active?.state ?? 'none',
					waiting: reg?.waiting ? 'yes' : 'none',
					installing: reg?.installing ? 'yes' : 'none'
				});
			});
		}

		// Re-check every 5 minutes.
		const interval = setInterval(checkForUpdate, 5 * 60 * 1000);

		// Re-check when the tab regains focus.
		function onVisibilityChange() {
			if (!document.hidden) checkForUpdate();
		}
		document.addEventListener('visibilitychange', onVisibilityChange);

		return () => {
			clearInterval(interval);
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	});
</script>

{#if updateAvailable}
	<div class="update-banner" role="status" aria-live="polite">
		<span class="update-message">Neue Version verfügbar</span>
		<button onclick={activateUpdate} disabled={updating} class="update-btn">
			{updating ? 'Wird aktualisiert\u2026' : 'Jetzt aktualisieren'}
		</button>
	</div>
{/if}

<style>
	.update-banner {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-left: 3px solid var(--color-accent);
		border-radius: var(--radius);
		padding: 0.65rem 1rem;
		box-shadow: var(--shadow-md);
		font-size: 0.875rem;
		color: var(--color-text);
		max-width: 90vw;
	}

	.update-message {
		color: var(--color-text-muted);
	}

	.update-btn {
		background: var(--color-accent);
		color: #fff;
		border: none;
		border-radius: var(--radius);
		padding: 0.35rem 0.85rem;
		font-size: 0.875rem;
		font-family: inherit;
		cursor: pointer;
		white-space: nowrap;
		transition: opacity 0.15s;
	}

	.update-btn:disabled {
		opacity: 0.65;
		cursor: default;
	}

	.update-btn:not(:disabled):hover {
		opacity: 0.88;
	}
</style>
