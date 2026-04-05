import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage before importing the service
const storage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { storage.set(key, value); }),
  removeItem: vi.fn((key: string) => { storage.delete(key); }),
  clear: vi.fn(() => { storage.clear(); }),
  get length() { return storage.size; },
  key: vi.fn((_: number) => null),
};

vi.stubGlobal('localStorage', localStorageMock);

// Stable UUID mock
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `mock-uuid-${++uuidCounter}`,
});

import {
  startNewPerspective,
  getPerspective,
  listPerspectivesForCase,
  updatePerspective,
  commitPerspectiveById,
  getComparablePerspectivesForCase,
  deletePerspective,
} from '../../apps/web/src/lib/services/perspective-service.js';

describe('perspective-service', () => {
  beforeEach(() => {
    storage.clear();
    uuidCounter = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // startNewPerspective
  // -----------------------------------------------------------------------

  describe('startNewPerspective', () => {
    it('creates a draft perspective', () => {
      const p = startNewPerspective('case-1', 'actor-1');
      expect(p.status).toBe('draft');
      expect(p.case_id).toBe('case-1');
      expect(p.actor_id).toBe('actor-1');
      expect(p.id).toBe('mock-uuid-1');
    });

    it('persists the perspective', () => {
      startNewPerspective('case-1', 'actor-1');
      const p = getPerspective('mock-uuid-1', 'actor-1');
      expect(p).not.toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getPerspective (access control)
  // -----------------------------------------------------------------------

  describe('getPerspective', () => {
    it('returns own draft to owner', () => {
      const p = startNewPerspective('case-1', 'actor-1');
      expect(getPerspective(p.id, 'actor-1')).not.toBeNull();
    });

    it('returns null for non-owner trying to read draft (no leak)', () => {
      const p = startNewPerspective('case-1', 'actor-1');
      expect(getPerspective(p.id, 'actor-2')).toBeNull();
    });

    it('returns null for non-existent perspective', () => {
      expect(getPerspective('does-not-exist', 'actor-1')).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // listPerspectivesForCase (anti-leak)
  // -----------------------------------------------------------------------

  describe('listPerspectivesForCase', () => {
    it('returns only own draft, not others\' drafts', () => {
      startNewPerspective('case-1', 'actor-1');
      startNewPerspective('case-1', 'actor-2');

      const visible = listPerspectivesForCase('case-1', 'actor-1');
      expect(visible).toHaveLength(1);
      expect(visible[0].actor_id).toBe('actor-1');
    });

    it('returns committed perspectives to all actors', () => {
      const p = startNewPerspective('case-1', 'actor-1', {
        observation: 'obs',
        interpretation: 'interp',
        counterInterpretation: 'counter',
        uncertainty: 'unc',
      });
      commitPerspectiveById(p.id, 'actor-1');

      const visible = listPerspectivesForCase('case-1', 'actor-2');
      expect(visible).toHaveLength(1);
      expect(visible[0].status).toBe('committed');
    });

    it('does not leak count of other actors\' drafts', () => {
      startNewPerspective('case-1', 'actor-1');
      startNewPerspective('case-1', 'actor-2');
      startNewPerspective('case-1', 'actor-3');

      const visible = listPerspectivesForCase('case-1', 'actor-1');
      expect(visible).toHaveLength(1);
    });

    it('filters by case_id', () => {
      startNewPerspective('case-1', 'actor-1');
      startNewPerspective('case-2', 'actor-1');

      const visible = listPerspectivesForCase('case-1', 'actor-1');
      expect(visible).toHaveLength(1);
      expect(visible[0].case_id).toBe('case-1');
    });
  });

  // -----------------------------------------------------------------------
  // updatePerspective (access control)
  // -----------------------------------------------------------------------

  describe('updatePerspective', () => {
    it('allows owner to update their draft', () => {
      const p = startNewPerspective('case-1', 'actor-1');
      const updated = updatePerspective(p.id, 'actor-1', { observation: 'New obs.' });
      expect(updated.content.observation).toBe('New obs.');
    });

    it('throws when non-owner tries to update', () => {
      const p = startNewPerspective('case-1', 'actor-1');
      expect(() => updatePerspective(p.id, 'actor-2', { observation: 'hack' })).toThrow(
        'Access denied',
      );
    });

    it('throws for non-existent perspective', () => {
      expect(() => updatePerspective('nope', 'actor-1', {})).toThrow('not found');
    });

    it('throws when updating a committed perspective', () => {
      const p = startNewPerspective('case-1', 'actor-1', {
        observation: 'obs',
        interpretation: 'interp',
        counterInterpretation: 'counter',
        uncertainty: 'unc',
      });
      commitPerspectiveById(p.id, 'actor-1');

      expect(() => updatePerspective(p.id, 'actor-1', { observation: 'changed' })).toThrow(
        'Access denied',
      );
    });

    it('merges content incrementally', () => {
      const p = startNewPerspective('case-1', 'actor-1', { observation: 'first' });
      updatePerspective(p.id, 'actor-1', { interpretation: 'second' });

      const result = getPerspective(p.id, 'actor-1')!;
      expect(result.content.observation).toBe('first');
      expect(result.content.interpretation).toBe('second');
    });
  });

  // -----------------------------------------------------------------------
  // commitPerspectiveById
  // -----------------------------------------------------------------------

  describe('commitPerspectiveById', () => {
    it('commits a complete draft', () => {
      const p = startNewPerspective('case-1', 'actor-1', {
        observation: 'obs',
        interpretation: 'interp',
        counterInterpretation: 'counter',
        uncertainty: 'unc',
      });

      const committed = commitPerspectiveById(p.id, 'actor-1');
      expect(committed.status).toBe('committed');
      expect(committed.committed_at).toBeDefined();
    });

    it('throws when non-owner tries to commit', () => {
      const p = startNewPerspective('case-1', 'actor-1', {
        observation: 'obs',
        interpretation: 'interp',
        counterInterpretation: 'counter',
        uncertainty: 'unc',
      });

      expect(() => commitPerspectiveById(p.id, 'actor-2')).toThrow('Access denied');
    });

    it('throws when content is incomplete', () => {
      const p = startNewPerspective('case-1', 'actor-1', { observation: 'only obs' });
      expect(() => commitPerspectiveById(p.id, 'actor-1')).toThrow();
    });

    it('throws for non-existent perspective', () => {
      expect(() => commitPerspectiveById('nope', 'actor-1')).toThrow('not found');
    });
  });

  // -----------------------------------------------------------------------
  // getComparablePerspectivesForCase
  // -----------------------------------------------------------------------

  describe('getComparablePerspectivesForCase', () => {
    it('returns empty when < 2 committed', () => {
      startNewPerspective('case-1', 'actor-1', {
        observation: 'obs',
        interpretation: 'interp',
        counterInterpretation: 'counter',
        uncertainty: 'unc',
      });
      commitPerspectiveById('mock-uuid-1', 'actor-1');

      expect(getComparablePerspectivesForCase('case-1')).toEqual([]);
    });

    it('returns perspectives when >= 2 committed', () => {
      const p1 = startNewPerspective('case-1', 'actor-1', {
        observation: 'obs1',
        interpretation: 'interp1',
        counterInterpretation: 'counter1',
        uncertainty: 'unc1',
      });
      commitPerspectiveById(p1.id, 'actor-1');

      const p2 = startNewPerspective('case-1', 'actor-2', {
        observation: 'obs2',
        interpretation: 'interp2',
        counterInterpretation: 'counter2',
        uncertainty: 'unc2',
      });
      commitPerspectiveById(p2.id, 'actor-2');

      const result = getComparablePerspectivesForCase('case-1');
      expect(result).toHaveLength(2);
    });

    it('does not include drafts in comparison', () => {
      const p1 = startNewPerspective('case-1', 'actor-1', {
        observation: 'obs1',
        interpretation: 'interp1',
        counterInterpretation: 'counter1',
        uncertainty: 'unc1',
      });
      commitPerspectiveById(p1.id, 'actor-1');

      startNewPerspective('case-1', 'actor-2', { observation: 'draft-only' });

      expect(getComparablePerspectivesForCase('case-1')).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // deletePerspective
  // -----------------------------------------------------------------------

  describe('deletePerspective', () => {
    it('allows owner to delete their draft', () => {
      const p = startNewPerspective('case-1', 'actor-1');
      deletePerspective(p.id, 'actor-1');
      expect(getPerspective(p.id, 'actor-1')).toBeNull();
    });

    it('throws when non-owner tries to delete', () => {
      const p = startNewPerspective('case-1', 'actor-1');
      expect(() => deletePerspective(p.id, 'actor-2')).toThrow('Access denied');
    });

    it('throws when deleting a committed perspective', () => {
      const p = startNewPerspective('case-1', 'actor-1', {
        observation: 'obs',
        interpretation: 'interp',
        counterInterpretation: 'counter',
        uncertainty: 'unc',
      });
      commitPerspectiveById(p.id, 'actor-1');

      expect(() => deletePerspective(p.id, 'actor-1')).toThrow('Access denied');
    });

    it('throws for non-existent perspective', () => {
      expect(() => deletePerspective('nope', 'actor-1')).toThrow('not found');
    });
  });
});
