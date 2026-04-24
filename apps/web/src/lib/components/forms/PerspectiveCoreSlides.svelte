<!--
  Gemeinsame Folienlogik für den epistemischen Kern der Perspektivenerfassung.

  Wird von zwei Routen identisch verwendet:
    - /cases/new                        (erste Perspektive beim Fallanlegen)
    - /cases/[id]/perspectives/new      (weitere Perspektive zu bestehendem Fall)

  Folien:
    1. Beobachtung
    2. Explorationsraum  (eigenständige Folie, kein Inline-Aufklappen)
    3. Deutung
    4. Gegen-Deutungen
    5. Unsicherheit
    6. Prüfen / Abschluss

  Zusatzmetadaten (Fallkontext, Teilnehmer, Actor-Auswahl) liegen außerhalb
  und werden von den Routen selbst vor oder neben diese Folien gesetzt.
-->
<script lang="ts">
  import { clusters, needs, determinants } from '$lib/catalog/catalog-data.js';
  import { filterCatalogItems } from '$lib/catalog/catalog-utils.js';
  import { filterItemsByClusterFocus, getClusterFocusItemIds } from '$lib/catalog/cluster-focus.js';
  import { evidenceLabels, uncertaintyLabels } from '$lib/ui/labels.js';
  import { toggleSelectionId } from '$lib/forms/exploration-selection-model.js';
  import type { EvidenceType, UncertaintyLevel } from '$domain/types.js';

  interface CounterRow {
    text: string;
    evidence: EvidenceType;
  }
  interface UncertaintyRow {
    level: UncertaintyLevel;
    rationale: string;
  }

  type CameraStateStr = 'null' | 'true' | 'false';

  interface Props {
    observationText: string;
    isCameraDescribableStr: CameraStateStr;
    interpretationText: string;
    interpretationEvidence: EvidenceType;
    counterRows: CounterRow[];
    uncertaintyRows: UncertaintyRow[];
    selectedNeedIds: string[];
    selectedDeterminantIds: string[];
    currentSlide?: number;
    submitLabel: string;
    cancelHref: string;
    errorMsg?: string;
    onSubmit: () => void;
    onChange?: () => void;
  }

  let {
    observationText = $bindable(),
    isCameraDescribableStr = $bindable(),
    interpretationText = $bindable(),
    interpretationEvidence = $bindable(),
    counterRows = $bindable(),
    uncertaintyRows = $bindable(),
    selectedNeedIds = $bindable(),
    selectedDeterminantIds = $bindable(),
    currentSlide = $bindable(1),
    submitLabel,
    cancelHref,
    errorMsg = '',
    onSubmit,
    onChange
  }: Props = $props();

  // ── Exploration-internal UI state ─────────────────────────────────────────
  let activeClusterId = $state<string>(clusters[0]?.id ?? '');
  let selectionSearch = $state('');

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

  const uncertaintyLevelOptions: UncertaintyLevel[] = [0, 1, 2, 3, 4, 5];
  const totalSlides = 6;

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

  function addCounterRow() {
    counterRows = [...counterRows, { text: '', evidence: 'observational' }];
  }
  function removeCounterRow(index: number) {
    if (counterRows.length > 1) {
      counterRows = counterRows.filter((_, i) => i !== index);
      notifyChange();
    }
  }
  function addUncertaintyRow() {
    uncertaintyRows = [...uncertaintyRows, { level: 2, rationale: '' }];
  }
  function removeUncertaintyRow(index: number) {
    if (uncertaintyRows.length > 1) {
      uncertaintyRows = uncertaintyRows.filter((_, i) => i !== index);
      notifyChange();
    }
  }

  function gotoSlide(n: number) {
    if (n < 1 || n > totalSlides) return;
    currentSlide = n;
  }
  function next() {
    gotoSlide(Math.min(currentSlide + 1, totalSlides));
  }
  function prev() {
    gotoSlide(Math.max(currentSlide - 1, 1));
  }

  const slideTitles = [
    '1. Beobachtung',
    '2. Explorationsraum',
    '3. Deutung',
    '4. Gegen-Deutungen',
    '5. Unsicherheit',
    '6. Prüfen'
  ];
</script>

<div class="slides-root">
  <nav class="slide-nav" aria-label="Formularfolien">
    {#each slideTitles as title, i}
      <button
        type="button"
        class="slide-nav-item"
        class:active={currentSlide === i + 1}
        aria-current={currentSlide === i + 1 ? 'step' : undefined}
        onclick={() => gotoSlide(i + 1)}
      >
        <span class="slide-nav-step">{i + 1}</span>
        <span class="slide-nav-label">{title.replace(/^\d+\.\s*/, '')}</span>
      </button>
    {/each}
  </nav>

  {#if errorMsg}
    <div class="error-box" role="alert">
      <p><strong>Fehler:</strong> {errorMsg}</p>
    </div>
  {/if}

  <form onsubmit={(e) => { e.preventDefault(); onSubmit(); }}>
    <!-- ═══════════════════════════════════════════════════════════════
         Folie 1: Beobachtung
         ═══════════════════════════════════════════════════════════════ -->
    {#if currentSlide === 1}
      <section class="card form-section slide">
        <h2>{slideTitles[0]}</h2>
        <p class="helper">
          Beschreiben Sie nur das, was eine Kamera hätte aufnehmen können — ohne
          Bewertung oder Interpretation.
        </p>

        <label class="field">
          <span class="field-label">Beobachtungstext</span>
          <textarea
            bind:value={observationText}
            oninput={notifyChange}
            rows="5"
            placeholder="z.B. Kind A nimmt Kind B den Stift aus der Hand. Kind B sagt ‚Nein‘ und wendet sich ab."
          ></textarea>
        </label>

        <label class="field">
          <span class="field-label">Ist diese Beschreibung rein beobachtbar (Kamera-Test)?</span>
          <select bind:value={isCameraDescribableStr} onchange={notifyChange}>
            <option value="null">Bitte wählen…</option>
            <option value="true">Ja, rein beobachtbar</option>
            <option value="false">Nein, enthält Wertungen/Deutungen</option>
          </select>
        </label>
      </section>
    {/if}

    <!-- ═══════════════════════════════════════════════════════════════
         Folie 2: Explorationsraum (eigene Folie, kein Inline-Aufklappen)
         ═══════════════════════════════════════════════════════════════ -->
    {#if currentSlide === 2}
      <section class="card form-section slide">
        <h2>{slideTitles[1]}</h2>
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
              <small
                aria-label={`Bedürfnisse ${selectedNeedCountForCluster(cluster.id)}, Determinanten ${selectedDeterminantCountForCluster(cluster.id)}`}
              >
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
    {/if}

    <!-- ═══════════════════════════════════════════════════════════════
         Folie 3: Deutung
         ═══════════════════════════════════════════════════════════════ -->
    {#if currentSlide === 3}
      <section class="card form-section slide">
        <h2>{slideTitles[2]}</h2>
        <p class="helper">
          Wie interpretieren Sie das Beobachtete? Markieren Sie die Evidenznähe
          Ihrer Deutung.
        </p>

        <label class="field">
          <span class="field-label">Deutungstext</span>
          <textarea
            bind:value={interpretationText}
            oninput={notifyChange}
            rows="4"
            placeholder="z.B. Kind A zeigt möglicherweise Frustration über die eigene Impulskontrolle…"
          ></textarea>
        </label>

        <label class="field">
          <span class="field-label">Evidenztyp</span>
          <select bind:value={interpretationEvidence} onchange={notifyChange}>
            {#each Object.entries(evidenceLabels) as [value, label]}
              <option {value}>{label}</option>
            {/each}
          </select>
        </label>
      </section>
    {/if}

    <!-- ═══════════════════════════════════════════════════════════════
         Folie 4: Gegen-Deutungen
         ═══════════════════════════════════════════════════════════════ -->
    {#if currentSlide === 4}
      <section class="card form-section slide">
        <h2>{slideTitles[3]}</h2>
        <p class="helper">
          Welche alternative Erklärung wäre denkbar? Die Gegen-Deutung zwingt zur
          Perspektiverweiterung und verhindert vorschnelle Festlegung.
        </p>

        {#each counterRows as row, i}
          <div class="counter-block">
            <span class="block-sub-heading">Gegen-Deutung {i + 1}</span>
            <label class="field">
              <textarea
                bind:value={row.text}
                oninput={notifyChange}
                rows="3"
                placeholder="z.B. Kind A imitiert möglicherweise ein Verhalten, das es bei anderen beobachtet hat…"
              ></textarea>
            </label>
            <div class="counter-block-footer">
              <label class="field field-counter-evidence">
                <select bind:value={row.evidence} onchange={notifyChange}>
                  {#each Object.entries(evidenceLabels) as [value, label]}
                    <option {value}>{label}</option>
                  {/each}
                </select>
              </label>
              {#if counterRows.length > 1}
                <button
                  type="button"
                  class="btn-remove"
                  onclick={() => removeCounterRow(i)}
                  aria-label={`Gegen-Deutung ${i + 1} entfernen`}
                >×</button>
              {/if}
            </div>
          </div>
        {/each}
        <button type="button" class="btn" onclick={addCounterRow}>+ Weitere Gegen-Deutung</button>
      </section>
    {/if}

    <!-- ═══════════════════════════════════════════════════════════════
         Folie 5: Unsicherheit
         ═══════════════════════════════════════════════════════════════ -->
    {#if currentSlide === 5}
      <section class="card form-section slide">
        <h2>{slideTitles[4]}</h2>
        <p class="helper">
          Wie sicher sind Sie sich in Ihrer Einschätzung? Unsicherheit explizit
          zu benennen ist ein Qualitätsmerkmal professioneller Reflexion.
        </p>

        {#each uncertaintyRows as row, i}
          <div class="uncertainty-block">
            <span class="block-sub-heading">Unsicherheit {i + 1}</span>
            <label class="field">
              <span class="field-label">Stufe</span>
              <select bind:value={row.level} onchange={notifyChange}>
                {#each uncertaintyLevelOptions as lvl}
                  <option value={lvl}>{uncertaintyLabels[lvl]}</option>
                {/each}
              </select>
            </label>
            <label class="field">
              <span class="field-label">Begründung</span>
              <textarea
                bind:value={row.rationale}
                oninput={notifyChange}
                rows="3"
                placeholder="z.B. Ich kenne die Vorgeschichte zwischen den Kindern nicht ausreichend…"
              ></textarea>
            </label>
            <div class="uncertainty-block-footer">
              {#if uncertaintyRows.length > 1}
                <button
                  type="button"
                  class="btn-remove"
                  onclick={() => removeUncertaintyRow(i)}
                  aria-label={`Unsicherheit ${i + 1} entfernen`}
                >×</button>
              {/if}
            </div>
          </div>
        {/each}
        <button type="button" class="btn" onclick={addUncertaintyRow}>+ Weitere Unsicherheit</button>
      </section>
    {/if}

    <!-- ═══════════════════════════════════════════════════════════════
         Folie 6: Prüfen / Abschluss
         ═══════════════════════════════════════════════════════════════ -->
    {#if currentSlide === 6}
      <section class="card form-section slide">
        <h2>{slideTitles[5]}</h2>
        <p class="helper">
          Prüfen Sie Ihre Eingaben. Leere Einträge werden beim Speichern entfernt;
          für den Abschluss sind Beobachtung, Deutung, mindestens eine Gegen-Deutung
          und mindestens eine Unsicherheit erforderlich.
        </p>

        <dl class="summary-list">
          <dt>Beobachtung</dt>
          <dd>{observationText.trim() || '— (noch leer)'}</dd>

          <dt>Kamera-Test</dt>
          <dd>
            {#if isCameraDescribableStr === 'true'}Ja, rein beobachtbar
            {:else if isCameraDescribableStr === 'false'}Nein, enthält Wertungen
            {:else}— (noch nicht gewählt){/if}
          </dd>

          <dt>Deutung</dt>
          <dd>{interpretationText.trim() || '— (noch leer)'}</dd>

          <dt>Gegen-Deutungen</dt>
          <dd>{counterRows.filter((r) => r.text.trim() !== '').length} gefüllt</dd>

          <dt>Unsicherheiten</dt>
          <dd>{uncertaintyRows.filter((r) => r.rationale.trim() !== '').length} gefüllt</dd>

          <dt>Exploration</dt>
          <dd>
            {selectedNeedIds.length} Bedürfnis(se), {selectedDeterminantIds.length} Determinante(n)
          </dd>
        </dl>
      </section>
    {/if}

    <!-- ═══════════════════════════════════════════════════════════════
         Navigation + Abschluss
         ═══════════════════════════════════════════════════════════════ -->
    <div class="form-actions">
      <button
        type="button"
        class="btn"
        onclick={prev}
        disabled={currentSlide === 1}
      >← Zurück</button>

      {#if currentSlide < totalSlides}
        <button type="button" class="btn btn-primary" onclick={next}>
          Weiter →
        </button>
      {:else}
        <button type="submit" class="btn btn-primary">{submitLabel}</button>
      {/if}

      <a href={cancelHref} class="btn">Abbrechen</a>
    </div>
  </form>
</div>

<style>
  .slides-root { display: block; }
  .slide-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-bottom: 1rem;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-bg);
  }
  .slide-nav-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-text-muted);
    padding: 0.35rem 0.6rem;
    font-size: 0.8rem;
    border-radius: var(--radius);
    cursor: pointer;
  }
  .slide-nav-item:hover { color: var(--color-text); }
  .slide-nav-item.active {
    color: var(--color-accent);
    border-color: var(--color-accent);
    background: rgba(45, 90, 155, 0.06);
  }
  .slide-nav-step {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.35rem;
    height: 1.35rem;
    border-radius: 50%;
    background: var(--color-border);
    color: var(--color-text);
    font-size: 0.72rem;
    font-weight: 600;
  }
  .slide-nav-item.active .slide-nav-step {
    background: var(--color-accent);
    color: white;
  }
  .error-box {
    background: var(--color-error-bg);
    border: 1px solid var(--color-error-border);
    border-radius: var(--radius);
    padding: 0.75rem 1rem;
    margin-bottom: 1.25rem;
    color: var(--color-danger);
  }
  .error-box p { margin: 0.2rem 0; }
  .form-section { margin-bottom: 1.25rem; }
  .form-section h2 {
    font-size: 1.05rem;
    margin-bottom: 0.25rem;
    color: var(--color-accent);
  }
  .helper {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-top: 0;
    margin-bottom: 1rem;
  }
  .field { display: block; margin-bottom: 0.75rem; }
  .field-label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 0.3rem;
  }
  textarea, input[type="text"], select {
    width: 100%;
    padding: 0.5rem 0.65rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-family: inherit;
    font-size: 0.9rem;
    background: var(--color-bg);
    color: var(--color-text);
  }
  textarea:focus, input:focus, select:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: -1px;
    border-color: var(--color-accent);
  }
  .counter-block, .uncertainty-block {
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border);
  }
  .counter-block:last-of-type, .uncertainty-block:last-of-type {
    border-bottom: none;
  }
  .counter-block-footer, .uncertainty-block-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: space-between;
  }
  .field-counter-evidence { flex: 1; margin-bottom: 0; }
  .block-sub-heading {
    display: block;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--color-text-muted);
    margin-bottom: 0.3rem;
  }
  .btn-remove {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
    padding: 0.45rem 0.6rem;
    color: var(--color-text-muted);
  }
  .btn-remove:hover { color: var(--color-danger); border-color: var(--color-danger); }
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
  .cluster-focus-card h3 {
    margin: 0 0 0.3rem 0;
    color: var(--color-text);
    font-size: 0.9rem;
  }
  .cluster-focus-card p {
    margin: 0;
    font-size: 0.82rem;
    color: var(--color-text-muted);
  }
  .selection-search { margin-bottom: 0.85rem; }
  .selection-search small {
    display: block;
    margin-top: 0.3rem;
  }
  .selection-group { margin-bottom: 1rem; }
  .selection-group h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    color: var(--color-text);
  }
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
  .summary-list {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.35rem 0.85rem;
    margin: 0;
  }
  .summary-list dt {
    font-weight: 600;
    font-size: 0.82rem;
    color: var(--color-text-muted);
  }
  .summary-list dd {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-text);
    white-space: pre-wrap;
  }
  .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  @media (max-width: 640px) {
    .slide-nav-label { display: none; }
  }
</style>
