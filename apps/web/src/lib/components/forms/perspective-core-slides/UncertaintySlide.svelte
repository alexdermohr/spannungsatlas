<script lang="ts">
  import { uncertaintyLabels } from '$lib/ui/labels.js';
  import type { UncertaintyLevel } from '$domain/types.js';
  import type { UncertaintyRow } from './types.js';

  interface Props {
    title: string;
    uncertaintyRows: UncertaintyRow[];
    onChange?: () => void;
  }

  let {
    title,
    uncertaintyRows = $bindable(),
    onChange
  }: Props = $props();

  const uncertaintyLevelOptions: UncertaintyLevel[] = [0, 1, 2, 3, 4, 5];

  function notifyChange() {
    onChange?.();
  }

  function addUncertaintyRow() {
    uncertaintyRows = [...uncertaintyRows, { level: 2, rationale: '' }];
  }

  function removeUncertaintyRow(index: number) {
    if (uncertaintyRows.length > 1) {
      uncertaintyRows = uncertaintyRows.filter((_, i) => i !== index);
      notifyChange();
    }
  }
</script>

<section class="card form-section slide">
  <h2>{title}</h2>
  <p class="helper">
    Wie sicher sind Sie sich in Ihrer Einschätzung? Unsicherheit explizit
    zu benennen ist ein Qualitätsmerkmal professioneller Reflexion.
  </p>

  {#each uncertaintyRows as row, i}
    <div class="uncertainty-block">
      <span class="block-sub-heading">Unsicherheit {i + 1}</span>
      <label class="field">
        <span class="field-label">Stufe</span>
        <select bind:value={row.level} onchange={notifyChange}>
          {#each uncertaintyLevelOptions as lvl}
            <option value={lvl}>{uncertaintyLabels[lvl]}</option>
          {/each}
        </select>
      </label>
      <label class="field">
        <span class="field-label">Begründung</span>
        <textarea
          bind:value={row.rationale}
          oninput={notifyChange}
          rows="3"
          placeholder="z.B. Ich kenne die Vorgeschichte zwischen den Kindern nicht ausreichend…"
        ></textarea>
      </label>
      <div class="uncertainty-block-footer">
        {#if uncertaintyRows.length > 1}
          <button
            type="button"
            class="btn-remove"
            onclick={() => removeUncertaintyRow(i)}
            aria-label={`Unsicherheit ${i + 1} entfernen`}
          >×</button>
        {/if}
      </div>
    </div>
  {/each}
  <button type="button" class="btn" onclick={addUncertaintyRow}>+ Weitere Unsicherheit</button>
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
  .uncertainty-block {
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border);
  }
  .uncertainty-block:last-of-type { border-bottom: none; }
  .uncertainty-block-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: space-between;
  }
  .block-sub-heading {
    display: block;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--color-text-muted);
    margin-bottom: 0.3rem;
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
  }
  .btn-remove:hover { color: var(--color-danger); border-color: var(--color-danger); }
</style>