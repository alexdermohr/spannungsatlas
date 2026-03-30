import type { Case, DriftType, EvidenceType, ParticipantRole, UncertaintyLevel } from '$domain/types.js';
import type { CreateCaseInput } from '$domain/factories.js';
import { createCase, createReflectionSnapshot, createRevision } from '$domain/factories.js';
import { localStorageStore, type PersistenceStore } from '$lib/persistence/store.js';

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
}

const store: PersistenceStore = localStorageStore;

export function startNewCase(input: StartNewCaseInput): Case {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

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
      }
    }
  };

  const created = createCase(caseInput);
  store.saveCase(created);
  return created;
}

export function addRevision(caseId: string, input: AddRevisionInput): Case {
  const existing = store.loadCase(caseId);
  if (!existing) {
    throw new Error(`Fall mit ID ${caseId} nicht gefunden.`);
  }

  const now = new Date().toISOString();
  const from = existing.currentReflection;
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
    }
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
