import type { Case } from '$domain/types.js';
import { guardCase } from '$domain/guards.js';
import { parseCaseExportJson, type CaseExportDocument } from '$lib/export/case-export.js';
import { MD_EXPORT_END, MD_EXPORT_START } from '$lib/export/markdown-export.js';
import { importIcfAssessment } from '$lib/import/icf-import.js';

export type ImportMode = 'replace' | 'merge' | 'new';
export type ImportKind = 'json' | 'html' | 'markdown' | 'icf';

function cloneCases(cases: readonly Case[]): Case[] {
  return cases.map((c) => structuredClone(c));
}

function ensureValidCaseList(cases: readonly Case[]): void {
  for (const [index, c] of cases.entries()) {
    const errors = guardCase(c);
    if (errors.length > 0) {
      throw new Error(`Importfall ungültig bei Index ${index}: ${errors.join(' | ')}`);
    }
  }
}

function withNewIds(cases: readonly Case[]): Case[] {
  return cases.map((c) => ({ ...c, id: crypto.randomUUID() }));
}

export function importCaseDocument(doc: CaseExportDocument, existingCases: readonly Case[], mode: ImportMode): Case[] {
  const incoming = cloneCases(doc.cases.map((entry) => entry.case));
  ensureValidCaseList(incoming);

  if (mode === 'replace') return incoming;

  if (mode === 'merge') {
    const merged = new Map(existingCases.map((c) => [c.id, c]));
    for (const c of incoming) merged.set(c.id, c);
    return [...merged.values()];
  }

  return [...cloneCases(existingCases), ...withNewIds(incoming)];
}

function extractJsonFromMarkdown(markdown: string): string {
  const startIndex = markdown.indexOf(MD_EXPORT_START);
  const endIndex = markdown.indexOf(MD_EXPORT_END);
  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
    throw new Error('Markdown-Import: Export-Marker nicht gefunden.');
  }

  const block = markdown.slice(startIndex + MD_EXPORT_START.length, endIndex);
  const fenced = block.match(/```json\s*([\s\S]*?)```/i);
  if (!fenced?.[1]) {
    throw new Error('Markdown-Import: JSON-Codeblock nicht gefunden.');
  }
  return fenced[1].trim();
}

function extractJsonFromHtml(html: string): string {
  const match = html.match(/<script\s+type=["']application\/json["']\s+id=["']spannungsatlas-data["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match?.[1]) {
    throw new Error('HTML-Import: Script-Tag mit Exportdaten nicht gefunden.');
  }
  return match[1]
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .trim();
}

export function detectImportKind(content: string): ImportKind {
  const trimmed = content.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      if (parsed.format === 'spannungsatlas-case-export') return 'json';
      if (Array.isArray(parsed.ratings)) return 'icf';
      return 'json';
    } catch {
      // Erkennung bleibt kontrolliert; die genaue JSON-Fehlermeldung liefert parseCaseExportJson.
      return 'json';
    }
  }

  if (trimmed.includes('<script') && trimmed.includes('spannungsatlas-data')) return 'html';
  if (trimmed.includes(MD_EXPORT_START) && trimmed.includes(MD_EXPORT_END)) return 'markdown';
  throw new Error('Importtyp konnte nicht erkannt werden. Unterstützt: JSON, HTML, Markdown, ICF-JSON.');
}

export function parseImportToDocument(content: string, forcedKind?: ImportKind): CaseExportDocument {
  const kind = forcedKind ?? detectImportKind(content);
  if (kind === 'json') return parseCaseExportJson(content);
  if (kind === 'html') return parseCaseExportJson(extractJsonFromHtml(content));
  if (kind === 'markdown') return parseCaseExportJson(extractJsonFromMarkdown(content));
  return importIcfAssessment(content);
}

export function importCases(content: string, existingCases: readonly Case[], mode: ImportMode, forcedKind?: ImportKind): Case[] {
  const doc = parseImportToDocument(content, forcedKind);
  return importCaseDocument(doc, existingCases, mode);
}
