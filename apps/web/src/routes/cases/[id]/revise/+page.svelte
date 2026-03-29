<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { getCase, addRevision } from '$lib/services/case-service.js';
  import type { Case, DriftType, EvidenceType, UncertaintyLevel } from '$domain/types.js';

  let caseData: Case | null = $state(null);
  let loaded = $state(false);

  // Form state — prefilled from current reflection
  let interpretationText = $state('');
  let interpretationEvidence = $state<EvidenceType>('derived');
  let counterText = $state('');
  let counterEvidence = $state<EvidenceType>('derived');
  let uncertaintyLevel = $state<UncertaintyLevel>(3);
  let uncertaintyRationale = $state('');
  let driftType = $state<DriftType>('new_observation');
  let revisionReason = $state('');

  let errors = $state<string[]>([]);
  let submitting = $state(false);

  const evidenceLabels: Record<EvidenceType, string> = {
    observational: 'Beobachtungsnah',
    derived: 'Abgeleitet',
    speculative: 'Spekulativ'
  };

  const driftLabels: Record<DriftType, string> = {
    new_observation: 'Neue Beobachtung',
    new_perspective: 'Neue Perspektive',
    reinterpretation: 'Uminterpretation'
  };

  const driftDescriptions: Record<DriftType, string> = {
    new_observation: 'Zusätzliche Wahrnehmung verändert das Bild.',
    new_perspective: 'Gleiche Beobachtung, anderer Blickwinkel.',
    reinterpretation: 'Grundlegende Neubewertung der vorhandenen Daten.'
  };

  const uncertaintyLabels: Record<number, string> = {
    0: '0 — Sicher',
    1: '1 — Weitgehend sicher',
    2: '2 — Wahrscheinlich',
    3: '3 — Unsicher',
    4: '4 — Sehr unsicher',
    5: '5 — Hochspekulativ'
  };

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
    if (caseData) {
      // Prefill with current reflection for easier editing
      interpretationText = caseData.currentReflection.interpretation.text;
      interpretationEvidence = caseData.currentReflection.interpretation.evidenceType;
      counterText = caseData.currentReflection.counterInterpretation.text;
      counterEvidence = caseData.currentReflection.counterInterpretation.evidenceType;
      uncertaintyLevel = caseData.currentReflection.uncertainty.level;
      uncertaintyRationale = caseData.currentReflection.uncertainty.rationale;
    }
    loaded = true;
  });

  function validate(): string[] {
    const errs: string[] = [];
    if (!interpretationText.trim()) errs.push('Deutung darf nicht leer sein.');
    if (!counterText.trim()) errs.push('Gegen-Deutung darf nicht leer sein.');
    if (!uncertaintyRationale.trim()) errs.push('Begründung der Unsicherheit fehlt.');
    if (!revisionReason.trim()) errs.push('Begründung der Revision fehlt.');
    if (interpretationText.trim() === counterText.trim()) {
      errs.push('Deutung und Gegen-Deutung dürfen nicht identisch sein.');
    }
    return errs;
  }

  function submit() {
    if (!caseData) return;
    errors = validate();
    if (errors.length > 0) return;

    submitting = true;
    try {
      addRevision(caseData.id, {
        interpretationText: interpretationText.trim(),
        interpretationEvidenceType: interpretationEvidence,
        counterInterpretationText: counterText.trim(),
        counterInterpretationEvidenceType: counterEvidence,
        uncertaintyLevel,
        uncertaintyRationale: uncertaintyRationale.trim(),
        driftType,
        reason: revisionReason.trim()
      });
      goto(`/cases/${caseData.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors = [msg];
      submitting = false;
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
    <h1>Revision erstellen</h1>
    <p class="subtitle">
      Dokumentieren Sie die Veränderung Ihres Denkstands — nicht als Korrektur,
      sondern als nachvollziehbare Entwicklung.
    </p>

    <!-- Current state reference -->
    <section class="card current-state">
      <h2>Aktueller Denkstand</h2>
      <p class="state-date">Reflektiert am {formatDate(caseData.currentReflection.reflectedAt)}</p>
      <div class="state-grid">
        <div>
          <strong>Deutung:</strong>
          <p class="state-text">{caseData.currentReflection.interpretation.text}</p>
        </div>
        <div>
          <strong>Gegen-Deutung:</strong>
          <p class="state-text">{caseData.currentReflection.counterInterpretation.text}</p>
        </div>
      </div>
      <div class="state-uncertainty">
        <strong>Unsicherheit:</strong> Stufe {caseData.currentReflection.uncertainty.level}/5
        — {caseData.currentReflection.uncertainty.rationale}
      </div>
    </section>

    {#if errors.length > 0}
      <div class="error-box">
        {#each errors as err}
          <p>{err}</p>
        {/each}
      </div>
    {/if}

    <form onsubmit={(e) => { e.preventDefault(); submit(); }}>
      <!-- Drift classification -->
      <section class="card form-section">
        <h2>1. Art der Veränderung (Drift)</h2>
        <p class="helper">
          Wie hat sich Ihr Denken verändert? Die Klassifikation macht die Art der
          Denkbewegung explizit — gemäß MASTERPLAN §2 #21.
        </p>

        <div class="drift-options">
          {#each Object.entries(driftLabels) as [value, label]}
            <label class="drift-option" class:drift-selected={driftType === value}>
              <input type="radio" name="driftType" {value} bind:group={driftType} />
              <span class="drift-label">{label}</span>
              <span class="drift-desc">{driftDescriptions[value as DriftType]}</span>
            </label>
          {/each}
        </div>

        <label class="field">
          <span class="field-label">Begründung der Revision</span>
          <textarea bind:value={revisionReason} rows="3" placeholder="Warum hat sich Ihr Denkstand verändert? Auf welche Beobachtung, Perspektive oder Erkenntnis bezieht sich die Veränderung?"></textarea>
        </label>
      </section>

      <!-- New interpretation -->
      <section class="card form-section">
        <h2>2. Neue Deutung</h2>
        <p class="helper">
          Formulieren Sie Ihre aktualisierte Deutung. Sie können den bisherigen Text
          überarbeiten oder komplett neu formulieren.
        </p>

        <label class="field">
          <span class="field-label">Deutungstext</span>
          <textarea bind:value={interpretationText} rows="4"></textarea>
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

      <!-- New counter-interpretation -->
      <section class="card form-section">
        <h2>3. Neue Gegen-Deutung</h2>
        <p class="helper">
          Welche alternative Erklärung ist weiterhin oder neu denkbar?
        </p>

        <label class="field">
          <span class="field-label">Gegen-Deutungstext</span>
          <textarea bind:value={counterText} rows="4"></textarea>
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

      <!-- New uncertainty -->
      <section class="card form-section">
        <h2>4. Unsicherheit neu bewerten</h2>
        <p class="helper">
          Hat sich Ihre Einschätzung der Unsicherheit verändert?
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
          <span class="field-label">Begründung</span>
          <textarea bind:value={uncertaintyRationale} rows="3"></textarea>
        </label>
      </section>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" disabled={submitting}>
          Revision dokumentieren
        </button>
        <a href="/cases/{caseData.id}" class="btn">Abbrechen</a>
      </div>
    </form>
  {/if}
</div>

<style>
  .subtitle {
    color: var(--color-text-muted);
    margin-top: -0.5rem;
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
  }
  .empty-state {
    text-align: center;
    padding: 2.5rem 1.5rem;
  }
  .current-state {
    background: var(--color-accent-light);
    border-color: var(--color-accent);
    margin-bottom: 1.5rem;
  }
  .current-state h2 {
    font-size: 1rem;
    color: var(--color-accent);
    margin-bottom: 0.25rem;
  }
  .state-date {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin: 0 0 0.75rem;
  }
  .state-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  @media (max-width: 600px) {
    .state-grid { grid-template-columns: 1fr; }
  }
  .state-grid strong {
    font-size: 0.85rem;
    color: var(--color-accent);
  }
  .state-text {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin: 0.2rem 0 0;
  }
  .state-uncertainty {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    font-style: italic;
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
  .drift-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .drift-option {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }
  .drift-option:hover {
    border-color: var(--color-accent);
  }
  .drift-selected {
    border-color: var(--color-accent);
    background: var(--color-accent-light);
  }
  .drift-option input[type="radio"] {
    margin-top: 0.15rem;
    flex-shrink: 0;
  }
  .drift-label {
    font-weight: 600;
    font-size: 0.9rem;
    white-space: nowrap;
    margin-right: 0.5rem;
  }
  .drift-desc {
    font-size: 0.8rem;
    color: var(--color-text-muted);
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
  textarea, select {
    width: 100%;
    padding: 0.5rem 0.65rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-family: inherit;
    font-size: 0.9rem;
    background: var(--color-bg);
    color: var(--color-text);
  }
  textarea:focus, select:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: -1px;
    border-color: var(--color-accent);
  }
  select {
    cursor: pointer;
  }
  .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
    margin-bottom: 2rem;
  }
</style>
