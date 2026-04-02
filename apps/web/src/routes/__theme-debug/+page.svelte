<script lang="ts">
	import { onMount } from 'svelte';
	import { setThemeMode, initTheme, themeMode } from '$lib/stores/theme';

	let currentTheme = $state('unknown');
	let bodyBg = $state('unknown');
	let bodyColor = $state('unknown');
	let localStorageVal = $state('unknown');
	let storeVal = $state('unknown');

	function updateReadings() {
		currentTheme = document.documentElement.getAttribute('data-theme') || 'null';
		const computed = window.getComputedStyle(document.documentElement);
		bodyBg = computed.getPropertyValue('background-color');
		bodyColor = computed.getPropertyValue('color');
		localStorageVal = localStorage.getItem('spannungsatlas-theme') || 'null';
	}

	onMount(() => {
		initTheme(); // Incorporate the store initialization

		updateReadings();
		const observer = new MutationObserver(() => {
			updateReadings();
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

		const unsub = themeMode.subscribe((v) => {
			storeVal = v;
		});

		return () => {
			observer.disconnect();
			unsub();
		};
	});

	function setLight() {
		setThemeMode('light'); // Use store
		updateReadings();
	}

	function setDark() {
		setThemeMode('dark'); // Use store
		updateReadings();
	}
</script>

<div class="debug-container">
	<h1>Theme Debug Minimal with Store</h1>

	<div class="actions">
		<button onclick={setLight}>Light</button>
		<button onclick={setDark}>Dark</button>
	</div>

	<div class="readings">
		<p><strong>data-theme:</strong> <span data-testid="val-theme">{currentTheme}</span></p>
		<p><strong>computed background:</strong> <span data-testid="val-bg">{bodyBg}</span></p>
		<p><strong>computed color:</strong> <span data-testid="val-color">{bodyColor}</span></p>
		<p><strong>localStorage:</strong> <span data-testid="val-storage">{localStorageVal}</span></p>
		<p><strong>store themeMode:</strong> <span data-testid="val-store">{storeVal}</span></p>
	</div>
</div>

<style>
	/* Minimal CSS isolated from the rest of the app */
	:global(html[data-theme='light']) {
		background-color: rgb(255, 255, 255) !important;
		color: rgb(0, 0, 0) !important;
	}
	:global(html[data-theme='dark']) {
		background-color: rgb(0, 0, 0) !important;
		color: rgb(255, 255, 255) !important;
	}
	.debug-container {
		padding: 2rem;
		font-family: monospace;
	}
	.actions {
		margin-bottom: 1rem;
		display: flex;
		gap: 1rem;
	}
	button {
		padding: 0.5rem 1rem;
		cursor: pointer;
	}
	.readings p {
		margin: 0.5rem 0;
	}
</style>
