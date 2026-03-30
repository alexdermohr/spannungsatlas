<script lang="ts">
  import { themeMode, setThemeMode, type ThemeMode } from '$lib/stores/theme.js';

  const modes: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Hell', icon: '☀️' },
    { value: 'dark', label: 'Dunkel', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' }
  ];
</script>

<div class="theme-toggle" role="radiogroup" aria-label="Farbschema">
  {#each modes as m (m.value)}
    <button
      class="theme-btn"
      class:active={themeMode() === m.value}
      aria-checked={themeMode() === m.value}
      role="radio"
      title={m.label}
      onclick={() => setThemeMode(m.value)}
    >
      <span class="theme-icon" aria-hidden="true">{m.icon}</span>
      <span class="theme-label">{m.label}</span>
    </button>
  {/each}
</div>

<style>
  .theme-toggle {
    display: inline-flex;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--color-bg);
  }
  .theme-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.6rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.78rem;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    font-family: inherit;
  }
  .theme-btn:not(:last-child) {
    border-right: 1px solid var(--color-border);
  }
  .theme-btn:hover {
    background: var(--color-accent-light);
    color: var(--color-text);
  }
  .theme-btn.active {
    background: var(--color-accent-light);
    color: var(--color-accent);
    font-weight: 600;
  }
  .theme-icon {
    font-size: 0.85rem;
    line-height: 1;
  }
  .theme-label {
    line-height: 1;
  }

  @media (max-width: 600px) {
    .theme-label {
      display: none;
    }
    .theme-btn {
      padding: 0.35rem 0.5rem;
    }
  }
</style>
