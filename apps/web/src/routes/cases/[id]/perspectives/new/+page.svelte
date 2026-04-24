<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import {
    getCase,
    addDraftPerspective,
    commitPerspective,
    getDraftPerspectiveForActor
  } from '$lib/services/case-service.js';
  import {
    fromCatalogSelections,
    toCatalogSelections,
  } from '$lib/forms/exploration-selection-model.js';
  import { buildPerspectiveDraftContent } from '$lib/forms/perspective-core-form.js';
  import { mapCameraStateToFormValue } from '$domain/form-mappers.js';
  import { roleLabels } from '$lib/ui/labels.js';
  import PerspectiveCoreSlides from '$lib/components/forms/PerspectiveCoreSlides.svelte';
  import type { Case, EvidenceType, UncertaintyLevel } from '$domain/types.js';

  let caseId = $state('');
  let caseData: Case | null = $state(null);
  let loaded = $state(false);
  let currentActorId = $state('User-1');

  let observationText = $state('');
  let isCameraDescribableStr = $state<'null' | 'true' | 'false'>('null');
  let interpretationText = $state('');
  let interpretationEvidence = $state<EvidenceType>('observational');
  let counterRows = $state<{ text: string; evidence: EvidenceType }[]>([
    { text: '', evidence: 'observational' }
  ]);
  let uncertaintyRows = $state<{ level: UncertaintyLevel; rationale: string }[]>([
    { level: 2, rationale: '' }
  ]);
  let selectedNeedIds = $state<string[]>([]);
  let selectedDeterminantIds = $state<string[]>([]);
  let currentSlide = $state(1);

  let draftId = $state<string | null>(null);
  let draftCreatedAt = $state<string | null>(null);
  let errorMsg = $state('');

  onMount(() => {
    caseId = page.params.id ?? '';
    caseData = getCase(caseId);
    currentActorId =
      page.url.searchParams.get('actor') ||
      (caseData && caseData.participants.length > 0 ? caseData.participants[0].id : 'User-1');
    loadDraft();
    loaded = true;
  });

  function loadDraft() {
    const draft = getDraftPerspectiveForActor(caseId, currentActorId);
    if (draft) {
      draftId = draft.id;
      draftCreatedAt = draft.createdAt;
      const obs = draft.content.observation;
      observationText = obs?.text ?? '';
      isCameraDescribableStr = mapCameraStateToFormValue(obs?.isCameraDescribable);
      const interp = draft.content.interpretation;
      interpretationText = interp?.text ?? '';
      interpretationEvidence = interp?.evidenceType ?? 'observational';
      const counters = draft.content.counterInterpretations;
      counterRows = counters && counters.length > 0
        ? counters.map((c) => ({ text: c.text ?? '', evidence: c.evidenceType ?? 'observational' }))
        : [{ text: '', evidence: 'observational' }];
      const uncerts = draft.content.uncertainties;
      uncertaintyRows = uncerts && uncerts.length > 0
        ? uncerts.map((u) => ({ level: u.level ?? 2, rationale: u.rationale ?? '' }))
        : [{ level: 2, rationale: '' }];
      selectedNeedIds = fromCatalogSelections(draft.content.selectedNeeds);
      selectedDeterminantIds = fromCatalogSelections(draft.content.selectedDeterminants);
      errorMsg = '';
    } else {
      draftId = crypto.randomUUID();
      draftCreatedAt = null;
      observationText = '';
      isCameraDescribableStr = 'null';
      interpretationText = '';
      interpretationEvidence = 'observational';
      counterRows = [{ text: '', evidence: 'observational' }];
      uncertaintyRows = [{ level: 2, rationale: '' }];
      selectedNeedIds = [];
      selectedDeterminantIds = [];
      errorMsg = '';
    }
  }

  function handleActorChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    currentActorId = target.value;
    loadDraft();
  }

  function saveDraft(): { success: boolean; error?: string } {
    try {
      if (!draftId) draftId = crypto.randomUUID();
      if (!draftCreatedAt) draftCreatedAt = new Date().toISOString();
      const draftContent = buildPerspectiveDraftContent({
        observationText,
        cameraState: isCameraDescribableStr,
        interpretationText,
        interpretationEvidence,
        counterRows,
        uncertaintyRows,
        selectedNeeds: toCatalogSelections(selectedNeedIds),
        selectedDeterminants: toCatalogSelections(selectedDeterminantIds)
      });
      addDraftPerspective(caseId, {
        id: draftId,
        caseId,
        actorId: currentActorId,
        createdAt: draftCreatedAt,
        observation: draftContent.observation,
        interpretation: draftContent.interpretation,
        counterInterpretations: draftContent.counterInterpretations,
        uncertainties: draftContent.uncertainties,
        selectedNeeds: draftContent.selectedNeeds,
        selectedDeterminants: draftContent.selectedDeterminants
      }, currentActorId);
      errorMsg = '';
      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg };
    }
  }

  function onCommit() {
    const result = saveDraft();
    if (!result.success) {
      let msg = result.error || 'Bitte füllen Sie alle Felder aus.';
      if (msg.includes('counter-interpretation') || msg.includes('Gegen-Deutung')) {
        msg = 'Für das Commit wird mindestens eine Gegen-Deutung benötigt.';
      } else if (msg.includes('uncertainty')) {
        msg = 'Für das Commit wird mindestens eine Unsicherheitsbegründung benötigt.';
      } else if (msg.includes('observation')) {
        msg = 'Für das Commit wird eine Beobachtung benötigt.';
      } else if (msg.includes('interpretation')) {
        msg = 'Für das Commit wird eine Deutung benötigt.';
      }
      errorMsg = msg;
      return;
    }
    try {
      commitPerspective(caseId, draftId!, currentActorId);
      goto(`/cases/${caseId}`);
    } catch (e: unknown) {
      errorMsg = e instanceof Error ? e.message : String(e);
    }
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
    <h1>Neue Perspektive</h1>
    <p class="subtitle">Fall: <code>{caseId.slice(0, 8)}</code></p>

    <div class="card form-section simulated-auth">
      <h2>Wer sind Sie?</h2>
      <p class="helper">
        <strong>Demo-Zugriffssimulation (später via Benutzerkonto).</strong> Ihr Draft ist
        nur für die gewählte Identität sichtbar, bis er committed wird.
      </p>
      <label class="field">
        <select value={currentActorId} onchange={handleActorChange}>
          {#each caseData.participants as p}
            <option value={p.id}>{p.id} ({p.role ? roleLabels[p.role] ?? p.role : 'unbekannt'})</option>
          {/each}
          <option value="external-viewer">Externe Beobachtung</option>
        </select>
      </label>
    </div>

    <PerspectiveCoreSlides
      bind:observationText
      bind:isCameraDescribableStr
      bind:interpretationText
      bind:interpretationEvidence
      bind:counterRows
      bind:uncertaintyRows
      bind:selectedNeedIds
      bind:selectedDeterminantIds
      bind:currentSlide
      submitLabel="Perspektive committen"
      cancelHref={`/cases/${caseId}`}
      errorMsg={errorMsg}
      onSubmit={onCommit}
      onChange={saveDraft}
    />
  {/if}
</div>

<style>
  .subtitle { color: var(--color-text-muted); margin-top: -0.5rem; margin-bottom: 1.5rem; }
  .form-section { margin-bottom: 1.25rem; }
  .form-section h2 { font-size: 1.05rem; margin-bottom: 0.25rem; color: var(--color-accent); }
  .helper { font-size: 0.85rem; color: var(--color-text-muted); margin-top: 0; margin-bottom: 1rem; }
  .field { display: block; margin-bottom: 0.75rem; }
  select { width: 100%; padding: 0.5rem 0.65rem; border: 1px solid var(--color-border); border-radius: var(--radius); font-family: inherit; font-size: 0.9rem; background: var(--color-bg); color: var(--color-text); }
  select:focus { outline: 2px solid var(--color-accent); outline-offset: -1px; border-color: var(--color-accent); }
  .simulated-auth { border: 2px dashed var(--color-accent); background: rgba(45, 90, 155, 0.05); }
</style>
