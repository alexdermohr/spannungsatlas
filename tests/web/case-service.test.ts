import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAllCases,
  startNewCase
} from '../../apps/web/src/lib/services/case-service.js';

class MemoryStorage implements Storage {
  #map = new Map<string, string>();

  get length(): number {
    return this.#map.size;
  }

  clear(): void {
    this.#map.clear();
  }

  getItem(key: string): string | null {
    return this.#map.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.#map.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.#map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.#map.set(key, value);
  }
}

describe('startNewCase', () => {
  const originalLocalStorage = globalThis.localStorage;
  const randomUuidSpy = vi.spyOn(globalThis.crypto, 'randomUUID');

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: new MemoryStorage()
    });
    randomUuidSpy.mockReturnValue('123e4567-e89b-12d3-a456-426614174000');
  });

  afterEach(() => {
    randomUuidSpy.mockReset();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: originalLocalStorage
    });
  });

  it('persists all provided participants including their roles', () => {
    const created = startNewCase({
      context: 'Morgenkreis nach dem Wochenende',
      participants: [
        { id: 'Anna', role: 'primary' },
        { id: 'Ben', role: 'secondary' },
        { id: 'Frau Keller', role: 'staff' }
      ],
      observationText: 'Anna spricht sehr leise und schaut auf den Boden.',
      isCameraDescribable: true,
      interpretationText: 'Anna wirkt in der Gruppe gehemmt.',
      interpretationEvidenceType: 'derived',
      counterInterpretations: [{ text: 'Anna ist noch müde vom Wochenende.', evidenceType: 'speculative' }],
      uncertainties: [{ level: 3, rationale: 'Es liegt nur diese eine Beobachtung vor.' }]
    });

    expect(created.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(created.participants).toEqual([
      { id: 'Anna', role: 'primary' },
      { id: 'Ben', role: 'secondary' },
      { id: 'Frau Keller', role: 'staff' }
    ]);
    expect(getAllCases()).toHaveLength(1);
    expect(getAllCases()[0]?.participants).toEqual(created.participants);
  });

  it('persists multiple counter-interpretations in order with correct evidence types', () => {
    const created = startNewCase({
      context: 'Gruppenarbeit',
      participants: [{ id: 'Max', role: 'primary' }],
      observationText: 'Max verlässt die Gruppe ohne Erklärung.',
      isCameraDescribable: true,
      interpretationText: 'Max zeigt Rückzugsverhalten aufgrund sozialer Überforderung.',
      interpretationEvidenceType: 'derived',
      counterInterpretations: [
        { text: 'Max musste die Toilette aufsuchen.', evidenceType: 'speculative' },
        { text: 'Max hatte eine andere Aufgabe zu erledigen.', evidenceType: 'observational' }
      ],
      uncertainties: [
        { level: 2, rationale: 'Nur kurzer Beobachtungszeitraum.' },
        { level: 4, rationale: 'Kein Kontext zur Vorgeschichte bekannt.' }
      ]
    });

    const counters = created.currentReflection.counterInterpretations;
    expect(counters).toHaveLength(2);
    expect(counters[0]!.text).toBe('Max musste die Toilette aufsuchen.');
    expect(counters[0]!.evidenceType).toBe('speculative');
    expect(counters[1]!.text).toBe('Max hatte eine andere Aufgabe zu erledigen.');
    expect(counters[1]!.evidenceType).toBe('observational');

    const uncerts = created.currentReflection.uncertainties;
    expect(uncerts).toHaveLength(2);
    expect(uncerts[0]!.level).toBe(2);
    expect(uncerts[1]!.level).toBe(4);

    const persisted = getAllCases()[0]!;
    expect(persisted.currentReflection.counterInterpretations).toHaveLength(2);
    expect(persisted.currentReflection.uncertainties).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Migration tests — old singular format
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'spannungsatlas-cases';

function makeOldSingularCase(id: string): object {
  return {
    id,
    context: 'Morgenkreis',
    participants: [{ id: 'Anna', role: 'primary' }],
    observation: { text: 'Anna schaut auf den Boden.', isCameraDescribable: true },
    currentReflection: {
      reflectedAt: '2026-03-01T08:00:00Z',
      interpretation: { text: 'Anna wirkt gehemmt.', evidenceType: 'derived' },
      // old singular fields
      counterInterpretation: { text: 'Anna ist müde.', evidenceType: 'speculative' },
      uncertainty: { level: 3, rationale: 'Nur eine Beobachtung.' },
      tensions: []
    },
    revisions: []
  };
}

describe('migration — old singular schema', () => {
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: new MemoryStorage()
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: originalLocalStorage
    });
  });

  it('loads an old case with singular counterInterpretation as counterInterpretations array of length 1', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([makeOldSingularCase('old-001')]));

    const cases = getAllCases();
    expect(cases).toHaveLength(1);
    const reflection = cases[0]!.currentReflection;
    expect(reflection.counterInterpretations).toHaveLength(1);
    expect(reflection.counterInterpretations[0]!.text).toBe('Anna ist müde.');
    expect(reflection.counterInterpretations[0]!.evidenceType).toBe('speculative');
  });

  it('loads an old case with singular uncertainty as uncertainties array of length 1', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([makeOldSingularCase('old-002')]));

    const cases = getAllCases();
    expect(cases).toHaveLength(1);
    const reflection = cases[0]!.currentReflection;
    expect(reflection.uncertainties).toHaveLength(1);
    expect(reflection.uncertainties[0]!.level).toBe(3);
    expect(reflection.uncertainties[0]!.rationale).toBe('Nur eine Beobachtung.');
  });

  it('does not crash when reflection fields are missing — case is silently skipped', () => {
    const broken = { id: 'broken', context: 'x', participants: [], observation: { text: 'y', isCameraDescribable: false }, currentReflection: null, revisions: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([broken]));
    expect(() => getAllCases()).not.toThrow();
  });
});
