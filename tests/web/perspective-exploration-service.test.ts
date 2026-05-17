import type { CreatePerspectiveDraftInput } from '../../src/domain/factories.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addDraftPerspective,
  commitPerspective,
  getCase,
  getOwnCommittedPerspectiveForActor,
  getPostCommitExplorationDisplayForActor,
  getSelectionDisplayForActor,
  savePerspectiveExploration
} from '../../apps/web/src/lib/services/case-service.js';
import { localStorageStore } from '../../apps/web/src/lib/persistence/store.js';
import type { Case, PerspectiveCommittedRecord } from '../../src/domain/types.js';

class MemoryStorage implements Storage {
  #map = new Map<string, string>();
  get length() { return this.#map.size; }
  clear() { this.#map.clear(); }
  getItem(key: string) { return this.#map.get(key) ?? null; }
  key(index: number) { return [...this.#map.keys()][index] ?? null; }
  removeItem(key: string) { this.#map.delete(key); }
  setItem(key: string, value: string) { this.#map.set(key, value); }
}

const BASE_CASE: Case = {
  id: 'case-expl',
  context: 'Test Context',
  participants: [{ id: 'actor-1' }, { id: 'actor-2' }],
  observation: { text: 'obs', isCameraDescribable: true },
  currentReflection: {
    reflectedAt: '2026-04-01T10:00:00Z',
    interpretation: { text: 'int', evidenceType: 'observational' },
    counterInterpretations: [{ text: 'cnt', evidenceType: 'derived' }],
    uncertainties: [{ level: 2, rationale: 'unc' }],
    tensions: []
  },
  revisions: [],
  perspectives: []
};

const FULL_DRAFT: CreatePerspectiveDraftInput = {
  id: 'p-actor-1',
  caseId: 'case-expl',
  actorId: 'actor-1',
  createdAt: '2026-04-01T10:00:00Z',
  observation: { text: 'obs-a1', isCameraDescribable: true },
  interpretation: { text: 'int-a1', evidenceType: 'observational' },
  counterInterpretations: [{ text: 'cnt-a1', evidenceType: 'derived' }],
  uncertainties: [{ level: 2, rationale: 'unc-a1' }]
};

function seedCommittedFor(actor: string, perspectiveId: string): PerspectiveCommittedRecord {
  const draft: CreatePerspectiveDraftInput = {
    ...FULL_DRAFT,
    id: perspectiveId,
    actorId: actor,
    observation: { text: `obs-${actor}`, isCameraDescribable: true },
    interpretation: { text: `int-${actor}`, evidenceType: 'observational' },
    counterInterpretations: [{ text: `cnt-${actor}`, evidenceType: 'derived' }],
    uncertainties: [{ level: 2, rationale: `unc-${actor}` }]
  };
  addDraftPerspective('case-expl', draft, actor);
  const updated = commitPerspective('case-expl', perspectiveId, actor);
  const found = updated.perspectives?.find((p) => p.id === perspectiveId);
  if (!found || found.status !== 'committed') throw new Error('seed failed');
  return found;
}

describe('savePerspectiveExploration', () => {
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: new MemoryStorage()
    });
    localStorageStore.saveCase(BASE_CASE);
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: originalLocalStorage
    });
  });

  it('stores selections on the own committed perspective as postCommitExploration', () => {
    const committed = seedCommittedFor('actor-1', 'p-actor-1');
    const updated = savePerspectiveExploration({
      caseId: 'case-expl',
      perspectiveId: committed.id,
      requestingActorId: 'actor-1',
      selectedNeeds: [{ id: 'need_phys' }],
      selectedDeterminants: [{ id: 'det_env' }]
    });

    const after = updated.perspectives?.find((p) => p.id === committed.id);
    expect(after?.status).toBe('committed');
    if (after?.status !== 'committed') throw new Error();
    expect(after.postCommitExploration?.selectedNeeds).toEqual([{ id: 'need_phys' }]);
    expect(after.postCommitExploration?.selectedDeterminants).toEqual([{ id: 'det_env' }]);
    expect(after.postCommitExploration?.exploredAt).toBeTruthy();
  });

  it('does not modify the committed epistemic core', () => {
    const committed = seedCommittedFor('actor-1', 'p-actor-1');
    const coreBefore = {
      observation: committed.content.observation,
      interpretation: committed.content.interpretation,
      counterInterpretations: committed.content.counterInterpretations,
      uncertainties: committed.content.uncertainties,
      committedAt: committed.committedAt
    };

    const updated = savePerspectiveExploration({
      caseId: 'case-expl',
      perspectiveId: committed.id,
      requestingActorId: 'actor-1',
      selectedNeeds: [{ id: 'need_phys' }]
    });

    const after = updated.perspectives?.find((p) => p.id === committed.id);
    if (after?.status !== 'committed') throw new Error();
    expect(after.content.observation).toEqual(coreBefore.observation);
    expect(after.content.interpretation).toEqual(coreBefore.interpretation);
    expect(after.content.counterInterpretations).toEqual(coreBefore.counterInterpretations);
    expect(after.content.uncertainties).toEqual(coreBefore.uncertainties);
    expect(after.committedAt).toBe(coreBefore.committedAt);
  });

  it('rejects writes from a foreign actor', () => {
    const committed = seedCommittedFor('actor-1', 'p-actor-1');
    expect(() =>
      savePerspectiveExploration({
        caseId: 'case-expl',
        perspectiveId: committed.id,
        requestingActorId: 'actor-2',
        selectedNeeds: [{ id: 'need_phys' }]
      })
    ).toThrow(/Access denied/);
  });

  it('rejects writes on a draft perspective', () => {
    addDraftPerspective('case-expl', FULL_DRAFT, 'actor-1');
    expect(() =>
      savePerspectiveExploration({
        caseId: 'case-expl',
        perspectiveId: 'p-actor-1',
        requestingActorId: 'actor-1',
        selectedNeeds: [{ id: 'need_phys' }]
      })
    ).toThrow(/committed/);
  });

  it('rejects unknown catalog ids at write time', () => {
    const committed = seedCommittedFor('actor-1', 'p-actor-1');
    expect(() =>
      savePerspectiveExploration({
        caseId: 'case-expl',
        perspectiveId: committed.id,
        requestingActorId: 'actor-1',
        selectedNeeds: [{ id: 'definitely-not-in-catalog' }]
      })
    ).toThrow(/Invalid catalog selections/);
  });

  it('sets updatedAt when overwriting and preserves exploredAt', () => {
    const committed = seedCommittedFor('actor-1', 'p-actor-1');
    savePerspectiveExploration({
      caseId: 'case-expl',
      perspectiveId: committed.id,
      requestingActorId: 'actor-1',
      selectedNeeds: [{ id: 'need_phys' }]
    });
    const first = getOwnCommittedPerspectiveForActor('case-expl', 'actor-1');
    const firstExploredAt = first?.postCommitExploration?.exploredAt;
    expect(firstExploredAt).toBeTruthy();
    expect(first?.postCommitExploration?.updatedAt).toBeUndefined();

    savePerspectiveExploration({
      caseId: 'case-expl',
      perspectiveId: committed.id,
      requestingActorId: 'actor-1',
      selectedNeeds: [{ id: 'need_phys' }],
      selectedDeterminants: [{ id: 'det_env' }]
    });
    const second = getOwnCommittedPerspectiveForActor('case-expl', 'actor-1');
    expect(second?.postCommitExploration?.exploredAt).toBe(firstExploredAt);
    expect(second?.postCommitExploration?.updatedAt).toBeTruthy();
  });

  it('keeps the legacy selection display strict-blind to the actor', () => {
    const committed = seedCommittedFor('actor-1', 'p-actor-1');
    savePerspectiveExploration({
      caseId: 'case-expl',
      perspectiveId: committed.id,
      requestingActorId: 'actor-1',
      selectedNeeds: [{ id: 'need_phys' }]
    });

    // Foreign actor sees nothing of the post-commit exploration.
    const foreignDisplay = getPostCommitExplorationDisplayForActor('case-expl', 'actor-2');
    expect(foreignDisplay.isEmpty).toBe(true);

    // Legacy content.selectedNeeds display is not polluted by the new field.
    const legacy = getSelectionDisplayForActor('case-expl', 'actor-1');
    expect(legacy.isEmpty).toBe(true);

    // Own actor sees the post-commit selections.
    const ownDisplay = getPostCommitExplorationDisplayForActor('case-expl', 'actor-1');
    expect(ownDisplay.isEmpty).toBe(false);
    expect(ownDisplay.needs.length).toBe(1);
  });

  it('reads back the saved snapshot through getOwnCommittedPerspectiveForActor', () => {
    const committed = seedCommittedFor('actor-1', 'p-actor-1');
    savePerspectiveExploration({
      caseId: 'case-expl',
      perspectiveId: committed.id,
      requestingActorId: 'actor-1',
      selectedDeterminants: [{ id: 'det_env' }]
    });

    const own = getOwnCommittedPerspectiveForActor('case-expl', 'actor-1');
    expect(own?.postCommitExploration?.selectedDeterminants).toEqual([{ id: 'det_env' }]);
    expect(own?.postCommitExploration?.selectedNeeds).toBeUndefined();

    // The case loads back via getCase and round-trips through the guard chain.
    const reloaded = getCase('case-expl');
    expect(reloaded?.perspectives?.[0]).toEqual(own);
  });
});
