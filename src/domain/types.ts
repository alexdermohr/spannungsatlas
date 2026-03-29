/**
 * Canonical domain types for Spannungsatlas.
 *
 * Derived from:
 *   - docs/ux-ui-blaupause.md §7 "Minimal sinnvolles Datenmodell"
 *   - MASTERPLAN.md §2 Produktinvarianten
 *
 * Only types documented in those sources are included.
 * No speculative additions.
 */

// ---------------------------------------------------------------------------
// Enums / Union Types
// ---------------------------------------------------------------------------

/** Evidence classification for an interpretation (MASTERPLAN §2 #17). */
export type EvidenceType = "observational" | "derived" | "speculative";

/** Classification of how a revision differs from the prior thinking state (MASTERPLAN §2 #21). */
export type DriftType = "new_observation" | "new_perspective" | "reinterpretation";

/**
 * Uncertainty scale from 0 (certain) to 5 (highly speculative).
 * UX-Blaupause §7.
 */
export type UncertaintyLevel = 0 | 1 | 2 | 3 | 4 | 5;

/** Direction of a tension edge in the tension graph. */
export type TensionDirection = "unidirectional" | "bidirectional";

/** Allowed participant roles. */
export type ParticipantRole = "primary" | "secondary" | "staff" | "contextual";

// ---------------------------------------------------------------------------
// Domain Interfaces
// ---------------------------------------------------------------------------

/** A person involved in a case. */
export interface CaseParticipant {
  readonly id: string;
  readonly role?: ParticipantRole;
}

/**
 * A purely descriptive observation — "camera-describable" (MASTERPLAN §2 #19).
 */
export interface Observation {
  readonly text: string;
  readonly isCameraDescribable: boolean;
  readonly recurringAspects?: readonly string[];
}

/**
 * A provisional interpretation or counter-interpretation.
 * Must be marked with an evidence type (MASTERPLAN §2 #17).
 */
export interface Interpretation {
  readonly text: string;
  readonly evidenceType: EvidenceType;
  readonly rationale?: string;
}

/**
 * Explicit uncertainty marker with mandatory rationale (MASTERPLAN §2 #6).
 */
export interface Uncertainty {
  readonly level: UncertaintyLevel;
  readonly rationale: string;
}

/**
 * A directed or bidirectional tension edge in the tension graph.
 * Edges require direction, context, and time reference (UX-Blaupause §3 step 7).
 */
export interface TensionEdge {
  readonly source: string;
  readonly target: string;
  readonly label: string;
  readonly context: string;
  readonly direction: TensionDirection;
  readonly timestamp?: string;
}

/**
 * A time-stamped snapshot of a reflection — a "Denkstand".
 * Later reflections do not silently overwrite earlier ones (MASTERPLAN §2 #14).
 */
export interface ReflectionSnapshot {
  readonly reflectedAt: string;
  readonly interpretation: Interpretation;
  readonly counterInterpretation: Interpretation;
  readonly uncertainty: Uncertainty;
  readonly tensions: readonly TensionEdge[];
}

/**
 * A revision documents how thinking changed between two snapshots.
 * Drift must be classified (MASTERPLAN §2 #21).
 */
export interface Revision {
  readonly at: string;
  readonly driftType: DriftType;
  readonly reason: string;
  readonly from: ReflectionSnapshot;
  readonly to: ReflectionSnapshot;
}

/**
 * A case — the central observation/reflection unit.
 * MASTERPLAN §3.1 + UX-Blaupause §7.
 */
export interface Case {
  readonly id: string;
  readonly participants: readonly CaseParticipant[];
  readonly context: string;
  readonly observedAt?: string;
  readonly observation: Observation;
  readonly currentReflection: ReflectionSnapshot;
  readonly revisions: readonly Revision[];
}
