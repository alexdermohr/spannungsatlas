import { describe, it, expect } from "vitest";
import {
  EVIDENCE_LEVELS,
  EPISTEMIC_MARKINGS,
  MIN_CASES_FOR_PROFILE,
  PROFILE_DECAY_DAYS,
  meetsDefaultProfileCaseThreshold,
  meetsProfileCaseThreshold,
  evidenceLevelRequirementsMet,
  counterEvidenceSatisfiesStrong,
  evaluateProfileDecay,
  guardEvidenceLevel,
  guardEpistemicMarking,
  guardCounterEvidence,
  guardTensionProfileSupport,
  guardTensionProfile,
  createTensionProfile,
  type CreateTensionProfileInput,
} from "../../src/domain/tension-profile.js";
import type {
  CounterEvidence,
  TensionProfile,
  TensionProfileSupport,
} from "../../src/domain/types.js";

// ---------------------------------------------------------------------------
// Helpers / fixtures
// ---------------------------------------------------------------------------

function support(over: Partial<TensionProfileSupport> = {}): TensionProfileSupport {
  return {
    caseIds: ["c1", "c2"],
    distinctTimepoints: 1,
    distinctContexts: 1,
    multiSourceCorroboration: false,
    lastSupportingCaseAt: "2026-05-01",
    ...over,
  };
}

function caseIds(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `c${i + 1}`);
}

const documentedCounter: CounterEvidence = {
  kind: "documented",
  text: "Im Konfliktfall am 2026-04-12 zeigte sich die gegenteilige Reaktion.",
  recordedAt: "2026-04-12",
};

function validInput(over: Partial<CreateTensionProfileInput> = {}): CreateTensionProfileInput {
  return {
    id: "tp-1",
    personId: "Ali",
    patternDescription:
      "Unter Kontrollverlust zeigt sich wiederholt Gegenkontrolle in Interaktion mit Bezugsbetreuung.",
    needPressures: ["Autonomie und Einfluss"],
    determinants: ["Kontrollverlust"],
    expressionForms: ["Gegenkontrolle"],
    reliefConditions: ["frühzeitige Ankündigung von Übergängen"],
    evidenceLevel: "weak",
    epistemicMarking: "plausible",
    counterEvidence: [],
    support: support(),
    revisedAt: "2026-05-20",
    createdAt: "2026-05-20",
    ...over,
  };
}

// ---------------------------------------------------------------------------
// Constants & enum guards
// ---------------------------------------------------------------------------

describe("constants", () => {
  it("exposes the canonical minimum case threshold (§3.2)", () => {
    expect(MIN_CASES_FOR_PROFILE).toBe(2);
  });

  it("exposes the canonical decay window in days (§3.2)", () => {
    expect(PROFILE_DECAY_DAYS).toBe(180);
  });

  it("lists exactly the three evidence levels and epistemic markings", () => {
    expect([...EVIDENCE_LEVELS]).toEqual(["weak", "moderate", "strong"]);
    expect([...EPISTEMIC_MARKINGS]).toEqual(["observational", "plausible", "speculative"]);
  });
});

describe("guardEvidenceLevel / guardEpistemicMarking", () => {
  it("accepts valid values", () => {
    expect(guardEvidenceLevel("moderate")).toBeUndefined();
    expect(guardEpistemicMarking("observational")).toBeUndefined();
  });

  it("rejects invalid values", () => {
    expect(guardEvidenceLevel("severe")).toMatch(/EvidenceLevel/);
    // EvidenceType value is NOT a valid EpistemicMarking
    expect(guardEpistemicMarking("derived")).toMatch(/EpistemicMarking/);
  });
});

// ---------------------------------------------------------------------------
// Existence gate
// ---------------------------------------------------------------------------

describe("meetsDefaultProfileCaseThreshold", () => {
  it("is false below 2 cases", () => {
    expect(meetsDefaultProfileCaseThreshold(0)).toBe(false);
    expect(meetsDefaultProfileCaseThreshold(1)).toBe(false);
  });

  it("is true at or above 2 cases", () => {
    expect(meetsDefaultProfileCaseThreshold(2)).toBe(true);
    expect(meetsDefaultProfileCaseThreshold(5)).toBe(true);
  });

  it("returns false for 1 case even though 1 case + multiSourceCorroboration satisfies weak (§3.2 Mehrquellen-Ausnahme)", () => {
    // The two-case threshold is the Regelfall gate only.
    // evidenceLevelRequirementsMet("weak", { caseIds: ["c1"], multiSourceCorroboration: true, ... })
    // passes on its own — this function intentionally does NOT model that exception,
    // since it has no access to the support object.
    expect(meetsDefaultProfileCaseThreshold(1)).toBe(false);
    expect(
      evidenceLevelRequirementsMet("weak", support({ caseIds: caseIds(1), multiSourceCorroboration: true })),
    ).toBeUndefined(); // the domain path IS open for 1 case + multi-source
  });
});

describe("meetsProfileCaseThreshold (deprecated alias)", () => {
  it("is the same function as meetsDefaultProfileCaseThreshold", () => {
    expect(meetsProfileCaseThreshold).toBe(meetsDefaultProfileCaseThreshold);
  });
});

// ---------------------------------------------------------------------------
// Evidence-level thresholds (§3.2)
// ---------------------------------------------------------------------------

describe("evidenceLevelRequirementsMet — weak", () => {
  it("accepts 2 cases", () => {
    expect(evidenceLevelRequirementsMet("weak", support({ caseIds: caseIds(2) }))).toBeUndefined();
  });

  it("accepts 1 case with multi-source corroboration", () => {
    expect(
      evidenceLevelRequirementsMet(
        "weak",
        support({ caseIds: caseIds(1), multiSourceCorroboration: true }),
      ),
    ).toBeUndefined();
  });

  it("rejects 1 case without corroboration", () => {
    expect(
      evidenceLevelRequirementsMet("weak", support({ caseIds: caseIds(1) })),
    ).toMatch(/weak profile entry/);
  });
});

describe("evidenceLevelRequirementsMet — moderate", () => {
  it("accepts 3 cases over 2 timepoints", () => {
    expect(
      evidenceLevelRequirementsMet(
        "moderate",
        support({ caseIds: caseIds(3), distinctTimepoints: 2, distinctContexts: 1 }),
      ),
    ).toBeUndefined();
  });

  it("accepts 3 cases over 2 contexts", () => {
    expect(
      evidenceLevelRequirementsMet(
        "moderate",
        support({ caseIds: caseIds(3), distinctTimepoints: 1, distinctContexts: 2 }),
      ),
    ).toBeUndefined();
  });

  it("rejects 3 cases over only 1 timepoint and 1 context", () => {
    expect(
      evidenceLevelRequirementsMet(
        "moderate",
        support({ caseIds: caseIds(3), distinctTimepoints: 1, distinctContexts: 1 }),
      ),
    ).toMatch(/moderate profile entry/);
  });

  it("rejects 2 cases even across 2 timepoints", () => {
    expect(
      evidenceLevelRequirementsMet(
        "moderate",
        support({ caseIds: caseIds(2), distinctTimepoints: 2, distinctContexts: 2 }),
      ),
    ).toMatch(/moderate profile entry/);
  });
});

describe("evidenceLevelRequirementsMet — strong", () => {
  it("accepts 4 cases over 2 timepoints AND 2 contexts", () => {
    expect(
      evidenceLevelRequirementsMet(
        "strong",
        support({ caseIds: caseIds(4), distinctTimepoints: 2, distinctContexts: 2 }),
      ),
    ).toBeUndefined();
  });

  it("accepts robust multi-source corroboration as the alternative branch", () => {
    expect(
      evidenceLevelRequirementsMet(
        "strong",
        support({ caseIds: caseIds(2), distinctTimepoints: 1, distinctContexts: 1, multiSourceCorroboration: true }),
      ),
    ).toBeUndefined();
  });

  it("rejects strong from 1 case even with multi-source corroboration", () => {
    expect(
      evidenceLevelRequirementsMet(
        "strong",
        support({ caseIds: caseIds(1), multiSourceCorroboration: true }),
      ),
    ).toMatch(/strong profile entry/);
  });

  it("rejects 4 cases over only 1 context without corroboration", () => {
    expect(
      evidenceLevelRequirementsMet(
        "strong",
        support({ caseIds: caseIds(4), distinctTimepoints: 2, distinctContexts: 1 }),
      ),
    ).toMatch(/strong profile entry/);
  });

  it("treats requirements as protection FLOORS (more evidence still qualifies a lower level)", () => {
    // 4 cases easily clear the weak floor — claiming weak is conservative, never blocked.
    expect(
      evidenceLevelRequirementsMet("weak", support({ caseIds: caseIds(4) })),
    ).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Counter-evidence (Gegenbeleg)
// ---------------------------------------------------------------------------

describe("counterEvidenceSatisfiesStrong", () => {
  it("is false for an empty list", () => {
    expect(counterEvidenceSatisfiesStrong([])).toBe(false);
  });

  it("is true for a documented counter-evidence", () => {
    expect(counterEvidenceSatisfiesStrong([documentedCounter])).toBe(true);
  });

  it("is true for an explicit checked-none marker", () => {
    expect(
      counterEvidenceSatisfiesStrong([{ kind: "checked_none", checkedAt: "2026-05-20" }]),
    ).toBe(true);
  });
});

describe("guardCounterEvidence", () => {
  it("accepts a valid documented entry", () => {
    expect(guardCounterEvidence(documentedCounter)).toEqual([]);
  });

  it("accepts a valid checked_none entry", () => {
    expect(guardCounterEvidence({ kind: "checked_none", checkedAt: "2026-05-20" })).toEqual([]);
  });

  it("rejects a documented entry without text", () => {
    expect(guardCounterEvidence({ kind: "documented", text: "  ", recordedAt: "2026-05-20" })).toEqual([
      expect.stringMatching(/non-empty text/),
    ]);
  });

  it("rejects an unknown kind", () => {
    expect(guardCounterEvidence({ kind: "rumor" })).toEqual([
      expect.stringMatching(/kind must be/),
    ]);
  });

  it("rejects an invalid date", () => {
    const errs = guardCounterEvidence({ kind: "checked_none", checkedAt: "gestern" });
    expect(errs.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Support structural guard
// ---------------------------------------------------------------------------

describe("guardTensionProfileSupport", () => {
  it("accepts a valid support", () => {
    expect(guardTensionProfileSupport(support())).toEqual([]);
  });

  it("rejects an empty caseIds array", () => {
    expect(guardTensionProfileSupport(support({ caseIds: [] }))).toEqual([
      expect.stringMatching(/non-empty array/),
    ]);
  });

  it("rejects duplicate caseIds", () => {
    const errs = guardTensionProfileSupport(support({ caseIds: ["c1", "c1"] }));
    expect(errs).toEqual([expect.stringMatching(/duplicate id/)]);
  });

  it("rejects distinctTimepoints exceeding the number of cases", () => {
    const errs = guardTensionProfileSupport(
      support({ caseIds: caseIds(2), distinctTimepoints: 3 }),
    );
    expect(errs).toEqual([expect.stringMatching(/distinctTimepoints.*exceed/)]);
  });

  it("rejects non-integer counts", () => {
    const errs = guardTensionProfileSupport(support({ distinctContexts: 1.5 }));
    expect(errs).toEqual([expect.stringMatching(/distinctContexts must be an integer/)]);
  });

  it("rejects an invalid lastSupportingCaseAt", () => {
    const errs = guardTensionProfileSupport(support({ lastSupportingCaseAt: "irgendwann" }));
    expect(errs.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Decay (§3.2 — 180 days)
// ---------------------------------------------------------------------------

describe("evaluateProfileDecay", () => {
  const profile = createTensionProfile(validInput({ support: support({ lastSupportingCaseAt: "2026-01-01" }) }));

  it("is current within the decay window", () => {
    const status = evaluateProfileDecay(profile, "2026-03-01"); // ~59 days
    expect(status.status).toBe("current");
  });

  it("is current exactly at the window boundary", () => {
    // 2026-01-01 + 180 days = 2026-06-30
    const status = evaluateProfileDecay(profile, "2026-06-30");
    expect(status.daysSinceLastSupport).toBe(180);
    expect(status.status).toBe("current");
  });

  it("becomes revision-due beyond the window", () => {
    const status = evaluateProfileDecay(profile, "2026-07-15"); // > 180 days
    expect(status.status).toBe("revision_due");
    expect(status.reason).toMatch(/revision-due/);
    expect(status.reason).toMatch(/does not count as counter-evidence/);
  });

  it("treats an unparseable asOfIso as revision-due rather than silently returning current", () => {
    const status = evaluateProfileDecay(profile, "not-a-date");
    expect(status.status).toBe("revision_due");
    expect(status.daysSinceLastSupport).toBe(-1);
    expect(status.reason).toMatch(/not a parseable date/);
  });
});

// ---------------------------------------------------------------------------
// Composite guard + factory
// ---------------------------------------------------------------------------

describe("createTensionProfile — happy path", () => {
  it("builds a valid weak profile", () => {
    const p: TensionProfile = createTensionProfile(validInput());
    expect(p.evidenceLevel).toBe("weak");
    expect(p.personId).toBe("Ali");
    expect(guardTensionProfile(p)).toEqual([]);
  });

  it("defaults optional cluster + counter-evidence arrays to empty (honest Leerstelle)", () => {
    const p = createTensionProfile(
      validInput({
        needPressures: undefined,
        determinants: undefined,
        expressionForms: undefined,
        reliefConditions: undefined,
        counterEvidence: undefined,
      }),
    );
    expect(p.needPressures).toEqual([]);
    expect(p.counterEvidence).toEqual([]);
  });

  it("builds a valid strong profile with a documented Gegenbeleg", () => {
    const p = createTensionProfile(
      validInput({
        evidenceLevel: "strong",
        epistemicMarking: "plausible",
        support: support({ caseIds: caseIds(4), distinctTimepoints: 2, distinctContexts: 2 }),
        counterEvidence: [documentedCounter],
      }),
    );
    expect(p.evidenceLevel).toBe("strong");
  });

  it("does not mutate the caller's input arrays", () => {
    const ids = caseIds(2);
    const input = validInput({ support: support({ caseIds: ids }) });
    const p = createTensionProfile(input);
    ids.push("c-mutated");
    expect(p.support.caseIds).toEqual(["c1", "c2"]);
  });
});

describe("createTensionProfile — protection rules reject", () => {
  it("rejects a profile with an empty pattern description", () => {
    expect(() => createTensionProfile(validInput({ patternDescription: "   " }))).toThrow(
      /Musterbeschreibung/,
    );
  });

  it("rejects a weak profile that lacks the case base", () => {
    expect(() =>
      createTensionProfile(validInput({ support: support({ caseIds: caseIds(1) }) })),
    ).toThrow(/weak profile entry/);
  });

  it("rejects a strong profile whose support is insufficient", () => {
    expect(() =>
      createTensionProfile(
        validInput({
          evidenceLevel: "strong",
          counterEvidence: [documentedCounter],
          support: support({ caseIds: caseIds(3), distinctTimepoints: 2, distinctContexts: 2 }),
        }),
      ),
    ).toThrow(/strong profile entry/);
  });

  it("rejects a strong profile without any counter-evidence (§3.2)", () => {
    expect(() =>
      createTensionProfile(
        validInput({
          evidenceLevel: "strong",
          counterEvidence: [],
          support: support({ caseIds: caseIds(4), distinctTimepoints: 2, distinctContexts: 2 }),
        }),
      ),
    ).toThrow(/at least one documented Gegenbeleg/);
  });

  it("rejects a strong profile marked speculative (§10.2)", () => {
    expect(() =>
      createTensionProfile(
        validInput({
          evidenceLevel: "strong",
          epistemicMarking: "speculative",
          counterEvidence: [documentedCounter],
          support: support({ caseIds: caseIds(4), distinctTimepoints: 2, distinctContexts: 2 }),
        }),
      ),
    ).toThrow(/must not be marked speculative/);
  });

  it("allows a weak profile to be speculative (only strong is restricted)", () => {
    const p = createTensionProfile(validInput({ epistemicMarking: "speculative" }));
    expect(p.epistemicMarking).toBe("speculative");
  });

  it("aggregates multiple errors rather than throwing on the first", () => {
    const errs = guardTensionProfile({
      ...validInput(),
      support: { ...support(), caseIds: [] },
    } as unknown);
    expect(errs.length).toBeGreaterThan(0);
  });
});
