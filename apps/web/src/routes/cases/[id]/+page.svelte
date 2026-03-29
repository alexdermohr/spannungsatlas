<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { getCase, deleteCase } from '$lib/services/case-service.js';
  import type { Case, DriftType, EvidenceType } from '$domain/types.js';

  let caseData: Case | null = $state(null);
  let loaded = $state(false);
  let showDeleteConfirm = $state(false);

  const evidenceLabels: Record<EvidenceType, string> = {
    observational: 'Beobachtungsnah',
    derived: 'Abgeleitet',
    speculative: 'Spekulativ'
  };

  const driftLabels: Record<DriftType, string> = {
    new_observation: 'Neue Beobachtung',
    new_perspective: 'Neue Perspektive',
    reinterpretation: 'Uminterpretation'
  };

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

  function confirmDelete() {
    if (!caseData) return;
    deleteCase(caseData.id);
    goto('/');
  }

  onMount(() => {
    const id = page.params.id ?? '';
    caseData = getCase(id);
    loaded = true;
  });
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
      <h1>Fall <code>{caseData.id.slice(0, 8)}</code></h1>
      <span class="case-date">{formatDate(caseData.currentReflection.reflectedAt)}</span>
    </div>

    <!-- Kontext -->
    <section class="card section">
      <h2>Kontext</h2>
      <p>{caseData.context}</p>
      <div class="participants">
        <strong>Beteiligte:</strong>
        {#each caseData.participants as p}
          <span class="participant">{p.id}{#if p.role} ({p.role}){/if}</span>
        {/each}
      </div>
    </section>

    <!-- Beobachtung -->
    <section class="card section">
      <h2>Beobachtung</h2>
      <p>{caseData.observation.text}</p>
      {#if caseData.observation.isCameraDescribable}
        <span class="badge badge-observational">📷 Kamerabeschreibbar</span>
      {/if}
    </section>

    <!-- Deutung -->
    <section class="card section">
      <h2>Deutung</h2>
      <p>{caseData.currentReflection.interpretation.text}</p>
      <span class={evidenceBadgeClass(caseData.currentReflection.interpretation.evidenceType)}>
        {evidenceLabels[caseData.currentReflection.interpretation.evidenceType]}
      </span>
    </section>

    <!-- Gegen-Deutung -->
    <section class="card section">
      <h2>Gegen-Deutung</h2>
      <p>{caseData.currentReflection.counterInterpretation.text}</p>
      <span class={evidenceBadgeClass(caseData.currentReflection.counterInterpretation.evidenceType)}>
        {evidenceLabels[caseData.currentReflection.counterInterpretation.evidenceType]}
      </span>
    </section>

    <!-- Unsicherheit -->
    <section class="card section">
      <h2>Unsicherheit</h2>
      <div class="uncertainty-level">
        <strong>Stufe {caseData.currentReflection.uncertainty.level}</strong> / 5
      </div>
      <div class="uncertainty-bar">
        <div
          class="uncertainty-fill"
          style="width: {(caseData.currentReflection.uncertainty.level / 5) * 100}%"
        ></div>
      </div>
      <p class="rationale">{caseData.currentReflection.uncertainty.rationale}</p>
    </section>

    <!-- Spannungen -->
    {#if caseData.currentReflection.tensions.length > 0}
      <section class="card section">
        <h2>Spannungen</h2>
        {#each caseData.currentReflection.tensions as tension}
          <div class="tension-edge">
            <span class="tension-source">{tension.source}</span>
            <span class="tension-arrow">{tension.direction === 'bidirectional' ? '↔' : '→'}</span>
            <span class="tension-target">{tension.target}</span>
            <span class="tension-label">({tension.label})</span>
          </div>
          <p class="tension-context">{tension.context}</p>
        {/each}
      </section>
    {/if}

    <!-- Revisionen -->
    <section class="card section">
      <div class="section-header">
        <h2>Revisionshistorie</h2>
        <span class="revision-count">{caseData.revisions.length} {caseData.revisions.length === 1 ? 'Revision' : 'Revisionen'}</span>
      </div>

      {#if caseData.revisions.length === 0}
        <p class="no-revisions">
          Noch keine Revisionen dokumentiert. Eine Revision dokumentiert die Veränderung
          Ihres Denkstands — nicht als stille Korrektur, sondern als nachvollziehbare Entwicklung.
        </p>
      {:else}
        {#each caseData.revisions as rev, i}
          <div class="revision">
            <div class="revision-header">
              <strong>Revision {i + 1} — {formatDate(rev.at)}</strong>
              <span class="badge badge-drift">{driftLabels[rev.driftType]}</span>
            </div>
            <p class="revision-reason">{rev.reason}</p>

            <details class="revision-details">
              <summary>Denkstand-Vergleich anzeigen</summary>
              <div class="revision-compare">
                <div class="compare-col compare-from">
                  <h4>Vorher</h4>
                  <div class="compare-item">
                    <strong>Deutung</strong>
                    <p>{rev.from.interpretation.text}</p>
                    <span class={evidenceBadgeClass(rev.from.interpretation.evidenceType)}>
                      {evidenceLabels[rev.from.interpretation.evidenceType]}
                    </span>
                  </div>
                  <div class="compare-item">
                    <strong>Gegen-Deutung</strong>
                    <p>{rev.from.counterInterpretation.text}</p>
                  </div>
                  <div class="compare-item">
                    <strong>Unsicherheit</strong>
                    <p>Stufe {rev.from.uncertainty.level}/5 — {rev.from.uncertainty.rationale}</p>
                  </div>
                </div>
                <div class="compare-col compare-to">
                  <h4>Nachher</h4>
                  <div class="compare-item">
                    <strong>Deutung</strong>
                    <p>{rev.to.interpretation.text}</p>
                    <span class={evidenceBadgeClass(rev.to.interpretation.evidenceType)}>
                      {evidenceLabels[rev.to.interpretation.evidenceType]}
                    </span>
                  </div>
                  <div class="compare-item">
                    <strong>Gegen-Deutung</strong>
                    <p>{rev.to.counterInterpretation.text}</p>
                  </div>
                  <div class="compare-item">
                    <strong>Unsicherheit</strong>
                    <p>Stufe {rev.to.uncertainty.level}/5 — {rev.to.uncertainty.rationale}</p>
                  </div>
                </div>
              </div>
            </details>
          </div>
        {/each}
      {/if}
    </section>

    <!-- Actions -->
    <div class="actions">
      <a href="/cases/{caseData.id}/revise" class="btn btn-primary">Revision erstellen</a>
      <a href="/" class="btn">← Zurück zur Übersicht</a>
      {#if !showDeleteConfirm}
        <button class="btn btn-danger" onclick={() => { showDeleteConfirm = true; }}>
          Fall löschen
        </button>
      {:else}
        <div class="delete-confirm">
          <span>Wirklich löschen?</span>
          <button class="btn btn-danger" onclick={confirmDelete}>Ja, endgültig löschen</button>
          <button class="btn" onclick={() => { showDeleteConfirm = false; }}>Abbrechen</button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .case-header-row {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .case-header-row h1 {
    margin-bottom: 0;
  }
  .case-header-row code {
    font-family: var(--font-mono);
    font-size: 0.85em;
    color: var(--color-accent);
  }
  .case-date {
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }
  .section {
    margin-bottom: 1rem;
  }
  .section h2 {
    font-size: 1rem;
    color: var(--color-accent);
    margin-bottom: 0.4rem;
  }
  .section p {
    margin: 0.3rem 0 0.5rem;
  }
  .section-header {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }
  .section-header h2 {
    margin-bottom: 0;
  }
  .revision-count {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
  .empty-state {
    text-align: center;
    padding: 2.5rem 1.5rem;
  }
  .participants {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-top: 0.5rem;
  }
  .participant {
    margin-left: 0.3rem;
  }
  .uncertainty-level {
    font-size: 0.95rem;
    margin-bottom: 0.4rem;
  }
  .uncertainty-bar {
    height: 8px;
    background: var(--color-border);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  .uncertainty-fill {
    height: 100%;
    background: var(--color-accent);
    border-radius: 4px;
    transition: width 0.3s;
  }
  .rationale {
    font-style: italic;
    color: var(--color-text-muted);
  }
  .tension-edge {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 500;
    margin-top: 0.5rem;
  }
  .tension-arrow {
    font-size: 1.2rem;
    color: var(--color-accent);
  }
  .tension-label {
    color: var(--color-text-muted);
    font-weight: 400;
    font-size: 0.85rem;
  }
  .tension-context {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-top: 0.1rem;
    margin-bottom: 0.75rem;
  }
  .no-revisions {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    font-style: italic;
  }
  .revision {
    border-left: 3px solid var(--color-accent);
    padding-left: 0.75rem;
    margin-bottom: 1rem;
  }
  .revision-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.2rem;
    font-size: 0.9rem;
    flex-wrap: wrap;
  }
  .badge-drift {
    background: var(--color-accent-light);
    color: var(--color-accent);
  }
  .revision-reason {
    font-size: 0.85rem;
    color: var(--color-text);
  }
  .revision-details {
    margin-top: 0.5rem;
    font-size: 0.85rem;
  }
  .revision-details summary {
    cursor: pointer;
    color: var(--color-accent);
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
  }
  .revision-compare {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }
  @media (max-width: 600px) {
    .revision-compare { grid-template-columns: 1fr; }
  }
  .compare-col {
    padding: 0.75rem;
    border-radius: var(--radius);
    font-size: 0.8rem;
  }
  .compare-from {
    background: #fef2f2;
    border: 1px solid #fecaca;
  }
  .compare-to {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
  }
  .compare-col h4 {
    margin: 0 0 0.5rem;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }
  .compare-item {
    margin-bottom: 0.5rem;
  }
  .compare-item strong {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
  .compare-item p {
    margin: 0.15rem 0 0.25rem;
    font-size: 0.8rem;
  }
  .actions {
    margin: 1.5rem 0 2rem;
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
  }
  .btn-danger {
    background: var(--color-danger);
    color: #fff;
    border-color: var(--color-danger);
  }
  .btn-danger:hover {
    background: #9b2c2c;
  }
  .delete-confirm {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--color-danger);
  }
</style>
