import type { CreatePerspectiveDraftInput } from '../../src/domain/factories.js';
import { mapCameraStateToFormValue } from '../../src/domain/form-mappers.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addDraftPerspective,
  commitPerspective,
  getComparablePerspectivesForCase,
  getDraftPerspectiveForActor,
  getSelectionDisplayForActor,
  selectPerspectiveForSelectionDisplay,
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
    counterInterpretations: [{ text: "c", evidenceType: "derived" as const }],
    uncertainties: [{ level: 2, rationale: "unc" }],
    tensions: []
  },
  revisions: [],
  perspectives: []
};

const DUMMY_INPUT: CreatePerspectiveDraftInput = {
  id: "p-1",
  caseId: "case-test",
  actorId: "actor-1",
  createdAt: "2026-04-01T10:00:00Z",
  observation: { text: "obs", isCameraDescribable: true },
  interpretation: { text: "int", evidenceType: "observational" },
  counterInterpretations: [{ text: "c", evidenceType: "derived" as const }],
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


  describe('partial draft storage coverage', () => {
    it('allows draft creation with explicit observation false even if text empty', () => {
      const input: CreatePerspectiveDraftInput = {
        id: "p-test-0",
        caseId: "case-test",
        actorId: "actor-1",
        createdAt: "2026-03-28T10:00:00Z",
        observation: { isCameraDescribable: false }
      };

      const updatedCase = addDraftPerspective('case-test', input, 'actor-1');
      expect(updatedCase.perspectives?.[0].content.observation?.isCameraDescribable).toBe(false);
      expect(updatedCase.perspectives?.[0].content.interpretation).toBeUndefined();
    });

    it('allows draft creation with explicit observation true even if text empty', () => {
      const input: CreatePerspectiveDraftInput = {
        id: "p-test-01",
        caseId: "case-test",
        actorId: "actor-1",
        createdAt: "2026-03-28T10:00:00Z",
        observation: { isCameraDescribable: true }
      };

      const updatedCase = addDraftPerspective('case-test', input, 'actor-1');
      expect(updatedCase.perspectives?.[0].content.observation?.isCameraDescribable).toBe(true);
      expect(updatedCase.perspectives?.[0].content.interpretation).toBeUndefined();
    });

    it('allows draft creation with observation text but missing camera describable (undefined/null)', () => {
      const input: CreatePerspectiveDraftInput = {
        id: "p-test-02",
        caseId: "case-test",
        actorId: "actor-1",
        createdAt: "2026-03-28T10:00:00Z",
        observation: { text: "Nur Text, kein Kamera-Test" }
      };

      const updatedCase = addDraftPerspective('case-test', input, 'actor-1');
      expect(updatedCase.perspectives?.[0].content.observation?.text).toBe("Nur Text, kein Kamera-Test");
      expect(updatedCase.perspectives?.[0].content.observation?.isCameraDescribable).toBeUndefined();
    });
    it('allows draft creation with only interpretation', () => {
      const input: CreatePerspectiveDraftInput = {
        id: "p-test-1",
        caseId: "case-test",
        actorId: "actor-1",
        createdAt: "2026-03-28T10:00:00Z",
        interpretation: { text: "Nur Interpretation", evidenceType: "observational" }
      };

      const updatedCase = addDraftPerspective('case-test', input, 'actor-1');
      expect(updatedCase.perspectives?.[0].content.interpretation?.text).toBe("Nur Interpretation");
      expect(updatedCase.perspectives?.[0].content.observation).toBeUndefined();
    });

    it('allows draft creation with only uncertainties', () => {
      const input: CreatePerspectiveDraftInput = {
        id: "p-test-2",
        caseId: "case-test",
        actorId: "actor-1",
        createdAt: "2026-03-28T10:00:00Z",
        uncertainties: [{ level: 5, rationale: "Draft Uncertain" }]
      };

      const updatedCase = addDraftPerspective('case-test', input, 'actor-1');
      expect(updatedCase.perspectives?.[0].content.uncertainties?.[0].level).toBe(5);
      expect(updatedCase.perspectives?.[0].content.observation).toBeUndefined();
    });

    it('allows draft creation with only counter interpretations', () => {
      const input: CreatePerspectiveDraftInput = {
        id: "p-test-3",
        caseId: "case-test",
        actorId: "actor-1",
        createdAt: "2026-03-28T10:00:00Z",
        counterInterpretations: [{ text: "Draft Counter", evidenceType: "speculative" }]
      };

      const updatedCase = addDraftPerspective('case-test', input, 'actor-1');
      expect(updatedCase.perspectives?.[0].content.counterInterpretations?.[0].text).toBe("Draft Counter");
      expect(updatedCase.perspectives?.[0].content.observation).toBeUndefined();
    });
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
      expect(updatedCase.perspectives![0].content.observation?.text).toBe('new obs');
    });


    it('rejects draft creation if input.caseId does not match caseId parameter', () => {
      const badInput = { ...DUMMY_INPUT, caseId: 'wrong-case' };
      expect(() => addDraftPerspective('case-test', badInput, 'actor-1'))
        .toThrow("Perspective caseId does not match target case.");
    });

    it('rejects draft creation if actor already has a committed perspective', () => {
      addDraftPerspective('case-test', DUMMY_INPUT, 'actor-1');
      commitPerspective('case-test', 'p-1', 'actor-1');

      const newDraftInput = { ...DUMMY_INPUT, id: "p-2", observation: { text: "new obs", isCameraDescribable: true } };

      expect(() => addDraftPerspective('case-test', newDraftInput, 'actor-1'))
        .toThrow("Perspective already committed for this actor.");
    });


    it("NEW SEMANTICS: allows draft creation if the input structure is incomplete (e.g., missing uncertainty)", () => {
      const incompleteInput = { ...DUMMY_INPUT };
      delete (incompleteInput).uncertainties;

      const updatedCase = addDraftPerspective('case-test', incompleteInput, incompleteInput.actorId);
      expect(updatedCase.perspectives?.[0].content.uncertainties).toBeUndefined();
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

    it('persists selected needs and determinants on draft save', () => {
      const inputWithSelections: CreatePerspectiveDraftInput = {
        ...DUMMY_INPUT,
        id: 'p-sel-1',
        selectedNeeds: [{ id: 'need_sec' }, { id: 'need_aut' }],
        selectedDeterminants: [{ id: 'det_env' }]
      };

      const updatedCase = addDraftPerspective('case-test', inputWithSelections, 'actor-1');
      const saved = updatedCase.perspectives?.find(p => p.id === 'p-sel-1');

      expect(saved?.status).toBe('draft');
      expect(saved?.content.selectedNeeds).toEqual([{ id: 'need_sec' }, { id: 'need_aut' }]);
      expect(saved?.content.selectedDeterminants).toEqual([{ id: 'det_env' }]);
    });

    it('stores selections as anchors only and does not create interpretation automatically', () => {
      const inputWithSelectionsOnly: CreatePerspectiveDraftInput = {
        id: 'p-sel-anchor',
        caseId: 'case-test',
        actorId: 'actor-1',
        createdAt: '2026-03-28T10:00:00Z',
        selectedNeeds: [{ id: 'need_sec' }],
        selectedDeterminants: [{ id: 'det_group' }]
      };

      const updatedCase = addDraftPerspective('case-test', inputWithSelectionsOnly, 'actor-1');
      const saved = updatedCase.perspectives?.find(p => p.id === 'p-sel-anchor');

      expect(saved?.content.selectedNeeds).toEqual([{ id: 'need_sec' }]);
      expect(saved?.content.selectedDeterminants).toEqual([{ id: 'det_group' }]);
      expect(saved?.content.interpretation).toBeUndefined();
    });

    it('rejects draft creation with an unknown need id at write time', () => {
      // Write-time catalog membership check: unknown ids must be rejected when
      // submitting NEW data, even though guards tolerate them for historical data.
      const inputWithUnknownNeed: CreatePerspectiveDraftInput = {
        id: 'p-bad-need',
        caseId: 'case-test',
        actorId: 'actor-1',
        createdAt: '2026-03-28T10:00:00Z',
        selectedNeeds: [{ id: 'need_does_not_exist' }]
      };

      expect(() => addDraftPerspective('case-test', inputWithUnknownNeed, 'actor-1'))
        .toThrow('Invalid catalog selections');
    });

    it('rejects draft creation with an unknown determinant id at write time', () => {
      const inputWithUnknownDet: CreatePerspectiveDraftInput = {
        id: 'p-bad-det',
        caseId: 'case-test',
        actorId: 'actor-1',
        createdAt: '2026-03-28T10:00:00Z',
        selectedDeterminants: [{ id: 'det_does_not_exist' }]
      };

      expect(() => addDraftPerspective('case-test', inputWithUnknownDet, 'actor-1'))
        .toThrow('Invalid catalog selections');
    });
  });


  describe('partial safe reload', () => {
    it('returns the partial draft safely without losing original empty fields context', () => {
      const incompleteInput: CreatePerspectiveDraftInput = {
        id: 'p-1',
        caseId: 'case-test',
        actorId: 'actor-1',
        createdAt: '2026-03-28T10:00:00Z',
        observation: { text: "Kind weint." },
      };

      const caseId = 'case-test';
      const actorId = 'actor-1';

      addDraftPerspective(caseId, incompleteInput, actorId);

      const draft = getDraftPerspectiveForActor(caseId, actorId);

      expect(draft).toBeDefined();
      expect(draft!.content.counterInterpretations).toBeUndefined();
      expect(draft!.content.uncertainties).toBeUndefined();
      expect(draft!.content.observation?.text).toBe(incompleteInput.observation?.text);
      expect(draft!.content.observation?.isCameraDescribable).toBeUndefined(); // Proves unset falls to undefined
    });

    it('tri-state reload UI logic properly distinguishes explicit false, true, and unset/undefined', () => {
       const caseId = 'case-test';
       const actorId = 'actor-1';

       // 1. Explicit True
       addDraftPerspective(caseId, {
         id: 'p-state-1', caseId, actorId, createdAt: '2026-03-28T10:00:00Z',
         observation: { isCameraDescribable: true }
       }, actorId);

       let draft = getDraftPerspectiveForActor(caseId, actorId)!;
       // Mock UI mapping logic from +page.svelte:
       let isCameraDescribableStr = mapCameraStateToFormValue(draft.content.observation?.isCameraDescribable);
       expect(isCameraDescribableStr).toBe('true');

       // 2. Explicit False
       addDraftPerspective(caseId, {
         id: 'p-state-1', caseId, actorId, createdAt: '2026-03-28T10:00:00Z',
         observation: { isCameraDescribable: false }
       }, actorId);

       draft = getDraftPerspectiveForActor(caseId, actorId)!;
       isCameraDescribableStr = mapCameraStateToFormValue(draft.content.observation?.isCameraDescribable);
       expect(isCameraDescribableStr).toBe('false');

       // 3. Unset / Undefined
       addDraftPerspective(caseId, {
         id: 'p-state-1', caseId, actorId, createdAt: '2026-03-28T10:00:00Z',
         observation: { text: "Nur Text" } // No camera describable
       }, actorId);

       draft = getDraftPerspectiveForActor(caseId, actorId)!;
       isCameraDescribableStr = mapCameraStateToFormValue(draft.content.observation?.isCameraDescribable);
       expect(isCameraDescribableStr).toBe('null');
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

    it('keeps selected needs and determinants after commit', () => {
      const inputWithSelections: CreatePerspectiveDraftInput = {
        ...DUMMY_INPUT,
        id: 'p-sel-2',
        selectedNeeds: [{ id: 'need_soc' }],
        selectedDeterminants: [{ id: 'det_group' }, { id: 'det_time' }]
      };

      addDraftPerspective('case-test', inputWithSelections, 'actor-1');
      const updatedCase = commitPerspective('case-test', 'p-sel-2', 'actor-1');
      const committed = updatedCase.perspectives?.find(p => p.id === 'p-sel-2');

      expect(committed?.status).toBe('committed');
      expect(committed?.content.selectedNeeds).toEqual([{ id: 'need_soc' }]);
      expect(committed?.content.selectedDeterminants).toEqual([
        { id: 'det_group' },
        { id: 'det_time' }
      ]);
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

    it('returns empty array even when conditions met (Phase 1 rule)', () => {
      addDraftPerspective('case-test', DUMMY_INPUT, 'actor-1');
      commitPerspective('case-test', 'p-1', 'actor-1');

      addDraftPerspective('case-test', { ...DUMMY_INPUT, id: "p-2", actorId: "actor-2" }, 'actor-2');
      commitPerspective('case-test', 'p-2', 'actor-2');

      const result = getComparablePerspectivesForCase('case-test', 'actor-1');
      expect(result).toEqual([]);
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

  describe('getSelectionDisplayForActor', () => {
    it('shows selection metadata for own perspective selections', () => {
      addDraftPerspective('case-test', {
        ...DUMMY_INPUT,
        id: 'p-own-sel',
        actorId: 'actor-1',
        selectedNeeds: [{ id: 'need_sec' }],
        selectedDeterminants: [{ id: 'det_env' }]
      }, 'actor-1');

      const selectionDisplay = getSelectionDisplayForActor('case-test', 'actor-1');

      expect(selectionDisplay.isEmpty).toBe(false);
      expect(selectionDisplay.needs).toHaveLength(1);
      expect(selectionDisplay.needs[0]?.id).toBe('need_sec');
      expect(selectionDisplay.determinants).toHaveLength(1);
      expect(selectionDisplay.determinants[0]?.id).toBe('det_env');
    });

    it('does not show selections from foreign perspectives in strict blind phase', () => {
      addDraftPerspective('case-test', {
        ...DUMMY_INPUT,
        id: 'p-foreign-sel',
        actorId: 'actor-2',
        selectedNeeds: [{ id: 'need_soc' }],
        selectedDeterminants: [{ id: 'det_group' }]
      }, 'actor-2');

      const selectionDisplay = getSelectionDisplayForActor('case-test', 'actor-1');

      expect(selectionDisplay.isEmpty).toBe(true);
      expect(selectionDisplay.needs).toEqual([]);
      expect(selectionDisplay.determinants).toEqual([]);
    });

    it('does not mutate currentReflection when resolving perspective selections', () => {
      const before = localStorageStore.loadCase('case-test')!;
      const reflectionBefore = before.currentReflection;

      addDraftPerspective('case-test', {
        ...DUMMY_INPUT,
        id: 'p-own-sel-immut',
        actorId: 'actor-1',
        selectedNeeds: [{ id: 'need_sec' }]
      }, 'actor-1');

      getSelectionDisplayForActor('case-test', 'actor-1');

      const after = localStorageStore.loadCase('case-test')!;
      expect(after.currentReflection).toEqual(reflectionBefore);
    });
  });

  describe('selectPerspectiveForSelectionDisplay (priority rule)', () => {
    it('prefers draft over committed when both exist (defensive: historical/migrated data)', () => {
      const draftPerspective = {
        id: 'p-draft',
        caseId: 'case-test',
        actorId: 'actor-1',
        status: 'draft' as const,
        content: { selectedNeeds: [{ id: 'need_sec' }] },
        createdAt: '2026-04-01T11:00:00Z'
      };
      const committedPerspective = {
        id: 'p-committed',
        caseId: 'case-test',
        actorId: 'actor-1',
        status: 'committed' as const,
        content: {
          observation: { text: 'obs', isCameraDescribable: true },
          interpretation: { text: 'int', evidenceType: 'observational' as const },
          counterInterpretations: [{ text: 'c', evidenceType: 'derived' as const }],
          uncertainties: [{ level: 2 as const, rationale: 'u' }],
          selectedNeeds: [{ id: 'need_aut' }]
        },
        createdAt: '2026-04-01T09:00:00Z',
        committedAt: '2026-04-01T09:30:00Z'
      };

      const result = selectPerspectiveForSelectionDisplay([committedPerspective, draftPerspective]);
      expect(result?.id).toBe('p-draft');
    });

    it('returns the committed perspective when no draft exists', () => {
      const committedPerspective = {
        id: 'p-only-committed',
        caseId: 'case-test',
        actorId: 'actor-1',
        status: 'committed' as const,
        content: {
          observation: { text: 'obs', isCameraDescribable: true },
          interpretation: { text: 'int', evidenceType: 'observational' as const },
          counterInterpretations: [{ text: 'c', evidenceType: 'derived' as const }],
          uncertainties: [{ level: 1 as const, rationale: 'u' }],
          selectedNeeds: [{ id: 'need_sec' }]
        },
        createdAt: '2026-04-01T09:00:00Z',
        committedAt: '2026-04-01T09:30:00Z'
      };

      const result = selectPerspectiveForSelectionDisplay([committedPerspective]);
      expect(result?.id).toBe('p-only-committed');
    });

    it('returns the latest (by createdAt) when multiple same-status exist (defensive)', () => {
      const older = {
        id: 'p-older',
        caseId: 'case-test',
        actorId: 'actor-1',
        status: 'draft' as const,
        content: { selectedNeeds: [{ id: 'need_sec' }] },
        createdAt: '2026-04-01T08:00:00Z'
      };
      const newer = {
        id: 'p-newer',
        caseId: 'case-test',
        actorId: 'actor-1',
        status: 'draft' as const,
        content: { selectedNeeds: [{ id: 'need_aut' }] },
        createdAt: '2026-04-01T12:00:00Z'
      };

      const result = selectPerspectiveForSelectionDisplay([older, newer]);
      expect(result?.id).toBe('p-newer');
    });

    it('returns undefined for empty perspective list', () => {
      expect(selectPerspectiveForSelectionDisplay([])).toBeUndefined();
    });
  });
});
