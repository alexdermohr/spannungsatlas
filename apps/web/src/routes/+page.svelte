<script lang="ts">
  import { onMount } from 'svelte';
  import { getAllCases } from '$lib/services/case-service.js';
  import type { Case } from '$domain/types.js';

  const roleLabels: Record<string, string> = {
    primary: 'Primär',
    secondary: 'Sekundär',
    staff: 'Fachkraft',
    contextual: 'Kontextuell'
  };

  let cases: Case[] = $state([]);
  let loaded = $state(false);

  onMount(() => {
    cases = getAllCases();
    loaded = true;
  });

  function truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return iso;
    }
  }

  function participantSummary(c: Case): string {
    const ps = c.participants;
    if (ps.length === 0) return '';
    const first = ps[0];
    const name = first.id;
    const role = first.role ? roleLabels[first.role] ?? first.role : '';
    const label = role ? `${name} (${role})` : name;
    if (ps.length === 1) return label;
    const rest = ps.length - 1;
    return `${label} + ${rest} weitere`;
  }
</script>

<div class="page">
  <h1>Übersicht</h1>
  <p class="subtitle">Reflexionsfälle im Spannungsatlas</p>

  {#if !loaded}
    <p>Lade…</p>
  {:else if cases.length === 0}
    <div class="card empty-state">
      <h2>Noch keine Fälle dokumentiert</h2>
      <p>
        Im Spannungsatlas dokumentieren Sie pädagogische Beobachtungen und trennen diese
        systematisch von Deutungen. So entsteht ein reflektierter Blick auf Spannungsfelder.
      </p>
      <a href="/cases/new" class="btn btn-primary">Ersten Fall anlegen</a>
    </div>
  {:else}
    <div class="case-list">
      {#each cases as c (c.id)}
        <a href="/cases/{c.id}" class="card case-card">
          <div class="case-header">
            <span class="case-participant">{participantSummary(c)}</span>
            <span class="case-date">{formatDate(c.currentReflection.reflectedAt)}</span>
          </div>
          <div class="case-context">{truncate(c.context, 80)}</div>
          <div class="case-observation">{truncate(c.observation.text, 120)}</div>
        </a>
      {/each}
    </div>
    <div class="actions">
      <a href="/cases/new" class="btn btn-primary">Neuen Fall anlegen</a>
    </div>
  {/if}
</div>

<style>
  .subtitle {
    color: var(--color-text-muted);
    margin-top: -0.5rem;
    margin-bottom: 1.5rem;
  }
  .empty-state {
    text-align: center;
    padding: 2.5rem 1.5rem;
  }
  .empty-state h2 {
    font-size: 1.15rem;
    margin-bottom: 0.5rem;
  }
  .empty-state p {
    color: var(--color-text-muted);
    max-width: 480px;
    margin: 0 auto 1.25rem;
  }
  .case-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  .case-card {
    display: block;
    text-decoration: none;
    color: var(--color-text);
    transition: box-shadow 0.15s;
  }
  .case-card:hover {
    box-shadow: var(--shadow-md);
    text-decoration: none;
  }
  .case-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
  }
  .case-participant {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-accent);
  }
  .case-date {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
  .case-context {
    font-weight: 600;
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
  }
  .case-observation {
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }
  .actions {
    margin-top: 1rem;
  }
</style>
