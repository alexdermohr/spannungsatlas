/**
 * Domain guards — structural and formal validation for Spannungsatlas domain objects.
 *
 * Sources:
 *   - MASTERPLAN.md §2 Produktinvarianten
 *   - docs/ux-ui-blaupause.md §3 Primärer Nutzerfluss, §7 Datenmodell
 *
 * Each guard returns a string error message on failure, or undefined on success.
 * This makes guards composable and easy to aggregate.
 *
 * WHAT THESE GUARDS ENFORCE (formal/structural):
 *   - Required text fields are non-empty.
 *   - Observation text and interpretation text are not textually identical.
 *   - Interpretation text and counter-interpretation text are not textually identical.
 *   - UncertaintyLevel is an integer in [0, 5].
 *   - Uncertainty rationale is non-empty.
 *   - Case id and context are non-empty.
 *   - Participants list is non-empty.
 *   - CaseParticipant id is non-empty.
 *   - CaseParticipant role, if provided, is one of the four allowed values.
 *   - EvidenceType is one of the three allowed values (runtime check).
 *   - DriftType is one of the three allowed values (runtime check).
 *   - Revision reason is non-empty.
 *   - Revision holds both `from` and `to` snapshots.
 *   - TensionEdge direction is one of the two allowed enum values.
 *   - TensionEdge source, target, label, context are non-empty.
 *   - Date/time fields (reflectedAt, Revision.at, observedAt, TensionEdge.timestamp)
 *     must match the supported date profile: date-only (YYYY-MM-DD) or full timestamp
 *     with seconds (YYYY-MM-DDTHH:MM:SS[.fff][Z|±HH:MM]). Enforced by regex + Date.parse().
 *
 * WHAT THESE GUARDS DO NOT ENFORCE (semantic, requires future work):
 *   - Whether observation text is genuinely camera-describable (MASTERPLAN §2 #19).
 *   - Whether an interpretation is consistent with its declared EvidenceType.
 *   - Whether a counter-interpretation provides a genuinely alternative explanation,
 *     not just a superficial reformulation (MASTERPLAN §2 #20).
 *   - Whether text uses essentialising or property-ascribing language (MASTERPLAN §2 #16).
 */

import type {
  CaseParticipant,
  Interpretation,
  Observation,
  ReflectionSnapshot,
  Revision,
  TensionEdge,
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
// Date/time guard — shared across multiple domain fields
// ---------------------------------------------------------------------------

/**
 * Supported date/time profile.
 *
 * Accepted forms:
 *   2024-01-15                         (date-only)
 *   2024-01-15T10:30:00                (local time, seconds required)
 *   2024-01-15T10:30:00Z               (UTC)
 *   2024-01-15T10:30:00.000Z           (UTC with fractional seconds)
 *   2024-01-15T10:30:00+02:00          (offset)
 *   2024-01-15T10:30:00.123+02:00      (offset with fractional seconds)
 *
 * NOT accepted (outside this profile):
 *   10:30:00          (time-only)
 *   2024-01-15T10:30  (hours and minutes only, seconds required)
 *   2024-W03-2        (ISO week date)
 *   2024-016          (ordinal date)
 */
const ISO_DATE_RE =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/;
const ISO_DATETIME_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;

/**
 * Checks that a value is a non-empty string matching the supported date profile:
 * either a date-only string (YYYY-MM-DD) or a full timestamp with seconds
 * (YYYY-MM-DDTHH:MM:SS[.frac][Z|±HH:MM]), where `.frac` is one or more fractional
 * second digits. Format is enforced via regex and parseability via Date.parse().
 * fieldName is included in the error for context.
 */
export function guardIsoDateString(value: string, fieldName: string): GuardResult {
  if (!isNonEmptyString(value)) {
    return `${fieldName} must not be empty.`;
  }
  if (!ISO_DATE_RE.test(value) || isNaN(Date.parse(value))) {
    return `${fieldName} must be a date-only string (YYYY-MM-DD) or full timestamp with seconds (YYYY-MM-DDTHH:MM:SS[.frac][Z|±HH:MM]), got "${value}".`;
  }
  return undefined;
}

/** Checks that a value is a full ISO date-time string (no date-only form). */
export function guardDateTimeString(value: string, fieldName: string): GuardResult {
  if (!isNonEmptyString(value)) {
    return `${fieldName} must not be empty.`;
  }
  if (!ISO_DATETIME_RE.test(value) || isNaN(Date.parse(value))) {
    return `${fieldName} must be a full timestamp (YYYY-MM-DDTHH:MM:SS[.frac][Z|±HH:MM]), got "${value}".`;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Case field guards
// ---------------------------------------------------------------------------

/** Case id must not be empty. */
export function guardCaseId(id: string): GuardResult {
  if (!isNonEmptyString(id)) {
    return "Case id must not be empty.";
  }
  return undefined;
}

/** Case context must not be empty. */
export function guardCaseContext(context: string): GuardResult {
  if (!isNonEmptyString(context)) {
    return "Case context must not be empty.";
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Observation guards
// Enforced: text is non-empty (MASTERPLAN §2 #1 requires observation to exist).
// NOT enforced: camera-describability of content (MASTERPLAN §2 #19 — semantic).
// ---------------------------------------------------------------------------

/** Observation text must not be empty. */
export function guardObservationText(text: string): GuardResult {
  if (!isNonEmptyString(text)) {
    return "Observation text must not be empty.";
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Interpretation guards
// Enforced: text fields are non-empty (MASTERPLAN §2 #16, #17).
//           evidenceType is one of the three allowed values (runtime).
// NOT enforced: EvidenceType consistency with observation content (semantic).
// ---------------------------------------------------------------------------

const VALID_EVIDENCE_TYPES = new Set<string>([
  "observational",
  "derived",
  "speculative",
]);

/**
 * EvidenceType must be one of the three allowed values.
 * Runtime check — TypeScript type alone does not protect against JSON input.
 */
export function guardEvidenceType(value: string): GuardResult {
  if (!VALID_EVIDENCE_TYPES.has(value)) {
    return `EvidenceType must be "observational", "derived", or "speculative", got "${value}".`;
  }
  return undefined;
}

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
 * Generic guard: returns `message` when the trimmed texts of two Interpretations
 * are identical, undefined otherwise. Use this as the underlying primitive when
 * the calling context determines the correct error message.
 */
export function guardDistinctTexts(
  a: Interpretation,
  b: Interpretation,
  message: string,
): GuardResult {
  if (a.text.trim() === b.text.trim()) return message;
  return undefined;
}

/**
 * Checks that interpretation and counter-interpretation texts are not textually
 * identical (trimmed). This is a minimal formal guard: it does not verify that
 * the counter-interpretation provides a genuinely alternative explanation
 * (MASTERPLAN §2 #20 — semantic check, not yet implemented).
 */
export function guardInterpretationsDistinct(
  interpretation: Interpretation,
  counterInterpretation: Interpretation,
): GuardResult {
  return guardDistinctTexts(
    interpretation,
    counterInterpretation,
    "Interpretation text and counter-interpretation text must not be textually identical.",
  );
}

/**
 * Checks that observation text and interpretation text are not textually
 * identical (trimmed). This is a minimal formal guard supporting the
 * observation/interpretation separation required by MASTERPLAN §2 #1.
 * It does not verify semantic separation — an interpretation that paraphrases
 * the observation in different words will pass this guard.
 */
export function guardObservationInterpretationDistinct(
  observation: Observation,
  interpretation: Interpretation,
): GuardResult {
  if (observation.text.trim() === interpretation.text.trim()) {
    return "Observation text and interpretation text must not be textually identical.";
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
// Participants guards (Case MUSS-Feld: Person)
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

/** CaseParticipant id must not be empty. */
export function guardParticipantId(id: string): GuardResult {
  if (!isNonEmptyString(id)) {
    return "CaseParticipant id must not be empty.";
  }
  return undefined;
}

const VALID_ROLES = new Set<string>([
  "primary",
  "secondary",
  "staff",
  "contextual",
]);

/**
 * CaseParticipant role, if provided, must be one of the four allowed values.
 * This is an enum membership check only — no semantic role validation.
 */
export function guardParticipantRole(role: string): GuardResult {
  if (!VALID_ROLES.has(role)) {
    return `CaseParticipant role must be one of "primary", "secondary", "staff", "contextual", got "${role}".`;
  }
  return undefined;
}

/**
 * Participant ids must be unique within a case.
 * Duplicate IDs would cause one participant to silently overwrite another in
 * any id-keyed lookup. Returns the first duplicate found.
 */
export function guardParticipantIdsUnique(
  participants: readonly CaseParticipant[],
): GuardResult {
  const seen = new Set<string>();
  for (const p of participants) {
    if (seen.has(p.id)) {
      return `Participant id "${p.id}" appears more than once.`;
    }
    seen.add(p.id);
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// TensionEdge guards (UX-Blaupause §3 step 7)
// ---------------------------------------------------------------------------

const VALID_DIRECTIONS = new Set(["unidirectional", "bidirectional"]);

/** TensionEdge direction must be a valid value. */
export function guardTensionDirection(direction: string): GuardResult {
  if (!VALID_DIRECTIONS.has(direction)) {
    return `TensionEdge direction must be "unidirectional" or "bidirectional", got "${direction}".`;
  }
  return undefined;
}

/**
 * All required TensionEdge text fields must be non-empty, direction must be
 * valid, and the optional timestamp must be a parseable date string if present.
 */
export function guardTensionEdgeFields(edge: TensionEdge): readonly string[] {
  const errors: string[] = [];
  const push = (r: GuardResult) => {
    if (r) errors.push(r);
  };

  if (!isNonEmptyString(edge.source))  errors.push("TensionEdge source must not be empty.");
  if (!isNonEmptyString(edge.target))  errors.push("TensionEdge target must not be empty.");
  if (!isNonEmptyString(edge.label))   errors.push("TensionEdge label must not be empty.");
  if (!isNonEmptyString(edge.context)) errors.push("TensionEdge context must not be empty.");
  push(guardTensionDirection(edge.direction));
  if (edge.timestamp !== undefined) {
    push(guardIsoDateString(edge.timestamp, "TensionEdge timestamp"));
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Revision guards (UX-Blaupause §7; MASTERPLAN §2 #14, #21)
// ---------------------------------------------------------------------------

const VALID_DRIFT_TYPES = new Set<string>([
  "new_observation",
  "new_perspective",
  "reinterpretation",
]);

/**
 * DriftType must be one of the three allowed values.
 * Runtime check — TypeScript type alone does not protect against JSON input.
 */
export function guardDriftType(value: string): GuardResult {
  if (!VALID_DRIFT_TYPES.has(value)) {
    return `DriftType must be "new_observation", "new_perspective", or "reinterpretation", got "${value}".`;
  }
  return undefined;
}

/** Revision reason must not be empty. */
export function guardRevisionReason(reason: string): GuardResult {
  if (!isNonEmptyString(reason)) {
    return "Revision reason must not be empty.";
  }
  return undefined;
}

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


export function guardCaseSource(source: unknown): readonly string[] {
  const errors: string[] = [];
  if (typeof source !== 'object' || source === null || Array.isArray(source)) {
    return ['Case source must be an object.'];
  }

  const sourceRecord = source as Record<string, unknown>;
  if (!isNonEmptyString(sourceRecord.type)) errors.push('Case source type must not be empty.');
  if (!('payload' in sourceRecord)) errors.push('Case source payload must be present.');
  if (!isNonEmptyString(sourceRecord.importedAt)) {
    errors.push('Case source importedAt must not be empty.');
  } else {
    const dateErr = guardDateTimeString(sourceRecord.importedAt, 'CaseSource.importedAt');
    if (dateErr) errors.push(dateErr);
  }
  return errors;
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

  push(guardIsoDateString(snapshot.reflectedAt, "reflectedAt"));
  push(guardInterpretationText(snapshot.interpretation.text));
  push(guardEvidenceType(snapshot.interpretation.evidenceType));
  if (snapshot.counterInterpretations.length === 0) {
    errors.push("At least one counter-interpretation is required.");
  }
  for (const counter of snapshot.counterInterpretations) {
    push(guardCounterInterpretationText(counter.text));
    push(guardEvidenceType(counter.evidenceType));
    push(guardInterpretationsDistinct(snapshot.interpretation, counter));
  }
  for (let i = 0; i < snapshot.counterInterpretations.length; i++) {
    for (let j = i + 1; j < snapshot.counterInterpretations.length; j++) {
      const r = guardDistinctTexts(
        snapshot.counterInterpretations[i],
        snapshot.counterInterpretations[j],
        "Two counter-interpretation texts must not be textually identical.",
      );
      if (r) errors.push(r);
    }
  }
  if (snapshot.uncertainties.length === 0) {
    errors.push("At least one uncertainty is required.");
  }
  for (const u of snapshot.uncertainties) {
    push(guardUncertaintyLevel(u.level));
    push(guardUncertaintyRationale(u.rationale));
  }

  for (const edge of snapshot.tensions) {
    errors.push(...guardTensionEdgeFields(edge));
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Composite guard: validate a full Case
// ---------------------------------------------------------------------------

export function guardCase(
  caseData: {
    id: string;
    context: string;
    participants: readonly CaseParticipant[];
    observation: Observation;
    currentReflection: ReflectionSnapshot;
    revisions: readonly Revision[];
    observedAt?: string;
    sources?: unknown;
  },
): readonly string[] {
  const errors: string[] = [];

  const push = (r: GuardResult) => {
    if (r) errors.push(r);
  };

  push(guardCaseId(caseData.id));
  push(guardCaseContext(caseData.context));

  push(guardParticipantsNotEmpty(caseData.participants));
  for (const p of caseData.participants) {
    push(guardParticipantId(p.id));
    if (p.role !== undefined) {
      push(guardParticipantRole(p.role));
    }
  }
  push(guardParticipantIdsUnique(caseData.participants));

  if (caseData.observedAt !== undefined) {
    push(guardIsoDateString(caseData.observedAt, "observedAt"));
  }

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
    push(guardIsoDateString(rev.at, "Revision.at"));
    push(guardDriftType(rev.driftType));
    push(guardRevisionReason(rev.reason));
  }

  if (caseData.sources !== undefined && !Array.isArray(caseData.sources)) {
    errors.push("sources must be an array when provided.");
  } else if (Array.isArray(caseData.sources)) {
    for (const source of caseData.sources) {
      errors.push(...guardCaseSource(source));
    }
  }

  return errors;
}
