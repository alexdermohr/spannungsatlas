import type { Case } from '$domain/types.js';

/** Abstraction over case persistence — swap localStorage for IndexedDB or API. */
export interface PersistenceStore {
  loadAllCases(): Case[];
  loadCase(id: string): Case | null;
  saveCase(c: Case): void;
  deleteCase(id: string): void;
}

const STORAGE_KEY = 'spannungsatlas-cases';

function isStorageAvailable(): boolean {
  return typeof localStorage !== 'undefined';
}

function readCases(): Case[] {
  if (!isStorageAvailable()) return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCases(cases: Case[]): void {
  if (!isStorageAvailable()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
}

export const localStorageStore: PersistenceStore = {
  loadAllCases(): Case[] {
    return readCases();
  },

  loadCase(id: string): Case | null {
    return readCases().find((c) => c.id === id) ?? null;
  },

  saveCase(c: Case): void {
    const cases = readCases();
    const idx = cases.findIndex((existing) => existing.id === c.id);
    if (idx >= 0) {
      cases[idx] = c;
    } else {
      cases.push(c);
    }
    writeCases(cases);
  },

  deleteCase(id: string): void {
    writeCases(readCases().filter((c) => c.id !== id));
  }
};
