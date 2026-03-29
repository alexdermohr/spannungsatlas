import { describe, it, expect } from "vitest";
import {
  guardObservationText,
  guardInterpretationText,
  guardCounterInterpretationText,
  guardInterpretationsDistinct,
  guardObservationInterpretationDistinct,
  guardUncertaintyLevel,
  guardUncertaintyRationale,
  guardParticipantsNotEmpty,
  guardTensionDirection,
  guardRevisionFromTo,
  guardReflectionSnapshot,
  guardCase,
} from "../../src/domain/guards.js";
import type {
  Interpretation,
  Observation,
  ReflectionSnapshot,
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
    counterInterpretation: validCounterInterpretation(),
    uncertainty: { level: 3, rationale: "Nur ein Einzelereignis beobachtet." },
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

describe("guardReflectionSnapshot", () => {
  it("returns no errors for a valid snapshot", () => {
    expect(guardReflectionSnapshot(validSnapshot())).toHaveLength(0);
  });

  it("collects multiple errors", () => {
    const bad: ReflectionSnapshot = {
      reflectedAt: "2026-03-28T10:00:00Z",
      interpretation: { text: "", evidenceType: "observational" },
      counterInterpretation: { text: "", evidenceType: "derived" },
      uncertainty: { level: 99 as any, rationale: "" },
      tensions: [],
    };
    const errors = guardReflectionSnapshot(bad);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Composite: Case
// ---------------------------------------------------------------------------

describe("guardCase", () => {
  it("returns no errors for a valid case", () => {
    const errors = guardCase({
      participants: [{ id: "p1", role: "primary" }],
      observation: validObservation(),
      currentReflection: validSnapshot(),
      revisions: [],
    });
    expect(errors).toHaveLength(0);
  });

  it("collects errors from observation, participants and reflection", () => {
    const errors = guardCase({
      participants: [],
      observation: { text: "", isCameraDescribable: true },
      currentReflection: {
        reflectedAt: "2026-03-28",
        interpretation: { text: "", evidenceType: "observational" },
        counterInterpretation: { text: "", evidenceType: "derived" },
        uncertainty: { level: 3, rationale: "" },
        tensions: [],
      },
      revisions: [],
    });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
