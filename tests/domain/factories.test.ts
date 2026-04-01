import { describe, it, expect } from "vitest";
import {
  createObservation,
  createInterpretation,
  createUncertainty,
  createTensionEdge,
  createReflectionSnapshot,
  createRevision,
  createCase,
} from "../../src/domain/factories.js";
import type { EvidenceType, ReflectionSnapshot } from "../../src/domain/types.js";

// ---------------------------------------------------------------------------
// Helpers: valid input builders
// ---------------------------------------------------------------------------

function validObservationInput() {
  return {
    text: "Kind schlägt mit der Hand auf den Tisch.",
    isCameraDescribable: true,
  };
}

function validInterpretationInput() {
  return {
    text: "Das Kind zeigt körperliche Anspannung.",
    evidenceType: "observational" as const,
  };
}

function validCounterInterpretationInput() {
  return {
    text: "Das Kind versucht Aufmerksamkeit zu gewinnen.",
    evidenceType: "derived" as const,
  };
}

function validUncertaintyInput() {
  return {
    level: 3 as const,
    rationale: "Nur ein Einzelereignis beobachtet.",
  };
}

function validReflectionSnapshotInput() {
  return {
    reflectedAt: "2026-03-28T10:00:00Z",
    interpretation: validInterpretationInput(),
    counterInterpretations: [validCounterInterpretationInput()],
    uncertainties: [validUncertaintyInput()],
    tensions: [],
  };
}

function validCaseInput() {
  return {
    id: "case-001",
    participants: [{ id: "p1", role: "primary" as const }],
    context: "Klassenraum, Montag 8:15 Uhr",
    observedAt: "2026-03-28T08:15:00Z",
    observation: validObservationInput(),
    currentReflection: validReflectionSnapshotInput(),
  };
}

// ---------------------------------------------------------------------------
// createObservation
// ---------------------------------------------------------------------------

describe("createObservation", () => {
  it("creates a valid observation", () => {
    const obs = createObservation(validObservationInput());
    expect(obs.text).toBe("Kind schlägt mit der Hand auf den Tisch.");
    expect(obs.isCameraDescribable).toBe(true);
  });

  it("defaults isCameraDescribable to false (safe, non-assertive default)", () => {
    const obs = createObservation({ text: "Beobachtung" });
    expect(obs.isCameraDescribable).toBe(false);
  });

  it("accepts isCameraDescribable: false — no semantic check is performed", () => {
    // isCameraDescribable is user-supplied metadata; the system does not verify
    // whether the text is actually camera-describable.
    const obs = createObservation({
      text: "Kind schlägt mit der Hand auf den Tisch.",
      isCameraDescribable: false,
    });
    expect(obs.isCameraDescribable).toBe(false);
  });

  it("throws on empty text", () => {
    expect(() => createObservation({ text: "" })).toThrow();
  });

  it("throws on whitespace-only text", () => {
    expect(() => createObservation({ text: "   " })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// createInterpretation
// ---------------------------------------------------------------------------

describe("createInterpretation", () => {
  it("creates a valid interpretation", () => {
    const interp = createInterpretation(validInterpretationInput());
    expect(interp.text).toBe("Das Kind zeigt körperliche Anspannung.");
    expect(interp.evidenceType).toBe("observational");
  });

  it("throws on empty text", () => {
    expect(() =>
      createInterpretation({ text: "", evidenceType: "derived" }),
    ).toThrow();
  });

  it("throws on invalid evidenceType", () => {
    expect(() =>
      createInterpretation({
        text: "Eine Deutung.",
        evidenceType: "factual" as any,
      }),
    ).toThrow(/EvidenceType/i);
  });
});

// ---------------------------------------------------------------------------
// createUncertainty
// ---------------------------------------------------------------------------

describe("createUncertainty", () => {
  it("creates a valid uncertainty", () => {
    const u = createUncertainty(validUncertaintyInput());
    expect(u.level).toBe(3);
    expect(u.rationale).toBe("Nur ein Einzelereignis beobachtet.");
  });

  it("throws on empty rationale", () => {
    expect(() =>
      createUncertainty({ level: 2, rationale: "" }),
    ).toThrow(/rationale/i);
  });

  it("throws on invalid level (too high)", () => {
    expect(() =>
      createUncertainty({ level: 6 as any, rationale: "begründung" }),
    ).toThrow(/level/i);
  });

  it("throws on invalid level (negative)", () => {
    expect(() =>
      createUncertainty({ level: -1 as any, rationale: "begründung" }),
    ).toThrow(/level/i);
  });

  it("throws on non-integer level", () => {
    expect(() =>
      createUncertainty({ level: 2.5 as any, rationale: "begründung" }),
    ).toThrow(/level/i);
  });
});

// ---------------------------------------------------------------------------
// createTensionEdge
// ---------------------------------------------------------------------------

describe("createTensionEdge", () => {
  it("creates a valid tension edge", () => {
    const edge = createTensionEdge({
      source: "child",
      target: "teacher",
      label: "Druck",
      context: "Klassenraum",
      direction: "unidirectional",
    });
    expect(edge.direction).toBe("unidirectional");
    expect(edge.source).toBe("child");
  });

  it("throws on invalid direction", () => {
    expect(() =>
      createTensionEdge({
        source: "a",
        target: "b",
        label: "x",
        context: "y",
        direction: "invalid" as any,
      }),
    ).toThrow(/direction/i);
  });

  it("throws when source is empty", () => {
    expect(() =>
      createTensionEdge({
        source: "",
        target: "teacher",
        label: "Druck",
        context: "Klassenraum",
        direction: "unidirectional",
      }),
    ).toThrow(/source/i);
  });

  it("throws when target is empty", () => {
    expect(() =>
      createTensionEdge({
        source: "child",
        target: "  ",
        label: "Druck",
        context: "Klassenraum",
        direction: "unidirectional",
      }),
    ).toThrow(/target/i);
  });

  it("throws when label is empty", () => {
    expect(() =>
      createTensionEdge({
        source: "child",
        target: "teacher",
        label: "",
        context: "Klassenraum",
        direction: "unidirectional",
      }),
    ).toThrow(/label/i);
  });

  it("throws when context is empty", () => {
    expect(() =>
      createTensionEdge({
        source: "child",
        target: "teacher",
        label: "Druck",
        context: "",
        direction: "unidirectional",
      }),
    ).toThrow(/context/i);
  });

  it("throws when timestamp is not a parseable date", () => {
    expect(() =>
      createTensionEdge({
        source: "child",
        target: "teacher",
        label: "Druck",
        context: "Klassenraum",
        direction: "unidirectional",
        timestamp: "not-a-date",
      }),
    ).toThrow(/timestamp/i);
  });

  it("throws when timestamp is an empty string", () => {
    expect(() =>
      createTensionEdge({
        source: "child",
        target: "teacher",
        label: "Druck",
        context: "Klassenraum",
        direction: "unidirectional",
        timestamp: "",
      }),
    ).toThrow(/timestamp/i);
  });
});

// ---------------------------------------------------------------------------
// createReflectionSnapshot
// ---------------------------------------------------------------------------

describe("createReflectionSnapshot", () => {
  it("creates a valid snapshot", () => {
    const snap = createReflectionSnapshot(validReflectionSnapshotInput());
    expect(snap.reflectedAt).toBe("2026-03-28T10:00:00Z");
    expect(snap.interpretation.text).toBe(
      "Das Kind zeigt körperliche Anspannung.",
    );
    expect(snap.counterInterpretations[0].text).toBe(
      "Das Kind versucht Aufmerksamkeit zu gewinnen.",
    );
  });

  it("throws when interpretation and counter-interpretation are identical", () => {
    expect(() =>
      createReflectionSnapshot({
        ...validReflectionSnapshotInput(),
        counterInterpretations: [validInterpretationInput()], // same as interpretation
      }),
    ).toThrow(/identical/i);
  });

  it("throws when interpretation text is empty", () => {
    expect(() =>
      createReflectionSnapshot({
        ...validReflectionSnapshotInput(),
        interpretation: { text: "", evidenceType: "observational" },
      }),
    ).toThrow();
  });

  it("throws when counter-interpretation text is empty", () => {
    expect(() =>
      createReflectionSnapshot({
        ...validReflectionSnapshotInput(),
        counterInterpretations: [{ text: "", evidenceType: "derived" }],
      }),
    ).toThrow();
  });

  it("throws when reflectedAt is not a parseable date", () => {
    expect(() =>
      createReflectionSnapshot({
        ...validReflectionSnapshotInput(),
        reflectedAt: "not-a-date",
      }),
    ).toThrow(/reflectedAt/i);
  });

  it("creates a valid snapshot with multiple counter-interpretations", () => {
    const snap = createReflectionSnapshot({
      ...validReflectionSnapshotInput(),
      counterInterpretations: [
        validCounterInterpretationInput(),
        { text: "Eine weitere alternative Erklärung.", evidenceType: "speculative" as EvidenceType },
      ],
    });
    expect(snap.counterInterpretations).toHaveLength(2);
  });

  it("throws when multiple counter-interpretations are identical to each other", () => {
    expect(() =>
      createReflectionSnapshot({
        ...validReflectionSnapshotInput(),
        counterInterpretations: [
          validCounterInterpretationInput(),
          validCounterInterpretationInput(),
        ],
      }),
    ).toThrow(/identical/i);
  });

  it("throws when no counter-interpretations are provided", () => {
    expect(() =>
      createReflectionSnapshot({
        ...validReflectionSnapshotInput(),
        counterInterpretations: [],
      }),
    ).toThrow(/required/i);
  });

  it("creates a valid snapshot with multiple uncertainties", () => {
    const snap = createReflectionSnapshot({
      ...validReflectionSnapshotInput(),
      uncertainties: [
        validUncertaintyInput(),
        { level: 1 as const, rationale: "Zweite Unsicherheitsbegründung." },
      ],
    });
    expect(snap.uncertainties).toHaveLength(2);
    expect(snap.uncertainties[0]!.level).toBe(3);
    expect(snap.uncertainties[1]!.level).toBe(1);
  });

  it("throws when no uncertainties are provided", () => {
    expect(() =>
      createReflectionSnapshot({
        ...validReflectionSnapshotInput(),
        uncertainties: [],
      }),
    ).toThrow(/required/i);
  });
});

// ---------------------------------------------------------------------------
// createRevision
// ---------------------------------------------------------------------------

describe("createRevision", () => {
  it("creates a valid revision with from and to", () => {
    const snapA = createReflectionSnapshot(validReflectionSnapshotInput());
    const snapB = createReflectionSnapshot({
      ...validReflectionSnapshotInput(),
      reflectedAt: "2026-04-01T10:00:00Z",
      interpretation: {
        text: "Neue Deutung nach weiterem Gespräch.",
        evidenceType: "derived",
      },
    });

    const rev = createRevision({
      at: "2026-04-01T10:30:00Z",
      driftType: "new_perspective",
      reason: "Gespräch mit Kolleg:in lieferte neue Sicht.",
      from: snapA,
      to: snapB,
    });

    expect(rev.from).toBe(snapA);
    expect(rev.to).toBe(snapB);
    expect(rev.driftType).toBe("new_perspective");
  });

  it("throws when from is missing", () => {
    const snap = createReflectionSnapshot(validReflectionSnapshotInput());
    expect(() =>
      createRevision({
        at: "2026-04-01T10:30:00Z",
        driftType: "new_observation",
        reason: "reason",
        from: undefined as any,
        to: snap,
      }),
    ).toThrow(/from/i);
  });

  it("throws when to is missing", () => {
    const snap = createReflectionSnapshot(validReflectionSnapshotInput());
    expect(() =>
      createRevision({
        at: "2026-04-01T10:30:00Z",
        driftType: "new_observation",
        reason: "reason",
        from: snap,
        to: null as any,
      }),
    ).toThrow();
  });

  it("throws when Revision.at is not a parseable date", () => {
    const snap = createReflectionSnapshot(validReflectionSnapshotInput());
    expect(() =>
      createRevision({
        at: "not-a-date",
        driftType: "new_observation",
        reason: "reason",
        from: snap,
        to: snap,
      }),
    ).toThrow(/Revision\.at/i);
  });

  it("throws when driftType is invalid", () => {
    const snap = createReflectionSnapshot(validReflectionSnapshotInput());
    expect(() =>
      createRevision({
        at: "2026-04-01T10:30:00Z",
        driftType: "correction" as any,
        reason: "Gespräch.",
        from: snap,
        to: snap,
      }),
    ).toThrow(/DriftType/i);
  });

  it("throws when reason is empty", () => {
    const snap = createReflectionSnapshot(validReflectionSnapshotInput());
    expect(() =>
      createRevision({
        at: "2026-04-01T10:30:00Z",
        driftType: "new_observation",
        reason: "",
        from: snap,
        to: snap,
      }),
    ).toThrow(/reason/i);
  });

  it("throws when reason is whitespace-only", () => {
    const snap = createReflectionSnapshot(validReflectionSnapshotInput());
    expect(() =>
      createRevision({
        at: "2026-04-01T10:30:00Z",
        driftType: "new_observation",
        reason: "   ",
        from: snap,
        to: snap,
      }),
    ).toThrow(/reason/i);
  });
});

// ---------------------------------------------------------------------------
// createCase
// ---------------------------------------------------------------------------

describe("createCase", () => {
  it("creates a valid case", () => {
    const c = createCase(validCaseInput());
    expect(c.id).toBe("case-001");
    expect(c.participants).toHaveLength(1);
    expect(c.observation.text).toBe(
      "Kind schlägt mit der Hand auf den Tisch.",
    );
    expect(c.currentReflection.interpretation.text).toBe(
      "Das Kind zeigt körperliche Anspannung.",
    );
    expect(c.revisions).toHaveLength(0);
  });

  it("throws when id is empty", () => {
    expect(() =>
      createCase({ ...validCaseInput(), id: "" }),
    ).toThrow(/Case id/i);
  });

  it("throws when id is whitespace-only", () => {
    expect(() =>
      createCase({ ...validCaseInput(), id: "   " }),
    ).toThrow(/Case id/i);
  });

  it("throws when context is empty", () => {
    expect(() =>
      createCase({ ...validCaseInput(), context: "" }),
    ).toThrow(/context/i);
  });

  it("throws when participants are empty", () => {
    expect(() =>
      createCase({ ...validCaseInput(), participants: [] }),
    ).toThrow(/participants/i);
  });

  it("throws when observation text is empty", () => {
    expect(() =>
      createCase({
        ...validCaseInput(),
        observation: { text: "" },
      }),
    ).toThrow(/observation/i);
  });

  it("throws when observation and interpretation are identical", () => {
    const input = validCaseInput();
    input.observation.text = input.currentReflection.interpretation.text;
    expect(() => createCase(input)).toThrow(/identical/i);
  });

  it("throws when counter-interpretation is empty", () => {
    expect(() =>
      createCase({
        ...validCaseInput(),
        currentReflection: {
          ...validReflectionSnapshotInput(),
          counterInterpretations: [{ text: "", evidenceType: "derived" }],
        },
      }),
    ).toThrow();
  });

  it("throws when uncertainty rationale is empty", () => {
    expect(() =>
      createCase({
        ...validCaseInput(),
        currentReflection: {
          ...validReflectionSnapshotInput(),
          uncertainties: [{ level: 3, rationale: "" }],
        },
      }),
    ).toThrow(/rationale/i);
  });

  it("throws when observedAt is an empty string", () => {
    expect(() =>
      createCase({ ...validCaseInput(), observedAt: "" }),
    ).toThrow(/observedAt/i);
  });

  it("throws when two participants share the same id", () => {
    expect(() =>
      createCase({
        ...validCaseInput(),
        participants: [
          { id: "Anna", role: "primary" as const },
          { id: "Anna", role: "contextual" as const },
        ],
      }),
    ).toThrow(/Anna/i);
  });
});
