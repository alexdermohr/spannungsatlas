<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { getCase, addDraftPerspective, commitPerspective, getDraftPerspectiveForActor } from '$lib/services/case-service.js';
  import { roleLabels, evidenceLabels, uncertaintyLabels } from '$lib/ui/labels.js';
  import type { Case, EvidenceType, UncertaintyLevel } from '$domain/types.js';

  let caseId = $state('');
  let caseData: Case | null = $state(null);
  let loaded = $state(false);

  // Simulated actor for access control. Nur Demo-Zugriffssimulation, keine echte Sicherheitsgrenze.
  let currentActorId = $state('User-1');

  // Form State
  let observationText = $state('');
  let isCameraDescribable = $state(false);
  let interpretationText = $state('');
  let interpretationEvidence = $state<EvidenceType>('observational');

  let counterRows = $state<{ text: string; evidence: EvidenceType }[]>([{ text: '', evidence: 'observational' }]);
  let uncertaintyRows = $state<{ level: UncertaintyLevel; rationale: string }[]>([{ level: 2, rationale: '' }]);

  let draftId = $state<string | null>(null);
  let draftCreatedAt = $state<string | null>(null);
  let errorMsg = $state('');

  onMount(() => {
    caseId = page.params.id ?? '';
    caseData = getCase(caseId);

    // We auto-select the first participant as the actor for demo purposes, if none is set
    currentActorId = page.url.searchParams.get('actor') || (caseData && caseData.participants.length > 0 ? caseData.participants[0].id : 'User-1');

    loadDraft();
    loaded = true;
  });

  function loadDraft() {
    const draft = getDraftPerspectiveForActor(caseId, currentActorId);
    if (draft) {
      draftId = draft.id;
      draftCreatedAt = draft.createdAt;
      observationText = draft.content.observation.text;
      isCameraDescribable = draft.content.observation.isCameraDescribable;
      interpretationText = draft.content.interpretation.text;
      interpretationEvidence = draft.content.interpretation.evidenceType;
      counterRows = draft.content.counterInterpretations.map(c => ({ text: c.text, evidence: c.evidenceType }));
      uncertaintyRows = draft.content.uncertainties.map(u => ({ level: u.level, rationale: u.rationale }));
    } else {
      draftId = crypto.randomUUID();
      draftCreatedAt = null;
      observationText = '';
      isCameraDescribable = false;
      interpretationText = '';
      interpretationEvidence = 'observational';
      counterRows = [{ text: '', evidence: 'observational' }];
      uncertaintyRows = [{ level: 2, rationale: '' }];
      errorMsg = '';
    }
  }

  function handleActorChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    currentActorId = target.value;
    loadDraft();
  }

  function addCounterRow() {
    counterRows = [...counterRows, { text: '', evidence: 'observational' }];
  }

  function removeCounterRow(index: number) {
    if (counterRows.length > 1) {
      counterRows = counterRows.filter((_, i) => i !== index);
    }
  }

  function addUncertaintyRow() {
    uncertaintyRows = [...uncertaintyRows, { level: 2, rationale: '' }];
  }

  function removeUncertaintyRow(index: number) {
    if (uncertaintyRows.length > 1) {
      uncertaintyRows = uncertaintyRows.filter((_, i) => i !== index);
    }
  }

  function saveDraft(): { success: boolean; error?: string } {
    try {
      if (!draftId) draftId = crypto.randomUUID();
      if (!draftCreatedAt) draftCreatedAt = new Date().toISOString();

      const counters = counterRows.filter(r => r.text.trim() !== '').map(r => ({ text: r.text, evidenceType: r.evidence }));
      const uncerts = uncertaintyRows.filter(r => r.rationale.trim() !== '').map(r => ({ level: r.level, rationale: r.rationale }));

      addDraftPerspective(caseId, {
        id: draftId,
        caseId,
        actorId: currentActorId,
        createdAt: draftCreatedAt,
        observation: observationText.trim() ? { text: observationText, isCameraDescribable } : undefined,
        interpretation: interpretationText.trim() ? { text: interpretationText, evidenceType: interpretationEvidence } : undefined,
        counterInterpretations: counters.length > 0 ? counters : undefined,
        uncertainties: uncerts.length > 0 ? uncerts : undefined
      }, currentActorId);

      errorMsg = ''; // clear on success
      return { success: true };
    } catch (e: any) {
      // Log unexpected errors but don't show to user while typing
      return { success: false, error: e.message };
    }
  }

  function onCommit() {
    const result = saveDraft();
    if (!result.success) {
      // Translate common validation errors
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
    } catch (e: any) {
      errorMsg = e.message;
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

    {#if errorMsg}
      <div class="error-box">
        <p><strong>Fehler:</strong> {errorMsg}</p>
      </div>
    {/if}

    <div class="card form-section simulated-auth">
      <h2>Wer sind Sie?</h2>
      <p class="helper"><strong>Demo-Zugriffssimulation (später via Benutzerkonto).</strong> Ihr Draft ist nur für die gewählte Identität sichtbar, bis er committed wird.</p>
      <label class="field">
        <select value={currentActorId} onchange={handleActorChange}>
          {#each caseData.participants as p}
            <option value={p.id}>{p.id} ({p.role ? roleLabels[p.role] ?? p.role : 'unbekannt'})</option>
          {/each}
          <option value="external-viewer">Externe Beobachtung</option>
        </select>
      </label>
    </div>

    <form onsubmit={(e) => { e.preventDefault(); onCommit(); }}>

      <section class="card form-section">
        <h2>1. Beobachtung</h2>
        <p class="helper">Beschreiben Sie das Verhalten rein faktisch.</p>
        <label class="field">
          <textarea bind:value={observationText} oninput={saveDraft} rows="4" placeholder="z.B. Kind A wirft das Spielzeug..."></textarea>
        </label>
        <label class="checkbox-field">
          <input type="checkbox" bind:checked={isCameraDescribable} onchange={saveDraft} />
          <span>Ist diese Beschreibung rein beobachtbar (Kamera-Test)?</span>
        </label>
      </section>

      <section class="card form-section">
        <h2>2. Deutung</h2>
        <p class="helper">Wie deuten Sie die Beobachtung?</p>
        <label class="field">
          <textarea bind:value={interpretationText} oninput={saveDraft} rows="4"></textarea>
        </label>
        <label class="field">
          <span class="field-label">Evidenztyp</span>
          <select bind:value={interpretationEvidence} onchange={saveDraft}>
            {#each Object.entries(evidenceLabels) as [value, label]}
              <option {value}>{label}</option>
            {/each}
          </select>
        </label>
      </section>

      <section class="card form-section">
        <h2>3. Gegen-Deutungen</h2>
        <p class="helper">Welche alternative Erklärung wäre denkbar?</p>
        {#each counterRows as row, i}
          <div class="counter-block">
            <span class="block-sub-heading">Gegen-Deutung {i + 1}</span>
            <label class="field">
              <textarea bind:value={row.text} oninput={saveDraft} rows="3"></textarea>
            </label>
            <div class="counter-block-footer">
              <label class="field field-counter-evidence">
                <select bind:value={row.evidence} onchange={saveDraft}>
                  {#each Object.entries(evidenceLabels) as [value, label]}
                    <option {value}>{label}</option>
                  {/each}
                </select>
              </label>
              {#if counterRows.length > 1}
                <button type="button" class="btn-remove" onclick={() => { removeCounterRow(i); saveDraft(); }} aria-label={`Gegen-Deutung ${i + 1} entfernen`}>×</button>
              {/if}
            </div>
          </div>
        {/each}
        <button type="button" class="btn" onclick={addCounterRow}>+ Weitere Gegen-Deutung</button>
      </section>

      <section class="card form-section">
        <h2>4. Unsicherheit</h2>
        <p class="helper">Wie sicher sind Sie sich?</p>
        {#each uncertaintyRows as row, i}
          <div class="uncertainty-block">
            <span class="block-sub-heading">Unsicherheit {i + 1}</span>
            <label class="field">
              <span class="field-label">Stufe</span>
              <select bind:value={row.level} onchange={saveDraft}>
                {#each [0, 1, 2, 3, 4, 5] as lvl}
                  <option value={lvl}>{uncertaintyLabels[lvl]}</option>
                {/each}
              </select>
            </label>
            <label class="field">
              <span class="field-label">Begründung</span>
              <textarea bind:value={row.rationale} oninput={saveDraft} rows="2"></textarea>
            </label>
            <div class="uncertainty-block-footer">
               {#if uncertaintyRows.length > 1}
                <button type="button" class="btn-remove" onclick={() => { removeUncertaintyRow(i); saveDraft(); }} aria-label={`Unsicherheit ${i + 1} entfernen`}>×</button>
              {/if}
            </div>
          </div>
        {/each}
        <button type="button" class="btn" onclick={addUncertaintyRow}>+ Weitere Unsicherheit</button>
      </section>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Perspektive committen</button>
        <a href="/cases/{caseId}" class="btn">Abbrechen</a>
      </div>
    </form>
  {/if}
</div>

<style>
  .subtitle { color: var(--color-text-muted); margin-top: -0.5rem; margin-bottom: 1.5rem; }
  .error-box { background: var(--color-error-bg); border: 1px solid var(--color-error-border); border-radius: var(--radius); padding: 0.75rem 1rem; margin-bottom: 1.25rem; color: var(--color-danger); }
  .form-section { margin-bottom: 1.25rem; }
  .form-section h2 { font-size: 1.05rem; margin-bottom: 0.25rem; color: var(--color-accent); }
  .helper { font-size: 0.85rem; color: var(--color-text-muted); margin-top: 0; margin-bottom: 1rem; }
  .field { display: block; margin-bottom: 0.75rem; }
  .field-label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem; }
  textarea, select { width: 100%; padding: 0.5rem 0.65rem; border: 1px solid var(--color-border); border-radius: var(--radius); font-family: inherit; font-size: 0.9rem; background: var(--color-bg); color: var(--color-text); }
  textarea:focus, select:focus { outline: 2px solid var(--color-accent); outline-offset: -1px; border-color: var(--color-accent); }
  .checkbox-field { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer; }
  .checkbox-field input { width: auto; }
  .form-actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; margin-bottom: 2rem; }
  .counter-block, .uncertainty-block { margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border); }
  .counter-block-footer, .uncertainty-block-footer { display: flex; align-items: center; gap: 0.5rem; justify-content: space-between;}
  .field-counter-evidence { flex: 1; margin-bottom: 0; }
  .block-sub-heading { display: block; font-size: 0.82rem; font-weight: 600; color: var(--color-text-muted); margin-bottom: 0.3rem; }
  .btn-remove { background: none; border: 1px solid var(--color-border); border-radius: var(--radius); cursor: pointer; font-size: 1.1rem; line-height: 1; padding: 0.45rem 0.6rem; color: var(--color-text-muted); }
  .btn-remove:hover { color: var(--color-danger); border-color: var(--color-danger); }
  .simulated-auth { border: 2px dashed var(--color-accent); background: rgba(45, 90, 155, 0.05); }
</style>
