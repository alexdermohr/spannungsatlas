/**
 * Domain guards — validation functions enforcing documented product invariants.
 *
 * Sources:
 *   - MASTERPLAN.md §2 Produktinvarianten
 *   - docs/ux-ui-blaupause.md §3 Primärer Nutzerfluss, §7 Datenmodell
 *
 * Each guard returns a string error message on failure, or undefined on success.
 * This makes guards composable and easy to aggregate.
 */

import type {
  CaseParticipant,
  Interpretation,
  Observation,
  ReflectionSnapshot,
  Revision,
  TensionEdge,
  Uncertainty,
  UncertaintyLevel,
} from "./types.js";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type GuardResult = string | undefined;

// ---------------------------------------------------------------------------
// Primitive checks
// ---------------------------------------------------------------------------

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// ---------------------------------------------------------------------------
// Observation guards (MASTERPLAN §2 #1, #19)
// ---------------------------------------------------------------------------

/** Observation text must not be empty. */
export function guardObservationText(text: string): GuardResult {
  if (!isNonEmptyString(text)) {
    return "Observation text must not be empty.";
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Interpretation guards (MASTERPLAN §2 #16, #17)
// ---------------------------------------------------------------------------

/** Interpretation text must not be empty. */
export function guardInterpretationText(text: string): GuardResult {
  if (!isNonEmptyString(text)) {
    return "Interpretation text must not be empty.";
  }
  return undefined;
}

/** Counter-interpretation text must not be empty (MASTERPLAN §2 #15, #20). */
export function guardCounterInterpretationText(text: string): GuardResult {
  if (!isNonEmptyString(text)) {
    return "Counter-interpretation text must not be empty.";
  }
  return undefined;
}

/**
 * Interpretation and counter-interpretation must not be identical.
 * A true counter-interpretation provides a genuine alternative explanation
 * (MASTERPLAN §2 #20).
 */
export function guardInterpretationsDistinct(
  interpretation: Interpretation,
  counterInterpretation: Interpretation,
): GuardResult {
  if (interpretation.text.trim() === counterInterpretation.text.trim()) {
    return "Interpretation and counter-interpretation must not be identical.";
  }
  return undefined;
}

/**
 * Observation text and interpretation text must not be identical.
 * Enforces the strict separation of observation and interpretation
 * (MASTERPLAN §2 #1).
 */
export function guardObservationInterpretationDistinct(
  observation: Observation,
  interpretation: Interpretation,
): GuardResult {
  if (observation.text.trim() === interpretation.text.trim()) {
    return "Observation and interpretation must not be identical.";
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Uncertainty guards (MASTERPLAN §2 #6; UX-Blaupause §3 step 6)
// ---------------------------------------------------------------------------

/** UncertaintyLevel must be an integer in [0, 5]. */
export function guardUncertaintyLevel(level: number): GuardResult {
  if (!Number.isInteger(level) || level < 0 || level > 5) {
    return "Uncertainty level must be an integer between 0 and 5.";
  }
  return undefined;
}

/** Uncertainty rationale must not be empty. */
export function guardUncertaintyRationale(rationale: string): GuardResult {
  if (!isNonEmptyString(rationale)) {
    return "Uncertainty rationale must not be empty.";
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Participants guard (Case MUSS-Feld: Person)
// ---------------------------------------------------------------------------

/** A case must have at least one participant. */
export function guardParticipantsNotEmpty(
  participants: readonly CaseParticipant[],
): GuardResult {
  if (!Array.isArray(participants) || participants.length === 0) {
    return "Participants must not be empty.";
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// TensionEdge guard (UX-Blaupause §3 step 7)
// ---------------------------------------------------------------------------

const VALID_DIRECTIONS = new Set(["unidirectional", "bidirectional"]);

/** TensionEdge direction must be a valid value. */
export function guardTensionDirection(direction: string): GuardResult {
  if (!VALID_DIRECTIONS.has(direction)) {
    return `TensionEdge direction must be "unidirectional" or "bidirectional", got "${direction}".`;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Revision guard (UX-Blaupause §7; MASTERPLAN §2 #14, #21)
// ---------------------------------------------------------------------------

/** A revision must have both `from` and `to` snapshots. */
export function guardRevisionFromTo(
  from: ReflectionSnapshot | undefined | null,
  to: ReflectionSnapshot | undefined | null,
): GuardResult {
  if (from == null || to == null) {
    return "Revision must have both 'from' and 'to' snapshots.";
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Composite guard: validate a full ReflectionSnapshot
// ---------------------------------------------------------------------------

export function guardReflectionSnapshot(
  snapshot: ReflectionSnapshot,
): readonly string[] {
  const errors: string[] = [];

  const push = (r: GuardResult) => {
    if (r) errors.push(r);
  };

  push(guardInterpretationText(snapshot.interpretation.text));
  push(guardCounterInterpretationText(snapshot.counterInterpretation.text));
  push(
    guardInterpretationsDistinct(
      snapshot.interpretation,
      snapshot.counterInterpretation,
    ),
  );
  push(guardUncertaintyLevel(snapshot.uncertainty.level));
  push(guardUncertaintyRationale(snapshot.uncertainty.rationale));

  for (const edge of snapshot.tensions) {
    push(guardTensionDirection(edge.direction));
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Composite guard: validate a full Case
// ---------------------------------------------------------------------------

export function guardCase(
  caseData: {
    participants: readonly CaseParticipant[];
    observation: Observation;
    currentReflection: ReflectionSnapshot;
    revisions: readonly Revision[];
  },
): readonly string[] {
  const errors: string[] = [];

  const push = (r: GuardResult) => {
    if (r) errors.push(r);
  };

  push(guardParticipantsNotEmpty(caseData.participants));
  push(guardObservationText(caseData.observation.text));
  push(
    guardObservationInterpretationDistinct(
      caseData.observation,
      caseData.currentReflection.interpretation,
    ),
  );

  errors.push(...guardReflectionSnapshot(caseData.currentReflection));

  for (const rev of caseData.revisions) {
    push(guardRevisionFromTo(rev.from, rev.to));
  }

  return errors;
}
