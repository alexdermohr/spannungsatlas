<script lang="ts">
  import { onMount } from 'svelte';
  import { getAllCases } from '$lib/services/case-service.js';
  import { aggregatePeopleFromCases, type PersonSummary } from '$lib/services/people-service.js';
  import { roleLabels } from '$lib/ui/labels.js';

  let people: readonly PersonSummary[] = $state([]);
  let loaded = $state(false);

  onMount(() => {
    people = aggregatePeopleFromCases(getAllCases());
    loaded = true;
  });

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  }

  function roleSummary(roles: readonly string[]): string {
    if (roles.length === 0) return 'Rolle nicht erfasst';
    return roles
      .map((r) => roleLabels[r as keyof typeof roleLabels] ?? r)
      .join(' · ');
  }
</script>

<div class="page">
  <h1>Personen</h1>
  <p class="subtitle">Übersicht aller in Fällen dokumentierten Personen</p>

  <div class="card scope-notice">
    <p>
      Diese Liste fasst Personen-IDs zusammen, wie sie in Fallrahmen vorkommen. Sie ist
      eine reine <strong>Navigationsaggregation</strong> — kein Spannungsprofil und keine
      Verdichtung.
    </p>
  </div>

  {#if !loaded}
    <p>Lade…</p>
  {:else if people.length === 0}
    <div class="card empty-state">
      <h2>Noch keine Personen dokumentiert</h2>
      <p>
        Personen entstehen automatisch, sobald Sie sie als Beteiligte eines Falls erfassen.
      </p>
      <a href="/cases/new" class="btn btn-primary">Ersten Fall anlegen</a>
    </div>
  {:else}
    <div class="person-list">
      {#each people as person (person.id)}
        <a href="/people/{encodeURIComponent(person.id)}" class="card person-card">
          <div class="person-header">
            <span class="person-id">{person.id}</span>
            <span class="person-count">
              {person.caseCount}
              {person.caseCount === 1 ? 'Fall' : 'Fälle'}
            </span>
          </div>
          <div class="person-meta">
            <span class="person-roles">{roleSummary(person.roles)}</span>
            {#if person.lastActivity}
              <span class="person-last">Zuletzt: {formatDate(person.lastActivity)}</span>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .subtitle {
    color: var(--color-text-muted);
    margin-top: -0.5rem;
    margin-bottom: 1.25rem;
  }
  .scope-notice {
    background: var(--color-bg-subtle, rgba(0, 0, 0, 0.03));
    border-left: 3px solid var(--color-accent);
    margin-bottom: 1.25rem;
  }
  .scope-notice p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-text-muted);
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
  .person-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .person-card {
    display: block;
    text-decoration: none;
    color: var(--color-text);
    transition: box-shadow 0.15s;
  }
  .person-card:hover {
    box-shadow: var(--shadow-md);
    text-decoration: none;
  }
  .person-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem;
    margin-bottom: 0.35rem;
  }
  .person-id {
    font-weight: 600;
    font-size: 1rem;
    color: var(--color-accent);
  }
  .person-count {
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }
  .person-meta {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    flex-wrap: wrap;
  }
</style>
