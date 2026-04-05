import type { Case, CaseParticipant, EvidenceType, UncertaintyLevel, PerspectiveRecord } from '$domain/types.js';
import type { CreateCaseInput } from '$domain/factories.js';
import { createCase, createPerspectiveRecord, commitPerspectiveRecord, type CreatePerspectiveRecordInput } from '$domain/factories.js';
import { canReadPerspective, canWritePerspective, canComparePerspectives, getComparablePerspectives, filterVisiblePerspectives } from '$domain/perspective-access.js';
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


/**
 * Adds or updates a draft perspective for the requesting actor.
 *
 * CURRENT DRAFT SEMANTICS:
 * The provided input must be a structurally complete perspective record
 * (e.g., must contain valid observations, counter-interpretations, and uncertainties).
 * Partial or incomplete drafts are currently rejected by the domain factory.
 * This autosaves fully structured data, but defers the "committed" state transition.
 */
export function addDraftPerspective(caseId: string, input: CreatePerspectiveRecordInput, requestingActorId: string): Case {
  if (input.caseId !== caseId) {
    throw new Error("Perspective caseId does not match target case.");
  }
  if (input.actorId !== requestingActorId) {
    throw new Error("Access denied: You can only create drafts for yourself.");
  }
  const c = getCase(caseId);
  if (!c) throw new Error("Case not found");

  const perspectives = [...(c.perspectives || [])];

  // Enforce single perspective per actor logic
  const hasCommitted = perspectives.some(p => p.actorId === input.actorId && p.status === 'committed');
  if (hasCommitted) {
    throw new Error("Perspective already committed for this actor.");
  }

  const perspective = createPerspectiveRecord(input);

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

export function commitPerspective(caseId: string, perspectiveId: string, requestingActorId: string): Case {
  const c = getCase(caseId);
  if (!c) throw new Error("Case not found");

  const perspectives = [...(c.perspectives || [])];
  const index = perspectives.findIndex(p => p.id === perspectiveId);
  if (index === -1) throw new Error("Perspective not found");

  const p = perspectives[index];
  if (!canWritePerspective(p, requestingActorId)) {
    throw new Error("Access denied: Cannot commit this perspective.");
  }

  // Double-check no other committed perspective exists for this actor
  const hasCommitted = perspectives.some(existing => existing.actorId === p.actorId && existing.status === 'committed' && existing.id !== p.id);
  if (hasCommitted) {
    throw new Error("Perspective already committed for this actor.");
  }

  const committed = commitPerspectiveRecord(p, new Date().toISOString());
  perspectives[index] = committed;

  const updatedCase = { ...c, perspectives };
  store.saveCase(updatedCase);
  return updatedCase;
}

export function getPerspectiveForActor(caseId: string, perspectiveId: string, requestingActorId: string): PerspectiveRecord {
  const c = getCase(caseId);
  if (!c) throw new Error("Case not found");

  const p = (c.perspectives || []).find(p => p.id === perspectiveId);
  if (!p) throw new Error("Perspective not found");

  if (!canReadPerspective(p, requestingActorId)) {
    throw new Error("Access denied: Cannot read this perspective.");
  }

  return p;
}

export function getVisiblePerspectivesForCase(caseId: string, requestingActorId: string): PerspectiveRecord[] {
  const c = getCase(caseId);
  if (!c) return [];
  return Array.from(filterVisiblePerspectives(c.perspectives || [], requestingActorId));
}

export function getComparablePerspectivesForCase(caseId: string, requestingActorId: string): readonly PerspectiveRecord[] {
  const c = getCase(caseId);
  if (!c) return [];

  if (!canComparePerspectives(c.perspectives || [], requestingActorId)) {
    // If not allowed to compare (either because own is not committed, or not enough total),
    // we return empty array to prevent leaks.
    return [];
  }

  return getComparablePerspectives(c.perspectives || []);
}

export function getCommittedPerspectiveCount(caseId: string): number {
  const c = getCase(caseId);
  if (!c) return 0;
  return (c.perspectives || []).filter(p => p.status === 'committed').length;
}

export function getDraftPerspectiveForActor(caseId: string, requestingActorId: string): PerspectiveRecord | undefined {
  const c = getCase(caseId);
  if (!c) return undefined;
  return (c.perspectives || []).find(p => p.actorId === requestingActorId && p.status === 'draft');
}
