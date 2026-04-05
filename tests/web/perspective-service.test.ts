import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addDraftPerspective,
  commitPerspective,
  getComparablePerspectivesForCase,
  getDraftPerspectiveForActor,
} from '../../apps/web/src/lib/services/case-service.js';
import { localStorageStore } from '../../apps/web/src/lib/persistence/store.js';
import type { Case } from '../../src/domain/types.js';

// Setup Mock Storage
class MemoryStorage implements Storage {
  #map = new Map<string, string>();
  get length() { return this.#map.size; }
  clear() { this.#map.clear(); }
  getItem(key: string) { return this.#map.get(key) ?? null; }
  key(index: number) { return [...this.#map.keys()][index] ?? null; }
  removeItem(key: string) { this.#map.delete(key); }
  setItem(key: string, value: string) { this.#map.set(key, value); }
}

const DUMMY_CASE: Case = {
  id: "case-test",
  context: "Test Context",
  participants: [{ id: "actor-1" }, { id: "actor-2" }, { id: "actor-3" }],
  observation: { text: "obs", isCameraDescribable: true },
  currentReflection: {
    reflectedAt: "2026-04-01T10:00:00Z",
    interpretation: { text: "int", evidenceType: "observational" },
    counterInterpretations: [{ text: "c", evidenceType: "derived" }],
    uncertainties: [{ level: 2, rationale: "unc" }],
    tensions: []
  },
  revisions: [],
  perspectives: []
};

const DUMMY_INPUT = {
  id: "p-1",
  caseId: "case-test",
  actorId: "actor-1",
  createdAt: "2026-04-01T10:00:00Z",
  observation: { text: "obs", isCameraDescribable: true },
  interpretation: { text: "int", evidenceType: "observational" },
  counterInterpretations: [{ text: "c", evidenceType: "derived" }],
  uncertainties: [{ level: 2, rationale: "unc" }]
};

describe('case-service - perspective management', () => {
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: new MemoryStorage()
    });
    // Seed a valid case
    localStorageStore.saveCase(DUMMY_CASE);
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: originalLocalStorage
    });
    vi.restoreAllMocks();
  });

  describe('addDraftPerspective', () => {
    it('creates a draft for the requesting actor', () => {
      const updatedCase = addDraftPerspective('case-test', DUMMY_INPUT, 'actor-1');
      expect(updatedCase.perspectives).toHaveLength(1);
      expect(updatedCase.perspectives![0].actorId).toBe('actor-1');
      expect(updatedCase.perspectives![0].status).toBe('draft');
    });

    it('overwrites an existing draft for the same actor', () => {
      addDraftPerspective('case-test', DUMMY_INPUT, 'actor-1');

      const newDraftInput = { ...DUMMY_INPUT, id: "p-2", observation: { text: "new obs", isCameraDescribable: true } };
      const updatedCase = addDraftPerspective('case-test', newDraftInput, 'actor-1');

      expect(updatedCase.perspectives).toHaveLength(1);
      expect(updatedCase.perspectives![0].id).toBe('p-2');
      expect(updatedCase.perspectives![0].content.observation.text).toBe('new obs');
    });


    it('rejects draft creation if actor already has a committed perspective', () => {
      addDraftPerspective('case-test', DUMMY_INPUT, 'actor-1');
      commitPerspective('case-test', 'p-1', 'actor-1');

      const newDraftInput = { ...DUMMY_INPUT, id: "p-2", observation: { text: "new obs", isCameraDescribable: true } };

      expect(() => addDraftPerspective('case-test', newDraftInput, 'actor-1'))
        .toThrow("Perspective already committed for this actor.");
    });

    it('does not touch drafts of other actors', () => {
      addDraftPerspective('case-test', DUMMY_INPUT, 'actor-1');

      const input2 = { ...DUMMY_INPUT, id: "p-2", actorId: "actor-2" };
      const updatedCase = addDraftPerspective('case-test', input2, 'actor-2');

      expect(updatedCase.perspectives).toHaveLength(2);
      const ids = updatedCase.perspectives!.map(p => p.actorId).sort();
      expect(ids).toEqual(['actor-1', 'actor-2']);
    });

    it('rejects creation if input.actorId does not match requestingActorId', () => {
      expect(() => addDraftPerspective('case-test', DUMMY_INPUT, 'actor-2'))
        .toThrow("Access denied: You can only create drafts for yourself.");
    });
  });

  describe('commitPerspective', () => {
    it('successfully commits own draft', () => {
      addDraftPerspective('case-test', DUMMY_INPUT, 'actor-1');
      const updatedCase = commitPerspective('case-test', 'p-1', 'actor-1');
      const p = updatedCase.perspectives!.find(p => p.id === 'p-1');
      expect(p!.status).toBe('committed');
      expect(p!.committedAt).toBeDefined();
    });

    it('rejects commit of another actor draft', () => {
      addDraftPerspective('case-test', DUMMY_INPUT, 'actor-1');
      expect(() => commitPerspective('case-test', 'p-1', 'actor-2'))
        .toThrow("Access denied");
    });

    it('rejects commit for unknown ID', () => {
      addDraftPerspective('case-test', DUMMY_INPUT, 'actor-1');
      expect(() => commitPerspective('case-test', 'unknown-id', 'actor-1'))
        .toThrow("Perspective not found");
    });
  });

  describe('getComparablePerspectivesForCase', () => {
    it('returns empty array if total committed is less than 2', () => {
      addDraftPerspective('case-test', DUMMY_INPUT, 'actor-1');
      commitPerspective('case-test', 'p-1', 'actor-1');

      const result = getComparablePerspectivesForCase('case-test', 'actor-1');
      expect(result).toEqual([]);
    });

    it('returns empty array if requester has not committed, even if total >= 2', () => {
      // actor-2 and actor-3 commit
      addDraftPerspective('case-test', { ...DUMMY_INPUT, id: "p-2", actorId: "actor-2" }, 'actor-2');
      commitPerspective('case-test', 'p-2', 'actor-2');
      addDraftPerspective('case-test', { ...DUMMY_INPUT, id: "p-3", actorId: "actor-3" }, 'actor-3');
      commitPerspective('case-test', 'p-3', 'actor-3');

      // actor-1 only has draft
      addDraftPerspective('case-test', DUMMY_INPUT, 'actor-1');

      const result = getComparablePerspectivesForCase('case-test', 'actor-1');
      expect(result).toEqual([]);
    });

    it('returns array of committed perspectives when all conditions met', () => {
      addDraftPerspective('case-test', DUMMY_INPUT, 'actor-1');
      commitPerspective('case-test', 'p-1', 'actor-1');

      addDraftPerspective('case-test', { ...DUMMY_INPUT, id: "p-2", actorId: "actor-2" }, 'actor-2');
      commitPerspective('case-test', 'p-2', 'actor-2');

      const result = getComparablePerspectivesForCase('case-test', 'actor-1');
      expect(result).toHaveLength(2);
      expect(result.every(p => p.status === 'committed')).toBe(true);
    });
  });

  describe('getDraftPerspectiveForActor', () => {
    it('returns correct draft or undefined', () => {
      addDraftPerspective('case-test', DUMMY_INPUT, 'actor-1');

      const p = getDraftPerspectiveForActor('case-test', 'actor-1');
      expect(p).toBeDefined();
      expect(p!.id).toBe('p-1');

      const p2 = getDraftPerspectiveForActor('case-test', 'actor-2');
      expect(p2).toBeUndefined();
    });
  });
});
