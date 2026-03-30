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
      uncertaintyLevel: 3,
      uncertaintyRationale: 'Es liegt nur diese eine Beobachtung vor.'
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
});
