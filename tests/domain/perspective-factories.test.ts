import { describe, it, expect } from "vitest";
import {
  createPerspective,
  commitPerspective,
} from "../../src/domain/factories.js";
import { guardPerspective } from "../../src/domain/guards.js";
import type { Perspective } from "../../src/domain/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fullContent() {
  return {
    observation: "Kind schlägt auf den Tisch.",
    interpretation: "Zeigt körperliche Anspannung.",
    counterInterpretation: "Versucht Aufmerksamkeit zu gewinnen.",
    uncertainty: "Nur ein Einzelereignis beobachtet.",
  };
}

// ---------------------------------------------------------------------------
// createPerspective
// ---------------------------------------------------------------------------

describe("createPerspective", () => {
  it("creates a draft perspective with minimal input", () => {
    const p = createPerspective({
      id: "p-1",
      case_id: "case-1",
      actor_id: "actor-1",
      created_at: "2026-04-01T10:00:00Z",
    });

    expect(p.id).toBe("p-1");
    expect(p.case_id).toBe("case-1");
    expect(p.actor_id).toBe("actor-1");
    expect(p.status).toBe("draft");
    expect(p.committed_at).toBeUndefined();
  });

  it("creates a draft with partial content", () => {
    const p = createPerspective({
      id: "p-2",
      case_id: "case-1",
      actor_id: "actor-1",
      content: { observation: "Something happened." },
      created_at: "2026-04-01T10:00:00Z",
    });

    expect(p.content.observation).toBe("Something happened.");
    expect(p.content.interpretation).toBeUndefined();
  });

  it("creates a draft with full content", () => {
    const p = createPerspective({
      id: "p-3",
      case_id: "case-1",
      actor_id: "actor-1",
      content: fullContent(),
      created_at: "2026-04-01T10:00:00Z",
    });

    expect(p.content.observation).toBe(fullContent().observation);
    expect(p.status).toBe("draft");
  });

  it("rejects empty id", () => {
    expect(() =>
      createPerspective({
        id: "",
        case_id: "case-1",
        actor_id: "actor-1",
        created_at: "2026-04-01T10:00:00Z",
      }),
    ).toThrow("id");
  });

  it("rejects empty case_id", () => {
    expect(() =>
      createPerspective({
        id: "p-1",
        case_id: "",
        actor_id: "actor-1",
        created_at: "2026-04-01T10:00:00Z",
      }),
    ).toThrow("case_id");
  });

  it("rejects empty actor_id", () => {
    expect(() =>
      createPerspective({
        id: "p-1",
        case_id: "case-1",
        actor_id: "",
        created_at: "2026-04-01T10:00:00Z",
      }),
    ).toThrow("actor_id");
  });

  it("auto-generates created_at when omitted", () => {
    const before = new Date().toISOString();
    const p = createPerspective({
      id: "p-auto",
      case_id: "case-1",
      actor_id: "actor-1",
    });
    const after = new Date().toISOString();

    expect(p.created_at >= before).toBe(true);
    expect(p.created_at <= after).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// commitPerspective
// ---------------------------------------------------------------------------

describe("commitPerspective", () => {
  it("commits a draft with full content", () => {
    const draft = createPerspective({
      id: "p-c1",
      case_id: "case-1",
      actor_id: "actor-1",
      content: fullContent(),
      created_at: "2026-04-01T10:00:00Z",
    });

    const committed = commitPerspective(draft);

    expect(committed.status).toBe("committed");
    expect(committed.committed_at).toBeDefined();
    expect(committed.id).toBe(draft.id);
    expect(committed.content).toEqual(draft.content);
  });

  it("preserves all fields after commit", () => {
    const draft = createPerspective({
      id: "p-preserve",
      case_id: "case-42",
      actor_id: "actor-7",
      content: fullContent(),
      created_at: "2026-04-01T10:00:00Z",
    });

    const committed = commitPerspective(draft);

    expect(committed.case_id).toBe("case-42");
    expect(committed.actor_id).toBe("actor-7");
    expect(committed.created_at).toBe("2026-04-01T10:00:00Z");
  });

  it("throws if content is incomplete (missing observation)", () => {
    const draft = createPerspective({
      id: "p-inc",
      case_id: "case-1",
      actor_id: "actor-1",
      content: { interpretation: "Something.", counterInterpretation: "Or not.", uncertainty: "Unsure." },
      created_at: "2026-04-01T10:00:00Z",
    });

    expect(() => commitPerspective(draft)).toThrow("observation");
  });

  it("throws if content is completely empty", () => {
    const draft = createPerspective({
      id: "p-empty",
      case_id: "case-1",
      actor_id: "actor-1",
      created_at: "2026-04-01T10:00:00Z",
    });

    expect(() => commitPerspective(draft)).toThrow();
  });

  it("throws if already committed", () => {
    const draft = createPerspective({
      id: "p-double",
      case_id: "case-1",
      actor_id: "actor-1",
      content: fullContent(),
      created_at: "2026-04-01T10:00:00Z",
    });

    const committed = commitPerspective(draft);
    expect(() => commitPerspective(committed)).toThrow("already committed");
  });

  it("committed perspective is structurally valid", () => {
    const draft = createPerspective({
      id: "p-valid",
      case_id: "case-1",
      actor_id: "actor-1",
      content: fullContent(),
      created_at: "2026-04-01T10:00:00Z",
    });

    const committed = commitPerspective(draft);

    // Re-validate via guards to ensure composite guard passes
    expect(guardPerspective(committed)).toEqual([]);
  });
});
