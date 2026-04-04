/**
 * Canonical domain types for Spannungsatlas — Reflexionskern (reflection core).
 *
 * Derived from:
 *   - docs/ux-ui-blaupause.md §7 "Minimal sinnvolles Datenmodell"
 *   - MASTERPLAN.md §2 Produktinvarianten
 *
 * SCOPE NOTE — deliberate phase cut:
 * The UX-Blaupause §7 data model also defines types for the exploration layer:
 * Need, Determinant, NeedSelection, DeterminantSelection.
 * These are intentionally NOT included here. They belong to a later phase
 * (Explorationsraum, UX-Blaupause §2 "Ebene A") and depend on a separate
 * catalog structure. Absence is intentional, not accidental.
 *
 * What is enforced by the accompanying guards (guards.ts):
 *   - Structural/formal constraints: non-empty required fields, value ranges,
 *     enum membership, presence of mandatory sub-objects.
 *   - Textual non-identity between observation, interpretation, and
 *     counter-interpretation texts.
 *
 * What is NOT enforced — requires future semantic or NLP-based checks:
 *   - Camera-describability of observation text (MASTERPLAN §2 #19).
 *   - Whether an interpretation is genuinely observational vs. speculative
 *     beyond the user-declared EvidenceType.
 *   - Whether a counter-interpretation provides a genuine alternative
 *     explanation rather than a mere reformulation (MASTERPLAN §2 #20).
 *   - Absence of essentialising language in any text field.
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

/**
 * Lifecycle status of an independent perspective.
 *
 * - "draft":     Being authored; visible only to the owning actor.
 *                Content may be incomplete. No other actor may read it.
 * - "committed": Finalized and immutable. Visible to all actors on the case
 *                once comparison is allowed (≥ 2 committed perspectives).
 */
export type PerspectiveStatus = "draft" | "committed";

// ---------------------------------------------------------------------------
// Domain Interfaces
// ---------------------------------------------------------------------------

/** A person involved in a case. */
export interface CaseParticipant {
  readonly id: string;
  readonly role?: ParticipantRole;
}

/**
 * A descriptive observation of a situation.
 *
 * The field `isCameraDescribable` is a user-supplied flag indicating whether
 * the author considers the text to be camera-describable (MASTERPLAN §2 #19).
 * The system does NOT verify this claim — no semantic or linguistic check is
 * performed on the text. The flag is structural metadata only.
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
 *
 * At least one counter-interpretation and at least one uncertainty are required.
 * Multiple counter-interpretations are alternative explanations of the same observation.
 * Multiple uncertainties are independently reasoned sources of doubt, not a
 * computed aggregate. Each entry stands on its own with its own level and rationale.
 */
export interface ReflectionSnapshot {
  readonly reflectedAt: string;
  readonly interpretation: Interpretation;
  readonly counterInterpretations: readonly Interpretation[];
  readonly uncertainties: readonly Uncertainty[];
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


export interface CaseSource {
  readonly type: string;
  readonly payload: unknown;
  readonly importedAt: string;
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
  readonly sources?: readonly CaseSource[];
}

// ---------------------------------------------------------------------------
// Independent Perspective (Blindheits-Architektur)
// ---------------------------------------------------------------------------

/**
 * Content of an independent perspective — the structured fields an actor
 * fills in isolation, without seeing other actors' perspectives.
 *
 * All fields are optional while status is "draft" (partial save).
 * All fields must be non-empty when the perspective is committed.
 */
export interface PerspectiveContent {
  readonly observation?: string;
  readonly interpretation?: string;
  readonly counterInterpretation?: string;
  readonly uncertainty?: string;
}

/**
 * An independent perspective authored by a single actor for a case.
 *
 * Invariants (enforced by guards + access control, not only UI):
 *   - While status = "draft": readable ONLY by the owning actor.
 *     No metadata about other actors or perspectives is exposed.
 *   - Transition to "committed": requires all content fields non-empty.
 *     committed_at is set; content becomes immutable.
 *   - After commit: readable by any actor, but not modifiable.
 *   - Comparison mode requires ≥ 2 committed perspectives on the same case.
 */
export interface Perspective {
  readonly id: string;
  readonly case_id: string;
  readonly actor_id: string;
  readonly status: PerspectiveStatus;
  readonly content: PerspectiveContent;
  readonly created_at: string;
  readonly committed_at?: string;
}
