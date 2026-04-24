<script lang="ts">
  import type { CounterRow, UncertaintyRow, CameraStateStr } from './types.js';

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
    <dd>{counterRows.filter((r) => r.text.trim() !== '').length} gefüllt</dd>

    <dt>Unsicherheiten</dt>
    <dd>{uncertaintyRows.filter((r) => r.rationale.trim() !== '').length} gefüllt</dd>

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
  }
  .summary-list dd {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-text);
    white-space: pre-wrap;
  }
</style>