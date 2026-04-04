import { describe, expect, it, vi } from 'vitest';
import { createCase } from '$domain/factories.js';
import { serializeCases, parseCaseExportJson } from '../src/lib/export/case-export.js';
import { exportCasesAsHtml } from '../src/lib/export/html-export.js';
import { exportCasesAsMarkdown, MD_EXPORT_END, MD_EXPORT_START } from '../src/lib/export/markdown-export.js';
import { detectImportKind, importCases, parseImportToDocument } from '../src/lib/import/case-import.js';

function buildCase(id = 'case-a') {
  return createCase({
    id,
    context: 'Morgenkreis',
    participants: [{ id: 'Anna', role: 'primary' }],
    observation: { text: 'Anna schaut häufig auf den Boden.', isCameraDescribable: true },
    currentReflection: {
      reflectedAt: '2026-03-01T10:00:00Z',
      interpretation: { text: 'Anna wirkt in der Gruppe gehemmt.', evidenceType: 'derived' },
      counterInterpretations: [{ text: 'Anna ist heute müde.', evidenceType: 'speculative' }],
      uncertainties: [{ level: 2, rationale: 'Nur ein kurzer Beobachtungszeitraum.' }],
      tensions: []
    },
    revisions: []
  });
}

describe('export/import', () => {
  it('JSON export -> import keeps case equality in replace mode', () => {
    const original = [buildCase('case-json')];
    const json = serializeCases(original, '0.1.0');
    const imported = importCases(json, [], 'replace');
    expect(imported).toEqual(original);
  });

  it('HTML export -> import keeps case equality in replace mode', () => {
    const original = [buildCase('case-html')];
    const html = exportCasesAsHtml(original, '0.1.0', true);
    const imported = importCases(html, [], 'replace');
    expect(imported).toEqual(original);
  });

  it('Markdown export -> import keeps case equality in replace mode', () => {
    const original = [buildCase('case-md')];
    const markdown = exportCasesAsMarkdown(original, '0.1.0', true);
    const imported = importCases(markdown, [], 'replace');
    expect(imported).toEqual(original);
  });

  it('merge keeps other cases and replaces by id', () => {
    const oldA = buildCase('same-id');
    const oldB = buildCase('keep-id');
    const incoming = createCase({
      ...buildCase('same-id'),
      context: 'Aktualisierter Kontext'
    });
    const imported = importCases(serializeCases([incoming], '0.1.0'), [oldA, oldB], 'merge');
    expect(imported).toHaveLength(2);
    expect(imported.find((c) => c.id === 'same-id')?.context).toBe('Aktualisierter Kontext');
    expect(imported.find((c) => c.id === 'keep-id')).toBeTruthy();
  });

  it('new mode assigns new IDs and keeps existing unchanged', () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValueOnce('new-id-1');
    const existing = [buildCase('existing-id')];
    const imported = importCases(serializeCases([buildCase('incoming-id')], '0.1.0'), existing, 'new');
    expect(imported).toHaveLength(2);
    expect(imported.some((c) => c.id === 'existing-id')).toBe(true);
    expect(imported.some((c) => c.id === 'new-id-1')).toBe(true);
  });

  it('fails on schema validation errors', () => {
    const broken = JSON.stringify({ format: 'spannungsatlas-case-export', version: '1.0', exportedAt: 'bad', appVersion: '0.1.0', cases: [] });
    expect(() => parseCaseExportJson(broken)).toThrow(/exportedAt/);
  });

  it('fails when source payload is missing although source exists', () => {
    const withBrokenSource = JSON.parse(serializeCases([buildCase('broken-source')], '0.1.0')) as {
      cases: Array<{ case: { sources?: Array<Record<string, unknown>> } }>;
    };
    withBrokenSource.cases[0].case.sources = [{ type: 'icf-tool', importedAt: new Date().toISOString() }];
    expect(() => parseCaseExportJson(JSON.stringify(withBrokenSource))).toThrow(/payload/);
  });

  it('fails on version mismatch', () => {
    const doc = JSON.parse(serializeCases([buildCase('case-ver')], '0.1.0')) as Record<string, unknown>;
    doc.version = '2.0';
    expect(() => parseCaseExportJson(JSON.stringify(doc))).toThrow(/Nicht unterstützte Exportversion/);
  });

  it('fails for HTML without embedded json', () => {
    expect(() => parseImportToDocument('<html><body>no data</body></html>', 'html')).toThrow(/Script-Tag/);
  });

  it('fails for markdown without markers', () => {
    expect(() => parseImportToDocument('# Report\n```json\n{}\n```', 'markdown')).toThrow(/Export-Marker/);
  });

  it('fails for markdown with markers but without json block', () => {
    const input = `${MD_EXPORT_START}\nnot-json\n${MD_EXPORT_END}`;
    expect(() => parseImportToDocument(input, 'markdown')).toThrow(/JSON-Codeblock/);
  });

  it('fails on invalid icf json', () => {
    expect(() => parseImportToDocument('{"ratings": "bad"}', 'icf')).toThrow(/ratings/);
  });

  it('malformed json is handled as controlled import error', () => {
    expect(() => parseImportToDocument('{"x":', undefined)).toThrow(/ungültiges JSON/);
  });

  it('detectImportKind handles malformed json input in a controlled way', () => {
    expect(() => detectImportKind('{"x":')).not.toThrow();
    expect(detectImportKind('{"x":')).toBe('json');
  });

  it('detectImportKind recognizes valid icf json', () => {
    const icf = JSON.stringify({ ratings: [{ code: 'd710', value: 2 }] });
    expect(detectImportKind(icf)).toBe('icf');
  });

  it('keeps icf provenance after import and re-export', () => {
    const icf = JSON.stringify({
      schema: 'assessment-export.schema.json',
      version: '1.2',
      metadata: { personName: 'Max', activity: 'Gruppensetting' },
      ratings: [{ code: 'd710', title: 'Interaktionen', value: 2, note: 'braucht Struktur' }]
    });

    const imported = importCases(icf, [], 'replace', 'icf');
    expect(imported[0].sources?.[0]?.type).toBe('icf-tool');

    const reexport = parseCaseExportJson(serializeCases(imported, '0.1.0'));
    expect(reexport.cases[0].case.sources?.[0]?.type).toBe('icf-tool');
  });
});
