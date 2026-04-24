<script lang="ts">
  import { goto } from '$app/navigation';
  import { tick } from 'svelte';
  import { startNewCase } from '$lib/services/case-service.js';
  import { roleLabels } from '$lib/ui/labels.js';
  import {
    ensureTrailingEmptyRow,
    filledParticipants,
    normalizeParticipants,
    refreshFieldErrors,
    clearErrorKeysWithPrefix,
    applyPrefixErrors,
    shouldShowRemoveParticipant,
    type ParticipantRow,
  } from '$lib/forms/new-case-form.js';
  import {
    normalizeObservationInput,
    normalizeInterpretationInput,
    normalizeCounterRows as normalizeCoreCounterRows,
    normalizeUncertaintyRows as normalizeCoreUncertaintyRows,
    type CounterInputRow,
    type UncertaintyInputRow
  } from '$lib/forms/perspective-core-form.js';
  import { toCatalogSelections } from '$lib/forms/exploration-selection-model.js';
  import PerspectiveCoreSlides from '$lib/components/forms/PerspectiveCoreSlides.svelte';
  import type { EvidenceType, UncertaintyLevel } from '$domain/types.js';

  let context = $state('');
  let participants = $state<ParticipantRow[]>([{ name: '', role: 'primary' }]);

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

  let fieldErrors = $state<Record<string, string>>({});
  let coreError = $state('');
  let submitting = $state(false);

  function clearFieldErrors(keys: string[]) {
    fieldErrors = refreshFieldErrors(fieldErrors, validateMetadata(), keys);
  }
  function handleContextInput() { clearFieldErrors(['context']); }
  function handleParticipantInput(_index: number) {
    participants = ensureTrailingEmptyRow(participants);
    let errs = clearErrorKeysWithPrefix(fieldErrors, 'participant-');
    if ('_submit' in errs) { errs = { ...errs }; delete errs['_submit']; }
    fieldErrors = applyPrefixErrors(errs, validateMetadata(), 'participant-');
  }
  function handleParticipantBlur() {
    participants = normalizeParticipants(participants);
    fieldErrors = clearErrorKeysWithPrefix(fieldErrors, 'participant-');
    fieldErrors = applyPrefixErrors(fieldErrors, validateMetadata(), 'participant-');
  }
  function removeParticipant(index: number) {
    participants = participants.filter((_, i) => i !== index);
    participants = normalizeParticipants(participants);
    fieldErrors = clearErrorKeysWithPrefix(fieldErrors, 'participant-');
    fieldErrors = applyPrefixErrors(fieldErrors, validateMetadata(), 'participant-');
  }

  function validateMetadata(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!context.trim()) errs['context'] = 'Kontext darf nicht leer sein.';
    if (filledParticipants(participants).length === 0)
      errs['participant-0'] = 'Mindestens eine beteiligte Person ist erforderlich.';
    const seenNames = new Set<string>();
    participants.forEach((row, i) => {
      const trimmed = row.name.trim();
      if (trimmed === '') return;
      if (seenNames.has(trimmed)) {
        errs[`participant-${i}`] = 'Dieser Name ist bereits eingetragen.';
      }
      seenNames.add(trimmed);
    });
    return errs;
  }

  function validateCore(): string | null {
    if (!observationText.trim()) return 'Beobachtung darf nicht leer sein.';
    if (!interpretationText.trim()) return 'Deutung darf nicht leer sein.';
    if (observationText.trim() === interpretationText.trim())
      return 'Beobachtung und Deutung dürfen nicht identisch sein.';
    const filledCounters = counterRows.filter((r) => r.text.trim() !== '');
    if (filledCounters.length === 0) return 'Mindestens eine Gegen-Deutung ist erforderlich.';
    const interp = interpretationText.trim();
    for (const row of counterRows) {
      const t = row.text.trim();
      if (t && t === interp) return 'Deutung und Gegen-Deutung dürfen nicht identisch sein.';
    }
    const filledUncerts = uncertaintyRows.filter((r) => r.rationale.trim() !== '');
    if (filledUncerts.length === 0)
      return 'Mindestens eine Unsicherheitsbegründung ist erforderlich.';
    return null;
  }

  async function submit() {
    fieldErrors = validateMetadata();
    const coreErr = validateCore();
    coreError = coreErr ?? '';

    if (Object.keys(fieldErrors).length > 0 || coreErr) {
      await tick();
      if (Object.keys(fieldErrors).length > 0) {
        const firstKey = Object.keys(fieldErrors)[0];
        const el = document.getElementById(`field-${firstKey}`);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
      }
      return;
    }

    submitting = true;
    try {
      const normalizedObservation = normalizeObservationInput({ observationText, cameraState: isCameraDescribableStr });
      const normalizedInterpretation = normalizeInterpretationInput({ interpretationText, interpretationEvidence });
      const normalizedCounters = normalizeCoreCounterRows(counterRows as CounterInputRow[]);
      const normalizedUncertainties = normalizeCoreUncertaintyRows(uncertaintyRows as UncertaintyInputRow[]);
      const filled = filledParticipants(participants);
      const primaryActorId = filled[0]?.name ?? undefined;

      const created = startNewCase({
        context: context.trim(),
        participants: filled.map((p) => ({ id: p.name, role: p.role })),
        observationText: normalizedObservation?.text ?? '',
        isCameraDescribable: normalizedObservation?.isCameraDescribable ?? false,
        interpretationText: normalizedInterpretation?.text ?? '',
        interpretationEvidenceType: normalizedInterpretation?.evidenceType ?? interpretationEvidence,
        counterInterpretations: normalizedCounters,
        uncertainties: normalizedUncertainties,
        primaryActorId,
        selectedNeeds: toCatalogSelections(selectedNeedIds),
        selectedDeterminants: toCatalogSelections(selectedDeterminantIds)
      });
      goto(`/cases/${created.id}`);
    } catch (e: unknown) {
      console.error('Fehler beim Erstellen des Falls:', e);
      fieldErrors = { _submit: 'Ein unerwarteter Fehler ist aufgetreten. Bitte prüfen Sie Ihre Eingaben und versuchen Sie es erneut.' };
      submitting = false;
    }
  }
</script>

<div class="page">
  <h1>Neuer Fall</h1>
  <p class="subtitle">
    Erste Fallanlage = erste Perspektive. Kontext und Teilnehmer werden ergänzt; der
    epistemische Kern (Beobachtung → Exploration → Deutung → Gegen-Deutung → Unsicherheit)
    ist identisch zu jeder weiteren Perspektive.
  </p>

  {#if fieldErrors['_submit']}
    <div class="error-box"><p>{fieldErrors['_submit']}</p></div>
  {/if}

  <section class="card form-section">
    <h2>Fallkontext & Teilnehmer</h2>
    <p class="helper">
      Diese Metadaten gelten für den Fall insgesamt. Der darauf folgende Kern ist identisch
      mit jeder weiteren Perspektive.
    </p>

    <label class="field" class:field-error={fieldErrors['context']}>
      <span class="field-label">Situationskontext</span>
      <textarea id="field-context" bind:value={context} oninput={handleContextInput} rows="3" placeholder="z.B. Mittagssituation in der Kita, Gruppenraum, 12 Kinder anwesend…"></textarea>
      {#if fieldErrors['context']}<span class="field-error-msg">{fieldErrors['context']}</span>{/if}
    </label>

    <fieldset class="participants-fieldset">
      <legend class="field-label">Beteiligte Personen</legend>
      {#each participants as row, i}
        <div class="field-row participant-row">
          <label class="field" class:field-error={fieldErrors[`participant-${i}`]}>
            <span class="sr-only">Name Person {i + 1}</span>
            <input id={`field-participant-${i}`} name={`participant-alias-${i}`} type="text" bind:value={row.name} oninput={() => handleParticipantInput(i)} onblur={handleParticipantBlur} autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" />
            {#if fieldErrors[`participant-${i}`]}<span class="field-error-msg">{fieldErrors[`participant-${i}`]}</span>{/if}
          </label>
          <label class="field">
            <span class="sr-only">Rolle Person {i + 1}</span>
            <select bind:value={row.role}>
              {#each Object.entries(roleLabels) as [value, label]}
                <option {value}>{label}</option>
              {/each}
            </select>
          </label>
          <button type="button" class="btn-remove" class:btn-remove--hidden={!shouldShowRemoveParticipant(participants, row)} onclick={() => removeParticipant(i)} aria-label={`Person ${i + 1} entfernen`} aria-hidden={!shouldShowRemoveParticipant(participants, row) ? true : undefined} tabindex={!shouldShowRemoveParticipant(participants, row) ? -1 : undefined}>×</button>
        </div>
      {/each}
    </fieldset>
  </section>

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
    submitLabel={submitting ? 'Wird angelegt…' : 'Fall dokumentieren'}
    cancelHref="/"
    errorMsg={coreError}
    onSubmit={submit}
  />
</div>

<style>
  .subtitle { color: var(--color-text-muted); margin-top: -0.5rem; margin-bottom: 1.5rem; font-size: 0.95rem; }
  .error-box { background: var(--color-error-bg); border: 1px solid var(--color-error-border); border-radius: var(--radius); padding: 0.75rem 1rem; margin-bottom: 1.25rem; color: var(--color-danger); font-size: 0.9rem; }
  .error-box p { margin: 0.2rem 0; }
  .form-section { margin-bottom: 1.25rem; }
  .form-section h2 { font-size: 1.05rem; margin-bottom: 0.25rem; color: var(--color-accent); }
  .helper { font-size: 0.85rem; color: var(--color-text-muted); margin-top: 0; margin-bottom: 1rem; }
  .field { display: block; margin-bottom: 0.75rem; }
  .field-label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem; }
  textarea, input[type="text"], select { width: 100%; padding: 0.5rem 0.65rem; border: 1px solid var(--color-border); border-radius: var(--radius); font-family: inherit; font-size: 0.9rem; background: var(--color-bg); color: var(--color-text); }
  textarea:focus, input:focus, select:focus { outline: 2px solid var(--color-accent); outline-offset: -1px; border-color: var(--color-accent); }
  .field-error textarea, .field-error input[type="text"] { border-color: var(--color-danger); }
  .field-error-msg { display: block; color: var(--color-danger); font-size: 0.8rem; margin-top: 0.25rem; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.75rem; align-items: start; }
  .participants-fieldset { border: none; padding: 0; margin: 0; }
  .participants-fieldset legend { padding: 0; }
  .participant-row .field { margin-bottom: 0.4rem; }
  .btn-remove { background: none; border: 1px solid var(--color-border); border-radius: var(--radius); cursor: pointer; font-size: 1.1rem; line-height: 1; padding: 0.45rem 0.6rem; color: var(--color-text-muted); align-self: start; }
  .btn-remove:hover { color: var(--color-danger); border-color: var(--color-danger); }
  .btn-remove--hidden { visibility: hidden; pointer-events: none; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
  @media (max-width: 640px) { .field-row { grid-template-columns: 1fr; } }
</style>
