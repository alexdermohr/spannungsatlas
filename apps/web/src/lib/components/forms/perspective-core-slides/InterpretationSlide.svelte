<script lang="ts">
  import { evidenceLabels } from '$lib/ui/labels.js';
  import type { EvidenceType } from '$domain/types.js';

  interface Props {
    title: string;
    interpretationText: string;
    interpretationEvidence: EvidenceType;
    onChange?: () => void;
  }

  let {
    title,
    interpretationText = $bindable(),
    interpretationEvidence = $bindable(),
    onChange
  }: Props = $props();
</script>

<section class="card form-section slide">
  <h2>{title}</h2>
  <p class="helper">
    Wie interpretieren Sie das Beobachtete? Markieren Sie die Evidenznähe
    Ihrer Deutung.
  </p>

  <label class="field">
    <span class="field-label">Deutungstext</span>
    <textarea
      bind:value={interpretationText}
      oninput={onChange}
      rows="4"
      placeholder="z.B. Kind A zeigt möglicherweise Frustration über die eigene Impulskontrolle…"
    ></textarea>
  </label>

  <label class="field">
    <span class="field-label">Evidenztyp</span>
    <select bind:value={interpretationEvidence} onchange={onChange}>
      {#each Object.entries(evidenceLabels) as [value, label]}
        <option {value}>{label}</option>
      {/each}
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