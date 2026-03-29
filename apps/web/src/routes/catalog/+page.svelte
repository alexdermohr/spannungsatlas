<script lang="ts">
  import { taxonomy, type TaxonomyCategory, type TaxonomyItem } from '$lib/catalog/taxonomy.js';

  let searchQuery = $state('');
  let activeCategory = $state<string | null>(null);

  const categoryIcons: Record<string, string> = {
    'needs': '🎯',
    'determinants': '⚡',
    'expression-forms': '💬',
    'environment-reactions': '🔄'
  };

  function matchesSearch(item: TaxonomyItem): boolean {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.examples ?? []).some(ex => ex.toLowerCase().includes(q))
    );
  }

  function filteredItems(category: TaxonomyCategory): TaxonomyItem[] {
    return category.items.filter(matchesSearch);
  }

  function hasResults(category: TaxonomyCategory): boolean {
    return filteredItems(category).length > 0;
  }

  function totalResults(): number {
    return taxonomy.reduce((sum, cat) => sum + filteredItems(cat).length, 0);
  }
</script>

<div class="page">
  <h1>Bedürfnis- und Determinantenraum</h1>
  <p class="subtitle">
    Explorationsraum für pädagogische Bezugsrahmen — kein Vorschlagsautomat,
    sondern Reflexionswerkzeug zur Horizonterweiterung.
  </p>

  <div class="info-banner card">
    <strong>Trennregel (MASTERPLAN §9.1):</strong>
    Bedürfnis (worauf der Mensch drängt), Determinante (was den Drang verstärkt/dämpft),
    Ausdrucksform (wie sich der Druck zeigt) und Umweltreaktion (was das Umfeld tut)
    — diese vier Ebenen dürfen nicht vermischt werden.
  </div>

  <!-- Search -->
  <div class="search-bar">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Katalog durchsuchen…"
      class="search-input"
    />
    {#if searchQuery.trim()}
      <span class="search-results">{totalResults()} Treffer</span>
    {/if}
  </div>

  <!-- Category tabs -->
  <div class="category-tabs">
    <button
      class="tab"
      class:tab-active={activeCategory === null}
      onclick={() => { activeCategory = null; }}
    >
      Alle
    </button>
    {#each taxonomy as cat}
      <button
        class="tab"
        class:tab-active={activeCategory === cat.id}
        onclick={() => { activeCategory = activeCategory === cat.id ? null : cat.id; }}
      >
        <span class="tab-icon">{categoryIcons[cat.id] ?? ''}</span>
        {cat.label}
      </button>
    {/each}
  </div>

  <!-- Categories -->
  {#each taxonomy as cat}
    {#if (activeCategory === null || activeCategory === cat.id) && hasResults(cat)}
      <section class="category-section">
        <div class="category-header">
          <h2>
            <span class="category-icon">{categoryIcons[cat.id] ?? ''}</span>
            {cat.label}
          </h2>
          <span class="category-count">{filteredItems(cat).length} Einträge</span>
        </div>
        <p class="category-desc">{cat.description}</p>

        <div class="item-grid">
          {#each filteredItems(cat) as item (item.id)}
            <div class="card item-card">
              <h3>{item.label}</h3>
              <p class="item-desc">{item.description}</p>
              {#if item.examples && item.examples.length > 0}
                <div class="item-examples">
                  <span class="examples-label">Beispiele:</span>
                  {#each item.examples as ex}
                    <span class="example-tag">{ex}</span>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/each}

  {#if searchQuery.trim() && totalResults() === 0}
    <div class="card no-results">
      <p>Keine Einträge für „{searchQuery}" gefunden.</p>
      <p class="no-results-hint">
        Die V1-Taxonomie ist bewusst begrenzt. Nicht jeder Begriff findet sich als
        eigener Eintrag — nutzen Sie die vorhandenen Kategorien als Reflexionsrahmen.
      </p>
    </div>
  {/if}
</div>

<style>
  .subtitle {
    color: var(--color-text-muted);
    margin-top: -0.5rem;
    margin-bottom: 1.5rem;
  }
  .info-banner {
    background: var(--color-accent-light);
    border-color: var(--color-accent);
    font-size: 0.85rem;
    margin-bottom: 1.25rem;
    line-height: 1.5;
  }
  .search-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .search-input {
    flex: 1;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-family: inherit;
    font-size: 0.9rem;
    background: var(--color-surface);
    color: var(--color-text);
  }
  .search-input:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: -1px;
    border-color: var(--color-accent);
  }
  .search-results {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    white-space: nowrap;
  }
  .category-tabs {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }
  .tab {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-surface);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s;
    color: var(--color-text-muted);
  }
  .tab:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
  .tab-active {
    background: var(--color-accent);
    color: #fff;
    border-color: var(--color-accent);
  }
  .tab-active:hover {
    color: #fff;
  }
  .tab-icon {
    font-size: 0.9rem;
  }
  .category-section {
    margin-bottom: 2rem;
  }
  .category-header {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
  }
  .category-header h2 {
    font-size: 1.15rem;
    color: var(--color-accent);
    margin-bottom: 0;
  }
  .category-icon {
    margin-right: 0.25rem;
  }
  .category-count {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
  .category-desc {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin: 0.25rem 0 1rem;
  }
  .item-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.75rem;
  }
  .item-card {
    padding: 1rem 1.25rem;
  }
  .item-card h3 {
    font-size: 0.95rem;
    margin: 0 0 0.4rem;
    color: var(--color-text);
  }
  .item-desc {
    font-size: 0.82rem;
    color: var(--color-text-muted);
    margin: 0 0 0.5rem;
    line-height: 1.5;
  }
  .item-examples {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.3rem;
  }
  .examples-label {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .example-tag {
    display: inline-block;
    padding: 0.12rem 0.45rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    font-size: 0.72rem;
    color: var(--color-text-muted);
  }
  .no-results {
    text-align: center;
    padding: 2rem 1.5rem;
  }
  .no-results p {
    margin: 0.25rem 0;
  }
  .no-results-hint {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    max-width: 480px;
    margin: 0.5rem auto 0;
  }
</style>
