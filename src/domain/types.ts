/**
 * Canonical domain types for Spannungsatlas — Reflexionskern (reflection core).
 *
 * Derived from:
 *   - docs/ux-ui-blaupause.md §7 "Minimal sinnvolles Datenmodell"
 *   - MASTERPLAN.md §2 Produktinvarianten
 *
 * SCOPE NOTE — explicit phase cut after Phase 2b start:
 * The UX-Blaupause §7 data model also defines types for the exploration layer:
 * Need, Determinant, NeedSelection, DeterminantSelection.
 * Phase 2b now introduces the minimal exploration selections for perspectives:
 * `CatalogSelection`, `selectedNeeds`, and `selectedDeterminants`.
 * This is a deliberate widening of the former Phase-1-only cut.
 * The broader exploration catalog model itself is still not made canonical here
 * as top-level domain objects. Only user-picked references into the catalog are
 * stored, without automatic inference or interpretation.
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



export type PerspectiveStatus = "draft" | "committed";

/**
 * Phase 2b selection marker for the exploration layer.
 * This stores a user-picked catalog entry id without inference.
 */
export interface CatalogSelection {
  readonly id: string;
}

export interface PerspectiveDraftObservation {
  readonly text?: string;
  readonly isCameraDescribable?: boolean;
  readonly recurringAspects?: readonly string[];
}

export interface PerspectiveDraftInterpretation {
  readonly text?: string;
  readonly evidenceType?: EvidenceType;
  readonly rationale?: string;
}

export interface PerspectiveDraftUncertainty {
  readonly level?: UncertaintyLevel;
  readonly rationale?: string;
}

export interface PerspectiveDraftContent {
  readonly observation?: PerspectiveDraftObservation;
  readonly interpretation?: PerspectiveDraftInterpretation;
  readonly counterInterpretations?: readonly PerspectiveDraftInterpretation[];
  readonly uncertainties?: readonly PerspectiveDraftUncertainty[];
  readonly selectedNeeds?: readonly CatalogSelection[];
  readonly selectedDeterminants?: readonly CatalogSelection[];
}

export interface PerspectiveCommittedContent {
  readonly observation: Observation;
  readonly interpretation: Interpretation;
  readonly counterInterpretations: readonly Interpretation[];
  readonly uncertainties: readonly Uncertainty[];
  readonly selectedNeeds?: readonly CatalogSelection[];
  readonly selectedDeterminants?: readonly CatalogSelection[];
}

export interface PerspectiveDraftRecord {
  readonly id: string;
  readonly caseId: string;
  readonly actorId: string;
  readonly status: "draft";
  readonly content: PerspectiveDraftContent;
  readonly createdAt: string;
  readonly committedAt?: undefined;
}

/**
 * Phase 2b: nachgelagerte Exploration nach Commit.
 *
 * Post-commit reflection anchor for the OWN committed perspective.
 * Lives strictly outside `PerspectiveCommittedContent` so that the committed
 * epistemic core (observation, interpretation, counter-interpretations,
 * uncertainties) remains byte-identical after the user opens the exploration
 * space. Selections here are NOT inferred — they are user-picked catalog
 * markers, time-stamped as nachgelagert.
 */
export interface PerspectiveExplorationSnapshot {
  readonly selectedNeeds?: readonly CatalogSelection[];
  readonly selectedDeterminants?: readonly CatalogSelection[];
  readonly exploredAt: string;
  readonly updatedAt?: string;
}

export interface PerspectiveCommittedRecord {
  readonly id: string;
  readonly caseId: string;
  readonly actorId: string;
  readonly status: "committed";
  readonly content: PerspectiveCommittedContent;
  readonly createdAt: string;
  readonly committedAt: string;
  readonly postCommitExploration?: PerspectiveExplorationSnapshot;
}

export type PerspectiveRecord = PerspectiveDraftRecord | PerspectiveCommittedRecord;

// ---------------------------------------------------------------------------
// Spannungsprofil (Tension Profile) — MASTERPLAN §3.2
// ---------------------------------------------------------------------------

/**
 * Evidence level of a tension-profile entry (MASTERPLAN §3.2):
 * weak (schwach) | moderate (moderat) | strong (stark).
 *
 * These stages are a Schutzmechanismus gegen vorschnelle Verdichtung — a
 * protection mechanism against premature condensation — NOT a measurement
 * system. See `tension-profile.ts` for the threshold logic.
 */
export type EvidenceLevel = "weak" | "moderate" | "strong";

/**
 * Epistemic marking of a condensation (MASTERPLAN §10.2):
 * observational (beobachtungsnah) | plausible (plausibel) | speculative (spekulativ).
 *
 * This is DISTINCT from `EvidenceType` (§2 #17, used per single interpretation).
 * `EpistemicMarking` classifies a *condensed* profile/constellation entry.
 * A strong profile entry must NOT be speculative (§10.2).
 */
export type EpistemicMarking = "observational" | "plausible" | "speculative";

/**
 * A counter-evidence record (Gegenbeleg) for a tension profile (MASTERPLAN §3.2).
 *
 * Two faithful forms:
 *   - "documented": an actually documented counter-observation or -result.
 *   - "checked_none": an explicit marker that counter-evidence was sought but
 *     none was found at a given date ("kein Gegenbeleg nach Prüfung am [Datum]").
 *
 * A strong entry requires at least one of these (§3.2). Missing documentation
 * is NOT itself a counter-evidence and never substitutes for this marker.
 */
export type CounterEvidence =
  | { readonly kind: "documented"; readonly text: string; readonly recordedAt: string }
  | { readonly kind: "checked_none"; readonly checkedAt: string };

/**
 * The factual evidence base a tension profile rests on (MASTERPLAN §3.2 / §5).
 *
 * These values are ASSERTED by the formulating practitioner from documented
 * cases. The domain layer validates internal consistency and threshold
 * sufficiency but does NOT infer patterns from case content — the system is
 * "kein Wahrheitsautomat" (MASTERPLAN §1, §11.6).
 */
export interface TensionProfileSupport {
  /** Ids of the documented cases this profile rests on (MASTERPLAN §5: no
   *  condensation level without a documented case base). */
  readonly caseIds: readonly string[];
  /** Distinct points in time the dynamic was observed across (1..caseIds.length). */
  readonly distinctTimepoints: number;
  /** Distinct contexts the dynamic was observed across (1..caseIds.length). */
  readonly distinctContexts: number;
  /** Whether a robust multi-source corroboration (belastbare Mehrquellenlage) exists. */
  readonly multiSourceCorroboration: boolean;
  /** Date of the most recent supporting case — basis for 180-day decay (§3.2). */
  readonly lastSupportingCaseAt: string;
}

/**
 * Spannungsprofil — an aggregated, revisable working condensation for ONE
 * person across multiple cases (MASTERPLAN §3.2).
 *
 * It is NOT a truth judgement about a person; it is a revisable working
 * hypothesis that may exist only under the §3.2 protection rules. In V1 a single
 * `TensionProfile` object carries one verdichtete Musterbeschreibung (the
 * "Profileintrag" granularity); multiple patterns for a person are multiple
 * objects (Profilhistorie is SOLL-später, MASTERPLAN §3.2).
 *
 * The cluster fields (needPressures, determinants, expressionForms,
 * reliefConditions) are the §3.2 MUSS sub-fields. They may be empty arrays as
 * honest "Leerstellen" — content must never be fabricated to fill a MUSS field
 * (AGENTS.md: lieber explizite Leerstelle als Fantasie-Ergänzung).
 */
export interface TensionProfile {
  readonly id: string;
  readonly personId: string;
  /** verdichtete Musterbeschreibung (MUSS). */
  readonly patternDescription: string;
  /** häufige Bedürfnisdrucke (MUSS). */
  readonly needPressures: readonly string[];
  /** häufige Determinanten (MUSS). */
  readonly determinants: readonly string[];
  /** typische Ausdrucksformen (MUSS). */
  readonly expressionForms: readonly string[];
  /** typische Entlastungsbedingungen (MUSS). */
  readonly reliefConditions: readonly string[];
  /** Evidenzstufe (MUSS). Gated by `support` via the §3.2 thresholds. */
  readonly evidenceLevel: EvidenceLevel;
  /** Epistemic marking (§10.2). A strong entry must not be speculative. */
  readonly epistemicMarking: EpistemicMarking;
  /** Gegenbelege (MUSS). A strong entry requires at least one. */
  readonly counterEvidence: readonly CounterEvidence[];
  /** The factual evidence base; gates the evidence level. */
  readonly support: TensionProfileSupport;
  /** Revisionsdatum (MUSS). */
  readonly revisedAt: string;
  readonly createdAt: string;
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
  readonly perspectives?: readonly PerspectiveRecord[];
}
