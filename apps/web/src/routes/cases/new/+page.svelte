<script lang="ts">
  import { goto } from '$app/navigation';
  import { tick } from 'svelte';
  import { startNewCase } from '$lib/services/case-service.js';
  import { roleLabels, evidenceLabels } from '$lib/ui/labels.js';
  import {
    ensureTrailingEmptyRow,
    filledParticipants,
    normalizeParticipants,
    refreshFieldErrors,
    shouldShowRemoveParticipant,
    type ParticipantRow,
    type CounterRow,
    filledCounterRows,
    ensureTrailingEmptyCounterRow,
    normalizeCounterRows,
    shouldShowRemoveCounterRow
  } from '$lib/forms/new-case-form.js';
  import type { EvidenceType, UncertaintyLevel } from '$domain/types.js';

  let context = $state('');
  let participants = $state<ParticipantRow[]>([{ name: '', role: 'primary' }]);

  let observationText = $state('');
  let isCameraDescribable = $state(false);

  let interpretationText = $state('');
  let interpretationEvidence = $state<EvidenceType>('derived');

  let counterRows = $state<CounterRow[]>([{ text: '', evidence: 'derived' }]);

  let uncertaintyLevel = $state<UncertaintyLevel>(3);
  let uncertaintyRationale = $state('');

  let fieldErrors = $state<Record<string, string>>({});
  let submitting = $state(false);

  const uncertaintyLabels: Record<number, string> = {
    0: '0 — Sicher',
    1: '1 — Weitgehend sicher',
    2: '2 — Wahrscheinlich',
    3: '3 — Unsicher',
    4: '4 — Sehr unsicher',
    5: '5 — Hochspekulativ'
  };

  function removeParticipant(index: number) {
    participants = participants.filter((_, i) => i !== index);
    participants = normalizeParticipants(participants);
  }

  function clearFieldErrors(keys: string[]) {
    fieldErrors = refreshFieldErrors(fieldErrors, validate(), keys);
  }

  function handleContextInput() {
    clearFieldErrors(['context']);
  }

  function handleParticipantInput(index: number) {
    participants = ensureTrailingEmptyRow(participants);
    clearFieldErrors([`participant-${index}`, 'participant-0']);
  }

  function handleParticipantBlur() {
    participants = normalizeParticipants(participants);
    clearFieldErrors(['participant-0']);
  }

  function handleObservationInput() {
    clearFieldErrors(['observationText', 'interpretationText']);
  }

  function handleInterpretationInput() {
    clearFieldErrors(['interpretationText', 'counterText']);
  }

  function handleCounterInput(index: number) {
    counterRows = ensureTrailingEmptyCounterRow(counterRows);
    clearFieldErrors([`counterText-${index}`]);
  }

  function removeCounterRow(index: number) {
    counterRows = counterRows.filter((_, i) => i !== index);
    counterRows = normalizeCounterRows(counterRows);
  }

  function handleUncertaintyRationaleInput() {
    clearFieldErrors(['uncertaintyRationale']);
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!context.trim()) errs['context'] = 'Kontext darf nicht leer sein.';
    if (filledParticipants(participants).length === 0)
      errs['participant-0'] = 'Mindestens eine beteiligte Person ist erforderlich.';
    if (!observationText.trim()) errs['observationText'] = 'Beobachtung darf nicht leer sein.';
    if (!interpretationText.trim()) errs['interpretationText'] = 'Deutung darf nicht leer sein.';
    if (!uncertaintyRationale.trim())
      errs['uncertaintyRationale'] = 'Begründung der Unsicherheit fehlt.';
    if (observationText.trim() && observationText.trim() === interpretationText.trim()) {
      errs['interpretationText'] = 'Beobachtung und Deutung dürfen nicht identisch sein.';
    }
    const filledCounters = filledCounterRows(counterRows);
    if (filledCounters.length === 0) {
      errs['counterText-0'] = 'Mindestens eine Gegen-Deutung ist erforderlich.';
    } else {
      filledCounters.forEach((row, i) => {
        if (interpretationText.trim() && interpretationText.trim() === row.text) {
          errs[`counterText-${i}`] = 'Deutung und Gegen-Deutung dürfen nicht identisch sein.';
        }
      });
      for (let i = 0; i < filledCounters.length; i++) {
        for (let j = i + 1; j < filledCounters.length; j++) {
          if (filledCounters[i].text === filledCounters[j].text) {
            errs[`counterText-${j}`] = 'Gegen-Deutungen dürfen nicht identisch sein.';
          }
        }
      }
    }
    return errs;
  }

  async function submit() {
    fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      await tick();
      const firstKey = Object.keys(fieldErrors)[0];
      const el = document.getElementById(`field-${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }

    submitting = true;
    try {
      const created = startNewCase({
        context: context.trim(),
        participants: filledParticipants(participants).map((p) => ({
          id: p.name,
          role: p.role
        })),
        observationText: observationText.trim(),
        isCameraDescribable,
        interpretationText: interpretationText.trim(),
        interpretationEvidenceType: interpretationEvidence,
        counterInterpretations: filledCounterRows(counterRows).map((r) => ({
          text: r.text,
          evidenceType: r.evidence
        })),
        uncertaintyLevel,
        uncertaintyRationale: uncertaintyRationale.trim()
      });
      goto(`/cases/${created.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      fieldErrors = { _submit: msg };
      submitting = false;
    }
  }
</script>

<div class="page">
  <h1>Neuer Fall</h1>
  <p class="subtitle">Reflexionsdisziplin: Beobachtung → Deutung → Gegen-Deutung → Unsicherheit</p>

  {#if fieldErrors['_submit']}
    <div class="error-box">
      <p>{fieldErrors['_submit']}</p>
    </div>
  {/if}

  <form onsubmit={(e) => { e.preventDefault(); submit(); }}>
    <!-- Sektion 1: Kontext -->
    <section class="card form-section">
      <h2>1. Kontext</h2>
      <p class="helper">Beschreiben Sie die Situation und das Setting, in dem die Beobachtung stattfand.</p>

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
              <input
                id={`field-participant-${i}`}
                type="text"
                bind:value={row.name}
                oninput={() => handleParticipantInput(i)}
                onblur={handleParticipantBlur}
                placeholder="Name oder Pseudonym"
              />
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
            <button
              type="button"
              class="btn-remove"
              class:btn-remove--hidden={!shouldShowRemoveParticipant(participants, row)}
              onclick={() => removeParticipant(i)}
              aria-label={`Person ${i + 1} entfernen`}
              aria-hidden={!shouldShowRemoveParticipant(participants, row) ? true : undefined}
              tabindex={!shouldShowRemoveParticipant(participants, row) ? -1 : undefined}
            >×</button>
          </div>
        {/each}
      </fieldset>
    </section>

    <!-- Sektion 2: Beobachtung -->
    <section class="card form-section">
      <h2>2. Beobachtung</h2>
      <p class="helper">
        Was genau haben Sie gesehen oder gehört? Beschreiben Sie nur das, was eine Kamera
        hätte aufnehmen können — ohne Bewertung oder Interpretation.
      </p>

      <label class="field" class:field-error={fieldErrors['observationText']}>
        <span class="field-label">Beobachtungstext</span>
        <textarea id="field-observationText" bind:value={observationText} oninput={handleObservationInput} rows="4" placeholder="z.B. Kind A nimmt Kind B den Stift aus der Hand. Kind B sagt ‚Nein' und wendet sich ab."></textarea>
        {#if fieldErrors['observationText']}<span class="field-error-msg">{fieldErrors['observationText']}</span>{/if}
      </label>

      <label class="checkbox-field">
        <input type="checkbox" bind:checked={isCameraDescribable} />
        <span>Ich halte diese Beschreibung für kamerabeschreibbar</span>
      </label>
    </section>

    <!-- Sektion 3: Deutung -->
    <section class="card form-section">
      <h2>3. Deutung</h2>
      <p class="helper">
        Wie interpretieren Sie das Beobachtete? Was könnte dahinter stehen?
        Markieren Sie die Evidenznähe Ihrer Deutung.
      </p>

      <label class="field" class:field-error={fieldErrors['interpretationText']}>
        <span class="field-label">Deutungstext</span>
        <textarea id="field-interpretationText" bind:value={interpretationText} oninput={handleInterpretationInput} rows="4" placeholder="z.B. Kind A zeigt möglicherweise Frustration über die eigene Impulskontrolle…"></textarea>
        {#if fieldErrors['interpretationText']}<span class="field-error-msg">{fieldErrors['interpretationText']}</span>{/if}
      </label>

      <label class="field">
        <span class="field-label">Evidenztyp</span>
        <select bind:value={interpretationEvidence}>
          {#each Object.entries(evidenceLabels) as [value, label]}
            <option {value}>{label}</option>
          {/each}
        </select>
      </label>
    </section>

    <!-- Sektion 4: Gegen-Deutung -->
    <section class="card form-section">
      <h2>4. Gegen-Deutung</h2>
      <p class="helper">
        Welche alternative Erklärung wäre ebenfalls denkbar? Die Gegen-Deutung zwingt
        zur Perspektiverweiterung und verhindert vorschnelle Festlegung.
      </p>

      <fieldset class="counter-fieldset">
        <legend class="field-label">Gegen-Deutungen</legend>
        {#each counterRows as row, i}
          <div class="counter-block">
            <label class="field" class:field-error={fieldErrors[`counterText-${i}`]}>
              <span class="sr-only">Gegen-Deutung {i + 1}</span>
              <textarea
                id={`field-counterText-${i}`}
                bind:value={row.text}
                oninput={() => handleCounterInput(i)}
                rows="3"
                placeholder="z.B. Kind A imitiert möglicherweise ein Verhalten, das es bei anderen Kindern beobachtet hat…"
              ></textarea>
              {#if fieldErrors[`counterText-${i}`]}<span class="field-error-msg">{fieldErrors[`counterText-${i}`]}</span>{/if}
            </label>
            <div class="counter-block-footer">
              <label class="field field-counter-evidence">
                <span class="sr-only">Evidenztyp Gegen-Deutung {i + 1}</span>
                <select bind:value={row.evidence}>
                  {#each Object.entries(evidenceLabels) as [value, label]}
                    <option {value}>{label}</option>
                  {/each}
                </select>
              </label>
              <button
                type="button"
                class="btn-remove"
                class:btn-remove--hidden={!shouldShowRemoveCounterRow(counterRows, row)}
                onclick={() => removeCounterRow(i)}
                aria-label={`Gegen-Deutung ${i + 1} entfernen`}
                aria-hidden={!shouldShowRemoveCounterRow(counterRows, row) ? true : undefined}
                tabindex={!shouldShowRemoveCounterRow(counterRows, row) ? -1 : undefined}
              >×</button>
            </div>
          </div>
        {/each}
      </fieldset>
    </section>

    <!-- Sektion 5: Unsicherheit -->
    <section class="card form-section">
      <h2>5. Unsicherheit</h2>
      <p class="helper">
        Wie sicher sind Sie sich in Ihrer Einschätzung? Unsicherheit explizit zu
        benennen ist ein Qualitätsmerkmal professioneller Reflexion.
      </p>

      <label class="field">
        <span class="field-label">Unsicherheitsstufe</span>
        <select bind:value={uncertaintyLevel}>
          {#each [0, 1, 2, 3, 4, 5] as lvl}
            <option value={lvl}>{uncertaintyLabels[lvl]}</option>
          {/each}
        </select>
      </label>

      <label class="field" class:field-error={fieldErrors['uncertaintyRationale']}>
        <span class="field-label">Begründung der Unsicherheit</span>
        <textarea id="field-uncertaintyRationale" bind:value={uncertaintyRationale} oninput={handleUncertaintyRationaleInput} rows="3" placeholder="z.B. Ich kenne die Vorgeschichte zwischen den Kindern nicht ausreichend…"></textarea>
        {#if fieldErrors['uncertaintyRationale']}<span class="field-error-msg">{fieldErrors['uncertaintyRationale']}</span>{/if}
      </label>
    </section>

    <div class="form-actions">
      <button type="submit" class="btn btn-primary" disabled={submitting}>
        Fall dokumentieren
      </button>
      <a href="/" class="btn">Abbrechen</a>
    </div>
  </form>
</div>

<style>
  .subtitle {
    color: var(--color-text-muted);
    margin-top: -0.5rem;
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
  }
  .error-box {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: var(--radius);
    padding: 0.75rem 1rem;
    margin-bottom: 1.25rem;
    color: var(--color-danger);
    font-size: 0.9rem;
  }
  .error-box p {
    margin: 0.2rem 0;
  }
  .form-section {
    margin-bottom: 1.25rem;
  }
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
  .field {
    display: block;
    margin-bottom: 0.75rem;
  }
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
  select {
    cursor: pointer;
  }
  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  @media (max-width: 500px) {
    .field-row { grid-template-columns: 1fr; }
  }
  .checkbox-field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    cursor: pointer;
  }
  .checkbox-field input {
    width: auto;
  }
  .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
    margin-bottom: 2rem;
  }

  /* Field-bound validation errors */
  .field-error textarea,
  .field-error input[type="text"] {
    border-color: var(--color-danger);
  }
  .field-error textarea:focus,
  .field-error input:focus {
    outline-color: var(--color-danger);
    border-color: var(--color-danger);
  }
  .field-error-msg {
    display: block;
    color: var(--color-danger);
    font-size: 0.8rem;
    margin-top: 0.25rem;
  }

  /* Multi-participant rows */
  .participants-fieldset {
    border: none;
    padding: 0;
    margin: 0;
  }
  .participants-fieldset legend {
    padding: 0;
  }
  .participant-row {
    grid-template-columns: 1fr 1fr auto;
    align-items: start;
  }
  .participant-row .field {
    margin-bottom: 0.4rem;
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
    margin-top: 0;
    align-self: start;
  }
  .btn-remove:hover {
    color: var(--color-danger);
    border-color: var(--color-danger);
  }
  .btn-remove--hidden {
    visibility: hidden;
    pointer-events: none;
  }
  /* Counter-interpretation (Gegen-Deutung) blocks */
  .counter-fieldset {
    border: none;
    padding: 0;
    margin: 0;
  }
  .counter-fieldset legend {
    padding: 0;
  }
  .counter-block {
    margin-bottom: 0.75rem;
  }
  .counter-block .field {
    margin-bottom: 0.25rem;
  }
  .counter-block-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .field-counter-evidence {
    flex: 1;
    margin-bottom: 0;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
</style>
