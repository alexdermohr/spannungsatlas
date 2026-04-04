import type { Case } from '$domain/types.js';
import { guardCase, guardDateTimeString } from '$domain/guards.js';
import schema from '../../../../../contracts/case-export.schema.json';

export const CASE_EXPORT_FORMAT = 'spannungsatlas-case-export';
export const CASE_EXPORT_VERSION = '1.0';

export interface CaseExportEntry {
  case: Case;
}

export interface CaseExportDocument {
  format: typeof CASE_EXPORT_FORMAT;
  version: typeof CASE_EXPORT_VERSION;
  exportedAt: string;
  appVersion: string;
  cases: CaseExportEntry[];
}

function asObject(input: unknown, label: string): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error(`${label} muss ein Objekt sein.`);
  }
  return input as Record<string, unknown>;
}

function assertSchemaRequired(obj: Record<string, unknown>, required: unknown, label: string): void {
  if (!Array.isArray(required)) return;
  for (const key of required) {
    if (typeof key !== 'string') continue;
    if (!(key in obj)) {
      throw new Error(`${label}.${key} fehlt (laut Schema).`);
    }
  }
}

export function validateCaseExportDocument(input: unknown): CaseExportDocument {
  /**
   * Übergangsstatus (bewusst):
   * - `contracts/case-export.schema.json` sichert in Phase 1 primär die Export-Hülle.
   * - `entry.case` wird weiterhin maßgeblich über `guardCase()` validiert.
   * - Eine vollständige schema-basierte Validierung der Case-Innensemantik ist vertagt.
   */
  const root = asObject(input, 'Exportdokument');
  assertSchemaRequired(root, schema.required, 'Exportdokument');

  if (root.format !== CASE_EXPORT_FORMAT) {
    throw new Error(`Ungültiges Exportformat: ${String(root.format)}`);
  }
  if (root.version !== CASE_EXPORT_VERSION) {
    throw new Error(`Nicht unterstützte Exportversion: ${String(root.version)}.`);
  }
  if (typeof root.exportedAt !== 'string' || guardDateTimeString(root.exportedAt, 'exportedAt') !== undefined) {
    throw new Error('exportedAt muss ein gültiger ISO-Zeitstempel sein.');
  }
  if (typeof root.appVersion !== 'string' || root.appVersion.trim().length === 0) {
    throw new Error('appVersion muss ein nicht-leerer String sein.');
  }
  if (!Array.isArray(root.cases)) {
    throw new Error('cases muss ein Array sein.');
  }

  const caseSchema = asObject(asObject(schema.properties, 'schema.properties').cases, 'schema.cases');
  const itemSchema = asObject(caseSchema.items, 'schema.cases.items');

  const cases: CaseExportEntry[] = root.cases.map((entry, index) => {
    const row = asObject(entry, `cases[${index}]`);
    assertSchemaRequired(row, itemSchema.required, `cases[${index}]`);

    const caseData = asObject(row.case, `cases[${index}].case`) as unknown as Case;

    const errors = guardCase(caseData);
    if (errors.length > 0) {
      throw new Error(`cases[${index}].case ist ungültig: ${errors.join(' | ')}`);
    }
    return { case: caseData };
  });

  return {
    format: CASE_EXPORT_FORMAT,
    version: CASE_EXPORT_VERSION,
    exportedAt: root.exportedAt,
    appVersion: root.appVersion,
    cases
  };
}

export function serializeCases(cases: readonly Case[], appVersion: string): string {
  const document: CaseExportDocument = {
    format: CASE_EXPORT_FORMAT,
    version: CASE_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion,
    cases: cases.map((c) => ({ case: c }))
  };

  validateCaseExportDocument(document);
  return JSON.stringify(document, null, 2);
}

export function parseCaseExportJson(json: string): CaseExportDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Import fehlgeschlagen: ungültiges JSON.');
  }

  return validateCaseExportDocument(parsed);
}
