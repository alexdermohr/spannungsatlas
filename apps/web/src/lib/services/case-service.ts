import type { Case, CaseParticipant, EvidenceType, UncertaintyLevel } from '$domain/types.js';
import type { CreateCaseInput } from '$domain/factories.js';
import { createCase } from '$domain/factories.js';
import { localStorageStore, type PersistenceStore } from '$lib/persistence/store.js';

export interface StartNewCaseInput {
  context: string;
  participants: CaseParticipant[];
  observationText: string;
  isCameraDescribable: boolean;
  interpretationText: string;
  interpretationEvidenceType: EvidenceType;
  counterInterpretations: Array<{ text: string; evidenceType: EvidenceType }>;
  uncertainties: Array<{ level: UncertaintyLevel; rationale: string }>;
}

const store: PersistenceStore = localStorageStore;

export function startNewCase(input: StartNewCaseInput): Case {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const caseInput: CreateCaseInput = {
    id,
    context: input.context,
    participants: input.participants,
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
      counterInterpretations: input.counterInterpretations,
      uncertainties: input.uncertainties
    }
  };

  const created = createCase(caseInput);
  store.saveCase(created);
  return created;
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

export function replaceAllCases(cases: readonly Case[]): void {
  store.replaceAllCases(cases);
}
