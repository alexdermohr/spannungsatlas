import type {
  Case,
  DriftType,
  EvidenceType,
  ParticipantRole,
  TensionDirection,
  UncertaintyLevel
} from '$domain/types.js';
import type { CreateCaseInput, CreateTensionEdgeInput } from '$domain/factories.js';
import { createCase, createReflectionSnapshot, createRevision } from '$domain/factories.js';
import { localStorageStore, type PersistenceStore } from '$lib/persistence/store.js';

export interface TensionEdgeInput {
  source: string;
  target: string;
  label: string;
  context: string;
  direction: TensionDirection;
}

export interface StartNewCaseInput {
  context: string;
  participantName: string;
  participantRole?: ParticipantRole;
  observationText: string;
  isCameraDescribable: boolean;
  interpretationText: string;
  interpretationEvidenceType: EvidenceType;
  counterInterpretationText: string;
  counterInterpretationEvidenceType: EvidenceType;
  uncertaintyLevel: UncertaintyLevel;
  uncertaintyRationale: string;
  tensions?: TensionEdgeInput[];
}

export interface AddRevisionInput {
  interpretationText: string;
  interpretationEvidenceType: EvidenceType;
  counterInterpretationText: string;
  counterInterpretationEvidenceType: EvidenceType;
  uncertaintyLevel: UncertaintyLevel;
  uncertaintyRationale: string;
  driftType: DriftType;
  reason: string;
  tensions?: TensionEdgeInput[];
}

const store: PersistenceStore = localStorageStore;

export function startNewCase(input: StartNewCaseInput): Case {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const tensions: CreateTensionEdgeInput[] | undefined = input.tensions?.map((t) => ({
    source: t.source,
    target: t.target,
    label: t.label,
    context: t.context,
    direction: t.direction,
    timestamp: now
  }));

  const caseInput: CreateCaseInput = {
    id,
    context: input.context,
    participants: [
      {
        id: input.participantName,
        ...(input.participantRole ? { role: input.participantRole } : {})
      }
    ],
    observation: {
      text: input.observationText,
      isCameraDescribable: input.isCameraDescribable
    },
    currentReflection: {
      reflectedAt: now,
      interpretation: {
        text: input.interpretationText,
        evidenceType: input.interpretationEvidenceType
      },
      counterInterpretation: {
        text: input.counterInterpretationText,
        evidenceType: input.counterInterpretationEvidenceType
      },
      uncertainty: {
        level: input.uncertaintyLevel,
        rationale: input.uncertaintyRationale
      },
      tensions
    }
  };

  const created = createCase(caseInput);
  store.saveCase(created);
  return created;
}

/**
 * Add a revision to an existing case: creates a new ReflectionSnapshot,
 * records the Revision (from → to), and updates the case's currentReflection.
 */
export function addRevision(caseId: string, input: AddRevisionInput): Case {
  const existing = store.loadCase(caseId);
  if (!existing) {
    throw new Error(`Fall mit ID ${caseId} nicht gefunden.`);
  }

  const now = new Date().toISOString();
  const from = existing.currentReflection;

  const tensions: CreateTensionEdgeInput[] | undefined = input.tensions?.map((t) => ({
    source: t.source,
    target: t.target,
    label: t.label,
    context: t.context,
    direction: t.direction,
    timestamp: now
  }));

  const to = createReflectionSnapshot({
    reflectedAt: now,
    interpretation: {
      text: input.interpretationText,
      evidenceType: input.interpretationEvidenceType
    },
    counterInterpretation: {
      text: input.counterInterpretationText,
      evidenceType: input.counterInterpretationEvidenceType
    },
    uncertainty: {
      level: input.uncertaintyLevel,
      rationale: input.uncertaintyRationale
    },
    tensions
  });

  const revision = createRevision({
    at: now,
    driftType: input.driftType,
    reason: input.reason,
    from,
    to
  });

  const updated: Case = {
    ...existing,
    currentReflection: to,
    revisions: [...existing.revisions, revision]
  };

  store.saveCase(updated);
  return updated;
}

export function getCase(id: string): Case | null {
  return store.loadCase(id);
}

export function getAllCases(): Case[] {
  return store.loadAllCases();
}

export function saveCaseData(caseData: Case): void {
  store.saveCase(caseData);
}

export function deleteCase(id: string): void {
  store.deleteCase(id);
}
