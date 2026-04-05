<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { getCase, getComparablePerspectivesForCase } from '$lib/services/case-service.js';
  import { roleLabels, evidenceLabels, uncertaintyLabels } from '$lib/ui/labels.js';
  import type { Case, PerspectiveRecord } from '$domain/types.js';

  let caseId = $state('');
  let caseData: Case | null = $state(null);
  let perspectives: PerspectiveRecord[] = $state([]);

  let loaded = $state(false);

  onMount(() => {
    caseId = page.params.id ?? '';
    caseData = getCase(caseId);
    const actor = page.url.searchParams.get('actor') || '';
    perspectives = getComparablePerspectivesForCase(caseId, actor) as PerspectiveRecord[];

    loaded = true;
  });

  function getActorRole(actorId: string): string {
    if (!caseData) return 'Unbekannt';
    const p = caseData.participants.find(p => p.id === actorId);
    if (p && p.role) return roleLabels[p.role] || p.role;
    return 'Externe Beobachtung';
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
      <h1>Vergleichsmodus</h1>
      <span class="case-date">Fall: <code>{caseData.id.slice(0, 8)}</code></span>
    </div>

    {#if perspectives.length < 2}
      <div class="card empty-state">
        <h2>Nicht genügend Daten</h2>
        <p>Der Vergleichsmodus wird erst freigeschaltet, wenn Sie Ihre eigene Perspektive committed haben UND insgesamt mindestens 2 committed Perspektiven existieren.</p>
        <!-- Don't show misleading perspectives.length count -->
        <a href="/cases/{caseId}" class="btn">Zurück zum Fall</a>
      </div>
    {:else}
      <p class="helper">Hier werden die isoliert erstellten Perspektiven zusammengeführt und verglichen.</p>

      <div class="comparison-grid" style="--cols: {perspectives.length}">
        {#each perspectives as p}
          <div class="perspective-column">
            <div class="actor-header">
              <h3>{p.actorId}</h3>
              <span class="actor-role">{getActorRole(p.actorId)}</span>
            </div>

            <div class="section-block">
              <h4>Beobachtung</h4>
              <p>{p.content.observation.text}</p>
              {#if p.content.observation.isCameraDescribable}
                <span class="badge badge-observational">📷 Kamerabeschreibbar</span>
              {/if}
            </div>

            <div class="section-block">
              <h4>Deutung</h4>
              <p>{p.content.interpretation.text}</p>
              <span class="badge badge-{p.content.interpretation.evidenceType}">
                {evidenceLabels[p.content.interpretation.evidenceType]}
              </span>
            </div>

            <div class="section-block">
              <h4>Gegen-Deutungen ({p.content.counterInterpretations.length})</h4>
              <ul class="counter-list">
                {#each p.content.counterInterpretations as c}
                  <li>
                    {c.text}
                    <div class="badge-row">
                      <span class="badge badge-{c.evidenceType}">{evidenceLabels[c.evidenceType]}</span>
                    </div>
                  </li>
                {/each}
              </ul>
            </div>

            <div class="section-block">
              <h4>Unsicherheiten ({p.content.uncertainties.length})</h4>
              <ul class="uncertainty-list">
                {#each p.content.uncertainties as u}
                  <li>
                    <strong>Stufe {u.level}</strong>: {u.rationale}
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        {/each}
      </div>

      <div class="actions">
        <a href="/cases/{caseId}" class="btn">← Zurück zum Fall</a>
      </div>
    {/if}
  {/if}
</div>

<style>
  .case-header-row { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
  .case-header-row h1 { margin-bottom: 0; }
  .case-date { font-family: var(--font-mono); font-size: 0.9em; color: var(--color-text-muted); }
  .empty-state { text-align: center; padding: 2.5rem 1.5rem; }
  .helper { color: var(--color-text-muted); margin-bottom: 1.5rem; font-size: 0.95rem; }

  .comparison-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: 1rem;
    overflow-x: auto;
    padding-bottom: 1rem;
  }

  .perspective-column {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 1rem;
    min-width: 300px;
  }

  .actor-header {
    border-bottom: 2px solid var(--color-accent);
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }

  .actor-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--color-text);
  }

  .actor-role {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .section-block {
    margin-bottom: 1.25rem;
  }

  .section-block h4 {
    font-size: 0.9rem;
    color: var(--color-accent);
    margin-bottom: 0.4rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .section-block p {
    font-size: 0.9rem;
    margin: 0 0 0.5rem 0;
    line-height: 1.4;
  }

  .counter-list, .uncertainty-list {
    margin: 0;
    padding-left: 1.2rem;
    font-size: 0.9rem;
  }

  .counter-list li, .uncertainty-list li {
    margin-bottom: 0.5rem;
  }

  .badge-row {
    margin-top: 0.2rem;
  }

  .actions {
    margin-top: 1.5rem;
  }

  @media (max-width: 768px) {
    .comparison-grid {
      display: flex;
      flex-direction: column;
    }
    .perspective-column {
      min-width: unset;
    }
  }
</style>
