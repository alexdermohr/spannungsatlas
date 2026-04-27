<script lang="ts">
  import type { CounterRow, UncertaintyRow, CameraStateStr } from './types.js';
  import { evidenceLabels, uncertaintyLabels } from '$lib/ui/labels.js';

  interface Props {
    title: string;
    observationText: string;
    isCameraDescribableStr: CameraStateStr;
    interpretationText: string;
    counterRows: CounterRow[];
    uncertaintyRows: UncertaintyRow[];
    selectedNeedIds: string[];
    selectedDeterminantIds: string[];
  }

  let {
    title,
    observationText,
    isCameraDescribableStr,
    interpretationText,
    counterRows,
    uncertaintyRows,
    selectedNeedIds,
    selectedDeterminantIds
  }: Props = $props();

  const filledCounterRows = $derived(counterRows.filter((r) => r.text.trim() !== ''));
  const filledUncertaintyRows = $derived(uncertaintyRows.filter((r) => r.rationale.trim() !== ''));
</script>

<section class="card form-section slide">
  <h2>{title}</h2>
  <p class="helper">
    Prüfen Sie Ihre Eingaben. Leere Einträge werden beim Speichern entfernt;
    für den Abschluss sind Beobachtung, Deutung, mindestens eine Gegen-Deutung
    und mindestens eine Unsicherheit erforderlich.
  </p>

  <dl class="summary-list">
    <dt>Beobachtung</dt>
    <dd>{observationText.trim() || '— (noch leer)'}</dd>

    <dt>Kamera-Test</dt>
    <dd>
      {#if isCameraDescribableStr === 'true'}Ja, rein beobachtbar
      {:else if isCameraDescribableStr === 'false'}Nein, enthält Wertungen
      {:else}— (noch nicht gewählt){/if}
    </dd>

    <dt>Deutung</dt>
    <dd>{interpretationText.trim() || '— (noch leer)'}</dd>

    <dt>Gegen-Deutungen</dt>
    <dd>
      {#if filledCounterRows.length}
        <ol class="review-list">
          {#each filledCounterRows as row}
            <li>
              <span class="review-item-text">{row.text.trim()}</span>
              <small class="review-item-meta">{evidenceLabels[row.evidence]}</small>
            </li>
          {/each}
        </ol>
      {:else}
        — (noch leer)
      {/if}
    </dd>

    <dt>Unsicherheiten</dt>
    <dd>
      {#if filledUncertaintyRows.length}
        <ol class="review-list">
          {#each filledUncertaintyRows as row}
            <li>
              <span class="review-item-text">{row.rationale.trim()}</span>
              <small class="review-item-meta">Stufe {uncertaintyLabels[row.level]}</small>
            </li>
          {/each}
        </ol>
      {:else}
        — (noch leer)
      {/if}
    </dd>

    <dt>Exploration</dt>
    <dd>
      {selectedNeedIds.length} Bedürfnis(se), {selectedDeterminantIds.length} Determinante(n)
    </dd>
  </dl>
</section>

<style>
  .form-section { margin-bottom: 1.25rem; }
  .form-section h2 { font-size: 1.05rem; margin-bottom: 0.25rem; color: var(--color-accent); }
  .helper { font-size: 0.85rem; color: var(--color-text-muted); margin-top: 0; margin-bottom: 1rem; }
  .summary-list {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.35rem 0.85rem;
    margin: 0;
  }
  .summary-list dt {
    font-weight: 600;
    font-size: 0.82rem;
    color: var(--color-text-muted);
    padding-top: 0.15rem;
  }
  .summary-list dd {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-text);
    white-space: pre-wrap;
  }
  .review-list {
    margin: 0;
    padding-left: 1.1rem;
    list-style: decimal;
    white-space: normal;
  }
  .review-list li {
    margin-bottom: 0.3rem;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  .review-item-text { font-size: 0.9rem; }
  .review-item-meta {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
</style>