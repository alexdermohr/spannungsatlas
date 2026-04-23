<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { getCase, getVisiblePerspectivesForCase } from '$lib/services/case-service.js';
  import { roleLabels, evidenceLabels, uncertaintyLabels } from '$lib/ui/labels.js';
  import type { Case, PerspectiveRecord, EvidenceType } from '$domain/types.js';

  let caseId = $state('');
  let caseData: Case | null = $state(null);
  let loaded = $state(false);

  // Simulated actor for access control. Demo only.
  let currentActorId = $state('User-1');

  // Visible perspectives for the current actor (strict blind mode)
  let visiblePerspectives: PerspectiveRecord[] = $state([]);

  function evidenceBadgeClass(t: EvidenceType): string {
    return `badge badge-${t}`;
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return iso;
    }
  }

  function loadPerspectives() {
    if (!caseId) return;
    visiblePerspectives = getVisiblePerspectivesForCase(caseId, currentActorId);
  }

  onMount(() => {
    caseId = page.params.id ?? '';
    caseData = getCase(caseId);

    // Auto-select first participant for demo, or from URL param
    currentActorId = page.url.searchParams.get('actor') || 
                      (caseData && caseData.participants.length > 0 ? caseData.participants[0].id : 'User-1');

    loadPerspectives();
    loaded = true;
  });

  function handleActorChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    currentActorId = target.value;
    loadPerspectives();
  }
</script>

<div class="page">
  {#if !loaded}
    <p>Lade…</p>
  {:else if !caseData}
    <div class="card empty-state">
      <h1>Kein Fall gefunden</h1>
      <p>Der angeforderte Fall existiert nicht oder wurde gelöscht.</p>
      <a href="/" class="btn btn-primary">Zurück zur Übersicht</a>
    </div>
  {:else}
    <div class="case-header-row">
      <h1>Perspektiven zu Fall <code>{caseData.id.slice(0, 8)}</code></h1>
    </div>

    <!-- Demo-Zugriffssimulation -->
    <section class="card section">
      <h2>Zugriff</h2>
      <div class="demo-notice" style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 1rem; border-left: 2px solid var(--color-accent); padding-left: 0.5rem;">
        <em>Demo-Zugriffssimulation (später via Benutzerkonto):</em>
        <label style="display: block; margin-top: 0.5rem; font-weight: bold;">
          Wer sind Sie jetzt?
          <select bind:value={currentActorId} onchange={handleActorChange} style="display: block; width: 100%; margin-top: 0.25rem;">
            {#each caseData.participants as p}
              <option value={p.id}>{p.id} ({p.role ? roleLabels[p.role] ?? p.role : 'unbekannt'})</option>
            {/each}
          </select>
        </label>
      </div>
      <p style="color: var(--color-text-muted); font-size: 0.9rem;">
        <strong>Streng blind (Phase 1):</strong> Sie sehen nur Ihre eigenen Perspektiven. Perspektiven anderer Akteure sind nicht sichtbar.
      </p>
    </section>

    <!-- Perspektiven-Listing -->
    {#if visiblePerspectives.length === 0}
      <div class="card empty-state">
        <p>Sie haben noch keine Perspektive zu diesem Fall eingereicht.</p>
        <a href="/cases/{caseId}/perspectives/new?actor={currentActorId}" class="btn btn-primary">Perspektive erstellen</a>
      </div>
    {:else}
      <section class="card section">
        <h2>Ihre Perspektiven</h2>
        {#each visiblePerspectives as perspective, idx}
          <div class="perspective-card" class:perspective-committed={perspective.status === 'committed'} class:perspective-draft={perspective.status === 'draft'}>
            <div class="perspective-header">
              <div>
                <strong>Perspektive #{idx + 1}</strong>
                <span class={`badge badge-${perspective.status}`}>
                  {perspective.status === 'committed' ? 'Committed' : 'Draft'}
                </span>
              </div>
              <div class="perspective-dates">
                <small>erstellt: {formatDate(perspective.createdAt)}</small>
                {#if perspective.committedAt}
                  <small>committed: {formatDate(perspective.committedAt)}</small>
                {/if}
              </div>
            </div>

            <!-- Beobachtung -->
            {#if perspective.content.observation}
              <div class="perspective-section">
                <h3>Beobachtung</h3>
                <p>{perspective.content.observation.text || '(leer)'}</p>
                {#if perspective.content.observation.isCameraDescribable === true}
                  <span class="badge badge-observational">📷 Kamerabeschreibbar</span>
                {:else if perspective.content.observation.isCameraDescribable === false}
                  <span class="badge" style="background: var(--color-error-bg); color: var(--color-error);">⚠️ Nicht kamerabeschreibbar</span>
                {/if}
              </div>
            {/if}

            <!-- Deutung -->
            {#if perspective.content.interpretation}
              <div class="perspective-section">
                <h3>Deutung</h3>
                <p>{perspective.content.interpretation.text || '(leer)'}</p>
                <span class={evidenceBadgeClass(perspective.content.interpretation.evidenceType)}>
                  {evidenceLabels[perspective.content.interpretation.evidenceType]}
                </span>
                {#if perspective.content.interpretation.rationale}
                  <p class="rationale"><em>Begründung:</em> {perspective.content.interpretation.rationale}</p>
                {/if}
              </div>
            {/if}

            <!-- Gegen-Deutungen -->
            {#if perspective.content.counterInterpretations && perspective.content.counterInterpretations.length > 0}
              <div class="perspective-section">
                <h3>Gegen-Deutungen</h3>
                {#each perspective.content.counterInterpretations as counter, i}
                  <div class="counter-item">
                    <strong class="sub-heading">Gegen-Deutung {i + 1}</strong>
                    <p>{counter.text || '(leer)'}</p>
                    <span class={evidenceBadgeClass(counter.evidenceType)}>
                      {evidenceLabels[counter.evidenceType]}
                    </span>
                    {#if counter.rationale}
                      <p class="rationale"><em>Begründung:</em> {counter.rationale}</p>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}

            <!-- Unsicherheiten -->
            {#if perspective.content.uncertainties && perspective.content.uncertainties.length > 0}
              <div class="perspective-section">
                <h3>Unsicherheiten</h3>
                {#each perspective.content.uncertainties as u, i}
                  <div class="uncertainty-item">
                    <strong class="sub-heading">Unsicherheit {i + 1}</strong>
                    <div class="uncertainty-level">
                      <strong>{uncertaintyLabels[u.level] || `Stufe ${u.level}`}</strong>
                    </div>
                    <div class="uncertainty-bar">
                      <div
                        class="uncertainty-fill"
                        style="width: {(u.level / 5) * 100}%"
                      ></div>
                    </div>
                    <p class="rationale">{u.rationale || '(keine Begründung)'}</p>
                  </div>
                {/each}
              </div>
            {/if}

            <!-- Draft-Aktion -->
            {#if perspective.status === 'draft'}
              <div class="perspective-actions">
                <a href="/cases/{caseId}/perspectives/new?actor={currentActorId}" class="btn btn-primary">Entwurf bearbeiten</a>
              </div>
            {/if}
          </div>
        {/each}
      </section>
    {/if}

    <div class="actions">
      <a href="/cases/{caseId}" class="btn">← Zurück zum Fall</a>
    </div>
  {/if}
</div>

<style>
  .case-header-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .case-header-row h1 {
    margin: 0;
    flex: 1;
  }

  .perspective-card {
    border: 2px solid var(--color-border);
    border-radius: var(--radius);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    background: var(--color-bg-secondary);
  }

  .perspective-card.perspective-committed {
    border-left: 4px solid var(--color-success);
  }

  .perspective-card.perspective-draft {
    border-left: 4px solid var(--color-warning);
    opacity: 0.9;
  }

  .perspective-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
  }

  .perspective-header strong {
    display: block;
    margin-bottom: 0.25rem;
  }

  .perspective-dates {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }

  .perspective-section {
    margin: 1rem 0;
  }

  .perspective-section h3 {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0.75rem 0 0.5rem 0;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .perspective-section p {
    margin: 0.5rem 0;
    line-height: 1.5;
  }

  .counter-item {
    margin: 0.75rem 0;
    padding: 0.75rem;
    background: var(--color-bg-primary);
    border-radius: calc(var(--radius) / 2);
  }

  .counter-item .sub-heading {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .counter-item p {
    margin: 0.5rem 0;
  }

  .uncertainty-item {
    margin: 1rem 0;
    padding: 1rem;
    background: var(--color-bg-primary);
    border-radius: calc(var(--radius) / 2);
  }

  .uncertainty-item .sub-heading {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .uncertainty-level {
    margin: 0.5rem 0;
    font-weight: 600;
  }

  .uncertainty-bar {
    height: 8px;
    background: var(--color-border);
    border-radius: 4px;
    overflow: hidden;
    margin: 0.5rem 0;
  }

  .uncertainty-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-success), var(--color-warning), var(--color-error));
    transition: width 0.2s ease;
  }

  .rationale {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    margin: 0.5rem 0 0 0 !important;
    font-style: italic;
  }

  .perspective-actions {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
    display: flex;
    gap: 0.5rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 2rem;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
  }

  .empty-state p {
    margin: 0.5rem 0;
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 99px;
    font-size: 0.8rem;
    font-weight: 600;
    margin: 0.25rem 0.25rem 0 0;
  }

  .badge-committed {
    background: var(--color-success);
    color: white;
  }

  .badge-draft {
    background: var(--color-warning);
    color: white;
  }

  .demo-notice {
    background: var(--color-info-bg, rgba(59, 130, 246, 0.1));
    padding: 0.75rem 1rem;
    border-radius: calc(var(--radius) / 2);
  }
</style>
