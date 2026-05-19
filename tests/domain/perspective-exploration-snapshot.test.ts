import { describe, it, expect } from "vitest";
import { guardPerspectiveExplorationSnapshot, guardPerspectiveRecord } from "../../src/domain/guards.js";

describe("guardPerspectiveExplorationSnapshot", () => {
  it("accepts a snapshot with valid selections and ISO exploredAt", () => {
    const errors = guardPerspectiveExplorationSnapshot({
      selectedNeeds: [{ id: "autonomie" }],
      selectedDeterminants: [{ id: "raum" }],
      exploredAt: "2026-05-17T08:30:00Z"
    });
    expect(errors).toEqual([]);
  });

  it("accepts an empty snapshot with only exploredAt", () => {
    const errors = guardPerspectiveExplorationSnapshot({
      exploredAt: "2026-05-17"
    });
    expect(errors).toEqual([]);
  });

  it("rejects non-object input", () => {
    expect(guardPerspectiveExplorationSnapshot(null).length).toBeGreaterThan(0);
    expect(guardPerspectiveExplorationSnapshot([]).length).toBeGreaterThan(0);
  });

  it("rejects empty selection ids", () => {
    const errors = guardPerspectiveExplorationSnapshot({
      selectedNeeds: [{ id: "" }],
      exploredAt: "2026-05-17T08:30:00Z"
    });
    expect(errors.some((e) => e.includes("non-empty string id"))).toBe(true);
  });

  it("rejects duplicate selectedNeeds", () => {
    const errors = guardPerspectiveExplorationSnapshot({
      selectedNeeds: [{ id: "a" }, { id: "a" }],
      exploredAt: "2026-05-17T08:30:00Z"
    });
    expect(errors.some((e) => e.includes("duplicate ids"))).toBe(true);
  });

  it("rejects duplicate selectedDeterminants", () => {
    const errors = guardPerspectiveExplorationSnapshot({
      selectedDeterminants: [{ id: "b" }, { id: "b" }],
      exploredAt: "2026-05-17T08:30:00Z"
    });
    expect(errors.some((e) => e.includes("duplicate ids"))).toBe(true);
  });

  it("rejects missing exploredAt", () => {
    const errors = guardPerspectiveExplorationSnapshot({
      selectedNeeds: [{ id: "a" }]
    });
    expect(errors.some((e) => e.toLowerCase().includes("exploredat"))).toBe(true);
  });

  it("rejects non-ISO exploredAt", () => {
    const errors = guardPerspectiveExplorationSnapshot({
      exploredAt: "not-a-date"
    });
    expect(errors.some((e) => e.toLowerCase().includes("exploredat"))).toBe(true);
  });

  it("rejects postCommitExploration on a draft record", () => {
    const errors = guardPerspectiveRecord({
      id: "p1",
      caseId: "c1",
      actorId: "a1",
      status: "draft",
      createdAt: "2026-05-17T08:00:00Z",
      content: {},
      postCommitExploration: {
        exploredAt: "2026-05-17T08:30:00Z"
      }
    });
    expect(errors.some((e) => e.includes("postCommitExploration must be absent when status is draft"))).toBe(true);
  });

  it("tolerates unknown catalog ids at read time", () => {
    const errors = guardPerspectiveExplorationSnapshot({
      selectedNeeds: [{ id: "definitely-not-in-catalog-xyz" }],
      exploredAt: "2026-05-17T08:30:00Z"
    });
    expect(errors).toEqual([]);
  });
});
