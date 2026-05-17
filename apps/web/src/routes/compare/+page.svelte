<script lang="ts">
  import { onMount } from 'svelte';
  import { getAllCases } from '$lib/services/case-service.js';
  import { roleLabels } from '$lib/ui/labels.js';
  import type { Case } from '$domain/types.js';

  let cases: Case[] = $state([]);
  let loaded = $state(false);

  type CompareEntry = {
    caseData: Case;
    committed: number;
    total: number;
    canCompare: boolean;
  };

  const entries = $derived<CompareEntry[]>(
    cases.map((c) => {
      const committed = (c.perspectives ?? []).filter((p) => p.status === 'committed').length;
      const total = c.participants.length;
      return {
        caseData: c,
        committed,
        total,
        canCompare: committed >= 2
      };
    })
  );

  const comparable = $derived(entries.filter((e) => e.canCompare));
  const pending = $derived(entries.filter((e) => !e.canCompare));

  onMount(() => {
    cases = getAllCases();
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

  function truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  function firstActorId(c: Case): string {
    return c.participants[0]?.id ?? '';
  }

  function participantSummary(c: Case): string {
    const ps = c.participants;
    if (ps.length === 0) return '—';
    const first = ps[0];
    const role = first.role ? roleLabels[first.role] ?? first.role : '';
    const label = role ? `${first.id} (${role})` : first.id;
    if (ps.length === 1) return label;
    const rest = ps.length - 1;
    return `${label} + ${rest} weitere ${rest === 1 ? 'Person' : 'Personen'}`;
  }
</script>

<div class="page">
  <h1>Vergleich &amp; Drift</h1>
  <p class="subtitle">Denkstände nebeneinander sichtbar machen</p>

  <section class="card intro">
    <p>
      Sobald für einen Fall mindestens zwei Perspektiven unabhängig abgegeben wurden,
      lassen sie sich nebeneinander vergleichen. So bleibt der Unterschied zwischen
      Beobachtungen, Deutungen und Unsicherheiten sichtbar — ohne Glättung.
    </p>
    <ul class="drift-types">
      <li><strong>Neue Beobachtung</strong> — zusätzliche Wahrnehmung verändert das Bild</li>
      <li><strong>Neue Perspektive</strong> — gleiche Beobachtung, anderer Blickwinkel</li>
      <li><strong>Uminterpretation</strong> — Neubewertung gleicher Daten</li>
    </ul>
  </section>

  {#if !loaded}
    <p>Lade…</p>
  {:else if cases.length === 0}
    <div class="card empty-state">
      <h2>Noch keine Fälle dokumentiert</h2>
      <p>Vergleichen lässt sich erst, wenn mindestens ein Fall existiert.</p>
      <a href="/cases/new" class="btn btn-primary">Ersten Fall anlegen</a>
    </div>
  {:else}
    <section>
      <h2>Vergleichbare Fälle ({comparable.length})</h2>
      {#if comparable.length === 0}
        <div class="card hint">
          <p>
            Aktuell ist kein Fall vergleichsfähig. Ein Vergleich wird möglich, sobald
            mindestens zwei Perspektiven für denselben Fall abgegeben (committed) sind.
          </p>
        </div>
      {:else}
        <div class="case-list">
          {#each comparable as entry (entry.caseData.id)}
            <a
              href="/cases/{entry.caseData.id}/compare?actor={firstActorId(entry.caseData)}"
              class="card case-card"
            >
              <div class="case-header">
                <span class="case-participant">{participantSummary(entry.caseData)}</span>
                <span class="case-date">
                  {formatDate(entry.caseData.currentReflection.reflectedAt)}
                </span>
              </div>
              <div class="case-context">{truncate(entry.caseData.context, 100)}</div>
              <div class="case-meta">
                <span class="badge badge-ready">
                  {entry.committed} / {entry.total} Perspektiven abgegeben
                </span>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </section>

    {#if pending.length > 0}
      <section>
        <h2>Fälle in Blinddokumentation ({pending.length})</h2>
        <p class="helper">
          Mindestens zwei abgegebene Perspektiven sind nötig, um einen Vergleich
          freizugeben.
        </p>
        <div class="case-list">
          {#each pending as entry (entry.caseData.id)}
            <a href="/cases/{entry.caseData.id}" class="card case-card case-card-muted">
              <div class="case-header">
                <span class="case-participant">{participantSummary(entry.caseData)}</span>
                <span class="case-date">
                  {formatDate(entry.caseData.currentReflection.reflectedAt)}
                </span>
              </div>
              <div class="case-context">{truncate(entry.caseData.context, 100)}</div>
              <div class="case-meta">
                <span class="badge">
                  {entry.committed} / {entry.total} Perspektiven abgegeben
                </span>
              </div>
            </a>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>

<style>
  .subtitle {
    color: var(--color-text-muted);
    margin-top: -0.5rem;
    margin-bottom: 1.5rem;
  }
  .intro {
    margin-bottom: 1.5rem;
  }
  .intro p {
    margin: 0 0 0.75rem;
    color: var(--color-text-muted);
    font-size: 0.95rem;
  }
  .drift-types {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.9rem;
    color: var(--color-text-muted);
  }
  .drift-types li {
    margin-bottom: 0.3rem;
  }
  h2 {
    font-size: 1.05rem;
    color: var(--color-accent);
    margin: 1.25rem 0 0.5rem;
  }
  .helper {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    margin: 0 0 0.75rem;
  }
  .empty-state {
    text-align: center;
    padding: 2.5rem 1.5rem;
  }
  .hint {
    color: var(--color-text-muted);
    font-size: 0.9rem;
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
  .case-card-muted {
    opacity: 0.75;
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
    font-weight: 500;
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
  }
  .case-meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .badge {
    background: var(--color-bg-subtle, #f3f4f6);
    color: var(--color-text-muted);
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .badge-ready {
    background: var(--color-accent-light, rgba(59, 130, 246, 0.12));
    color: var(--color-accent);
  }
</style>
