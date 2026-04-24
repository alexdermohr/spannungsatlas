<script lang="ts">
  import { clusters, needs, determinants } from '$lib/catalog/catalog-data.js';
  import { filterCatalogItems } from '$lib/catalog/catalog-utils.js';
  import { filterItemsByClusterFocus, getClusterFocusItemIds } from '$lib/catalog/cluster-focus.js';
  import { toggleSelectionId } from '$lib/forms/exploration-selection-model.js';

  let {
    title,
    selectedNeedIds = $bindable<string[]>(),
    selectedDeterminantIds = $bindable<string[]>(),
    activeClusterId = $bindable<string>(),
    selectionSearch = $bindable<string>(),
    onChange
  }: {
    title: string;
    selectedNeedIds?: string[];
    selectedDeterminantIds?: string[];
    activeClusterId: string;
    selectionSearch: string;
    onChange?: () => void;
  } = $props();

  const activeCluster = $derived(
    clusters.find((cluster) => cluster.id === activeClusterId) ?? null
  );
  const visibleNeeds = $derived(
    filterItemsByClusterFocus(
      filterCatalogItems(needs, selectionSearch),
      activeClusterId,
      'need'
    )
  );
  const visibleDeterminants = $derived(
    filterItemsByClusterFocus(
      filterCatalogItems(determinants, selectionSearch),
      activeClusterId,
      'determinant'
    )
  );

  function notifyChange() {
    onChange?.();
  }

  function toggleNeed(id: string) {
    selectedNeedIds = toggleSelectionId(selectedNeedIds, id);
    notifyChange();
  }

  function toggleDeterminant(id: string) {
    selectedDeterminantIds = toggleSelectionId(selectedDeterminantIds, id);
    notifyChange();
  }

  function selectedNeedCountForCluster(clusterId: string): number {
    const ids = new Set(getClusterFocusItemIds(clusterId).needs);
    return selectedNeedIds.filter((id) => ids.has(id)).length;
  }

  function selectedDeterminantCountForCluster(clusterId: string): number {
    const ids = new Set(getClusterFocusItemIds(clusterId).determinants);
    return selectedDeterminantIds.filter((id) => ids.has(id)).length;
  }
</script>

<section class="card form-section slide">
  <h2>{title}</h2>
  <p class="helper">
    Markieren Sie relevante Bedürfnisse und Determinanten als
    Reflexionsanker. <strong>Markierungen sind Reflexionsanker, keine
    automatische Deutung.</strong>
  </p>

  <div class="cluster-focus-controls" role="group" aria-label="Cluster-Fokus">
    {#each clusters as cluster (cluster.id)}
      <button
        type="button"
        class:active={activeClusterId === cluster.id}
        aria-pressed={activeClusterId === cluster.id}
        onclick={() => activeClusterId = cluster.id}
      >
        <span>{cluster.short}</span>
        <small aria-label={`Bedürfnisse ${selectedNeedCountForCluster(cluster.id)}, Determinanten ${selectedDeterminantCountForCluster(cluster.id)}`}>
          {selectedNeedCountForCluster(cluster.id)} B / {selectedDeterminantCountForCluster(cluster.id)} D
        </small>
      </button>
    {/each}
  </div>

  {#if activeCluster}
    <div class="cluster-focus-card">
      <h3>{activeCluster.label}</h3>
      <p>{activeCluster.description}</p>
    </div>
  {/if}

  <label class="field selection-search">
    <span class="field-label">Suche im aktuellen Cluster-Fokus</span>
    <input
      type="text"
      bind:value={selectionSearch}
      placeholder="z. B. Sicherheit, Gruppe, Raum"
    />
    <small class="helper">
      Die Suche filtert nur die Anzeige — bereits getroffene Markierungen bleiben erhalten.
    </small>
  </label>

  <div class="selection-group">
    <h3>Bedürfnisse ({selectedNeedIds.length} ausgewählt, {visibleNeeds.length} sichtbar)</h3>
    <div class="selection-grid">
      {#each visibleNeeds as need (need.id)}
        <label class="selection-item">
          <input
            type="checkbox"
            checked={selectedNeedIds.includes(need.id)}
            onchange={() => toggleNeed(need.id)}
          />
          <span>{need.label}</span>
        </label>
      {/each}
    </div>
  </div>

  <div class="selection-group">
    <h3>Determinanten ({selectedDeterminantIds.length} ausgewählt, {visibleDeterminants.length} sichtbar)</h3>
    <div class="selection-grid">
      {#each visibleDeterminants as determinant (determinant.id)}
        <label class="selection-item">
          <input
            type="checkbox"
            checked={selectedDeterminantIds.includes(determinant.id)}
            onchange={() => toggleDeterminant(determinant.id)}
          />
          <span>{determinant.label}</span>
        </label>
      {/each}
    </div>
  </div>

  <div class="selection-summary">
    <strong>Auswahlzusammenfassung:</strong>
    {selectedNeedIds.length} Bedürfnis(se), {selectedDeterminantIds.length} Determinante(n).
  </div>
</section>

<style>
  .form-section { margin-bottom: 1.25rem; }
  .form-section h2 { font-size: 1.05rem; margin-bottom: 0.25rem; color: var(--color-accent); }
  .helper { font-size: 0.85rem; color: var(--color-text-muted); margin-top: 0; margin-bottom: 1rem; }
  .field { display: block; margin-bottom: 0.75rem; }
  .field-label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem; }
  input[type='text'] {
    width: 100%;
    padding: 0.5rem 0.65rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-family: inherit;
    font-size: 0.9rem;
    background: var(--color-bg);
    color: var(--color-text);
  }
  input[type='text']:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: -1px;
    border-color: var(--color-accent);
  }
  .cluster-focus-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.5rem;
    margin-bottom: 0.65rem;
  }
  .cluster-focus-controls button {
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    border-radius: var(--radius);
    padding: 0.45rem 0.6rem;
    text-align: left;
    color: var(--color-text);
    font-size: 0.82rem;
    cursor: pointer;
  }
  .cluster-focus-controls button.active {
    border-color: var(--color-accent);
    box-shadow: inset 0 0 0 1px var(--color-accent);
  }
  .cluster-focus-controls button small {
    display: block;
    margin-top: 0.2rem;
    color: var(--color-text-muted);
    font-size: 0.74rem;
  }
  .cluster-focus-card {
    border: 1px dashed var(--color-border);
    border-radius: var(--radius);
    padding: 0.55rem 0.7rem;
    margin-bottom: 0.75rem;
    background: rgba(45, 90, 155, 0.04);
  }
  .cluster-focus-card h3 { margin: 0 0 0.3rem 0; color: var(--color-text); font-size: 0.9rem; }
  .cluster-focus-card p { margin: 0; font-size: 0.82rem; color: var(--color-text-muted); }
  .selection-search { margin-bottom: 0.85rem; }
  .selection-search small { display: block; margin-top: 0.3rem; }
  .selection-group { margin-bottom: 1rem; }
  .selection-group h3 { margin: 0 0 0.5rem 0; font-size: 0.9rem; color: var(--color-text); }
  .selection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 0.5rem;
  }
  .selection-item {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 0.5rem 0.65rem;
    background: var(--color-bg);
    font-size: 0.85rem;
  }
  .selection-item input { margin-top: 0.15rem; width: auto; }
  .selection-summary {
    border-top: 1px solid var(--color-border);
    padding-top: 0.5rem;
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }
</style>