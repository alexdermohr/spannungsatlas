<!--
  Nachgelagerter Explorationsraum für die eigene committete Perspektive.

  Diese Route ist absichtlich vom initialen Erfassungsfluss getrennt:
    - /cases/new
    - /cases/[id]/perspectives/new
  Die ursprüngliche Beobachtung, Deutung, Gegen-Deutung und Unsicherheit bleiben
  unangetastet. Markierungen hier sind Reflexionsanker NACH Abschluss.
-->
<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import {
    getCase,
    getOwnCommittedPerspectiveForActor,
    savePerspectiveExploration
  } from '$lib/services/case-service.js';
  import {
    fromCatalogSelections,
    toCatalogSelections
  } from '$lib/forms/exploration-selection-model.js';
  import { clusters } from '$lib/catalog/catalog-data.js';
  import ExplorationSlide from '$lib/components/forms/perspective-core-slides/ExplorationSlide.svelte';
  import type { Case, PerspectiveCommittedRecord } from '$domain/types.js';

  let caseId = $state('');
  let perspectiveId = $state('');
  let actorId = $state('');
  let caseData: Case | null = $state(null);
  let ownPerspective: PerspectiveCommittedRecord | undefined = $state(undefined);
  let loaded = $state(false);
  let errorMsg = $state('');

  let selectedNeedIds = $state<string[]>([]);
  let selectedDeterminantIds = $state<string[]>([]);
  let activeClusterId = $state<string>('');
  let selectionSearch = $state<string>('');
  let exploredAt = $state<string | null>(null);
  let updatedAt = $state<string | null>(null);

  onMount(() => {
    caseId = page.params.id ?? '';
    perspectiveId = page.params.perspectiveId ?? '';
    actorId = page.url.searchParams.get('actor') ?? '';

    if (!actorId) {
      errorMsg = 'Kein Actor angegeben (?actor=…).';
      loaded = true;
      return;
    }

    caseData = getCase(caseId);
    if (!caseData) {
      errorMsg = 'Fall nicht gefunden.';
      loaded = true;
      return;
    }

    const own = getOwnCommittedPerspectiveForActor(caseId, actorId);
    if (!own) {
      errorMsg =
        'Es existiert keine eigene, abgeschlossene Perspektive. Der Explorationsraum ist erst nach Abschluss möglich.';
      loaded = true;
      return;
    }
    if (own.id !== perspectiveId) {
      errorMsg = 'Diese Perspektive gehört nicht zum angegebenen Actor.';
      loaded = true;
      return;
    }

    ownPerspective = own;
    selectedNeedIds = fromCatalogSelections(own.postCommitExploration?.selectedNeeds);
    selectedDeterminantIds = fromCatalogSelections(own.postCommitExploration?.selectedDeterminants);
    exploredAt = own.postCommitExploration?.exploredAt ?? null;
    updatedAt = own.postCommitExploration?.updatedAt ?? null;
    activeClusterId = clusters[0]?.id ?? '';
    selectionSearch = '';
    loaded = true;
  });

  function onSave() {
    if (!ownPerspective) return;
    try {
      savePerspectiveExploration({
        caseId,
        perspectiveId: ownPerspective.id,
        requestingActorId: actorId,
        selectedNeeds: toCatalogSelections(selectedNeedIds),
        selectedDeterminants: toCatalogSelections(selectedDeterminantIds)
      });
      goto(`/cases/${caseId}?actor=${encodeURIComponent(actorId)}`);
    } catch (e: unknown) {
      errorMsg = e instanceof Error ? e.message : String(e);
    }
  }
</script>

<div class="page">
  {#if !loaded}
    <p>Lade…</p>
  {:else if errorMsg && !ownPerspective}
    <div class="card empty-state">
      <h1>Explorationsraum nicht verfügbar</h1>
      <p>{errorMsg}</p>
      <a href={`/cases/${caseId}`} class="btn">← Zurück zum Fall</a>
    </div>
  {:else if ownPerspective}
    <h1>Explorationsraum nach Abschluss</h1>
    <p class="subtitle">
      Fall: <code>{caseId.slice(0, 8)}</code> · Actor: <code>{actorId}</code>
    </p>

    <section class="card post-commit-notice">
      <p>
        <strong>Nachgelagerte Exploration.</strong> Diese Markierungen entstehen
        nach Ihrer eigenen Perspektive. Sie ändern nicht die ursprüngliche
        Beobachtung, Deutung, Gegen-Deutung oder Unsicherheit. Sie dienen als
        Kontrast- und Reflexionsanker.
      </p>
      {#if exploredAt}
        <p class="meta">
          Exploration begonnen: <code>{exploredAt}</code>
          {#if updatedAt}· zuletzt aktualisiert: <code>{updatedAt}</code>{/if}
        </p>
      {/if}
    </section>

    {#if errorMsg}
      <div class="error-box" role="alert">
        <p><strong>Fehler:</strong> {errorMsg}</p>
      </div>
    {/if}

    <form onsubmit={(e) => { e.preventDefault(); onSave(); }}>
      <ExplorationSlide
        title="Bedürfnisse und Determinanten markieren"
        bind:selectedNeedIds
        bind:selectedDeterminantIds
        bind:activeClusterId
        bind:selectionSearch
      />

      <div class="form-actions">
        <a href={`/cases/${caseId}?actor=${encodeURIComponent(actorId)}`} class="btn">Abbrechen</a>
        <button type="submit" class="btn btn-primary">Nachgelagerte Exploration speichern</button>
      </div>
    </form>
  {/if}
</div>

<style>
  .subtitle { color: var(--color-text-muted); margin-top: -0.5rem; margin-bottom: 1.5rem; }
  .post-commit-notice {
    border-left: 3px solid var(--color-accent);
    background: rgba(45, 90, 155, 0.04);
    margin-bottom: 1.25rem;
  }
  .post-commit-notice p { margin: 0.3rem 0; font-size: 0.9rem; }
  .post-commit-notice .meta { font-size: 0.78rem; color: var(--color-text-muted); }
  .error-box {
    background: var(--color-error-bg);
    border: 1px solid var(--color-error-border);
    border-radius: var(--radius);
    padding: 0.75rem 1rem;
    margin-bottom: 1.25rem;
    color: var(--color-danger);
  }
  .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }
  .empty-state {
    text-align: center;
    padding: 2.5rem 1.5rem;
  }
</style>
