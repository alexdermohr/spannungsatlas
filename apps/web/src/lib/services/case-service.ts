import type { Case, CaseParticipant, CatalogSelection, EvidenceType, UncertaintyLevel, PerspectiveRecord, PerspectiveCommittedRecord } from '$domain/types.js';
import type { CreateCaseInput } from '$domain/factories.js';
import { createCase, createPerspectiveDraftRecord, commitPerspectiveRecord, type CreatePerspectiveDraftInput } from '$domain/factories.js';
import { canReadPerspective, canWritePerspective, canComparePerspectives, getComparablePerspectives, filterVisiblePerspectives } from '$domain/perspective-access.js';
import { validateNewPerspectiveCatalogIds } from '$domain/exploration-catalog.js';
import { formatSelectionsForDisplay, type FormattedSelectionsForDisplay } from '$lib/services/selection-display.js';
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
  /**
   * Optional actor id under which the Case's first PerspectiveRecord is created.
   * Defaults to the id of the first participant.
   */
  primaryActorId?: string;
  /**
   * Optional exploration selections belonging to the first perspective.
   * Persisted on the PerspectiveRecord, never on currentReflection.
   */
  selectedNeeds?: readonly CatalogSelection[];
  selectedDeterminants?: readonly CatalogSelection[];
}

const store: PersistenceStore = localStorageStore;

/**
 * Creates a Case and, in the same capture flow, optionally seeds the first
 * actor-attributed PerspectiveRecord.
 *
 * Transitional dual-model rule:
 * - currentReflection remains on the Case because the domain model still expects
 *   a case-level reflection snapshot and older read paths use it.
 * - the first committed PerspectiveRecord stores the same epistemic core for the
 *   primary actor so actor-attributed content starts at case creation time.
 * - selectedNeeds and selectedDeterminants belong only to PerspectiveRecord.content;
 *   they must never be copied onto currentReflection.
 *
 * Until the legacy case snapshot is retired, both structures intentionally start
 * with matching observation/interpretation/counters/uncertainties. The PerspectiveRecord
 * is the source of truth for actor-attributed content.
 */
export function startNewCase(input: StartNewCaseInput): Case {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const primaryActorId = input.primaryActorId ?? input.participants[0]?.id;

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

  // Seed the initial actor-attributed perspective while keeping the legacy
  // case snapshot for existing read paths.
  let withFirstPerspective: Case = created;
  if (primaryActorId) {
    if (input.selectedNeeds || input.selectedDeterminants) {
      const catalogErrors = validateNewPerspectiveCatalogIds(
        input.selectedNeeds,
        input.selectedDeterminants
      );
      if (catalogErrors.length > 0) {
        throw new Error(`Invalid catalog selections: ${catalogErrors.join('; ')}`);
      }
    }

    const draftId = crypto.randomUUID();
    const draft = createPerspectiveDraftRecord({
      id: draftId,
      caseId: id,
      actorId: primaryActorId,
      createdAt: now,
      observation: {
        text: input.observationText,
        isCameraDescribable: input.isCameraDescribable
      },
      interpretation: {
        text: input.interpretationText,
        evidenceType: input.interpretationEvidenceType
      },
      counterInterpretations: input.counterInterpretations.map((c) => ({
        text: c.text,
        evidenceType: c.evidenceType
      })),
      uncertainties: input.uncertainties.map((u) => ({
        level: u.level,
        rationale: u.rationale
      })),
      ...(input.selectedNeeds && input.selectedNeeds.length > 0
        ? { selectedNeeds: input.selectedNeeds.map((s) => ({ id: s.id })) }
        : {}),
      ...(input.selectedDeterminants && input.selectedDeterminants.length > 0
        ? { selectedDeterminants: input.selectedDeterminants.map((s) => ({ id: s.id })) }
        : {})
    });
    const committed = commitPerspectiveRecord(draft, now);
    withFirstPerspective = { ...created, perspectives: [committed] };
  }

  store.saveCase(withFirstPerspective);
  return withFirstPerspective;
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
 * NEW DRAFT SEMANTICS:
 * Drafts can be partial and do not enforce strict completeness checks.
 * Validation happens upon committing the draft.
 */
export function addDraftPerspective(caseId: string, input: CreatePerspectiveDraftInput, requestingActorId: string): Case {
  if (input.caseId !== caseId) {
    throw new Error("Perspective caseId does not match target case.");
  }
  if (input.actorId !== requestingActorId) {
    throw new Error("Access denied: You can only create drafts for yourself.");
  }

  // Write-time catalog membership check — must not be performed at read time.
  // See exploration-catalog.ts → validateNewPerspectiveCatalogIds for design rationale.
  const catalogErrors = validateNewPerspectiveCatalogIds(input.selectedNeeds, input.selectedDeterminants);
  if (catalogErrors.length > 0) {
    throw new Error(`Invalid catalog selections: ${catalogErrors.join('; ')}`);
  }

  const c = getCase(caseId);
  if (!c) throw new Error("Case not found");

  const perspectives = [...(c.perspectives || [])];

  // Enforce single perspective per actor logic
  const hasCommitted = perspectives.some(p => p.actorId === input.actorId && p.status === 'committed');
  if (hasCommitted) {
    throw new Error("Perspective already committed for this actor.");
  }

  const perspective = createPerspectiveDraftRecord(input);

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

  if (p.status !== 'draft') {
    throw new Error("Perspective is already committed.");
  }

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

export function getComparablePerspectivesForCase(caseId: string, requestingActorId: string): readonly PerspectiveCommittedRecord[] {
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

function createdAtMs(p: PerspectiveRecord): number {
  const ms = Date.parse(p.createdAt);
  return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
}

/**
 * Selects the single perspective to use for selection display.
 *
 * Explicit priority rule (deterministic, independent of array order):
 *   1. Draft — the actor is actively working on it and selections reflect current intent.
 *   2. Committed — no draft present, show the committed state.
 *   3. If multiple perspectives share the same status (defensive, should not occur in normal
 *      operation given the single-perspective-per-actor invariant), pick the most recently
 *      created one (latest parseable createdAt timestamp).
 *
 * This function does not enforce ownership itself. Callers must pass already actor-filtered
 * perspectives (e.g. via filterVisiblePerspectives + actorId filter).
 */
export function selectPerspectiveForSelectionDisplay(
  ownPerspectives: readonly PerspectiveRecord[]
): PerspectiveRecord | undefined {
  if (ownPerspectives.length === 0) return undefined;

  const drafts = ownPerspectives.filter((p) => p.status === 'draft');
  const candidates = drafts.length > 0 ? drafts : [...ownPerspectives];

  return candidates.reduce((best, current) =>
    createdAtMs(current) > createdAtMs(best) ? current : best
  );
}

export function getSelectionDisplayForActorFromPerspectives(
  perspectives: readonly PerspectiveRecord[] | undefined,
  requestingActorId: string
): FormattedSelectionsForDisplay {
  const ownPerspectives = (perspectives || []).filter((p) => p.actorId === requestingActorId);
  const ownPerspective = selectPerspectiveForSelectionDisplay(ownPerspectives);

  return formatSelectionsForDisplay(
    ownPerspective?.content.selectedNeeds,
    ownPerspective?.content.selectedDeterminants
  );
}

/**
 * Returns selection metadata for the requesting actor's own visible perspective.
 * In Phase 1 (strict blind), this never exposes another actor's perspective.
 */
export function getSelectionDisplayForActor(caseId: string, requestingActorId: string): FormattedSelectionsForDisplay {
  const c = getCase(caseId);
  if (!c) {
    return formatSelectionsForDisplay(undefined, undefined);
  }

  const visiblePerspectives = filterVisiblePerspectives(c.perspectives || [], requestingActorId);
  return getSelectionDisplayForActorFromPerspectives(visiblePerspectives, requestingActorId);
}
