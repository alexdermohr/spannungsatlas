<!--
  Gemeinsame Folienlogik für den epistemischen Kern der Perspektivenerfassung.

  Wird von zwei Routen identisch verwendet:
    - /cases/new                        (erste Perspektive beim Fallanlegen)
    - /cases/[id]/perspectives/new      (weitere Perspektive zu bestehendem Fall)

  Folien:
    1. Beobachtung
    2. Explorationsraum  (eigenständige Folie, kein Inline-Aufklappen)
    3. Deutung
    4. Gegen-Deutungen
    5. Unsicherheit
    6. Prüfen / Abschluss

  Zusatzmetadaten (Fallkontext, Teilnehmer, Actor-Auswahl) liegen außerhalb
  und werden von den Routen selbst vor oder neben diese Folien gesetzt.
-->
<script lang="ts">
  import type { EvidenceType, UncertaintyLevel } from '$domain/types.js';
  import SlideNav from '$lib/components/forms/perspective-core-slides/SlideNav.svelte';
  import ObservationSlide from '$lib/components/forms/perspective-core-slides/ObservationSlide.svelte';
  import ExplorationSlide from '$lib/components/forms/perspective-core-slides/ExplorationSlide.svelte';
  import InterpretationSlide from '$lib/components/forms/perspective-core-slides/InterpretationSlide.svelte';
  import CounterInterpretationsSlide from '$lib/components/forms/perspective-core-slides/CounterInterpretationsSlide.svelte';
  import UncertaintySlide from '$lib/components/forms/perspective-core-slides/UncertaintySlide.svelte';
  import ReviewSlide from '$lib/components/forms/perspective-core-slides/ReviewSlide.svelte';
  import type { CounterRow, UncertaintyRow, CameraStateStr } from '$lib/components/forms/perspective-core-slides/types.js';

  interface Props {
    observationText: string;
    isCameraDescribableStr: CameraStateStr;
    interpretationText: string;
    interpretationEvidence: EvidenceType;
    counterRows: CounterRow[];
    uncertaintyRows: UncertaintyRow[];
    selectedNeedIds: string[];
    selectedDeterminantIds: string[];
    currentSlide?: number;
    submitLabel: string;
    cancelHref: string;
    errorMsg?: string;
    onSubmit: () => void;
    // Optional route-owned draft persistence hook. The existing-perspective route
    // passes saveDraft for actor-specific autosave; the new-case route omits this
    // because case creation currently has no persisted draft model.
    onChange?: () => void;
  }

  let {
    observationText = $bindable(),
    isCameraDescribableStr = $bindable(),
    interpretationText = $bindable(),
    interpretationEvidence = $bindable(),
    counterRows = $bindable(),
    uncertaintyRows = $bindable(),
    selectedNeedIds = $bindable(),
    selectedDeterminantIds = $bindable(),
    currentSlide = $bindable(1),
    submitLabel,
    cancelHref,
    errorMsg = '',
    onSubmit,
    onChange
  }: Props = $props();

  const totalSlides = 6;

  function notifyChange() {
    onChange?.();
  }

  function gotoSlide(n: number) {
    if (n < 1 || n > totalSlides) return;
    currentSlide = n;
  }
  function next() {
    gotoSlide(Math.min(currentSlide + 1, totalSlides));
  }
  function prev() {
    gotoSlide(Math.max(currentSlide - 1, 1));
  }

  const slideTitles = [
    '1. Beobachtung',
    '2. Explorationsraum',
    '3. Deutung',
    '4. Gegen-Deutungen',
    '5. Unsicherheit',
    '6. Prüfen'
  ];
</script>

<div class="slides-root">
  <SlideNav {slideTitles} {currentSlide} onSelect={gotoSlide} />

  {#if errorMsg}
    <div class="error-box" role="alert">
      <p><strong>Fehler:</strong> {errorMsg}</p>
    </div>
  {/if}

  <form onsubmit={(e) => { e.preventDefault(); onSubmit(); }}>
    {#if currentSlide === 1}
      <ObservationSlide
        title={slideTitles[0]}
        bind:observationText
        bind:isCameraDescribableStr
        onChange={notifyChange}
      />
    {/if}

    {#if currentSlide === 2}
      <ExplorationSlide
        title={slideTitles[1]}
        bind:selectedNeedIds
        bind:selectedDeterminantIds
        onChange={notifyChange}
      />
    {/if}

    {#if currentSlide === 3}
      <InterpretationSlide
        title={slideTitles[2]}
        bind:interpretationText
        bind:interpretationEvidence
        onChange={notifyChange}
      />
    {/if}

    {#if currentSlide === 4}
      <CounterInterpretationsSlide
        title={slideTitles[3]}
        bind:counterRows
        onChange={notifyChange}
      />
    {/if}

    {#if currentSlide === 5}
      <UncertaintySlide
        title={slideTitles[4]}
        bind:uncertaintyRows
        onChange={notifyChange}
      />
    {/if}

    {#if currentSlide === 6}
      <ReviewSlide
        title={slideTitles[5]}
        {observationText}
        {isCameraDescribableStr}
        {interpretationText}
        {counterRows}
        {uncertaintyRows}
        {selectedNeedIds}
        {selectedDeterminantIds}
      />
    {/if}

    <div class="form-actions">
      <button
        type="button"
        class="btn"
        onclick={prev}
        disabled={currentSlide === 1}
      >← Zurück</button>

      {#if currentSlide < totalSlides}
        <button type="button" class="btn btn-primary" onclick={next}>
          Weiter →
        </button>
      {:else}
        <button type="submit" class="btn btn-primary">{submitLabel}</button>
      {/if}

      <a href={cancelHref} class="btn">Abbrechen</a>
    </div>
  </form>
</div>

<style>
  .slides-root { display: block; }
  .error-box {
    background: var(--color-error-bg);
    border: 1px solid var(--color-error-border);
    border-radius: var(--radius);
    padding: 0.75rem 1rem;
    margin-bottom: 1.25rem;
    color: var(--color-danger);
  }
  .error-box p { margin: 0.2rem 0; }
  .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }
</style>
