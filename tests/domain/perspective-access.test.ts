import { describe, it, expect } from "vitest";
import {
  canReadPerspective,
  canWritePerspective,
  getComparablePerspectives,
  filterVisiblePerspectives,
} from "../../src/domain/perspective-access.js";
import type { PerspectiveRecord, PerspectiveContent } from "../../src/domain/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const dummyContent: PerspectiveContent = {
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

describe("canReadPerspective", () => {
  it("allows owner to read their own draft", () => {
    expect(canReadPerspective(draftPerspective("actor-1"), "actor-1")).toBe(true);
  });

  it("denies non-owner from reading a draft", () => {
    expect(canReadPerspective(draftPerspective("actor-1"), "actor-2")).toBe(false);
  });

  it("allows anyone to read a committed perspective", () => {
    expect(canReadPerspective(committedPerspective("actor-1"), "actor-2")).toBe(true);
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

describe("getComparablePerspectives", () => {
  it("returns empty when no perspectives exist", () => {
    expect(getComparablePerspectives([])).toEqual([]);
  });

  it("returns empty when only one committed perspective exists", () => {
    const perspectives = [committedPerspective("actor-1")];
    expect(getComparablePerspectives(perspectives)).toEqual([]);
  });

  it("returns all committed when >= 2 exist", () => {
    const perspectives = [
      committedPerspective("actor-1", "p-1"),
      committedPerspective("actor-2", "p-2"),
    ];
    const result = getComparablePerspectives(perspectives);
    expect(result).toHaveLength(2);
  });

  it("ignores draft perspectives in the count", () => {
    const perspectives = [
      committedPerspective("actor-1", "p-1"),
      draftPerspective("actor-2", "p-2"),
    ];
    expect(getComparablePerspectives(perspectives)).toEqual([]);
  });

  it("returns only committed perspectives (excludes drafts)", () => {
    const perspectives = [
      committedPerspective("actor-1", "p-1"),
      committedPerspective("actor-2", "p-2"),
      draftPerspective("actor-3", "p-3"),
    ];
    const result = getComparablePerspectives(perspectives);
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.status === "committed")).toBe(true);
  });

  it("respects custom minRequired threshold", () => {
    const perspectives = [
      committedPerspective("actor-1", "p-1"),
      committedPerspective("actor-2", "p-2"),
    ];
    expect(getComparablePerspectives(perspectives, 3)).toEqual([]);
    expect(getComparablePerspectives(perspectives, 2)).toHaveLength(2);
    expect(getComparablePerspectives(perspectives, 1)).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// filterVisiblePerspectives
// ---------------------------------------------------------------------------

describe("filterVisiblePerspectives", () => {
  it("returns own draft + all committed", () => {
    const perspectives = [
      draftPerspective("actor-1", "p-1"),
      draftPerspective("actor-2", "p-2"),
      committedPerspective("actor-3", "p-3"),
    ];

    const visible = filterVisiblePerspectives(perspectives, "actor-1");
    expect(visible).toHaveLength(2);
    expect(visible.map((p) => p.id).sort()).toEqual(["p-1", "p-3"]);
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

  it("returns all committed perspectives to any actor", () => {
    const perspectives = [
      committedPerspective("actor-1", "p-1"),
      committedPerspective("actor-2", "p-2"),
    ];

    const visible = filterVisiblePerspectives(perspectives, "actor-99");
    expect(visible).toHaveLength(2);
  });

  it("returns empty if no perspectives match", () => {
    const perspectives = [
      draftPerspective("actor-1", "p-1"),
    ];

    const visible = filterVisiblePerspectives(perspectives, "actor-2");
    expect(visible).toHaveLength(0);
  });
});
