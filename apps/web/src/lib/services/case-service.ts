import type { Case } from '$domain/types.js';
import type { CreateCaseInput } from '$domain/factories.js';
import { createCase } from '$domain/factories.js';
import { localStorageStore, type PersistenceStore } from '$lib/persistence/store.js';

export interface StartNewCaseInput {
  context: string;
  participantName: string;
  participantRole?: 'primary' | 'secondary' | 'staff' | 'contextual';
  observationText: string;
  isCameraDescribable: boolean;
  interpretationText: string;
  interpretationEvidenceType: 'observational' | 'derived' | 'speculative';
  counterInterpretationText: string;
  counterInterpretationEvidenceType: 'observational' | 'derived' | 'speculative';
  uncertaintyLevel: 0 | 1 | 2 | 3 | 4 | 5;
  uncertaintyRationale: string;
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
