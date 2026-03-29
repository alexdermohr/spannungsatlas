<script lang="ts">
  import { goto } from '$app/navigation';
  import { startNewCase } from '$lib/services/case-service.js';
  import type { EvidenceType, UncertaintyLevel } from '$domain/types.js';

  let context = $state('');
  let participantName = $state('');
  let participantRole = $state<'primary' | 'secondary' | 'staff' | 'contextual'>('primary');

  let observationText = $state('');
  let isCameraDescribable = $state(false);

  let interpretationText = $state('');
  let interpretationEvidence = $state<EvidenceType>('derived');

  let counterText = $state('');
  let counterEvidence = $state<EvidenceType>('derived');

  let uncertaintyLevel = $state<UncertaintyLevel>(3);
  let uncertaintyRationale = $state('');

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

  function validate(): string[] {
    const errs: string[] = [];
    if (!context.trim()) errs.push('Kontext darf nicht leer sein.');
    if (!participantName.trim()) errs.push('Name der beteiligten Person fehlt.');
    if (!observationText.trim()) errs.push('Beobachtung darf nicht leer sein.');
    if (!interpretationText.trim()) errs.push('Deutung darf nicht leer sein.');
    if (!counterText.trim()) errs.push('Gegen-Deutung darf nicht leer sein.');
    if (!uncertaintyRationale.trim()) errs.push('Begründung der Unsicherheit fehlt.');
    if (observationText.trim() === interpretationText.trim()) {
      errs.push('Beobachtung und Deutung dürfen nicht identisch sein.');
    }
    if (interpretationText.trim() === counterText.trim()) {
      errs.push('Deutung und Gegen-Deutung dürfen nicht identisch sein.');
    }
    return errs;
  }

  function submit() {
    errors = validate();
    if (errors.length > 0) return;

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
        uncertaintyRationale: uncertaintyRationale.trim()
      });
      goto(`/cases/${created.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors = [`Validierungsfehler: ${msg}`];
      submitting = false;
    }
  }
</script>

<div class="page">
  <h1>Neuer Fall</h1>
  <p class="subtitle">Reflexionsdisziplin: Beobachtung → Deutung → Gegen-Deutung → Unsicherheit</p>

  {#if errors.length > 0}
    <div class="error-box">
      {#each errors as err}
        <p>{err}</p>
      {/each}
    </div>
  {/if}

  <form onsubmit={(e) => { e.preventDefault(); submit(); }}>
    <!-- Sektion 1: Kontext -->
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

    <!-- Sektion 2: Beobachtung -->
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

    <!-- Sektion 3: Deutung -->
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

    <!-- Sektion 4: Gegen-Deutung -->
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

      <label class="field">
        <span class="field-label">Begründung der Unsicherheit</span>
        <textarea bind:value={uncertaintyRationale} rows="3" placeholder="z.B. Ich kenne die Vorgeschichte zwischen den Kindern nicht ausreichend…"></textarea>
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
</style>
