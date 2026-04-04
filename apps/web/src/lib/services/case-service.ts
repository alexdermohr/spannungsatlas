import type { Case, CaseParticipant, EvidenceType, UncertaintyLevel, PerspectiveRecord } from '$domain/types.js';
import type { CreateCaseInput } from '$domain/factories.js';
import { createCase, createPerspectiveRecord, commitPerspectiveRecord, type CreatePerspectiveRecordInput } from '$domain/factories.js';
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


export function addDraftPerspective(caseId: string, input: CreatePerspectiveRecordInput): Case {
  const c = getCase(caseId);
  if (!c) throw new Error("Case not found");

  const perspective = createPerspectiveRecord(input);

  const perspectives = [...(c.perspectives || [])];
  // Remove any existing draft for this actor
  const existingIndex = perspectives.findIndex(p => p.actorId === input.actorId && p.status === 'draft');
  if (existingIndex >= 0) {
    perspectives[existingIndex] = perspective;
  } else {
    perspectives.push(perspective);
  }

  const updatedCase = { ...c, perspectives };
  store.saveCase(updatedCase);
  return updatedCase;
}

export function commitPerspective(caseId: string, perspectiveId: string): Case {
  const c = getCase(caseId);
  if (!c) throw new Error("Case not found");

  const perspectives = [...(c.perspectives || [])];
  const index = perspectives.findIndex(p => p.id === perspectiveId);
  if (index === -1) throw new Error("Perspective not found");

  const committed = commitPerspectiveRecord(perspectives[index], new Date().toISOString());
  perspectives[index] = committed;

  const updatedCase = { ...c, perspectives };
  store.saveCase(updatedCase);
  return updatedCase;
}

export function getPerspectiveForActor(caseId: string, perspectiveId: string, currentActorId: string): PerspectiveRecord {
  const c = getCase(caseId);
  if (!c) throw new Error("Case not found");

  const p = (c.perspectives || []).find(p => p.id === perspectiveId);
  if (!p) throw new Error("Perspective not found");

  if (p.status === 'draft' && p.actorId !== currentActorId) {
    throw new Error("Access denied: Cannot view another user's draft perspective.");
  }

  return p;
}

export function getCommittedPerspectivesForCase(caseId: string): PerspectiveRecord[] {
  const c = getCase(caseId);
  if (!c) return [];
  return (c.perspectives || []).filter(p => p.status === 'committed');
}

export function getDraftPerspectiveForActor(caseId: string, currentActorId: string): PerspectiveRecord | undefined {
  const c = getCase(caseId);
  if (!c) return undefined;
  return (c.perspectives || []).find(p => p.actorId === currentActorId && p.status === 'draft');
}
