import type { PerspectiveCommittedContent } from '../../src/domain/types.js';
import { describe, it, expect } from "vitest";
import {
  canReadPerspective,
  canWritePerspective,
  canComparePerspectives,
  getComparablePerspectives,
  filterVisiblePerspectives,
} from "../../src/domain/perspective-access.js";
import type { PerspectiveRecord } from "../../src/domain/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const dummyContent: PerspectiveCommittedContent = {
  observation: { text: "obs", isCameraDescribable: true },
  interpretation: { text: "interp", evidenceType: "observational" },
  counterInterpretations: [{ text: "counter", evidenceType: "derived" }],
  uncertainties: [{ level: 2, rationale: "unc" }],
};

function draftPerspective(actorId: string, id: string = "p-draft"): PerspectiveRecord {
  return {
    id,
    caseId: "case-1",
    actorId: actorId,
    status: "draft",
    content: dummyContent,
    createdAt: "2026-04-01T10:00:00Z",
  };
}

function committedPerspective(actorId: string, id: string = "p-committed"): PerspectiveRecord {
  return {
    id,
    caseId: "case-1",
    actorId: actorId,
    status: "committed",
    content: dummyContent,
    createdAt: "2026-04-01T10:00:00Z",
    committedAt: "2026-04-01T11:00:00Z",
  };
}

// ---------------------------------------------------------------------------
// canReadPerspective
// ---------------------------------------------------------------------------

describe("canReadPerspective (Phase 1 Policy: STRICT BLIND)", () => {
  it("allows owner to read their own draft", () => {
    expect(canReadPerspective(draftPerspective("actor-1"), "actor-1")).toBe(true);
  });

  it("denies non-owner from reading a draft", () => {
    expect(canReadPerspective(draftPerspective("actor-1"), "actor-2")).toBe(false);
  });

  it("denies non-owner from reading a committed perspective", () => {
    expect(canReadPerspective(committedPerspective("actor-1"), "actor-2")).toBe(false);
  });

  it("allows owner to read their own committed perspective", () => {
    expect(canReadPerspective(committedPerspective("actor-1"), "actor-1")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// canWritePerspective
// ---------------------------------------------------------------------------

describe("canWritePerspective", () => {
  it("allows owner to write their own draft", () => {
    expect(canWritePerspective(draftPerspective("actor-1"), "actor-1")).toBe(true);
  });

  it("denies non-owner from writing a draft", () => {
    expect(canWritePerspective(draftPerspective("actor-1"), "actor-2")).toBe(false);
  });

  it("denies writing to a committed perspective (even by owner)", () => {
    expect(canWritePerspective(committedPerspective("actor-1"), "actor-1")).toBe(false);
  });

  it("denies writing to a committed perspective by non-owner", () => {
    expect(canWritePerspective(committedPerspective("actor-1"), "actor-2")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getComparablePerspectives
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// canComparePerspectives
// ---------------------------------------------------------------------------

describe("canComparePerspectives (Phase 1 Policy: DISABLED)", () => {
  it("denies if total committed is less than 2, even if actor has committed", () => {
    const perspectives = [committedPerspective("actor-1")];
    expect(canComparePerspectives(perspectives, "actor-1")).toBe(false);
  });

  it("denies if actor has not committed, even if total >= 2", () => {
    const perspectives = [
      committedPerspective("actor-2", "p-2"),
      committedPerspective("actor-3", "p-3"),
      draftPerspective("actor-1", "p-1"), // actor-1 only has draft
    ];
    expect(canComparePerspectives(perspectives, "actor-1")).toBe(false);
  });

  it("denies even if actor has committed and total >= 2 (Phase 1 rule)", () => {
    const perspectives = [
      committedPerspective("actor-1", "p-1"),
      committedPerspective("actor-2", "p-2"),
    ];
    expect(canComparePerspectives(perspectives, "actor-1")).toBe(false);
  });
});

describe("getComparablePerspectives (Phase 1 Policy: DISABLED)", () => {
  it("returns empty unconditionally in Phase 1 (streng blind)", () => {
    expect(getComparablePerspectives([])).toEqual([]);
    const perspectives = [
      committedPerspective("actor-1", "p-1"),
      committedPerspective("actor-2", "p-2"),
    ];
    expect(getComparablePerspectives(perspectives)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// filterVisiblePerspectives
// ---------------------------------------------------------------------------

describe("filterVisiblePerspectives (Phase 1 Policy: STRICT BLIND)", () => {
  it("returns own draft + own committed", () => {
    const perspectives = [
      draftPerspective("actor-1", "p-1"),
      draftPerspective("actor-2", "p-2"),
      committedPerspective("actor-3", "p-3"),
    ];

    const visible = filterVisiblePerspectives(perspectives, "actor-1");
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("p-1");
  });

  it("never shows another actor's draft", () => {
    const perspectives = [
      draftPerspective("actor-1", "p-1"),
      draftPerspective("actor-2", "p-2"),
      draftPerspective("actor-3", "p-3"),
    ];

    const visible = filterVisiblePerspectives(perspectives, "actor-2");
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("p-2");
  });

  it("never shows another actor's committed perspective", () => {
    const perspectives = [
      committedPerspective("actor-1", "p-1"),
      committedPerspective("actor-2", "p-2"),
    ];

    const visible = filterVisiblePerspectives(perspectives, "actor-99");
    expect(visible).toHaveLength(0);
  });

  it("returns empty if no perspectives match", () => {
    const perspectives = [
      draftPerspective("actor-1", "p-1"),
    ];

    const visible = filterVisiblePerspectives(perspectives, "actor-2");
    expect(visible).toHaveLength(0);
  });
});
