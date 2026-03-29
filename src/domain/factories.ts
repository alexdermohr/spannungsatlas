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
} from "./types.js";

import {
  guardObservationText,
  guardInterpretationText,
  guardCounterInterpretationText,
  guardInterpretationsDistinct,
  guardObservationInterpretationDistinct,
  guardUncertaintyLevel,
  guardUncertaintyRationale,
  guardParticipantsNotEmpty,
  guardTensionEdgeFields,
  guardIsoDateString,
  guardRevisionFromTo,
  guardReflectionSnapshot,
  guardCase,
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
    ...(input.timestamp ? { timestamp: input.timestamp } : {}),
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
  counterInterpretation: CreateInterpretationInput;
  uncertainty: CreateUncertaintyInput;
  tensions?: CreateTensionEdgeInput[];
}

export function createReflectionSnapshot(
  input: CreateReflectionSnapshotInput,
): ReflectionSnapshot {
  throwIfError(guardIsoDateString(input.reflectedAt, "reflectedAt"));

  const interpretation = createInterpretation(input.interpretation);
  const counterInterpretation = createInterpretation(
    input.counterInterpretation,
  );

  throwIfError(
    guardInterpretationsDistinct(interpretation, counterInterpretation),
  );

  const uncertainty = createUncertainty(input.uncertainty);
  const tensions = (input.tensions ?? []).map(createTensionEdge);

  const snapshot: ReflectionSnapshot = {
    reflectedAt: input.reflectedAt,
    interpretation,
    counterInterpretation,
    uncertainty,
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

  return {
    at: input.at,
    driftType: input.driftType,
    reason: input.reason,
    from: input.from,
    to: input.to,
  };
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
}

export function createCase(input: CreateCaseInput): Case {
  throwIfError(guardParticipantsNotEmpty(input.participants));

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
    ...(input.observedAt ? { observedAt: input.observedAt } : {}),
    observation,
    currentReflection,
    revisions,
  };

  // Run composite guard as final sanity check
  throwIfErrors(guardCase(caseObj));

  return caseObj;
}
