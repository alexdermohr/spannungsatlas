<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { getCase } from '$lib/services/case-service.js';
  import type { Case, EvidenceType } from '$domain/types.js';

  let caseData: Case | null = $state(null);
  let loaded = $state(false);

  const evidenceLabels: Record<EvidenceType, string> = {
    observational: 'Beobachtungsnah',
    derived: 'Abgeleitet',
    speculative: 'Spekulativ'
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
    {#if caseData.revisions.length > 0}
      <section class="card section">
        <h2>Revisionen</h2>
        {#each caseData.revisions as rev}
          <div class="revision">
            <div class="revision-header">
              <strong>{formatDate(rev.at)}</strong>
              <span class="badge badge-derived">{rev.driftType}</span>
            </div>
            <p>{rev.reason}</p>
          </div>
        {/each}
      </section>
    {/if}

    <div class="actions">
      <a href="/" class="btn">← Zurück zur Übersicht</a>
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
  .revision {
    border-left: 3px solid var(--color-accent);
    padding-left: 0.75rem;
    margin-bottom: 0.75rem;
  }
  .revision-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.2rem;
    font-size: 0.9rem;
  }
  .actions {
    margin: 1.5rem 0 2rem;
  }
</style>
