<script lang="ts">
  import { goto } from '$app/navigation';
  import { startNewCase } from '$lib/services/case-service.js';
  import type { EvidenceType, ParticipantRole, TensionDirection, UncertaintyLevel } from '$domain/types.js';
  import type { TensionEdgeInput } from '$lib/services/case-service.js';

  let currentStep = $state(1);
  const totalSteps = 6;

  let context = $state('');
  let participantName = $state('');
  let participantRole = $state<ParticipantRole>('primary');

  let observationText = $state('');
  let isCameraDescribable = $state(false);

  let interpretationText = $state('');
  let interpretationEvidence = $state<EvidenceType>('derived');

  let counterText = $state('');
  let counterEvidence = $state<EvidenceType>('derived');

  let uncertaintyLevel = $state<UncertaintyLevel>(3);
  let uncertaintyRationale = $state('');

  let tensions = $state<TensionEdgeInput[]>([]);

  let errors = $state<string[]>([]);
  let submitting = $state(false);

  const evidenceLabels: Record<EvidenceType, string> = {
    observational: 'Beobachtungsnah',
    derived: 'Abgeleitet',
    speculative: 'Spekulativ'
  };

  const roleLabels: Record<string, string> = {
    primary: 'Primär',
    secondary: 'Sekundär',
    staff: 'Fachkraft',
    contextual: 'Kontextuell'
  };

  const uncertaintyLabels: Record<number, string> = {
    0: '0 — Sicher',
    1: '1 — Weitgehend sicher',
    2: '2 — Wahrscheinlich',
    3: '3 — Unsicher',
    4: '4 — Sehr unsicher',
    5: '5 — Hochspekulativ'
  };

  const stepLabels: Record<number, string> = {
    1: 'Kontext',
    2: 'Beobachtung',
    3: 'Deutung',
    4: 'Gegen-Deutung',
    5: 'Unsicherheit',
    6: 'Spannungen'
  };

  function validateStep(step: number): string[] {
    const errs: string[] = [];
    switch (step) {
      case 1:
        if (!context.trim()) errs.push('Kontext darf nicht leer sein.');
        if (!participantName.trim()) errs.push('Name der beteiligten Person fehlt.');
        break;
      case 2:
        if (!observationText.trim()) errs.push('Beobachtung darf nicht leer sein.');
        break;
      case 3:
        if (!interpretationText.trim()) errs.push('Deutung darf nicht leer sein.');
        if (observationText.trim() === interpretationText.trim()) {
          errs.push('Beobachtung und Deutung dürfen nicht identisch sein.');
        }
        break;
      case 4:
        if (!counterText.trim()) errs.push('Gegen-Deutung darf nicht leer sein.');
        if (interpretationText.trim() === counterText.trim()) {
          errs.push('Deutung und Gegen-Deutung dürfen nicht identisch sein.');
        }
        break;
      case 5:
        if (!uncertaintyRationale.trim()) errs.push('Begründung der Unsicherheit fehlt.');
        break;
    }
    return errs;
  }

  function nextStep() {
    errors = validateStep(currentStep);
    if (errors.length > 0) return;
    if (currentStep < totalSteps) {
      currentStep++;
      errors = [];
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
      errors = [];
    }
  }

  function addTension() {
    tensions = [...tensions, {
      source: participantName || '',
      target: '',
      label: '',
      context: '',
      direction: 'unidirectional' as TensionDirection
    }];
  }

  function removeTension(index: number) {
    tensions = tensions.filter((_, i) => i !== index);
  }

  function submit() {
    // Validate all steps
    for (let s = 1; s <= 5; s++) {
      const stepErrors = validateStep(s);
      if (stepErrors.length > 0) {
        errors = stepErrors;
        currentStep = s;
        return;
      }
    }

    // Validate tensions if any
    const validTensions = tensions.filter(t =>
      t.source.trim() && t.target.trim() && t.label.trim() && t.context.trim()
    );

    submitting = true;
    try {
      const created = startNewCase({
        context: context.trim(),
        participantName: participantName.trim(),
        participantRole,
        observationText: observationText.trim(),
        isCameraDescribable,
        interpretationText: interpretationText.trim(),
        interpretationEvidenceType: interpretationEvidence,
        counterInterpretationText: counterText.trim(),
        counterInterpretationEvidenceType: counterEvidence,
        uncertaintyLevel,
        uncertaintyRationale: uncertaintyRationale.trim(),
        tensions: validTensions.length > 0 ? validTensions : undefined
      });
      goto(`/cases/${created.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors = [msg];
      submitting = false;
    }
  }
</script>

<div class="page">
  <h1>Neuer Fall</h1>
  <p class="subtitle">Reflexionsdisziplin: Schritt für Schritt vom Beobachteten zur Einordnung</p>

  <!-- Step indicator -->
  <div class="stepper">
    {#each Array.from({ length: totalSteps }, (_, i) => i + 1) as step}
      <button
        class="step"
        class:step-active={currentStep === step}
        class:step-done={currentStep > step}
        class:step-future={currentStep < step}
        onclick={() => {
          if (step < currentStep) { currentStep = step; errors = []; }
        }}
        disabled={step > currentStep}
      >
        <span class="step-number">{step}</span>
        <span class="step-label">{stepLabels[step]}</span>
      </button>
      {#if step < totalSteps}
        <div class="step-connector" class:step-connector-done={currentStep > step}></div>
      {/if}
    {/each}
  </div>

  {#if errors.length > 0}
    <div class="error-box">
      {#each errors as err}
        <p>{err}</p>
      {/each}
    </div>
  {/if}

  <form onsubmit={(e) => { e.preventDefault(); submit(); }}>
    <!-- Schritt 1: Kontext -->
    {#if currentStep === 1}
      <section class="card form-section">
        <h2>1. Kontext</h2>
        <p class="helper">Beschreiben Sie die Situation und das Setting, in dem die Beobachtung stattfand.</p>

        <label class="field">
          <span class="field-label">Situationskontext</span>
          <textarea bind:value={context} rows="3" placeholder="z.B. Mittagssituation in der Kita, Gruppenraum, 12 Kinder anwesend…"></textarea>
        </label>

        <div class="field-row">
          <label class="field">
            <span class="field-label">Beteiligte Person</span>
            <input type="text" bind:value={participantName} placeholder="Name oder Pseudonym" />
          </label>
          <label class="field">
            <span class="field-label">Rolle</span>
            <select bind:value={participantRole}>
              {#each Object.entries(roleLabels) as [value, label]}
                <option {value}>{label}</option>
              {/each}
            </select>
          </label>
        </div>
      </section>
    {/if}

    <!-- Schritt 2: Beobachtung -->
    {#if currentStep === 2}
      <section class="card form-section">
        <h2>2. Beobachtung</h2>
        <p class="helper">
          Was genau haben Sie gesehen oder gehört? Beschreiben Sie nur das, was eine Kamera
          hätte aufnehmen können — ohne Bewertung oder Interpretation.
        </p>

        <label class="field">
          <span class="field-label">Beobachtungstext</span>
          <textarea bind:value={observationText} rows="4" placeholder="z.B. Kind A nimmt Kind B den Stift aus der Hand. Kind B sagt ‚Nein' und wendet sich ab."></textarea>
        </label>

        <label class="checkbox-field">
          <input type="checkbox" bind:checked={isCameraDescribable} />
          <span>Ich halte diese Beschreibung für kamerabeschreibbar</span>
        </label>
      </section>
    {/if}

    <!-- Schritt 3: Deutung -->
    {#if currentStep === 3}
      <section class="card form-section">
        <h2>3. Deutung</h2>
        <p class="helper">
          Wie interpretieren Sie das Beobachtete? Was könnte dahinter stehen?
          Markieren Sie die Evidenznähe Ihrer Deutung.
        </p>

        <label class="field">
          <span class="field-label">Deutungstext</span>
          <textarea bind:value={interpretationText} rows="4" placeholder="z.B. Kind A zeigt möglicherweise Frustration über die eigene Impulskontrolle…"></textarea>
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
    {/if}

    <!-- Schritt 4: Gegen-Deutung -->
    {#if currentStep === 4}
      <section class="card form-section">
        <h2>4. Gegen-Deutung</h2>
        <p class="helper">
          Welche alternative Erklärung wäre ebenfalls denkbar? Die Gegen-Deutung zwingt
          zur Perspektiverweiterung und verhindert vorschnelle Festlegung.
        </p>

        <label class="field">
          <span class="field-label">Gegen-Deutungstext</span>
          <textarea bind:value={counterText} rows="4" placeholder="z.B. Kind A imitiert möglicherweise ein Verhalten, das es bei anderen Kindern beobachtet hat…"></textarea>
        </label>

        <label class="field">
          <span class="field-label">Evidenztyp</span>
          <select bind:value={counterEvidence}>
            {#each Object.entries(evidenceLabels) as [value, label]}
              <option {value}>{label}</option>
            {/each}
          </select>
        </label>
      </section>
    {/if}

    <!-- Schritt 5: Unsicherheit -->
    {#if currentStep === 5}
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

        <label class="field">
          <span class="field-label">Begründung der Unsicherheit</span>
          <textarea bind:value={uncertaintyRationale} rows="3" placeholder="z.B. Ich kenne die Vorgeschichte zwischen den Kindern nicht ausreichend…"></textarea>
        </label>
      </section>
    {/if}

    <!-- Schritt 6: Spannungen (optional) -->
    {#if currentStep === 6}
      <section class="card form-section">
        <h2>6. Spannungen <span class="optional-tag">(optional)</span></h2>
        <p class="helper">
          Modellieren Sie Spannungsbeziehungen zwischen beteiligten Akteuren.
          Jede Spannung beschreibt eine gerichtete oder wechselseitige Dynamik
          zwischen zwei Akteuren in einem bestimmten Kontext.
        </p>

        {#each tensions as tension, i}
          <div class="tension-form card">
            <div class="tension-form-header">
              <strong>Spannung {i + 1}</strong>
              <button type="button" class="btn btn-sm btn-danger" onclick={() => removeTension(i)}>Entfernen</button>
            </div>
            <div class="field-row">
              <label class="field">
                <span class="field-label">Quelle</span>
                <input type="text" bind:value={tension.source} placeholder="Akteur A" />
              </label>
              <label class="field">
                <span class="field-label">Ziel</span>
                <input type="text" bind:value={tension.target} placeholder="Akteur B" />
              </label>
            </div>
            <label class="field">
              <span class="field-label">Bezeichnung</span>
              <input type="text" bind:value={tension.label} placeholder="z.B. Machtkonflikt, Zugehörigkeitsspannung" />
            </label>
            <label class="field">
              <span class="field-label">Kontext der Spannung</span>
              <input type="text" bind:value={tension.context} placeholder="In welcher Situation zeigt sich diese Spannung?" />
            </label>
            <label class="field">
              <span class="field-label">Richtung</span>
              <select bind:value={tension.direction}>
                <option value="unidirectional">Einseitig (→)</option>
                <option value="bidirectional">Wechselseitig (↔)</option>
              </select>
            </label>
          </div>
        {/each}

        <button type="button" class="btn" onclick={addTension}>
          + Spannung hinzufügen
        </button>
      </section>
    {/if}

    <!-- Navigation -->
    <div class="form-actions">
      {#if currentStep > 1}
        <button type="button" class="btn" onclick={prevStep}>← Zurück</button>
      {/if}

      {#if currentStep < totalSteps}
        <button type="button" class="btn btn-primary" onclick={nextStep}>
          Weiter zu: {stepLabels[currentStep + 1]} →
        </button>
      {:else}
        <button type="submit" class="btn btn-primary" disabled={submitting}>
          Fall dokumentieren
        </button>
      {/if}

      <a href="/" class="btn btn-cancel">Abbrechen</a>
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
  .stepper {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 1.5rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }
  .step {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-surface);
    font-size: 0.75rem;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
    color: var(--color-text-muted);
  }
  .step:disabled {
    cursor: default;
    opacity: 0.6;
  }
  .step-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    font-size: 0.7rem;
    font-weight: 700;
    background: var(--color-border);
    color: var(--color-text-muted);
    flex-shrink: 0;
  }
  .step-active {
    border-color: var(--color-accent);
    background: var(--color-accent-light);
    color: var(--color-accent);
  }
  .step-active .step-number {
    background: var(--color-accent);
    color: #fff;
  }
  .step-done {
    border-color: var(--color-success);
    color: var(--color-success);
  }
  .step-done .step-number {
    background: var(--color-success);
    color: #fff;
  }
  .step-connector {
    width: 1rem;
    height: 2px;
    background: var(--color-border);
    flex-shrink: 0;
  }
  .step-connector-done {
    background: var(--color-success);
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
    .step-label { display: none; }
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
  .optional-tag {
    font-size: 0.8rem;
    font-weight: 400;
    color: var(--color-text-muted);
  }
  .tension-form {
    margin-bottom: 0.75rem;
    padding: 1rem;
    background: var(--color-bg);
  }
  .tension-form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  .btn-sm {
    padding: 0.25rem 0.6rem;
    font-size: 0.8rem;
  }
  .btn-danger {
    background: var(--color-danger);
    color: #fff;
    border-color: var(--color-danger);
  }
  .btn-danger:hover {
    background: #9b2c2c;
  }
  .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }
  .btn-cancel {
    margin-left: auto;
  }
</style>
