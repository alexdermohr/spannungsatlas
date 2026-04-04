import { describe, it, expect } from "vitest";
import {
  guardPerspectiveStatus,
  guardPerspectiveContentComplete,
  guardPerspectiveId,
  guardPerspectiveCaseId,
  guardPerspectiveActorId,
  guardPerspective,
} from "../../src/domain/guards.js";
import type { Perspective, PerspectiveContent } from "../../src/domain/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validDraftPerspective(): Perspective {
  return {
    id: "p-1",
    case_id: "case-1",
    actor_id: "actor-1",
    status: "draft",
    content: {},
    created_at: "2026-04-01T10:00:00Z",
  };
}

function validCommittedPerspective(): Perspective {
  return {
    id: "p-2",
    case_id: "case-1",
    actor_id: "actor-1",
    status: "committed",
    content: {
      observation: "Kind schlägt auf den Tisch.",
      interpretation: "Zeigt körperliche Anspannung.",
      counterInterpretation: "Versucht Aufmerksamkeit zu gewinnen.",
      uncertainty: "Nur ein Einzelereignis beobachtet.",
    },
    created_at: "2026-04-01T10:00:00Z",
    committed_at: "2026-04-01T11:00:00Z",
  };
}

function fullContent(): PerspectiveContent {
  return {
    observation: "Kind schlägt auf den Tisch.",
    interpretation: "Zeigt körperliche Anspannung.",
    counterInterpretation: "Versucht Aufmerksamkeit zu gewinnen.",
    uncertainty: "Nur ein Einzelereignis beobachtet.",
  };
}

// ---------------------------------------------------------------------------
// guardPerspectiveStatus
// ---------------------------------------------------------------------------

describe("guardPerspectiveStatus", () => {
  it("accepts 'draft'", () => {
    expect(guardPerspectiveStatus("draft")).toBeUndefined();
  });

  it("accepts 'committed'", () => {
    expect(guardPerspectiveStatus("committed")).toBeUndefined();
  });

  it("rejects unknown status", () => {
    expect(guardPerspectiveStatus("open")).toContain("PerspectiveStatus");
  });

  it("rejects empty string", () => {
    expect(guardPerspectiveStatus("")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// guardPerspectiveContentComplete
// ---------------------------------------------------------------------------

describe("guardPerspectiveContentComplete", () => {
  it("returns no errors for full content", () => {
    expect(guardPerspectiveContentComplete(fullContent())).toEqual([]);
  });

  it("reports missing observation", () => {
    const content: PerspectiveContent = { ...fullContent(), observation: undefined };
    const errors = guardPerspectiveContentComplete(content);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes("observation"))).toBe(true);
  });

  it("reports missing interpretation", () => {
    const content: PerspectiveContent = { ...fullContent(), interpretation: undefined };
    const errors = guardPerspectiveContentComplete(content);
    expect(errors.some((e) => e.includes("interpretation"))).toBe(true);
  });

  it("reports missing counter-interpretation", () => {
    const content: PerspectiveContent = { ...fullContent(), counterInterpretation: undefined };
    const errors = guardPerspectiveContentComplete(content);
    expect(errors.some((e) => e.includes("counter-interpretation"))).toBe(true);
  });

  it("reports missing uncertainty", () => {
    const content: PerspectiveContent = { ...fullContent(), uncertainty: undefined };
    const errors = guardPerspectiveContentComplete(content);
    expect(errors.some((e) => e.includes("uncertainty"))).toBe(true);
  });

  it("reports all four errors when content is empty", () => {
    const errors = guardPerspectiveContentComplete({});
    expect(errors).toHaveLength(4);
  });

  it("rejects whitespace-only fields", () => {
    const content: PerspectiveContent = {
      observation: "   ",
      interpretation: "  ",
      counterInterpretation: "\t",
      uncertainty: "\n",
    };
    expect(guardPerspectiveContentComplete(content)).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// guardPerspectiveId / CaseId / ActorId
// ---------------------------------------------------------------------------

describe("guardPerspectiveId", () => {
  it("accepts non-empty id", () => {
    expect(guardPerspectiveId("abc-123")).toBeUndefined();
  });

  it("rejects empty id", () => {
    expect(guardPerspectiveId("")).toBeDefined();
  });

  it("rejects whitespace-only id", () => {
    expect(guardPerspectiveId("   ")).toBeDefined();
  });
});

describe("guardPerspectiveCaseId", () => {
  it("accepts non-empty case_id", () => {
    expect(guardPerspectiveCaseId("case-1")).toBeUndefined();
  });

  it("rejects empty case_id", () => {
    expect(guardPerspectiveCaseId("")).toBeDefined();
  });
});

describe("guardPerspectiveActorId", () => {
  it("accepts non-empty actor_id", () => {
    expect(guardPerspectiveActorId("actor-1")).toBeUndefined();
  });

  it("rejects empty actor_id", () => {
    expect(guardPerspectiveActorId("")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// guardPerspective (composite)
// ---------------------------------------------------------------------------

describe("guardPerspective", () => {
  it("accepts a valid draft perspective with empty content", () => {
    expect(guardPerspective(validDraftPerspective())).toEqual([]);
  });

  it("accepts a valid committed perspective", () => {
    expect(guardPerspective(validCommittedPerspective())).toEqual([]);
  });

  it("rejects draft with empty id", () => {
    const p = { ...validDraftPerspective(), id: "" };
    expect(guardPerspective(p).length).toBeGreaterThan(0);
  });

  it("rejects draft with empty case_id", () => {
    const p = { ...validDraftPerspective(), case_id: "" };
    expect(guardPerspective(p).length).toBeGreaterThan(0);
  });

  it("rejects draft with empty actor_id", () => {
    const p = { ...validDraftPerspective(), actor_id: "" };
    expect(guardPerspective(p).length).toBeGreaterThan(0);
  });

  it("rejects committed perspective with incomplete content", () => {
    const p: Perspective = {
      ...validDraftPerspective(),
      status: "committed",
      committed_at: "2026-04-01T11:00:00Z",
    };
    const errors = guardPerspective(p);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes("observation"))).toBe(true);
  });

  it("rejects committed perspective without committed_at", () => {
    const p: Perspective = {
      ...validDraftPerspective(),
      status: "committed",
      content: fullContent(),
    };
    const errors = guardPerspective(p);
    expect(errors.some((e) => e.includes("committed_at"))).toBe(true);
  });

  it("rejects committed perspective with invalid committed_at", () => {
    const p: Perspective = {
      ...validDraftPerspective(),
      status: "committed",
      content: fullContent(),
      committed_at: "not-a-date",
    };
    const errors = guardPerspective(p);
    expect(errors.some((e) => e.includes("committed_at"))).toBe(true);
  });

  it("rejects invalid created_at", () => {
    const p = { ...validDraftPerspective(), created_at: "bad" };
    expect(guardPerspective(p).length).toBeGreaterThan(0);
  });

  it("rejects invalid status", () => {
    const p = { ...validDraftPerspective(), status: "open" as "draft" };
    expect(guardPerspective(p).length).toBeGreaterThan(0);
  });
});
