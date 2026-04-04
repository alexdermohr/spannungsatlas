import { createCase } from '$domain/factories.js';
import type { Case } from '$domain/types.js';
import type { CaseExportDocument } from '$lib/export/case-export.js';
import { CASE_EXPORT_FORMAT, CASE_EXPORT_VERSION } from '$lib/export/case-export.js';

interface IcfRating {
  code: string;
  title?: string;
  value: number;
  note?: string;
}

interface IcfAssessment {
  schema?: string;
  version?: string;
  metadata?: Record<string, string | undefined>;
  ratings: IcfRating[];
}

function parseIcfAssessment(input: unknown): IcfAssessment {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('ICF-Import erwartet ein JSON-Objekt.');
  }

  const root = input as Record<string, unknown>;
  if (!Array.isArray(root.ratings)) {
    throw new Error('ICF-Import erwartet ein ratings[]-Feld.');
  }

  const ratings = root.ratings.map((r, i) => {
    if (typeof r !== 'object' || r === null || Array.isArray(r)) {
      throw new Error(`ratings[${i}] muss ein Objekt sein.`);
    }
    const obj = r as Record<string, unknown>;
    if (typeof obj.code !== 'string' || obj.code.trim().length === 0) {
      throw new Error(`ratings[${i}].code muss ein nicht-leerer String sein.`);
    }
    if (typeof obj.value !== 'number' || !Number.isFinite(obj.value)) {
      throw new Error(`ratings[${i}].value muss eine Zahl sein.`);
    }
    return {
      code: obj.code,
      title: typeof obj.title === 'string' ? obj.title : undefined,
      value: obj.value,
      note: typeof obj.note === 'string' ? obj.note : undefined
    };
  });

  const metadataRaw = root.metadata;
  const metadata = typeof metadataRaw === 'object' && metadataRaw !== null && !Array.isArray(metadataRaw)
    ? (metadataRaw as Record<string, string | undefined>)
    : undefined;

  return {
    schema: typeof root.schema === 'string' ? root.schema : undefined,
    version: typeof root.version === 'string' ? root.version : undefined,
    metadata,
    ratings
  };
}

function toContext(assessment: IcfAssessment): string {
  const person = assessment.metadata?.personName?.trim();
  const activity = assessment.metadata?.activity?.trim();
  if (person && activity) return `ICF-Import: ${person} · ${activity}`;
  if (person) return `ICF-Import: ${person}`;
  if (activity) return `ICF-Import: ${activity}`;
  return 'ICF-Import (strukturierte Einschätzung)';
}

export function importIcfAssessment(json: string): CaseExportDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('ICF-Import fehlgeschlagen: ungültiges JSON.');
  }

  const assessment = parseIcfAssessment(parsed);
  const now = new Date().toISOString();
  const caseData: Case = createCase({
    id: crypto.randomUUID(),
    context: toContext(assessment),
    participants: [{ id: assessment.metadata?.personName?.trim() || 'Unbekannte Person', role: 'primary' }],
    observation: {
      text: 'ICF-Import erstellt eine Vorstruktur. Beobachtung muss manuell ergänzt werden.',
      isCameraDescribable: false
    },
    currentReflection: {
      reflectedAt: now,
      interpretation: {
        text: 'Vorläufiger Reflexionsanker aus ICF-Import (keine Beobachtung, keine Diagnose).',
        evidenceType: 'speculative'
      },
      counterInterpretations: [{
        text: 'Die ICF-Daten sind strukturierte Einschätzungen und müssen im Kontext geprüft werden.',
        evidenceType: 'derived'
      }],
      uncertainties: [{
        level: 4,
        rationale: `ICF-Import mit ${assessment.ratings.length} Ratings. Ratings bleiben externe Quelle und wurden nicht als Beobachtung/Deutung übernommen.`
      }],
      tensions: []
    },
    revisions: [],
    sources: [{ type: 'icf-tool', payload: parsed, importedAt: now }]
  });

  return {
    format: CASE_EXPORT_FORMAT,
    version: CASE_EXPORT_VERSION,
    exportedAt: now,
    appVersion: 'icf-adapter',
    cases: [{ case: caseData }]
  };
}
