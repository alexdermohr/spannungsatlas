import { vi } from "vitest";
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { localStorageStore } from '../../apps/web/src/lib/persistence/store.js';

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
    interpretation: { text: 'My interpretation.', evidenceType: 'derived' as const },
    counterInterpretations: [{ text: 'Counter interpretation.', evidenceType: 'speculative' as const }],
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
        counterInterpretation: { text: 'Counter interpretation.', evidenceType: 'speculative' as const },
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


  it('isValidCase rejects cases with invalid perspective elements', () => {
    // This goes directly to the internal isValidCase by passing through the array mapping if we were doing readCases,
    // but the easiest way is to push a bad case and see if loadAllCases rejects it.

    // We mock localStorage for a quick test
    const rawData = [
      {
        id: "case-1",
        context: "ctx",
        participants: [{ id: "p1", role: "primary" }],
        observation: { text: "obs", isCameraDescribable: true },
        currentReflection: {
          reflectedAt: "2026-04-01T10:00:00Z",
          interpretation: { text: "int", evidenceType: "observational" },
          counterInterpretations: [{ text: "c", evidenceType: "derived" }],
          uncertainties: [{ level: 2, rationale: "unc" }],
          tensions: []
        },
        revisions: [],
        perspectives: [null] // Should fail isValidCase
      }
    ];

    const store = localStorageStore;
    const getItemSpy = vi.spyOn(globalThis.localStorage, 'getItem').mockReturnValue(JSON.stringify(rawData));

    const cases = store.loadAllCases();
    expect(cases).toHaveLength(0); // The invalid case is filtered out

    getItemSpy.mockRestore();
  });


  it('does not wrap a legacy counterInterpretation that is already an array — case is skipped as invalid', () => {
    // An array value in the legacy singular field must not be double-wrapped.
    // isMigratableObject() excludes arrays, so the field is skipped and the
    // case ends up with no counterInterpretations — guardCase then rejects it.
    const raw = makeBaseCase({
      currentReflection: makeSnap({
        counterInterpretations: undefined,
        // Malformed legacy data: already an array stored in the singular field
        counterInterpretation: [{ text: 'Already an array.', evidenceType: 'speculative' as const }],
      }),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify([raw]));
    // Case is rejected by guardCase (no valid counterInterpretations), not double-wrapped
    const cases = localStorageStore.loadAllCases();
    expect(cases).toHaveLength(0);
  });

  it('migrates singular counterInterpretation and uncertainty in revision.from and revision.to', () => {
    const oldSnap = makeSnap({
      reflectedAt: '2023-12-01T00:00:00.000Z',
      interpretation: { text: 'Old interpretation.', evidenceType: 'derived' as const },
      counterInterpretations: undefined,
      counterInterpretation: { text: 'Old counter interpretation.', evidenceType: 'speculative' as const },
      uncertainties: undefined,
      uncertainty: { level: 1, rationale: 'Old uncertainty rationale.' },
    });
    const newSnap = makeSnap({
      interpretation: { text: 'Revised interpretation.', evidenceType: 'observational' as const },
      counterInterpretations: undefined,
      counterInterpretation: { text: 'Revised counter interpretation.', evidenceType: 'speculative' as const },
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

describe("store migration — draft handling", () => {
  it("accepts cases containing a valid partial draft perspective", () => {
    const rawData = [
      {
        id: "case-with-draft",
        context: "Schulhof",
        participants: [{ id: "Kind A" }],
        observation: { text: "Das Kind läuft.", isCameraDescribable: true },
        currentReflection: {
          reflectedAt: "2025-01-01T10:00:00Z",
          interpretation: { text: "Freude", evidenceType: "observational" },
          counterInterpretations: [{ text: "Flucht", evidenceType: "speculative" }],
          uncertainties: [{ level: 3, rationale: "Keine Mimik sichtbar" }],
          tensions: []
        },
        revisions: [],
        perspectives: [
          {
            id: "draft-1",
            caseId: "case-with-draft",
            actorId: "Kind A",
            status: "draft",
            createdAt: "2025-01-01T11:00:00Z",
            content: {
              observation: { text: "Ein partial Draft", isCameraDescribable: false }
            }
          }
        ]
      }
    ];


    const mockStorage = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        clear: () => { store = {}; }
      };
    })();
    vi.stubGlobal('localStorage', mockStorage);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData));
    const loaded = localStorageStore.loadAllCases();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].perspectives?.[0].status).toBe("draft");
    expect(loaded[0].perspectives?.[0].content.observation?.text).toBe("Ein partial Draft");
    expect(loaded[0].perspectives?.[0].content.interpretation).toBeUndefined();
  });

  it("rejects cases containing an invalid draft perspective (e.g. text is a number)", () => {
    const rawData = [
      {
        id: "case-with-invalid-draft",
        context: "Schulhof",
        participants: [{ id: "Kind A" }],
        observation: { text: "Das Kind läuft.", isCameraDescribable: true },
        currentReflection: {
          reflectedAt: "2025-01-01T10:00:00Z",
          interpretation: { text: "Freude", evidenceType: "observational" },
          counterInterpretations: [{ text: "Flucht", evidenceType: "speculative" }],
          uncertainties: [{ level: 3, rationale: "Keine Mimik sichtbar" }],
          tensions: []
        },
        revisions: [],
        perspectives: [
          {
            id: "draft-1",
            caseId: "case-with-invalid-draft",
            actorId: "Kind A",
            status: "draft",
            createdAt: "2025-01-01T11:00:00Z",
            content: {
              observation: { text: 12345 } // Invalid text type
            }
          }
        ]
      }
    ];


    const mockStorage = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        clear: () => { store = {}; }
      };
    })();
    vi.stubGlobal('localStorage', mockStorage);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData));
    const loaded = localStorageStore.loadAllCases();
    expect(loaded).toHaveLength(0);
  });
});
