import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { localStorageStore, _resetCacheForTesting } from '../../apps/web/src/lib/persistence/store.js';

const STORAGE_KEY = 'spannungsatlas-cases';

class MemoryStorage implements Storage {
  #map = new Map<string, string>();
  get length() { return this.#map.size; }
  clear() { this.#map.clear(); }
  getItem(key: string): string | null { return this.#map.get(key) ?? null; }
  key(index: number): string | null { return [...this.#map.keys()][index] ?? null; }
  removeItem(key: string) { this.#map.delete(key); }
  setItem(key: string, value: string) { this.#map.set(key, value); }
}

const originalLocalStorage = globalThis.localStorage;

/** Minimal valid snapshot — add singular or override fields as needed. */
function makeSnap(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    reflectedAt: '2024-01-01T00:00:00.000Z',
    interpretation: { text: 'My interpretation.', evidenceType: 'derived' },
    counterInterpretations: [{ text: 'Counter interpretation.', evidenceType: 'speculative' }],
    uncertainties: [{ level: 3, rationale: 'Not sure about this.' }],
    tensions: [],
    ...overrides,
  };
}

function makeBaseCase(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'case-1',
    participants: [{ id: 'p-1', role: 'primary' }],
    context: 'Test context',
    observation: { text: 'Something happened.', isCameraDescribable: false },
    currentReflection: makeSnap(),
    revisions: [],
    ...overrides,
  };
}

describe('store migration — normalizeCaseFromStorage', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new MemoryStorage() });
    _resetCacheForTesting();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalLocalStorage });
  });

  it('loads a modern case (plural fields) unchanged', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([makeBaseCase()]));
    const cases = localStorageStore.loadAllCases();
    expect(cases).toHaveLength(1);
    expect(cases[0].currentReflection.counterInterpretations).toHaveLength(1);
    expect(cases[0].currentReflection.uncertainties).toHaveLength(1);
  });

  it('migrates singular counterInterpretation in currentReflection', () => {
    const raw = makeBaseCase({
      currentReflection: makeSnap({
        counterInterpretations: undefined,
        counterInterpretation: { text: 'Counter interpretation.', evidenceType: 'speculative' },
      }),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify([raw]));
    const cases = localStorageStore.loadAllCases();
    expect(cases).toHaveLength(1);
    expect(cases[0].currentReflection.counterInterpretations).toHaveLength(1);
    expect(cases[0].currentReflection.counterInterpretations[0].text).toBe('Counter interpretation.');
  });

  it('migrates singular uncertainty in currentReflection', () => {
    const raw = makeBaseCase({
      currentReflection: makeSnap({
        uncertainties: undefined,
        uncertainty: { level: 2, rationale: 'Quite uncertain about this.' },
      }),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify([raw]));
    const cases = localStorageStore.loadAllCases();
    expect(cases).toHaveLength(1);
    expect(cases[0].currentReflection.uncertainties).toHaveLength(1);
    expect(cases[0].currentReflection.uncertainties[0].rationale).toBe('Quite uncertain about this.');
  });

  it('migrates singular counterInterpretation and uncertainty in revision.from and revision.to', () => {
    const oldSnap = makeSnap({
      reflectedAt: '2023-12-01T00:00:00.000Z',
      interpretation: { text: 'Old interpretation.', evidenceType: 'derived' },
      counterInterpretations: undefined,
      counterInterpretation: { text: 'Old counter interpretation.', evidenceType: 'speculative' },
      uncertainties: undefined,
      uncertainty: { level: 1, rationale: 'Old uncertainty rationale.' },
    });
    const newSnap = makeSnap({
      interpretation: { text: 'Revised interpretation.', evidenceType: 'observational' },
      counterInterpretations: undefined,
      counterInterpretation: { text: 'Revised counter interpretation.', evidenceType: 'speculative' },
      uncertainties: undefined,
      uncertainty: { level: 3, rationale: 'Revised uncertainty rationale.' },
    });
    const raw = makeBaseCase({
      revisions: [
        {
          at: '2024-01-01T00:00:00.000Z',
          driftType: 'new_perspective',
          reason: 'Changed my mind after reflection.',
          from: oldSnap,
          to: newSnap,
        },
      ],
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify([raw]));
    const cases = localStorageStore.loadAllCases();
    expect(cases).toHaveLength(1);
    const rev = cases[0].revisions[0];
    expect(rev.from.counterInterpretations).toHaveLength(1);
    expect(rev.from.counterInterpretations[0].text).toBe('Old counter interpretation.');
    expect(rev.from.uncertainties).toHaveLength(1);
    expect(rev.from.uncertainties[0].rationale).toBe('Old uncertainty rationale.');
    expect(rev.to.counterInterpretations).toHaveLength(1);
    expect(rev.to.counterInterpretations[0].text).toBe('Revised counter interpretation.');
    expect(rev.to.uncertainties).toHaveLength(1);
    expect(rev.to.uncertainties[0].rationale).toBe('Revised uncertainty rationale.');
  });
});
