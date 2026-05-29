<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { getAllCases } from '$lib/services/case-service.js';
  import {
    findCasesForPerson,
    findPersonSummary,
    findRoleForPersonInCase,
    type PersonSummary
  } from '$lib/services/people-service.js';
  import { roleLabels } from '$lib/ui/labels.js';
  import { meetsProfileCaseThreshold, MIN_CASES_FOR_PROFILE } from '$domain/tension-profile.js';
  import type { Case, ParticipantRole } from '$domain/types.js';

  let personId = $state('');
  let summary: PersonSummary | null = $state(null);
  let cases: readonly Case[] = $state([]);
  let loaded = $state(false);

  onMount(() => {
    personId = page.params.id ?? '';
    const allCases = getAllCases();
    summary = findPersonSummary(personId, allCases);
    cases = findCasesForPerson(personId, allCases);
    loaded = true;
  });

  function truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

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

  function roleLabel(role: ParticipantRole | undefined): string {
    if (!role) return 'Rolle nicht erfasst';
    return roleLabels[role] ?? role;
  }

  function roleSummary(roles: readonly ParticipantRole[]): string {
    if (roles.length === 0) return 'Rolle nicht erfasst';
    return roles.map((r) => roleLabels[r] ?? r).join(' · ');
  }
</script>

<div class="page">
  {#if !loaded}
    <p>Lade…</p>
  {:else if !summary}
    <div class="card empty-state">
      <h1>Person nicht gefunden</h1>
      <p>
        Es existiert kein dokumentierter Fall, in dem die Person
        <code>{personId || '—'}</code> als Beteiligte vorkommt.
      </p>
      <a href="/people" class="btn">← Zur Personenübersicht</a>
    </div>
  {:else}
    <div class="person-header-row">
      <h1>{summary.id}</h1>
      <span class="case-count-badge">
        {summary.caseCount}
        {summary.caseCount === 1 ? 'Fall' : 'Fälle'}
      </span>
    </div>

    <div class="card scope-notice">
      <p>
        <strong>Fallübersicht.</strong> Diese Seite listet alle Fälle, in denen
        <code>{summary.id}</code> als Beteiligte vorkommt. Sie ist eine
        Navigationsaggregation — <strong>keine</strong> Verdichtung und
        <strong>kein</strong> Spannungsprofil.
      </p>
      <p class="threshold">
        {#if meetsProfileCaseThreshold(summary.caseCount)}
          <strong>Schwellenstatus:</strong> {summary.caseCount} Fälle dokumentiert — die
          Mindestfallzahl ({MIN_CASES_FOR_PROFILE}) für ein Spannungsprofil ist erreicht.
          Die Verdichtungs- und Evidenzregeln nach MASTERPLAN §3.2 sind im Domänenkern
          hinterlegt; die Formulierung eines Spannungsprofils ist in der Oberfläche
          noch nicht verfügbar.
        {:else}
          <strong>Schwellenstatus:</strong> {summary.caseCount}
          {summary.caseCount === 1 ? 'Fall' : 'Fälle'} dokumentiert — die Mindestfallzahl
          ({MIN_CASES_FOR_PROFILE}) für ein Spannungsprofil ist noch nicht erreicht
          (MASTERPLAN §3.2).
        {/if}
      </p>
    </div>

    <section class="card section">
      <h2>Übersicht</h2>
      <dl class="meta-grid">
        <dt>Bisherige Rollen</dt>
        <dd>{roleSummary(summary.roles)}</dd>

        <dt>Zuletzt dokumentiert</dt>
        <dd>{summary.lastActivity ? formatDate(summary.lastActivity) : '—'}</dd>
      </dl>
    </section>

    <section class="card section">
      <h2>Fälle</h2>
      <div class="case-list">
        {#each cases as c (c.id)}
          <a href={`/cases/${encodeURIComponent(c.id)}`} class="case-card">
            <div class="case-header">
              <span class="case-role">{roleLabel(findRoleForPersonInCase(summary.id, c))}</span>
              <span class="case-date">{formatDate(c.currentReflection.reflectedAt)}</span>
            </div>
            <div class="case-context">{truncate(c.context, 80)}</div>
            <div class="case-observation">{truncate(c.observation.text, 120)}</div>
          </a>
        {/each}
      </div>
    </section>

    <div class="actions">
      <a href="/people" class="btn">← Zur Personenübersicht</a>
    </div>
  {/if}
</div>

<style>
  .person-header-row {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .person-header-row h1 {
    margin-bottom: 0;
  }
  .case-count-badge {
    background: var(--color-bg-subtle, rgba(0, 0, 0, 0.05));
    color: var(--color-text-muted);
    font-size: 0.85rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
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
  .scope-notice .threshold {
    margin-top: 0.6rem;
    padding-top: 0.6rem;
    border-top: 1px solid var(--color-border);
  }
  .scope-notice code {
    font-family: var(--font-mono);
    font-size: 0.9em;
    color: var(--color-accent);
  }
  .empty-state {
    text-align: center;
    padding: 2.5rem 1.5rem;
  }
  .empty-state p {
    color: var(--color-text-muted);
    max-width: 480px;
    margin: 0 auto 1.25rem;
  }
  .section {
    margin-bottom: 1rem;
  }
  .section h2 {
    font-size: 1rem;
    color: var(--color-accent);
    margin-bottom: 0.5rem;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.35rem 1rem;
    margin: 0;
  }
  .meta-grid dt {
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }
  .meta-grid dd {
    margin: 0;
    font-size: 0.9rem;
  }
  .case-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .case-card {
    display: block;
    text-decoration: none;
    color: var(--color-text);
    padding: 0.65rem 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-bg);
    transition: box-shadow 0.15s;
  }
  .case-card:hover {
    box-shadow: var(--shadow-md);
    text-decoration: none;
  }
  .case-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
  }
  .case-role {
    font-size: 0.85rem;
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
    margin-bottom: 0.15rem;
  }
  .case-observation {
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }
  .actions {
    margin: 1.5rem 0 2rem;
  }
</style>
