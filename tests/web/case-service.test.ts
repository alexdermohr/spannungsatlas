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
