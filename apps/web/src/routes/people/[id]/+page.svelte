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
  import { meetsDefaultProfileCaseThreshold, MIN_CASES_FOR_PROFILE } from '$domain/tension-profile.js';
  import type { Case, CounterEvidence, EvidenceLevel, EpistemicMarking, ParticipantRole } from '$domain/types.js';
  import { findTensionProfilesForPerson, saveTensionProfile, type TensionProfileWithDecay } from '$lib/services/tension-profile-service.js';

  let personId = $state('');
  let summary: PersonSummary | null = $state(null);
  let cases: readonly Case[] = $state([]);
  let loaded = $state(false);
  let profiles: TensionProfileWithDecay[] = $state([]);
  let profileError = $state('');
  let profileSuccess = $state('');
  let patternDescription = $state('');
  let needPressuresText = $state('');
  let determinantsText = $state('');
  let expressionFormsText = $state('');
  let reliefConditionsText = $state('');
  let evidenceLevel: EvidenceLevel = $state('weak');
  let epistemicMarking: EpistemicMarking = $state('plausible');
  let counterEvidenceMode: 'documented' | 'checked_none' | 'empty' = $state('empty');
  let counterEvidenceText = $state('');
  let counterEvidenceDate = $state(new Date().toISOString().slice(0, 10));
  let supportCaseIds = $state<string[]>([]);
  let distinctTimepoints = $state(2);
  let distinctContexts = $state(1);
  let multiSourceCorroboration = $state(false);
  let revisedAt = $state(new Date().toISOString().slice(0, 10));

  onMount(() => {
    personId = page.params.id ?? '';
    const allCases = getAllCases();
    summary = findPersonSummary(personId, allCases);
    cases = findCasesForPerson(personId, allCases);
    profiles = findTensionProfilesForPerson(personId);
    supportCaseIds = cases.slice(0, 2).map((c) => c.id);
    distinctTimepoints = Math.max(1, Math.min(supportCaseIds.length || 1, 2));
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

  function splitLines(text: string): string[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function deriveLastSupportingCaseDate(caseIds: readonly string[]): string {
    const selectedDates = cases
      .filter((c) => caseIds.includes(c.id))
      .map((c) => c.observedAt ?? c.currentReflection.reflectedAt)
      .sort();
    return (selectedDates.at(-1) ?? new Date().toISOString()).slice(0, 10);
  }

  function toggleSupportCase(caseId: string): void {
    const nextSupportCaseIds = supportCaseIds.includes(caseId)
      ? supportCaseIds.filter((id) => id !== caseId)
      : [...supportCaseIds, caseId];
    supportCaseIds = nextSupportCaseIds;
    distinctTimepoints = Math.max(1, Math.min(distinctTimepoints, nextSupportCaseIds.length || 1));
    distinctContexts = Math.max(1, Math.min(distinctContexts, nextSupportCaseIds.length || 1));
  }

  function evidenceLabel(level: EvidenceLevel): string {
    return { weak: 'schwach', moderate: 'moderat', strong: 'stark' }[level];
  }

  function epistemicLabel(marking: EpistemicMarking): string {
    return { observational: 'beobachtungsnah', plausible: 'plausibel', speculative: 'spekulativ' }[marking];
  }

  function clusterSummary(entries: readonly string[]): string {
    return entries.length > 0 ? entries.join(' · ') : 'Leerstelle';
  }

  function counterEvidenceSummary(counterEvidence: readonly CounterEvidence[]): string {
    if (counterEvidence.length === 0) return 'Leerstelle: kein Gegenbeleg dokumentiert';
    return counterEvidence
      .map((entry) =>
        entry.kind === 'documented'
          ? `Gegenbeleg (${formatDate(entry.recordedAt)}): ${entry.text}`
          : `Kein Gegenbeleg nach Prüfung am ${formatDate(entry.checkedAt)}`
      )
      .join(' · ');
  }

  function submitProfile(): void {
    profileError = '';
    profileSuccess = '';
    try {
      const counterEvidence: CounterEvidence[] =
        counterEvidenceMode === 'documented'
          ? [{ kind: 'documented', text: counterEvidenceText, recordedAt: new Date(counterEvidenceDate).toISOString() }]
          : counterEvidenceMode === 'checked_none'
            ? [{ kind: 'checked_none', checkedAt: new Date(counterEvidenceDate).toISOString() }]
            : [];

      saveTensionProfile({
        personId,
        patternDescription,
        needPressures: splitLines(needPressuresText),
        determinants: splitLines(determinantsText),
        expressionForms: splitLines(expressionFormsText),
        reliefConditions: splitLines(reliefConditionsText),
        evidenceLevel,
        epistemicMarking,
        counterEvidence,
        support: {
          caseIds: supportCaseIds,
          distinctTimepoints,
          distinctContexts,
          multiSourceCorroboration,
          lastSupportingCaseAt: new Date(deriveLastSupportingCaseDate(supportCaseIds)).toISOString()
        },
        revisedAt: new Date(revisedAt).toISOString()
      });
      profiles = findTensionProfilesForPerson(personId);
      patternDescription = '';
      needPressuresText = '';
      determinantsText = '';
      expressionFormsText = '';
      reliefConditionsText = '';
      counterEvidenceText = '';
      profileSuccess = 'Spannungsprofil wurde als formulierter Denkstand gespeichert.';
    } catch (error) {
      profileError = error instanceof Error ? error.message : 'Spannungsprofil konnte nicht gespeichert werden.';
    }
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
        {#if meetsDefaultProfileCaseThreshold(summary.caseCount)}
          <strong>Schwellenstatus:</strong> {summary.caseCount} Fälle dokumentiert — die
          Regelschwelle ({MIN_CASES_FOR_PROFILE} Fälle) für ein Spannungsprofil ist erreicht.
          Die Formulierung eines Spannungsprofils ist unten verfügbar; die
          Verdichtungs- und Evidenzregeln nach MASTERPLAN §3.2 werden dabei
          durch den Domänenkern geprüft.
        {:else if summary.caseCount >= 1}
          <strong>Schwellenstatus:</strong> {summary.caseCount} Fall dokumentiert — die
          Regelschwelle ({MIN_CASES_FOR_PROFILE} Fälle) ist noch nicht erreicht.
          Die Formulierung ist unten für die Mehrquellen-Ausnahme sichtbar; Speichern
          gelingt nur, wenn die Domänenprüfung die Fallbasis zulässt.
        {:else}
          <strong>Schwellenstatus:</strong> {summary.caseCount}
          {summary.caseCount === 1 ? 'Fall' : 'Fälle'} dokumentiert — die Regelschwelle
          ({MIN_CASES_FOR_PROFILE} Fälle) für ein Spannungsprofil ist noch nicht erreicht
          (MASTERPLAN §3.2). Eine mögliche Mehrquellen-Ausnahme wird in dieser
          Fallübersicht nicht bewertet.
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
      <h2>Spannungsprofil</h2>
      <p class="section-note">
        Formulierte, revidierbare Arbeitsverdichtung. Das System prüft nur Schutzregeln
        und Schwellen — es erzeugt keine Deutung automatisch.
      </p>

      {#if profiles.length > 0}
        <div class="profile-list">
          {#each profiles as item (item.profile.id)}
            <article class:revision-due={item.decay.status === 'revision_due'} class="profile-card">
              <div class="case-header">
                <strong>{evidenceLabel(item.profile.evidenceLevel)} · {epistemicLabel(item.profile.epistemicMarking)}</strong>
                <span class="case-date">Revision: {formatDate(item.profile.revisedAt)}</span>
              </div>
              <p>{item.profile.patternDescription}</p>
              <dl class="profile-meta">
                <dt>Bedürfnisdrucke</dt><dd>{clusterSummary(item.profile.needPressures)}</dd>
                <dt>Determinanten</dt><dd>{clusterSummary(item.profile.determinants)}</dd>
                <dt>Ausdrucksformen</dt><dd>{clusterSummary(item.profile.expressionForms)}</dd>
                <dt>Entlastungsbedingungen</dt><dd>{clusterSummary(item.profile.reliefConditions)}</dd>
                <dt>Fallbasis</dt><dd>{item.profile.support.caseIds.length} Fälle</dd>
                <dt>Gegenbelege</dt><dd>{counterEvidenceSummary(item.profile.counterEvidence)}</dd>
                <dt>Verfall</dt><dd>{item.decay.status === 'revision_due' ? 'revisionspflichtig' : 'aktuell'} ({item.decay.daysSinceLastSupport} Tage)</dd>
              </dl>
            </article>
          {/each}
        </div>
      {:else}
        <p class="empty-inline">Noch kein Spannungsprofil formuliert.</p>
      {/if}

      {#if summary.caseCount >= 1}
        <form class="profile-form" onsubmit={(event) => { event.preventDefault(); submitProfile(); }}>
          <h3>Profil formulieren</h3>
          {#if !meetsDefaultProfileCaseThreshold(summary.caseCount)}
            <p class="form-hint">
              Unterhalb der Regelschwelle von {MIN_CASES_FOR_PROFILE} Fällen ist Speichern nur
              mit belastbarer Mehrquellenlage möglich; die Domänenprüfung entscheidet verbindlich.
            </p>
          {/if}
          <label>
            Musterbeschreibung
            <textarea bind:value={patternDescription} rows="3" required placeholder="z. B. Spannung zeigt sich unter Bedingung Y als ..."></textarea>
          </label>
          <div class="form-grid">
            <label>
              Evidenzstufe
              <select bind:value={evidenceLevel}>
                <option value="weak">schwach</option>
                <option value="moderate">moderat</option>
                <option value="strong">stark</option>
              </select>
            </label>
            <label>
              Epistemische Markierung
              <select bind:value={epistemicMarking}>
                <option value="observational">beobachtungsnah</option>
                <option value="plausible">plausibel</option>
                <option value="speculative">spekulativ</option>
              </select>
            </label>
          </div>
          <div class="form-grid">
            <label>Bedürfnisdrucke<textarea bind:value={needPressuresText} rows="3" placeholder="Ein Eintrag pro Zeile; Leerstelle erlaubt"></textarea></label>
            <label>Determinanten<textarea bind:value={determinantsText} rows="3" placeholder="Ein Eintrag pro Zeile; Leerstelle erlaubt"></textarea></label>
            <label>Ausdrucksformen<textarea bind:value={expressionFormsText} rows="3" placeholder="Ein Eintrag pro Zeile; Leerstelle erlaubt"></textarea></label>
            <label>Entlastungsbedingungen<textarea bind:value={reliefConditionsText} rows="3" placeholder="Ein Eintrag pro Zeile; Leerstelle erlaubt"></textarea></label>
          </div>
          <fieldset>
            <legend>Fallbasis</legend>
            {#each cases as c (c.id)}
              <label class="checkbox-row"><input type="checkbox" checked={supportCaseIds.includes(c.id)} onchange={() => toggleSupportCase(c.id)} /> {formatDate(c.currentReflection.reflectedAt)} · {truncate(c.context, 60)}</label>
            {/each}
            <div class="form-grid">
              <label>Zeitpunkte<input type="number" min="1" max={Math.max(1, supportCaseIds.length)} bind:value={distinctTimepoints} /></label>
              <label>Kontexte<input type="number" min="1" max={Math.max(1, supportCaseIds.length)} bind:value={distinctContexts} /></label>
              <label>Letzter stützender Fall<input type="date" value={deriveLastSupportingCaseDate(supportCaseIds)} readonly /></label>
              <label class="checkbox-row"><input type="checkbox" bind:checked={multiSourceCorroboration} /> belastbare Mehrquellenlage</label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Gegenbelegprüfung</legend>
            <label><select bind:value={counterEvidenceMode}><option value="empty">Leerstelle</option><option value="documented">Gegenbeleg dokumentiert</option><option value="checked_none">geprüft: keiner gefunden</option></select></label>
            {#if counterEvidenceMode === 'documented'}
              <label>Gegenbeleg<textarea bind:value={counterEvidenceText} rows="2"></textarea></label>
            {/if}
            {#if counterEvidenceMode !== 'empty'}
              <label>Datum<input type="date" bind:value={counterEvidenceDate} /></label>
            {/if}
          </fieldset>
          <label>Revisionsdatum<input type="date" bind:value={revisedAt} /></label>
          {#if profileError}<p class="form-error">{profileError}</p>{/if}
          {#if profileSuccess}<p class="form-success">{profileSuccess}</p>{/if}
          <button class="btn" type="submit">Spannungsprofil speichern</button>
        </form>
      {/if}
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
  .section-note,
  .empty-inline,
  .form-hint {
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }
  .profile-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .profile-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 0.85rem;
    background: var(--color-bg);
  }
  .profile-card.revision-due {
    border-left: 3px solid #b45309;
  }
  .profile-card p {
    margin: 0.5rem 0;
  }
  .profile-meta {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.25rem 0.75rem;
    margin: 0;
    font-size: 0.85rem;
  }
  .profile-meta dt {
    font-weight: 700;
    color: var(--color-text-muted);
  }
  .profile-meta dd {
    margin: 0;
  }
  .profile-form {
    border-top: 1px solid var(--color-border);
    margin-top: 1rem;
    padding-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
  .profile-form h3 {
    margin: 0;
    font-size: 0.95rem;
  }
  .profile-form label,
  .profile-form fieldset {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .profile-form fieldset {
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 0.75rem;
  }
  .profile-form textarea,
  .profile-form input,
  .profile-form select {
    font: inherit;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 0.45rem 0.55rem;
    background: var(--color-bg);
    color: var(--color-text);
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
  .checkbox-row {
    flex-direction: row !important;
    align-items: center;
    font-weight: 500 !important;
  }
  .form-error {
    color: #b91c1c;
    font-size: 0.85rem;
  }
  .form-success {
    color: #047857;
    font-size: 0.85rem;
  }
  @media (max-width: 640px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
