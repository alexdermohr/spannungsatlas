/**
 * Spannungsprofil (Tension Profile) — condensation protection logic.
 *
 * Implements the MASTERPLAN §3.2 evidence/threshold logic together with the
 * §10.2 epistemic-marking constraints. This module is a Schutzmechanismus
 * gegen vorschnelle Verdichtung — a protection mechanism against premature
 * condensation — not a measurement or inference engine.
 *
 * DESIGN — the system GUARDS, it does not AUTHOR:
 *   A `TensionProfile` is FORMULATED by a practitioner (MASTERPLAN §6.1:
 *   "einfaches Spannungsprofil aus mehreren Fällen formulieren"). This module
 *   never infers patterns from case content; it validates that a formulated
 *   profile rests on a sufficient, internally consistent evidence base and
 *   obeys the §3.2 protection rules. The system is "kein Wahrheitsautomat"
 *   (MASTERPLAN §1, §11.6).
 *
 * THRESHOLD SEMANTICS — PROTECTION FLOORS, not exact matches:
 *   Each evidence level lists the MINIMUM evidence required to be allowed to
 *   claim it. Marking an entry at a LOWER level than the evidence would permit
 *   is always allowed (conservative). The guards only prevent claiming a HIGHER
 *   level than the evidence supports. This is why a strict "genau 2 Fälle" in
 *   §3.2's weak definition is treated as "at least 2 cases" here: more evidence
 *   never makes a weak claim unsafe.
 *
 * WHAT THIS MODULE DOES NOT ENFORCE (semantic / requires future case data):
 *   - "Gleiche Richtung" of the supporting cases (§3.2 weak): asserted by the
 *     act of formulating ONE Musterbeschreibung over the cases, not separately
 *     checked.
 *   - Validity loss when "die 2 letzten relevanten Fälle widersprechen" (§3.2):
 *     requires structured per-case contradiction/outcome data that V1 cases do
 *     not yet carry. Only the time-based 180-day decay rule is enforced here.
 */

import type {
  CounterEvidence,
  EpistemicMarking,
  EvidenceLevel,
  TensionProfile,
  TensionProfileSupport,
} from "./types.js";
import { guardIsoDateString, type GuardResult } from "./guards.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const EVIDENCE_LEVELS: readonly EvidenceLevel[] = ["weak", "moderate", "strong"];
export const EPISTEMIC_MARKINGS: readonly EpistemicMarking[] = [
  "observational",
  "plausible",
  "speculative",
];

/** Minimum documented cases for a tension profile to exist at all (MASTERPLAN §3.2). */
export const MIN_CASES_FOR_PROFILE = 2;

/** Days without a supporting case after which an entry becomes revision-due (§3.2). */
export const PROFILE_DECAY_DAYS = 180;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Primitive checks
// ---------------------------------------------------------------------------

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ---------------------------------------------------------------------------
// Enum guards
// ---------------------------------------------------------------------------

/** EvidenceLevel must be one of the three allowed values (runtime check). */
export function guardEvidenceLevel(value: string): GuardResult {
  if (!(EVIDENCE_LEVELS as readonly string[]).includes(value)) {
    return `EvidenceLevel must be "weak", "moderate", or "strong", got "${value}".`;
  }
  return undefined;
}

/** EpistemicMarking must be one of the three allowed values (runtime check). */
export function guardEpistemicMarking(value: string): GuardResult {
  if (!(EPISTEMIC_MARKINGS as readonly string[]).includes(value)) {
    return `EpistemicMarking must be "observational", "plausible", or "speculative", got "${value}".`;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Eligibility convenience (existence gate only)
// ---------------------------------------------------------------------------

/**
 * Whether a person with `caseCount` documented cases meets the bare minimum
 * case threshold for a tension profile to exist at all (MASTERPLAN §3.2).
 *
 * This is ONLY the existence gate. It implies no particular evidence level and
 * performs no condensation, inference or judgement.
 */
export function meetsProfileCaseThreshold(caseCount: number): boolean {
  return caseCount >= MIN_CASES_FOR_PROFILE;
}

// ---------------------------------------------------------------------------
// Evidence-level thresholds (the protection floors)
// ---------------------------------------------------------------------------

/**
 * Returns undefined if `support` satisfies the protection FLOOR for `level`,
 * otherwise an explanatory message.
 *
 * Per MASTERPLAN §3.2:
 *   - weak:     ≥ 2 cases, OR 1 case + robust multi-source corroboration.
 *   - moderate: ≥ 3 cases AND (≥ 2 timepoints OR ≥ 2 contexts).
 *   - strong:   (≥ 4 cases AND ≥ 2 timepoints AND ≥ 2 contexts),
 *               OR robust multi-source corroboration.
 *
 * The counter-evidence requirement and the no-speculation rule for strong
 * entries (the "Gegenbelegprüfung") are enforced separately — see
 * `counterEvidenceSatisfiesStrong` and `guardTensionProfile`.
 */
export function evidenceLevelRequirementsMet(
  level: EvidenceLevel,
  support: TensionProfileSupport,
): GuardResult {
  const n = support.caseIds.length;
  switch (level) {
    case "weak":
      if (n >= 2) return undefined;
      if (n >= 1 && support.multiSourceCorroboration) return undefined;
      return "A weak profile entry requires at least 2 supporting cases, or 1 case with robust multi-source corroboration (MASTERPLAN §3.2).";
    case "moderate":
      if (n >= 3 && (support.distinctTimepoints >= 2 || support.distinctContexts >= 2)) {
        return undefined;
      }
      return "A moderate profile entry requires at least 3 cases showing the same dynamic across at least 2 timepoints or 2 contexts (MASTERPLAN §3.2).";
    case "strong":
      if (n >= 4 && support.distinctTimepoints >= 2 && support.distinctContexts >= 2) {
        return undefined;
      }
      if (support.multiSourceCorroboration) return undefined;
      return "A strong profile entry requires at least 4 cases across at least 2 timepoints and 2 contexts, or robust multi-source corroboration (MASTERPLAN §3.2).";
    default:
      return guardEvidenceLevel(level);
  }
}

/**
 * Whether the counter-evidence (Gegenbelege) suffices for a STRONG entry.
 *
 * A strong entry must not be released without either a documented counter-
 * evidence OR an explicit "checked, none found" marker (MASTERPLAN §3.2).
 * Both kinds count; an empty list does not.
 */
export function counterEvidenceSatisfiesStrong(
  counterEvidence: readonly CounterEvidence[],
): boolean {
  return counterEvidence.length >= 1;
}

// ---------------------------------------------------------------------------
// Decay (MASTERPLAN §3.2 — 180 days)
// ---------------------------------------------------------------------------

export interface ProfileDecayStatus {
  readonly status: "current" | "revision_due";
  readonly daysSinceLastSupport: number;
  readonly reason?: string;
}

/**
 * Evaluates whether a profile has become revision-due because no supporting
 * case has been documented for more than `PROFILE_DECAY_DAYS` (MASTERPLAN §3.2).
 *
 * Missing documentation marks the entry revision-due; it never counts as a
 * counter-evidence and never silently invalidates the entry.
 *
 * `asOfIso` and `profile.support.lastSupportingCaseAt` must be valid ISO date
 * strings (the factory guarantees the latter).
 */
export function evaluateProfileDecay(
  profile: TensionProfile,
  asOfIso: string,
): ProfileDecayStatus {
  const last = Date.parse(profile.support.lastSupportingCaseAt);
  const asOf = Date.parse(asOfIso);
  const days = Math.floor((asOf - last) / MS_PER_DAY);

  if (days > PROFILE_DECAY_DAYS) {
    return {
      status: "revision_due",
      daysSinceLastSupport: days,
      reason: `No supporting case documented for ${days} days (> ${PROFILE_DECAY_DAYS}); the entry is revision-due (MASTERPLAN §3.2). Missing documentation does not count as counter-evidence.`,
    };
  }
  return { status: "current", daysSinceLastSupport: days };
}

// ---------------------------------------------------------------------------
// Structural guards
// ---------------------------------------------------------------------------

/** Validates a single counter-evidence entry structurally. */
export function guardCounterEvidence(value: unknown): readonly string[] {
  if (!isPlainObject(value)) {
    return ["CounterEvidence must be an object."];
  }
  const errors: string[] = [];
  const kind = value.kind;
  if (kind === "documented") {
    if (!isNonEmptyString(value.text)) {
      errors.push("Documented counter-evidence must have non-empty text.");
    }
    if (typeof value.recordedAt !== "string") {
      errors.push("Documented counter-evidence recordedAt must be a string.");
    } else {
      const dateErr = guardIsoDateString(value.recordedAt, "CounterEvidence.recordedAt");
      if (dateErr) errors.push(dateErr);
    }
  } else if (kind === "checked_none") {
    if (typeof value.checkedAt !== "string") {
      errors.push("checked_none counter-evidence checkedAt must be a string.");
    } else {
      const dateErr = guardIsoDateString(value.checkedAt, "CounterEvidence.checkedAt");
      if (dateErr) errors.push(dateErr);
    }
  } else {
    errors.push(`CounterEvidence kind must be "documented" or "checked_none", got "${String(kind)}".`);
  }
  return errors;
}

/** Validates the factual evidence base (support) structurally. */
export function guardTensionProfileSupport(value: unknown): readonly string[] {
  if (!isPlainObject(value)) {
    return ["TensionProfileSupport must be an object."];
  }
  const errors: string[] = [];

  if (!Array.isArray(value.caseIds) || value.caseIds.length === 0) {
    errors.push("TensionProfileSupport.caseIds must be a non-empty array.");
  } else {
    const seen = new Set<string>();
    for (const id of value.caseIds) {
      if (!isNonEmptyString(id)) {
        errors.push("TensionProfileSupport.caseIds entries must be non-empty strings.");
        continue;
      }
      if (seen.has(id)) {
        errors.push(`TensionProfileSupport.caseIds must not contain duplicate id "${id}".`);
      }
      seen.add(id);
    }
  }

  const n = Array.isArray(value.caseIds) ? value.caseIds.length : 0;

  const checkCount = (field: "distinctTimepoints" | "distinctContexts") => {
    const v = value[field];
    if (typeof v !== "number" || !Number.isInteger(v)) {
      errors.push(`TensionProfileSupport.${field} must be an integer.`);
    } else if (v < 1) {
      errors.push(`TensionProfileSupport.${field} must be at least 1 when cases are present.`);
    } else if (n > 0 && v > n) {
      errors.push(`TensionProfileSupport.${field} (${v}) must not exceed the number of supporting cases (${n}).`);
    }
  };
  checkCount("distinctTimepoints");
  checkCount("distinctContexts");

  if (typeof value.multiSourceCorroboration !== "boolean") {
    errors.push("TensionProfileSupport.multiSourceCorroboration must be a boolean.");
  }

  if (typeof value.lastSupportingCaseAt !== "string") {
    errors.push("TensionProfileSupport.lastSupportingCaseAt must be a string.");
  } else {
    const dateErr = guardIsoDateString(value.lastSupportingCaseAt, "TensionProfileSupport.lastSupportingCaseAt");
    if (dateErr) errors.push(dateErr);
  }

  return errors;
}

function guardStringClusterField(
  errors: string[],
  value: unknown,
  fieldName: string,
): void {
  if (!Array.isArray(value)) {
    errors.push(`${fieldName} must be an array.`);
    return;
  }
  const seen = new Set<string>();
  for (const entry of value) {
    if (!isNonEmptyString(entry)) {
      errors.push(`${fieldName} entries must be non-empty strings.`);
      continue;
    }
    const key = entry.trim();
    if (seen.has(key)) {
      errors.push(`${fieldName} must not contain duplicate entry "${key}".`);
    }
    seen.add(key);
  }
}

/**
 * Composite structural + cross-field guard for a full TensionProfile.
 *
 * Enforces the §3.2 protection rules:
 *   - the claimed evidence level is justified by the support (threshold floor),
 *   - a strong entry has sufficient counter-evidence (Gegenbelegprüfung),
 *   - a strong entry is not marked speculative (§10.2),
 *   - all MUSS fields are present and structurally valid.
 */
export function guardTensionProfile(value: unknown): readonly string[] {
  if (!isPlainObject(value)) {
    return ["TensionProfile must be an object."];
  }
  const errors: string[] = [];
  const push = (r: GuardResult) => {
    if (r) errors.push(r);
  };

  if (!isNonEmptyString(value.id)) errors.push("TensionProfile.id must not be empty.");
  if (!isNonEmptyString(value.personId)) errors.push("TensionProfile.personId must not be empty.");
  if (!isNonEmptyString(value.patternDescription)) {
    errors.push("TensionProfile.patternDescription (verdichtete Musterbeschreibung) must not be empty.");
  }

  guardStringClusterField(errors, value.needPressures, "TensionProfile.needPressures");
  guardStringClusterField(errors, value.determinants, "TensionProfile.determinants");
  guardStringClusterField(errors, value.expressionForms, "TensionProfile.expressionForms");
  guardStringClusterField(errors, value.reliefConditions, "TensionProfile.reliefConditions");

  const levelValid = typeof value.evidenceLevel === "string" && guardEvidenceLevel(value.evidenceLevel) === undefined;
  if (typeof value.evidenceLevel !== "string") {
    errors.push("TensionProfile.evidenceLevel must be a string.");
  } else {
    push(guardEvidenceLevel(value.evidenceLevel));
  }

  if (typeof value.epistemicMarking !== "string") {
    errors.push("TensionProfile.epistemicMarking must be a string.");
  } else {
    push(guardEpistemicMarking(value.epistemicMarking));
  }

  if (!Array.isArray(value.counterEvidence)) {
    errors.push("TensionProfile.counterEvidence must be an array.");
  } else {
    for (const ce of value.counterEvidence) {
      errors.push(...guardCounterEvidence(ce));
    }
  }

  const supportErrors = guardTensionProfileSupport(value.support);
  errors.push(...supportErrors);

  if (typeof value.revisedAt !== "string") {
    errors.push("TensionProfile.revisedAt (Revisionsdatum) must be a string.");
  } else {
    push(guardIsoDateString(value.revisedAt, "TensionProfile.revisedAt"));
  }
  if (typeof value.createdAt !== "string") {
    errors.push("TensionProfile.createdAt must be a string.");
  } else {
    push(guardIsoDateString(value.createdAt, "TensionProfile.createdAt"));
  }

  // Cross-field protection rules — only meaningful once level + support are valid.
  if (levelValid && supportErrors.length === 0) {
    const level = value.evidenceLevel as EvidenceLevel;
    const support = value.support as TensionProfileSupport;
    push(evidenceLevelRequirementsMet(level, support));

    if (level === "strong") {
      const counterEvidence = Array.isArray(value.counterEvidence)
        ? (value.counterEvidence as readonly CounterEvidence[])
        : [];
      if (!counterEvidenceSatisfiesStrong(counterEvidence)) {
        errors.push(
          "A strong profile entry requires at least one documented Gegenbeleg or an explicit \"checked, none found\" marker (MASTERPLAN §3.2).",
        );
      }
      if (value.epistemicMarking === "speculative") {
        errors.push("A strong profile entry must not be marked speculative (MASTERPLAN §10.2).");
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface CreateTensionProfileInput {
  id: string;
  personId: string;
  patternDescription: string;
  needPressures?: readonly string[];
  determinants?: readonly string[];
  expressionForms?: readonly string[];
  reliefConditions?: readonly string[];
  evidenceLevel: EvidenceLevel;
  epistemicMarking: EpistemicMarking;
  counterEvidence?: readonly CounterEvidence[];
  support: TensionProfileSupport;
  revisedAt: string;
  createdAt: string;
}

/**
 * Constructs a validated TensionProfile, or throws with a descriptive message.
 *
 * The profile is FORMULATED by the caller; this factory only verifies that the
 * formulation obeys the §3.2 protection rules. It does not infer, score, or
 * complete any field.
 */
export function createTensionProfile(input: CreateTensionProfileInput): TensionProfile {
  const profile: TensionProfile = {
    id: input.id,
    personId: input.personId,
    patternDescription: input.patternDescription,
    needPressures: [...(input.needPressures ?? [])],
    determinants: [...(input.determinants ?? [])],
    expressionForms: [...(input.expressionForms ?? [])],
    reliefConditions: [...(input.reliefConditions ?? [])],
    evidenceLevel: input.evidenceLevel,
    epistemicMarking: input.epistemicMarking,
    counterEvidence: [...(input.counterEvidence ?? [])],
    support: {
      ...input.support,
      caseIds: [...input.support.caseIds],
    },
    revisedAt: input.revisedAt,
    createdAt: input.createdAt,
  };

  const errors = guardTensionProfile(profile);
  if (errors.length > 0) {
    throw new Error(errors.join(" | "));
  }
  return profile;
}
