<script lang="ts">
  import type { CameraStateStr } from './types.js';

  interface Props {
    title: string;
    observationText: string;
    isCameraDescribableStr: CameraStateStr;
    onChange?: () => void;
  }

  let {
    title,
    observationText = $bindable(),
    isCameraDescribableStr = $bindable(),
    onChange
  }: Props = $props();
</script>

<section class="card form-section slide">
  <h2>{title}</h2>
  <p class="helper">
    Beschreiben Sie nur das, was eine Kamera hätte aufnehmen können — ohne
    Bewertung oder Interpretation.
  </p>

  <label class="field">
    <span class="field-label">Beobachtungstext</span>
    <textarea
      bind:value={observationText}
      oninput={onChange}
      rows="5"
      placeholder="z.B. Kind A nimmt Kind B den Stift aus der Hand. Kind B sagt ‚Nein‘ und wendet sich ab."
    ></textarea>
  </label>

  <label class="field">
    <span class="field-label">Ist diese Beschreibung rein beobachtbar (Kamera-Test)?</span>
    <select bind:value={isCameraDescribableStr} onchange={onChange}>
      <option value="null">Bitte wählen…</option>
      <option value="true">Ja, rein beobachtbar</option>
      <option value="false">Nein, enthält Wertungen/Deutungen</option>
    </select>
  </label>
</section>

<style>
  .form-section { margin-bottom: 1.25rem; }
  .form-section h2 { font-size: 1.05rem; margin-bottom: 0.25rem; color: var(--color-accent); }
  .helper { font-size: 0.85rem; color: var(--color-text-muted); margin-top: 0; margin-bottom: 1rem; }
  .field { display: block; margin-bottom: 0.75rem; }
  .field-label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem; }
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
</style>