import { describe, it, expect } from "vitest";
import {
  guardObservationText,
  guardInterpretationText,
  guardCounterInterpretationText,
  guardInterpretationsDistinct,
  guardDistinctTexts,
  guardObservationInterpretationDistinct,
  guardUncertaintyLevel,
  guardUncertaintyRationale,
  guardCaseId,
  guardCaseContext,
  guardParticipantsNotEmpty,
  guardParticipantId,
  guardParticipantRole,
  guardParticipantIdsUnique,
  guardEvidenceType,
  guardDriftType,
  guardRevisionReason,
  guardTensionDirection,
  guardTensionEdgeFields,
  guardIsoDateString,
  guardRevisionFromTo,
  guardReflectionSnapshot,
  guardCase,
  guardPerspectiveRecord,
  guardPerspectiveContent,
} from "../../src/domain/guards.js";
import type {
  Interpretation,
  Observation,
  ReflectionSnapshot,
  TensionEdge,
} from "../../src/domain/types.js";

// ---------------------------------------------------------------------------
// Helpers: valid fixtures
// ---------------------------------------------------------------------------

function validObservation(): Observation {
  return {
    text: "Kind schlägt mit der Hand auf den Tisch.",
    isCameraDescribable: true,
  };
}

function validInterpretation(): Interpretation {
  return {
    text: "Das Kind zeigt körperliche Anspannung.",
    evidenceType: "observational",
  };
}

function validCounterInterpretation(): Interpretation {
  return {
    text: "Das Kind versucht Aufmerksamkeit zu gewinnen.",
    evidenceType: "derived",
  };
}

function validSnapshot(): ReflectionSnapshot {
  return {
    reflectedAt: "2026-03-28T10:00:00Z",
    interpretation: validInterpretation(),
    counterInterpretations: [validCounterInterpretation()],
    uncertainties: [{ level: 3, rationale: "Nur ein Einzelereignis beobachtet." }],
    tensions: [],
  };
}

// ---------------------------------------------------------------------------
// Observation guards
// ---------------------------------------------------------------------------

describe("guardObservationText", () => {
  it("accepts non-empty text", () => {
    expect(guardObservationText("etwas beobachtet")).toBeUndefined();
  });

  it("rejects empty string", () => {
    expect(guardObservationText("")).toBeDefined();
  });

  it("rejects whitespace-only string", () => {
    expect(guardObservationText("   ")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Interpretation guards
// ---------------------------------------------------------------------------

describe("guardInterpretationText", () => {
  it("accepts non-empty text", () => {
    expect(guardInterpretationText("eine Deutung")).toBeUndefined();
  });

  it("rejects empty string", () => {
    expect(guardInterpretationText("")).toBeDefined();
  });
});

describe("guardCounterInterpretationText", () => {
  it("accepts non-empty text", () => {
    expect(guardCounterInterpretationText("eine Gegen-Deutung")).toBeUndefined();
  });

  it("rejects empty string", () => {
    expect(guardCounterInterpretationText("")).toBeDefined();
  });

  it("rejects whitespace-only string", () => {
    expect(guardCounterInterpretationText("  ")).toBeDefined();
  });
});

describe("guardInterpretationsDistinct", () => {
  it("passes when texts differ", () => {
    expect(
      guardInterpretationsDistinct(
        validInterpretation(),
        validCounterInterpretation(),
      ),
    ).toBeUndefined();
  });

  it("fails when texts are identical", () => {
    const interp = validInterpretation();
    expect(guardInterpretationsDistinct(interp, interp)).toBeDefined();
  });

  it("fails when texts are identical except for whitespace", () => {
    const a = { ...validInterpretation(), text: "  Deutung  " };
    const b = { ...validCounterInterpretation(), text: "Deutung" };
    expect(guardInterpretationsDistinct(a, b)).toBeDefined();
  });
});

describe("guardDistinctTexts", () => {
  it("returns the supplied message when texts are identical", () => {
    const a = validInterpretation();
    const msg = "Two counter-interpretation texts must not be textually identical.";
    expect(guardDistinctTexts(a, a, msg)).toBe(msg);
  });

  it("returns undefined when texts differ", () => {
    expect(
      guardDistinctTexts(validInterpretation(), validCounterInterpretation(), "msg"),
    ).toBeUndefined();
  });

  it("uses the caller-supplied message, not a hardcoded one", () => {
    const a = { ...validInterpretation(), text: "same" };
    const b = { ...validCounterInterpretation(), text: "same" };
    const customMsg = "Gegen-Deutungen dürfen nicht identisch sein.";
    expect(guardDistinctTexts(a, b, customMsg)).toBe(customMsg);
  });
});

describe("guardObservationInterpretationDistinct", () => {
  it("passes when texts differ", () => {
    expect(
      guardObservationInterpretationDistinct(
        validObservation(),
        validInterpretation(),
      ),
    ).toBeUndefined();
  });

  it("fails when texts are identical", () => {
    const obs = validObservation();
    const interp = { ...validInterpretation(), text: obs.text };
    expect(
      guardObservationInterpretationDistinct(obs, interp),
    ).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Uncertainty guards
// ---------------------------------------------------------------------------

describe("guardUncertaintyLevel", () => {
  it.each([0, 1, 2, 3, 4, 5])("accepts level %i", (level) => {
    expect(guardUncertaintyLevel(level)).toBeUndefined();
  });

  it("rejects negative values", () => {
    expect(guardUncertaintyLevel(-1)).toBeDefined();
  });

  it("rejects values above 5", () => {
    expect(guardUncertaintyLevel(6)).toBeDefined();
  });

  it("rejects non-integer values", () => {
    expect(guardUncertaintyLevel(2.5)).toBeDefined();
  });
});

describe("guardUncertaintyRationale", () => {
  it("accepts non-empty rationale", () => {
    expect(guardUncertaintyRationale("Noch unklar.")).toBeUndefined();
  });

  it("rejects empty string", () => {
    expect(guardUncertaintyRationale("")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Case field guards
// ---------------------------------------------------------------------------

describe("guardCaseId", () => {
  it("accepts non-empty id", () => {
    expect(guardCaseId("case-001")).toBeUndefined();
  });

  it("rejects empty id", () => {
    expect(guardCaseId("")).toBeDefined();
  });

  it("rejects whitespace-only id", () => {
    expect(guardCaseId("   ")).toBeDefined();
  });
});

describe("guardCaseContext", () => {
  it("accepts non-empty context", () => {
    expect(guardCaseContext("Klassenraum, Montag")).toBeUndefined();
  });

  it("rejects empty context", () => {
    expect(guardCaseContext("")).toBeDefined();
  });

  it("rejects whitespace-only context", () => {
    expect(guardCaseContext("   ")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// EvidenceType guard
// ---------------------------------------------------------------------------

describe("guardEvidenceType", () => {
  it.each(["observational", "derived", "speculative"])(
    'accepts evidenceType "%s"',
    (value) => {
      expect(guardEvidenceType(value)).toBeUndefined();
    },
  );

  it("rejects unknown value", () => {
    expect(guardEvidenceType("factual")).toBeDefined();
  });

  it("rejects empty string", () => {
    expect(guardEvidenceType("")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// DriftType guard
// ---------------------------------------------------------------------------

describe("guardDriftType", () => {
  it.each(["new_observation", "new_perspective", "reinterpretation"])(
    'accepts driftType "%s"',
    (value) => {
      expect(guardDriftType(value)).toBeUndefined();
    },
  );

  it("rejects unknown value", () => {
    expect(guardDriftType("correction")).toBeDefined();
  });

  it("rejects empty string", () => {
    expect(guardDriftType("")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Revision reason guard
// ---------------------------------------------------------------------------

describe("guardRevisionReason", () => {
  it("accepts non-empty reason", () => {
    expect(guardRevisionReason("Neues Gespräch lieferte andere Sicht.")).toBeUndefined();
  });

  it("rejects empty string", () => {
    expect(guardRevisionReason("")).toBeDefined();
  });

  it("rejects whitespace-only string", () => {
    expect(guardRevisionReason("   ")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Participants guard
// ---------------------------------------------------------------------------

describe("guardParticipantsNotEmpty", () => {
  it("accepts non-empty array", () => {
    expect(
      guardParticipantsNotEmpty([{ id: "p1" }]),
    ).toBeUndefined();
  });

  it("rejects empty array", () => {
    expect(guardParticipantsNotEmpty([])).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// CaseParticipant id / role guards
// ---------------------------------------------------------------------------

describe("guardParticipantId", () => {
  it("accepts non-empty id", () => {
    expect(guardParticipantId("p1")).toBeUndefined();
  });

  it("rejects empty id", () => {
    expect(guardParticipantId("")).toBeDefined();
  });

  it("rejects whitespace-only id", () => {
    expect(guardParticipantId("   ")).toBeDefined();
  });
});

describe("guardParticipantRole", () => {
  it.each(["primary", "secondary", "staff", "contextual"])(
    'accepts role "%s"',
    (role) => {
      expect(guardParticipantRole(role)).toBeUndefined();
    },
  );

  it("rejects unknown role", () => {
    expect(guardParticipantRole("admin")).toBeDefined();
  });

  it("rejects empty role string", () => {
    expect(guardParticipantRole("")).toBeDefined();
  });
});

describe("guardParticipantIdsUnique", () => {
  it("passes when all ids are distinct", () => {
    expect(
      guardParticipantIdsUnique([
        { id: "p1", role: "primary" },
        { id: "p2", role: "secondary" },
      ]),
    ).toBeUndefined();
  });

  it("passes for a single participant", () => {
    expect(guardParticipantIdsUnique([{ id: "p1" }])).toBeUndefined();
  });

  it("passes for an empty array", () => {
    expect(guardParticipantIdsUnique([])).toBeUndefined();
  });

  it("returns an error for duplicate ids", () => {
    const result = guardParticipantIdsUnique([
      { id: "Anna", role: "primary" },
      { id: "Ben", role: "secondary" },
      { id: "Anna", role: "contextual" },
    ]);
    expect(result).toBeDefined();
    expect(result).toMatch(/Anna/);
  });

  it("returns an error for the first duplicate, not all duplicates", () => {
    const result = guardParticipantIdsUnique([
      { id: "x" },
      { id: "x" },
      { id: "y" },
      { id: "y" },
    ]);
    expect(result).toBeDefined();
    expect(result).toMatch(/x/);
  });
});

// ---------------------------------------------------------------------------
// Date/time guard
// ---------------------------------------------------------------------------

describe("guardIsoDateString", () => {
  it("accepts a full ISO 8601 datetime string", () => {
    expect(
      guardIsoDateString("2026-03-28T10:00:00Z", "someField"),
    ).toBeUndefined();
  });

  it("accepts a date-only ISO 8601 string", () => {
    expect(guardIsoDateString("2026-03-28", "someField")).toBeUndefined();
  });

  it("rejects a non-date string", () => {
    expect(guardIsoDateString("not-a-date", "someField")).toBeDefined();
  });

  it("rejects an empty string", () => {
    expect(guardIsoDateString("", "someField")).toBeDefined();
  });

  it("includes the field name in the error message", () => {
    const result = guardIsoDateString("garbage", "reflectedAt");
    expect(result).toMatch(/reflectedAt/);
  });
});

// ---------------------------------------------------------------------------
// TensionEdge guard
// ---------------------------------------------------------------------------

describe("guardTensionDirection", () => {
  it('accepts "unidirectional"', () => {
    expect(guardTensionDirection("unidirectional")).toBeUndefined();
  });

  it('accepts "bidirectional"', () => {
    expect(guardTensionDirection("bidirectional")).toBeUndefined();
  });

  it("rejects invalid direction", () => {
    expect(guardTensionDirection("lateral")).toBeDefined();
  });
});

describe("guardTensionEdgeFields", () => {
  function validEdge(): TensionEdge {
    return {
      source: "child",
      target: "teacher",
      label: "Druck",
      context: "Klassenraum",
      direction: "unidirectional",
    };
  }

  it("returns no errors for a valid edge", () => {
    expect(guardTensionEdgeFields(validEdge())).toHaveLength(0);
  });

  it("returns an error when source is empty", () => {
    const errors = guardTensionEdgeFields({ ...validEdge(), source: "" });
    expect(errors.some((e) => /source/i.test(e))).toBe(true);
  });

  it("returns an error when target is empty", () => {
    const errors = guardTensionEdgeFields({ ...validEdge(), target: "  " });
    expect(errors.some((e) => /target/i.test(e))).toBe(true);
  });

  it("returns an error when label is empty", () => {
    const errors = guardTensionEdgeFields({ ...validEdge(), label: "" });
    expect(errors.some((e) => /label/i.test(e))).toBe(true);
  });

  it("returns an error when context is empty", () => {
    const errors = guardTensionEdgeFields({ ...validEdge(), context: "" });
    expect(errors.some((e) => /context/i.test(e))).toBe(true);
  });

  it("returns an error when direction is invalid", () => {
    const errors = guardTensionEdgeFields({
      ...validEdge(),
      direction: "lateral" as any,
    });
    expect(errors.some((e) => /direction/i.test(e))).toBe(true);
  });

  it("returns an error when timestamp is not a parseable date", () => {
    const errors = guardTensionEdgeFields({
      ...validEdge(),
      timestamp: "not-a-date",
    });
    expect(errors.some((e) => /timestamp/i.test(e))).toBe(true);
  });

  it("accepts a valid optional timestamp", () => {
    const errors = guardTensionEdgeFields({
      ...validEdge(),
      timestamp: "2026-03-28T10:00:00Z",
    });
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Revision guard
// ---------------------------------------------------------------------------

describe("guardRevisionFromTo", () => {
  it("passes with both snapshots present", () => {
    const s = validSnapshot();
    expect(guardRevisionFromTo(s, s)).toBeUndefined();
  });

  it("fails when from is null", () => {
    expect(guardRevisionFromTo(null, validSnapshot())).toBeDefined();
  });

  it("fails when to is undefined", () => {
    expect(guardRevisionFromTo(validSnapshot(), undefined)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Composite: ReflectionSnapshot
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// guardPerspectiveRecord & guardPerspectiveContent
// ---------------------------------------------------------------------------

describe("guardPerspectiveRecord & guardPerspectiveContent", () => {
  it("guardPerspectiveRecord rejects null or non-objects", () => {
    expect(guardPerspectiveRecord(null).length).toBeGreaterThan(0);
    expect(guardPerspectiveRecord("string").length).toBeGreaterThan(0);
    expect(guardPerspectiveRecord([]).length).toBeGreaterThan(0);
  });

  it("guardPerspectiveContent rejects missing observation/interpretation objects", () => {
    expect(guardPerspectiveContent({}).length).toBeGreaterThan(0);
    expect(guardPerspectiveContent({ observation: "string" }).length).toBeGreaterThan(0);
  });

  it("guardCase passes elements without casting and rejects invalid arrays", () => {
    const invalidCase: any = {
      id: "case-1",
      context: "ctx",
      participants: [{ id: "p1", role: "primary" }],
      observation: { text: "obs", isCameraDescribable: true },
      currentReflection: {
        reflectedAt: "2026-04-01T10:00:00Z",
        interpretation: { text: "int", evidenceType: "observational" },
        counterInterpretations: [{ text: "c", evidenceType: "derived" }],
        uncertainties: [{ level: 2, rationale: "unc" }],
        tensions: []
      },
      revisions: [],
      perspectives: [null, "string"] // Invalid perspectives
    };
    const errors = guardCase(invalidCase);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes("PerspectiveRecord must be an object"))).toBe(true);
  });
});


  it("guardCase rejects multiple perspectives for the same actor", () => {
    const invalidCase: any = {
      id: "case-1",
      context: "ctx",
      participants: [{ id: "actor-1", role: "primary" }],
      observation: { text: "obs", isCameraDescribable: true },
      currentReflection: {
        reflectedAt: "2026-04-01T10:00:00Z",
        interpretation: { text: "int", evidenceType: "observational" },
        counterInterpretations: [{ text: "c", evidenceType: "derived" }],
        uncertainties: [{ level: 2, rationale: "unc" }],
        tensions: []
      },
      revisions: [],
      perspectives: [
        {
          id: "p1",
          caseId: "case-1",
          actorId: "actor-1",
          status: "draft",
          createdAt: "2026-04-01T10:00:00Z",
          content: {
            observation: { text: "obs" },
            interpretation: { text: "int", evidenceType: "observational" },
            counterInterpretations: [{ text: "c", evidenceType: "derived" }],
            uncertainties: [{ level: 2, rationale: "unc" }]
          }
        },
        {
          id: "p2",
          caseId: "case-1",
          actorId: "actor-1",
          status: "draft",
          createdAt: "2026-04-01T10:00:00Z",
          content: {
            observation: { text: "obs" },
            interpretation: { text: "int", evidenceType: "observational" },
            counterInterpretations: [{ text: "c", evidenceType: "derived" }],
            uncertainties: [{ level: 2, rationale: "unc" }]
          }
        }
      ]
    };
    const errors = guardCase(invalidCase);
    expect(errors.some(e => e.includes("Only one perspective per actor is allowed"))).toBe(true);
  });


describe("guardReflectionSnapshot", () => {
  it("returns no errors for a valid snapshot", () => {
    expect(guardReflectionSnapshot(validSnapshot())).toHaveLength(0);
  });

  it("returns an error for an invalid evidenceType in interpretation", () => {
    const bad: ReflectionSnapshot = {
      ...validSnapshot(),
      interpretation: { text: "Eine Deutung.", evidenceType: "factual" as any },
    };
    const errors = guardReflectionSnapshot(bad);
    expect(errors.some((e) => /EvidenceType/i.test(e))).toBe(true);
  });

  it("returns an error for an invalid evidenceType in counterInterpretation", () => {
    const bad: ReflectionSnapshot = {
      ...validSnapshot(),
      counterInterpretations: [{ text: "Eine Gegendeutung.", evidenceType: "unknown" as any }],
    };
    const errors = guardReflectionSnapshot(bad);
    expect(errors.some((e) => /EvidenceType/i.test(e))).toBe(true);
  });

  it("collects multiple errors", () => {
    const bad: ReflectionSnapshot = {
      reflectedAt: "2026-03-28T10:00:00Z",
      interpretation: { text: "", evidenceType: "observational" },
      counterInterpretations: [{ text: "", evidenceType: "derived" }],
      uncertainties: [{ level: 99 as any, rationale: "" }],
      tensions: [],
    };
    const errors = guardReflectionSnapshot(bad);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  it("returns an error when counterInterpretations is empty", () => {
    const bad: ReflectionSnapshot = { ...validSnapshot(), counterInterpretations: [] };
    const errors = guardReflectionSnapshot(bad);
    expect(errors.some((e) => /counter-interpretation/i.test(e))).toBe(true);
  });

  it("returns an error when a counter-interpretation is identical to the main interpretation", () => {
    const bad: ReflectionSnapshot = {
      ...validSnapshot(),
      counterInterpretations: [validInterpretation()], // same text as interpretation
    };
    const errors = guardReflectionSnapshot(bad);
    expect(errors.some((e) => /identical/i.test(e))).toBe(true);
  });

  it("returns an error when two counter-interpretations are identical to each other", () => {
    const bad: ReflectionSnapshot = {
      ...validSnapshot(),
      counterInterpretations: [validCounterInterpretation(), validCounterInterpretation()],
    };
    const errors = guardReflectionSnapshot(bad);
    expect(errors.some((e) => /identical/i.test(e))).toBe(true);
  });

  it("returns no errors for two distinct counter-interpretations", () => {
    const good: ReflectionSnapshot = {
      ...validSnapshot(),
      counterInterpretations: [
        validCounterInterpretation(),
        { text: "Eine weitere alternative Erklärung.", evidenceType: "speculative" },
      ],
    };
    expect(guardReflectionSnapshot(good)).toHaveLength(0);
  });

  it("returns an error when uncertainties is empty", () => {
    const bad: ReflectionSnapshot = { ...validSnapshot(), uncertainties: [] };
    const errors = guardReflectionSnapshot(bad);
    expect(errors.some((e) => /uncertainty/i.test(e))).toBe(true);
  });

  it("returns errors for each invalid uncertainty entry", () => {
    const bad: ReflectionSnapshot = {
      ...validSnapshot(),
      uncertainties: [
        { level: 99 as any, rationale: "" },
        { level: 2, rationale: "" },
      ],
    };
    const errors = guardReflectionSnapshot(bad);
    expect(errors.length).toBeGreaterThanOrEqual(3); // invalid level + 2 empty rationales
  });
});

// ---------------------------------------------------------------------------
// Composite: Case
// ---------------------------------------------------------------------------

describe("guardCase", () => {
  it("returns no errors for a valid case", () => {
    const errors = guardCase({
      id: "case-001",
      context: "Klassenraum, Montag",
      participants: [{ id: "p1", role: "primary" }],
      observation: validObservation(),
      currentReflection: validSnapshot(),
      revisions: [],
    });
    expect(errors).toHaveLength(0);
  });

  it("returns an error when id is empty", () => {
    const errors = guardCase({
      id: "",
      context: "Klassenraum",
      participants: [{ id: "p1" }],
      observation: validObservation(),
      currentReflection: validSnapshot(),
      revisions: [],
    });
    expect(errors.some((e) => /Case id/i.test(e))).toBe(true);
  });

  it("returns an error when context is empty", () => {
    const errors = guardCase({
      id: "case-001",
      context: "   ",
      participants: [{ id: "p1" }],
      observation: validObservation(),
      currentReflection: validSnapshot(),
      revisions: [],
    });
    expect(errors.some((e) => /context/i.test(e))).toBe(true);
  });

  it("collects errors from observation, participants and reflection", () => {
    const errors = guardCase({
      id: "case-001",
      context: "Klassenraum",
      participants: [],
      observation: { text: "", isCameraDescribable: true },
      currentReflection: {
        reflectedAt: "2026-03-28",
        interpretation: { text: "", evidenceType: "observational" },
        counterInterpretations: [{ text: "", evidenceType: "derived" }],
        uncertainties: [{ level: 3, rationale: "" }],
        tensions: [],
      },
      revisions: [],
    });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  it("returns an error for a participant with an empty id", () => {
    const errors = guardCase({
      id: "case-001",
      context: "Klassenraum",
      participants: [{ id: "" }],
      observation: validObservation(),
      currentReflection: validSnapshot(),
      revisions: [],
    });
    expect(errors.some((e) => /id/i.test(e))).toBe(true);
  });

  it("returns an error for an invalid observedAt date", () => {
    const errors = guardCase({
      id: "case-001",
      context: "Klassenraum",
      participants: [{ id: "p1" }],
      observation: validObservation(),
      currentReflection: validSnapshot(),
      revisions: [],
      observedAt: "not-a-date",
    });
    expect(errors.some((e) => /observedAt/i.test(e))).toBe(true);
  });

  it("returns no error when observedAt is a valid date string", () => {
    const errors = guardCase({
      id: "case-001",
      context: "Klassenraum",
      participants: [{ id: "p1" }],
      observation: validObservation(),
      currentReflection: validSnapshot(),
      revisions: [],
      observedAt: "2026-03-28T08:15:00Z",
    });
    expect(errors).toHaveLength(0);
  });

  it("returns an error for a revision with an invalid driftType", () => {
    const snap = validSnapshot();
    const snapB: ReflectionSnapshot = {
      ...snap,
      reflectedAt: "2026-04-01T10:00:00Z",
      interpretation: { text: "Neue Deutung.", evidenceType: "derived" },
    };
    const errors = guardCase({
      id: "case-001",
      context: "Klassenraum",
      participants: [{ id: "p1" }],
      observation: validObservation(),
      currentReflection: snap,
      revisions: [
        {
          at: "2026-04-01T10:30:00Z",
          driftType: "correction" as any,
          reason: "Gespräch.",
          from: snap,
          to: snapB,
        },
      ],
    });
    expect(errors.some((e) => /DriftType/i.test(e))).toBe(true);
  });

  it("returns an error when two participants share the same id", () => {
    const errors = guardCase({
      id: "case-001",
      context: "Klassenraum",
      participants: [
        { id: "Anna", role: "primary" },
        { id: "Anna", role: "contextual" },
      ],
      observation: validObservation(),
      currentReflection: validSnapshot(),
      revisions: [],
    });
    expect(errors.some((e) => /Anna/i.test(e))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Calibration tests — document what the guards DO and DO NOT check
//
// These tests make the actual guarantee level explicit. They are not about
// desired future behaviour; they document the current, honest state.
// ---------------------------------------------------------------------------

describe("formal guarantee boundary — observation text guard", () => {
  it("accepts observation text that contains interpretive language (no semantic check)", () => {
    // guardObservationText only checks non-emptiness.
    // Whether the text is genuinely camera-describable is NOT verified.
    expect(guardObservationText("Ali ist aggressiv.")).toBeUndefined();
  });
});

describe("formal guarantee boundary — observation/interpretation non-identity", () => {
  it("accepts an interpretation that paraphrases the observation in different words", () => {
    // Only textual identity is blocked, not semantic overlap.
    const obs: Observation = {
      text: "Kind schlägt mit der Hand auf den Tisch.",
      isCameraDescribable: true,
    };
    const interp: Interpretation = {
      text: "Das Kind schlug mit seiner Hand auf den Tisch.", // paraphrase, not identical
      evidenceType: "observational",
    };
    expect(guardObservationInterpretationDistinct(obs, interp)).toBeUndefined();
  });
});

describe("formal guarantee boundary — interpretations non-identity", () => {
  it("accepts a counter-interpretation that is similar but not textually identical", () => {
    // Only exact textual identity is blocked — a superficial reformulation passes.
    const interp: Interpretation = {
      text: "Das Kind zeigt körperliche Anspannung.",
      evidenceType: "observational",
    };
    const counter: Interpretation = {
      text: "Das Kind zeigt körperliche Anspannung und sucht Aufmerksamkeit.",
      evidenceType: "derived",
    };
    expect(guardInterpretationsDistinct(interp, counter)).toBeUndefined();
  });
});
