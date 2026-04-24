<script lang="ts">
  import { evidenceLabels } from '$lib/ui/labels.js';
  import type { CounterRow } from './types.js';

  interface Props {
    title: string;
    counterRows: CounterRow[];
    onChange?: () => void;
  }

  let {
    title,
    counterRows = $bindable(),
    onChange
  }: Props = $props();

  function notifyChange() {
    onChange?.();
  }

  function addCounterRow() {
    counterRows = [...counterRows, { text: '', evidence: 'observational' }];
    notifyChange();
  }

  function removeCounterRow(index: number) {
    if (counterRows.length > 1) {
      counterRows = counterRows.filter((_, i) => i !== index);
      notifyChange();
    }
  }
</script>

<section class="card form-section slide">
  <h2>{title}</h2>
  <p class="helper">
    Welche alternative Erklärung wäre denkbar? Die Gegen-Deutung zwingt zur
    Perspektiverweiterung und verhindert vorschnelle Festlegung.
  </p>

  {#each counterRows as row, i}
    <div class="counter-block">
      <span class="block-sub-heading">Gegen-Deutung {i + 1}</span>
      <label class="field">
        <textarea
          bind:value={row.text}
          oninput={notifyChange}
          rows="3"
          placeholder="z.B. Kind A imitiert möglicherweise ein Verhalten, das es bei anderen beobachtet hat…"
        ></textarea>
      </label>
      <div class="counter-block-footer">
        <label class="field field-counter-evidence">
          <select bind:value={row.evidence} onchange={notifyChange}>
            {#each Object.entries(evidenceLabels) as [value, label]}
              <option {value}>{label}</option>
            {/each}
          </select>
        </label>
        {#if counterRows.length > 1}
          <button
            type="button"
            class="btn-remove"
            onclick={() => removeCounterRow(i)}
            aria-label={`Gegen-Deutung ${i + 1} entfernen`}
          >×</button>
        {/if}
      </div>
    </div>
  {/each}
  <button type="button" class="btn" onclick={addCounterRow}>+ Weitere Gegen-Deutung</button>
</section>

<style>
  .form-section { margin-bottom: 1.25rem; }
  .form-section h2 { font-size: 1.05rem; margin-bottom: 0.25rem; color: var(--color-accent); }
  .helper { font-size: 0.85rem; color: var(--color-text-muted); margin-top: 0; margin-bottom: 1rem; }
  .field { display: block; margin-bottom: 0.75rem; }
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
  .counter-block {
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border);
  }
  .counter-block:last-of-type { border-bottom: none; }
  .counter-block-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: space-between;
  }
  .field-counter-evidence { flex: 1; margin-bottom: 0; }
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