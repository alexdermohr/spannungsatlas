/**
 * Factory functions for canonical domain objects — Reflexionskern (reflection core).
 *
 * Every factory validates its input through the corresponding guards
 * so that only structurally valid objects can be constructed. Invalid input
 * causes a thrown Error with a descriptive message.
 *
 * Sources:
 *   - docs/ux-ui-blaupause.md §7
 *   - MASTERPLAN.md §2 Produktinvarianten
 *
 * See guards.ts for the distinction between what IS formally enforced and
 * what is NOT yet enforced (semantic/linguistic checks).
 */

import type {
  Case,
  CaseParticipant,
  EvidenceType,
  Interpretation,
  Observation,
  ReflectionSnapshot,
  Revision,
  TensionEdge,
  Uncertainty,
  UncertaintyLevel,
  DriftType,
  CaseSource,
  PerspectiveRecord,
  PerspectiveContent
} from "./types.js";

import {
  guardObservationText,
  guardInterpretationText,
  guardEvidenceType,
  guardInterpretationsDistinct,
  guardDistinctTexts,
  guardObservationInterpretationDistinct,
  guardUncertaintyLevel,
  guardUncertaintyRationale,
  guardParticipantsNotEmpty,
  guardParticipantId,
  guardParticipantRole,
  guardParticipantIdsUnique,
  guardCaseId,
  guardCaseContext,
  guardDriftType,
  guardRevisionReason,
  guardTensionEdgeFields,
  guardIsoDateString,
  guardRevisionFromTo,
  guardReflectionSnapshot,
  guardCase,
  guardPerspectiveRecord,
} from "./guards.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function throwIfErrors(errors: readonly string[]): void {
  if (errors.length > 0) {
    throw new Error(errors.join(" | "));
  }
}

function throwIfError(result: string | undefined): void {
  if (result !== undefined) {
    throw new Error(result);
  }
}

// ---------------------------------------------------------------------------
// Observation
// ---------------------------------------------------------------------------

export interface CreateObservationInput {
  text: string;
  isCameraDescribable?: boolean;
  recurringAspects?: string[];
}

export function createObservation(input: CreateObservationInput): Observation {
  throwIfError(guardObservationText(input.text));

  // isCameraDescribable is a user-supplied flag. The system does not verify
  // whether the text is genuinely camera-describable. Defaults to false if
  // omitted — the safe, non-assertive choice.
  return {
    text: input.text,
    isCameraDescribable: input.isCameraDescribable ?? false,
    ...(input.recurringAspects
      ? { recurringAspects: [...input.recurringAspects] }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Interpretation
// ---------------------------------------------------------------------------

export interface CreateInterpretationInput {
  text: string;
  evidenceType: EvidenceType;
  rationale?: string;
}

export function createInterpretation(
  input: CreateInterpretationInput,
): Interpretation {
  throwIfError(guardInterpretationText(input.text));
  throwIfError(guardEvidenceType(input.evidenceType));

  return {
    text: input.text,
    evidenceType: input.evidenceType,
    ...(input.rationale ? { rationale: input.rationale } : {}),
  };
}

// ---------------------------------------------------------------------------
// Uncertainty
// ---------------------------------------------------------------------------

export interface CreateUncertaintyInput {
  level: UncertaintyLevel;
  rationale: string;
}

export function createUncertainty(input: CreateUncertaintyInput): Uncertainty {
  throwIfError(guardUncertaintyLevel(input.level));
  throwIfError(guardUncertaintyRationale(input.rationale));

  return {
    level: input.level,
    rationale: input.rationale,
  };
}

// ---------------------------------------------------------------------------
// TensionEdge
// ---------------------------------------------------------------------------

export interface CreateTensionEdgeInput {
  source: string;
  target: string;
  label: string;
  context: string;
  direction: "unidirectional" | "bidirectional";
  timestamp?: string;
}

export function createTensionEdge(input: CreateTensionEdgeInput): TensionEdge {
  const edge: TensionEdge = {
    source: input.source,
    target: input.target,
    label: input.label,
    context: input.context,
    direction: input.direction,
    ...(input.timestamp !== undefined ? { timestamp: input.timestamp } : {}),
  };
  throwIfErrors(guardTensionEdgeFields(edge));
  return edge;
}

// ---------------------------------------------------------------------------
// ReflectionSnapshot
// ---------------------------------------------------------------------------

export interface CreateReflectionSnapshotInput {
  reflectedAt: string;
  interpretation: CreateInterpretationInput;
  counterInterpretations: CreateInterpretationInput[];
  uncertainties: CreateUncertaintyInput[];
  tensions?: CreateTensionEdgeInput[];
}

export function createReflectionSnapshot(
  input: CreateReflectionSnapshotInput,
): ReflectionSnapshot {
  throwIfError(guardIsoDateString(input.reflectedAt, "reflectedAt"));

  const interpretation = createInterpretation(input.interpretation);

  if (input.counterInterpretations.length === 0) {
    throw new Error("At least one counter-interpretation is required.");
  }
  const counterInterpretations = input.counterInterpretations.map(createInterpretation);
  for (const counter of counterInterpretations) {
    throwIfError(guardInterpretationsDistinct(interpretation, counter));
  }
  for (let i = 0; i < counterInterpretations.length; i++) {
    for (let j = i + 1; j < counterInterpretations.length; j++) {
      throwIfError(guardDistinctTexts(
        counterInterpretations[i],
        counterInterpretations[j],
        "Two counter-interpretation texts must not be textually identical.",
      ));
    }
  }

  if (input.uncertainties.length === 0) {
    throw new Error("At least one uncertainty is required.");
  }
  const uncertainties = input.uncertainties.map(createUncertainty);
  const tensions = (input.tensions ?? []).map(createTensionEdge);

  const snapshot: ReflectionSnapshot = {
    reflectedAt: input.reflectedAt,
    interpretation,
    counterInterpretations,
    uncertainties,
    tensions,
  };

  // Belt-and-suspenders: run composite guard as well
  throwIfErrors(guardReflectionSnapshot(snapshot));

  return snapshot;
}

// ---------------------------------------------------------------------------
// Revision
// ---------------------------------------------------------------------------

export interface CreateRevisionInput {
  at: string;
  driftType: DriftType;
  reason: string;
  from: ReflectionSnapshot;
  to: ReflectionSnapshot;
}

export function createRevision(input: CreateRevisionInput): Revision {
  throwIfError(guardRevisionFromTo(input.from, input.to));
  throwIfError(guardIsoDateString(input.at, "Revision.at"));
  throwIfError(guardDriftType(input.driftType));
  throwIfError(guardRevisionReason(input.reason));

  return {
    at: input.at,
    driftType: input.driftType,
    reason: input.reason,
    from: input.from,
    to: input.to,
  };
}


// ---------------------------------------------------------------------------
// PerspectiveRecord
// ---------------------------------------------------------------------------

export interface CreatePerspectiveRecordInput {
  id: string;
  caseId: string;
  actorId: string;
  observation: CreateObservationInput;
  interpretation: CreateInterpretationInput;
  counterInterpretations: CreateInterpretationInput[];
  uncertainties: CreateUncertaintyInput[];
  createdAt: string;
}

export function createPerspectiveRecord(
  input: CreatePerspectiveRecordInput,
): PerspectiveRecord {
  throwIfError(guardIsoDateString(input.createdAt, "createdAt"));

  const observation = createObservation(input.observation);
  const interpretation = createInterpretation(input.interpretation);

  throwIfError(guardObservationInterpretationDistinct(observation, interpretation));

  if (input.counterInterpretations.length === 0) {
    throw new Error("At least one counter-interpretation is required.");
  }
  const counterInterpretations = input.counterInterpretations.map(createInterpretation);
  for (const counter of counterInterpretations) {
    throwIfError(guardInterpretationsDistinct(interpretation, counter));
  }
  for (let i = 0; i < counterInterpretations.length; i++) {
    for (let j = i + 1; j < counterInterpretations.length; j++) {
      throwIfError(guardDistinctTexts(
        counterInterpretations[i],
        counterInterpretations[j],
        "Two counter-interpretation texts must not be textually identical.",
      ));
    }
  }

  if (input.uncertainties.length === 0) {
    throw new Error("At least one uncertainty is required.");
  }
  const uncertainties = input.uncertainties.map(createUncertainty);

  const content: PerspectiveContent = {
    observation,
    interpretation,
    counterInterpretations,
    uncertainties,
  };

  const record: PerspectiveRecord = {
    id: input.id,
    caseId: input.caseId,
    actorId: input.actorId,
    status: "draft",
    content,
    createdAt: input.createdAt,
  };

  throwIfErrors(guardPerspectiveRecord(record));

  return record;
}

export function commitPerspectiveRecord(record: PerspectiveRecord, committedAt: string): PerspectiveRecord {
  if (record.status === "committed") {
    throw new Error("PerspectiveRecord is already committed.");
  }

  throwIfError(guardIsoDateString(committedAt, "committedAt"));

  const committedRecord: PerspectiveRecord = {
    ...record,
    status: "committed",
    committedAt,
  };

  throwIfErrors(guardPerspectiveRecord(committedRecord));

  return committedRecord;
}

// ---------------------------------------------------------------------------
// Case
// ---------------------------------------------------------------------------

export interface CreateCaseInput {
  id: string;
  participants: CaseParticipant[];
  context: string;
  observedAt?: string;
  observation: CreateObservationInput;
  currentReflection: CreateReflectionSnapshotInput;
  revisions?: CreateRevisionInput[];
  sources?: CaseSource[];
  perspectives?: PerspectiveRecord[];
}

export function createCase(input: CreateCaseInput): Case {
  throwIfError(guardCaseId(input.id));
  throwIfError(guardCaseContext(input.context));
  throwIfError(guardParticipantsNotEmpty(input.participants));

  for (const p of input.participants) {
    throwIfError(guardParticipantId(p.id));
    if (p.role !== undefined) {
      throwIfError(guardParticipantRole(p.role));
    }
  }
  throwIfError(guardParticipantIdsUnique(input.participants));

  const observation = createObservation(input.observation);
  const currentReflection = createReflectionSnapshot(input.currentReflection);

  throwIfError(
    guardObservationInterpretationDistinct(
      observation,
      currentReflection.interpretation,
    ),
  );

  const revisions = (input.revisions ?? []).map(createRevision);

  const caseObj: Case = {
    id: input.id,
    participants: [...input.participants],
    context: input.context,
    ...(input.observedAt !== undefined ? { observedAt: input.observedAt } : {}),
    observation,
    currentReflection,
    revisions,
    ...(input.sources ? { sources: [...input.sources] } : {}),
    ...(input.perspectives ? { perspectives: [...input.perspectives] } : {}),
  };

  // Run composite guard as final sanity check
  throwIfErrors(guardCase(caseObj));

  return caseObj;
}
