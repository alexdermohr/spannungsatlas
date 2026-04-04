<script lang="ts">
  import { onMount } from 'svelte';
  import { getAllCases, replaceAllCases } from '$lib/services/case-service.js';
  import { roleLabels } from '$lib/ui/labels.js';
  import { serializeCases } from '$lib/export/case-export.js';
  import { exportCasesAsMarkdown } from '$lib/export/markdown-export.js';
  import { exportCasesAsHtml } from '$lib/export/html-export.js';
  import { importCases, detectImportKind, parseImportToDocument, type ImportMode } from '$lib/import/case-import.js';
  import { APP_RELEASE } from '$lib/app-release.js';
  import type { Case } from '$domain/types.js';

  let cases: Case[] = $state([]);
  let loaded = $state(false);
  let exportFormat = $state<'json' | 'markdown' | 'html'>('json');
  let embedJson = $state(true);
  let importMode = $state<ImportMode>('merge');
  let importPreview = $state('');
  let importNotice = $state('');
  let pendingImportText = '';

  onMount(() => {
    cases = getAllCases();
    loaded = true;
  });

  function refreshCases(): void {
    cases = getAllCases();
  }

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
    return `${label} + ${rest} weitere ${rest === 1 ? 'Person' : 'Personen'}`;
  }

  function triggerDownload(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function runExport(): void {
    const appVersion = APP_RELEASE;
    if (exportFormat === 'json') {
      triggerDownload(serializeCases(cases, appVersion), 'spannungsatlas-export.json', 'application/json');
      return;
    }
    if (exportFormat === 'markdown') {
      triggerDownload(exportCasesAsMarkdown(cases, appVersion, embedJson), 'spannungsatlas-export.md', 'text/markdown');
      return;
    }
    triggerDownload(exportCasesAsHtml(cases, appVersion, embedJson), 'spannungsatlas-export.html', 'text/html');
  }

  async function onImportFileSelected(event: Event): Promise<void> {
    importNotice = '';
    importPreview = '';
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      pendingImportText = '';
      return;
    }

    try {
      pendingImportText = await file.text();
      const kind = detectImportKind(pendingImportText);
      const doc = parseImportToDocument(pendingImportText, kind);
      const sourceCount = doc.cases.reduce((sum, entry) => sum + (entry.case.sources?.length ?? 0), 0);
      importPreview = `Typ: ${kind.toUpperCase()} · Fälle: ${doc.cases.length} · Quellen: ${sourceCount}`;
      if (kind === 'icf') {
        importNotice = 'Diese Daten sind strukturierte Einschätzungen, keine Beobachtungen.';
      }
    } catch (error) {
      pendingImportText = '';
      importNotice = error instanceof Error ? `Importprüfung fehlgeschlagen: ${error.message}` : 'Importprüfung fehlgeschlagen.';
    }
  }

  function runImport(): void {
    if (!pendingImportText) {
      importNotice = 'Bitte zuerst eine gültige Datei auswählen.';
      return;
    }

    try {
      const importedCases = importCases(pendingImportText, cases, importMode);
      replaceAllCases(importedCases);
      refreshCases();
      importNotice = `Import erfolgreich: ${importedCases.length} Fälle im Speicher.`;
    } catch (error) {
      importNotice = error instanceof Error ? `Import fehlgeschlagen: ${error.message}` : 'Import fehlgeschlagen.';
    }
  }
</script>

<div class="page">
  <h1>Übersicht</h1>
  <p class="subtitle">Reflexionsfälle im Spannungsatlas</p>

  <section class="card transfer-tools">
    <h2>Export / Import</h2>
    <div class="tool-row">
      <label>
        Exportformat
        <select bind:value={exportFormat}>
          <option value="json">JSON (empfohlen)</option>
          <option value="markdown">Markdown</option>
          <option value="html">HTML</option>
        </select>
      </label>
      <label>
        <input type="checkbox" bind:checked={embedJson} disabled={exportFormat === 'json'} />
        JSON einbetten (für Markdown/HTML)
      </label>
      <button type="button" class="btn" onclick={runExport}>Exportieren</button>
    </div>

    <div class="tool-row">
      <label>
        Importdatei
        <input type="file" accept=".json,.md,.markdown,.html,.htm,.txt" onchange={onImportFileSelected} />
      </label>
      <label>
        Importmodus
        <select bind:value={importMode}>
          <option value="replace">replace</option>
          <option value="merge">merge</option>
          <option value="new">new</option>
        </select>
      </label>
      <button type="button" class="btn" onclick={runImport}>
        {importMode === 'replace' ? 'Ersetzen und importieren' : 'Importieren'}
      </button>
    </div>

    {#if importMode === 'replace'}
      <p class="warning">Achtung: replace ersetzt alle aktuell gespeicherten Fälle im lokalen Speicher.</p>
    {/if}

    {#if importPreview}
      <p class="preview">{importPreview}</p>
    {/if}
    {#if importNotice}
      <p class="notice">{importNotice}</p>
    {/if}
  </section>

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
  .subtitle { color: var(--color-text-muted); margin-top: -0.5rem; margin-bottom: 1.5rem; }
  .transfer-tools { margin-bottom: 1rem; }
  .tool-row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: end; margin-bottom: 0.75rem; }
  .tool-row label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem; }
  .preview { font-size: 0.9rem; color: var(--color-text-muted); }
  .warning { font-size: 0.9rem; color: #b45309; font-weight: 600; }
  .notice { font-size: 0.9rem; color: var(--color-accent); }
  .empty-state { text-align: center; padding: 2.5rem 1.5rem; }
  .empty-state h2 { font-size: 1.15rem; margin-bottom: 0.5rem; }
  .empty-state p { color: var(--color-text-muted); max-width: 480px; margin: 0 auto 1.25rem; }
  .case-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
  .case-card { display: block; text-decoration: none; color: var(--color-text); transition: box-shadow 0.15s; }
  .case-card:hover { box-shadow: var(--shadow-md); text-decoration: none; }
  .case-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
  .case-participant { font-size: 0.9rem; font-weight: 600; color: var(--color-accent); }
  .case-date { font-size: 0.8rem; color: var(--color-text-muted); }
  .case-context { font-weight: 600; font-size: 0.95rem; margin-bottom: 0.25rem; }
  .case-observation { font-size: 0.85rem; color: var(--color-text-muted); }
  .actions { margin-top: 1rem; }
</style>
