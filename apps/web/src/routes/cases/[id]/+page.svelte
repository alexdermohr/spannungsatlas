<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { getCase, getCommittedPerspectiveCount } from '$lib/services/case-service.js';
  import { roleLabels, evidenceLabels } from '$lib/ui/labels.js';
  import { renderCaseAsMarkdown } from '$lib/services/case-report.js';
  import type { Case, EvidenceType } from '$domain/types.js';

  let caseData: Case | null = $state(null);
  let loaded = $state(false);
  let copyFeedback = $state('');
  let committedCount: number = $state(0);
  let demoActorId: string = $state('');
  let isComparable: boolean = $state(false);
  let actorHasCommitted: boolean = $state(false);
  let actorHasDraft: boolean = $state(false);

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



  async function copyReport(): Promise<void> {
    if (!caseData) return;

    try {
      const markdown = renderCaseAsMarkdown(caseData);
      await navigator.clipboard.writeText(markdown);
      copyFeedback = 'Kopiert';
    } catch {
      copyFeedback = 'Kopieren fehlgeschlagen';
    }

    setTimeout(() => {
      copyFeedback = '';
    }, 1500);
  }

  function updateActorState() {
    if (!caseData || !demoActorId) return;

    // All states derived directly from the loaded case object to ensure synchronous rendering
    // and avoid unnecessary localStorage reads.
    const perspectives = caseData.perspectives || [];

    actorHasCommitted = perspectives.some(p => p.actorId === demoActorId && p.status === 'committed');
    actorHasDraft = perspectives.some(p => p.actorId === demoActorId && p.status === 'draft');
    // Compare is available if the service layer allows it for the current phase
    isComparable = getComparablePerspectivesForCase(caseData.id, demoActorId).length > 0;
  }

  onMount(() => {
    const id = page.params.id ?? '';
    caseData = getCase(id);
    committedCount = getCommittedPerspectiveCount(id);
    if (caseData?.participants.length) {
      demoActorId = caseData.participants[0].id;
      updateActorState();
    }
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
      {#if caseData.currentReflection?.reflectedAt}
        <span class="case-date">{formatDate(caseData.currentReflection.reflectedAt)}</span>
      {/if}
    </div>

    <!-- Kontext -->
    <section class="card section">
      <h2>Kontext</h2>
      <p>{caseData.context}</p>
      <div class="participants">
        <strong>Beteiligte:</strong>
        {#each caseData.participants as p}
          <span class="participant">{p.id}{#if p.role} ({roleLabels[p.role] ?? p.role}){/if}</span>
        {/each}
      </div>
    </section>



    <!-- Perspektiven Status -->
    <section class="card section">
      <h2>Perspektiven (Isolation Phase)</h2>
      <div class="demo-notice" style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 1rem; border-left: 2px solid var(--color-accent); padding-left: 0.5rem;">
        <em>Demo-Zugriffssimulation (später via Benutzerkonto):</em>
        <label style="display: block; margin-top: 0.5rem; font-weight: bold;">
          Wer sind Sie jetzt?
          <select bind:value={demoActorId} onchange={updateActorState} style="display: block; width: 100%; margin-top: 0.25rem;">
            {#each caseData.participants as p}
              <option value={p.id}>{p.id} ({p.role ? roleLabels[p.role] ?? p.role : 'unbekannt'})</option>
            {/each}
          </select>
        </label>
      </div>

      <p>Committed: <strong>{committedCount}</strong> / {caseData.participants.length}</p>
      <div class="actions" style="margin-top: 1rem; margin-bottom: 0;">
        {#if actorHasCommitted}
          {#if isComparable}
            <span style="font-size: 0.9rem; color: var(--color-success); display: inline-block; padding: 0.5rem 1rem 0.5rem 0;">Ihre Perspektive wurde bereits committed.</span>
            <a href="/cases/{caseData.id}/compare?actor={demoActorId}" class="btn btn-primary">Zum Vergleich</a>
          {:else}
            <span style="font-size: 0.9rem; color: var(--color-success); display: inline-block; padding: 0.5rem 0;">
              Ihre Perspektive wurde committed. (Der Vergleichsmodus ist in Phase 1 / Streng blind deaktiviert).
            </span>
          {/if}
        {:else}
          {#if actorHasDraft}
            <a href="/cases/{caseData.id}/perspectives/new?actor={demoActorId}" class="btn btn-primary">Entwurf fortsetzen</a>
          {:else}
            <a href="/cases/{caseData.id}/perspectives/new?actor={demoActorId}" class="btn btn-primary">Perspektive erstellen</a>
            <span style="font-size: 0.85rem; color: var(--color-text-muted); display: inline-block; margin-left: 1rem;">
              Erst nach einem Commit kann Ihre Perspektive in den Vergleich eingehen.
            </span>
          {/if}
        {/if}
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
    {#if caseData.currentReflection?.interpretation}
      <section class="card section">
        <h2>Deutung</h2>
        <p>{caseData.currentReflection.interpretation.text}</p>
        <span class={evidenceBadgeClass(caseData.currentReflection.interpretation.evidenceType)}>
          {evidenceLabels[caseData.currentReflection.interpretation.evidenceType]}
        </span>
      </section>
    {/if}

    <!-- Gegen-Deutungen -->
    {#if caseData.currentReflection?.counterInterpretations?.length}
      <section class="card section">
        <h2>Gegen-Deutungen</h2>
        {#each caseData.currentReflection.counterInterpretations as counter, i}
          <div class="counter-item">
            <strong class="sub-heading">Gegen-Deutung {i + 1}</strong>
            <p>{counter.text}</p>
            <span class={evidenceBadgeClass(counter.evidenceType)}>
              {evidenceLabels[counter.evidenceType]}
            </span>
          </div>
        {/each}
      </section>
    {/if}

    <!-- Unsicherheiten -->
    {#if caseData.currentReflection?.uncertainties?.length}
      <section class="card section">
        <h2>Unsicherheiten</h2>
        {#each caseData.currentReflection.uncertainties as u, i}
          <div class="uncertainty-item">
            <strong class="sub-heading">Unsicherheit {i + 1}</strong>
            <div class="uncertainty-level">
              <strong>Stufe {u.level}</strong> / 5
            </div>
            <div class="uncertainty-bar">
              <div
                class="uncertainty-fill"
                style="width: {(u.level / 5) * 100}%"
              ></div>
            </div>
            <p class="rationale">{u.rationale}</p>
          </div>
        {/each}
      </section>
    {/if}

    <!-- Spannungen -->
    {#if caseData.currentReflection?.tensions?.length}
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
      <button type="button" class="btn" onclick={copyReport}>Bericht kopieren</button>
      {#if copyFeedback}
        <span class="copy-feedback" role="status" aria-live="polite" aria-atomic="true">{copyFeedback}</span>
      {/if}
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
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .copy-feedback {
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }
  .counter-item {
    margin-bottom: 0.75rem;
  }
  .counter-item:last-child {
    margin-bottom: 0;
  }
  .uncertainty-item {
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-border);
  }
  .uncertainty-item:last-child {
    margin-bottom: 0;
    border-bottom: none;
    padding-bottom: 0;
  }
  .sub-heading {
    display: block;
    font-size: 0.82rem;
    color: var(--color-text-muted);
    margin-bottom: 0.15rem;
  }
</style>
