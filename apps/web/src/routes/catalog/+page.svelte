<script lang="ts">
	import { needs, determinants, clusters } from '$lib/catalog/catalog-data';
	import { filterCatalogItems } from '$lib/catalog/catalog-utils';

	let activeTab: 'needs' | 'determinants' | 'clusters' = 'needs';
	let searchQuery = '';

	$: activeData =
		activeTab === 'needs' ? needs :
		activeTab === 'determinants' ? determinants :
		clusters;

	$: filteredData = filterCatalogItems(activeData, searchQuery);
</script>

<div class="page">
	<header class="page-header">
		<h1>Explorationsraum</h1>
		<p class="subtitle">Katalog für Bedürfnisse, Determinanten und Cluster</p>
	</header>

	<div class="controls">
		<div class="tabs" role="tablist" aria-label="Katalog Kategorien">
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === 'needs'}
				class:active={activeTab === 'needs'}
				on:click={() => activeTab = 'needs'}
			>
				Bedürfnisse
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === 'determinants'}
				class:active={activeTab === 'determinants'}
				on:click={() => activeTab = 'determinants'}
			>
				Determinanten
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === 'clusters'}
				class:active={activeTab === 'clusters'}
				on:click={() => activeTab = 'clusters'}
			>
				Cluster
			</button>
		</div>

		<div class="search">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Katalog durchsuchen..."
				aria-label="Katalog durchsuchen"
			/>
		</div>
	</div>

	<div class="catalog-grid">
		{#if filteredData.length === 0}
			<div class="empty-state card">
				<p>Keine Einträge für "{searchQuery}" gefunden.</p>
			</div>
		{:else}
			{#each filteredData as item (item.id)}
				<article class="card catalog-card">
					<header class="card-header">
						<h2>{item.label}</h2>
						<span class="badge">{item.short}</span>
					</header>
					<p class="description">{item.description}</p>
					<div class="card-footer">
						<code class="id-tag">{item.id}</code>
					</div>
				</article>
			{/each}
		{/if}
	</div>
</div>

<style>
	.page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
		color: var(--color-text);
	}

	.subtitle {
		color: var(--color-text-muted);
		font-size: 1.1rem;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	@media (min-width: 600px) {
		.controls {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		background: var(--color-bg-subtle, #f3f4f6);
		padding: 0.25rem;
		border-radius: 0.5rem;
	}

	.tabs button {
		padding: 0.5rem 1rem;
		border: none;
		background: transparent;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 500;
		color: var(--color-text-muted);
		transition: all 0.2s;
	}

	.tabs button:hover {
		color: var(--color-text);
	}

	.tabs button.active {
		background: var(--color-bg, #ffffff);
		color: var(--color-accent, #3b82f6);
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
	}

	.search input {
		width: 100%;
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.5rem;
		font-size: 0.95rem;
	}

	.search input:focus {
		outline: none;
		border-color: var(--color-accent, #3b82f6);
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	.catalog-grid {
		display: grid;
		gap: 1rem;
	}

	.catalog-card {
		padding: 1.5rem;
		background: var(--color-bg, #ffffff);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.75rem;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.catalog-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 6px rgba(0,0,0,0.05);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		gap: 1rem;
	}

	.card-header h2 {
		font-size: 1.25rem;
		margin: 0;
		color: var(--color-text);
	}

	.badge {
		background: var(--color-bg-subtle, #f3f4f6);
		color: var(--color-text-muted);
		padding: 0.25rem 0.5rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.description {
		color: var(--color-text-muted);
		line-height: 1.5;
		margin-bottom: 1.5rem;
	}

	.card-footer {
		border-top: 1px solid var(--color-border, #e5e7eb);
		padding-top: 1rem;
	}

	.id-tag {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		background: var(--color-bg-subtle, #f3f4f6);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--color-text-muted);
		background: var(--color-bg-subtle, #f3f4f6);
		border-radius: 0.75rem;
	}
</style>
